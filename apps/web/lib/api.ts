// Thin client for the NestJS API.
// Used from both Server Components (where the token comes from the NextAuth session)
// and Client Components (where we read the JWT from a signed cookie).

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Options = RequestInit & {
  token?: string | null;
  /**
   * Opt in to server-side idempotency for this call. The API caches the
   * first response for 24h and any retry with the same key returns the
   * cached response instead of creating duplicates.
   *
   *  - Pass `true` to auto-generate a fresh UUID per call. This protects
   *    against the SDK's own internal retries (network jitter, 502s) but
   *    NOT against the user clicking submit twice — each click gets a
   *    fresh key.
   *  - Pass a string to use a stable key. The caller is responsible for
   *    keeping the key constant across logical-action retries (e.g. one
   *    key per mutation closure / per form submit).
   */
  idempotent?: boolean | string;
};

function randomKey(): string {
  // Prefer the platform's UUID where available; fall back to a non-crypto
  // random string so tests and old runtimes still work.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const { token, idempotent, ...rest } = opts;
  const url = path.startsWith('http') ? path : `${API_URL}/api/v1${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(idempotent
        ? { 'Idempotency-Key': typeof idempotent === 'string' ? idempotent : randomKey() }
        : {}),
      ...(rest.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const API_BASE = `${API_URL}/api/v1`;

/**
 * Pull a clean, human-readable message out of an error response. Handles the
 * NestJS shapes — `{ message: string }`, `{ message: string[] }` (validation),
 * and the older double-nested `{ message: { message } }` — so a toast shows
 * "Email already registered" instead of a raw JSON blob.
 */
async function extractErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as {
      message?: unknown;
      detail?: unknown;
      error?: unknown;
    };
    const m = j.message;
    if (typeof m === 'string' && m) return m;
    if (Array.isArray(m) && m.length) return m.join(', ');
    if (m && typeof m === 'object' && typeof (m as { message?: unknown }).message === 'string') {
      return (m as { message: string }).message;
    }
    if (typeof j.detail === 'string' && j.detail) return j.detail;
    if (typeof j.error === 'string' && j.error) return j.error;
  } catch {
    if (text) return text.slice(0, 200);
  }
  return `Request failed (${res.status})`;
}

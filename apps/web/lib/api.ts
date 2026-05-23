// Thin client for the NestJS API.
// Used from both Server Components (where the token comes from the NextAuth session)
// and Client Components (where we read the JWT from a signed cookie).

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Options = RequestInit & { token?: string | null };

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const { token, ...rest } = opts;
  const url = path.startsWith('http') ? path : `${API_URL}/api/v1${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const API_BASE = `${API_URL}/api/v1`;

import { describe, it, expect, vi, afterEach } from 'vitest';
import { OpenRouterClient } from './openrouter.client';

/**
 * Free OpenRouter model ids churn constantly, so a stale id in a fallback chain
 * returns 404 (or "not a valid model"). chatJson MUST skip that model and try
 * the next one — a dead id must never abort the whole chain. Regression guard
 * for the resume-parse 500 caused by `deepseek/deepseek-v4-flash:free` 404ing.
 */
function clientWithMock(create: ReturnType<typeof vi.fn>): OpenRouterClient {
  process.env.OPENROUTER_API_KEY = 'test-key';
  const c = new OpenRouterClient();
  // Replace the underlying SDK call with our mock.
  (c.client as unknown as { chat: unknown }).chat = { completions: { create } };
  return c;
}

describe('OpenRouterClient.chatJson model fallback', () => {
  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    vi.restoreAllMocks();
  });

  it('falls through to the next model when one is dead (404)', async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('is not a valid model id'), { status: 404 }))
      .mockResolvedValueOnce({ choices: [{ message: { content: '{"ok":true}' } }] });
    const c = clientWithMock(create);

    const out = await c.chatJson(['dead/model:free', 'good/model:free'], 'sys', 'user');

    expect(out).toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(2); // tried dead, then good
  });

  it('also falls through on 429 rate-limit', async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('rate-limited'), { status: 429 }))
      .mockResolvedValueOnce({ choices: [{ message: { content: '{"v":1}' } }] });
    const c = clientWithMock(create);

    expect(await c.chatJson(['a:free', 'b:free'], 's', 'u')).toEqual({ v: 1 });
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('throws only after every model has been tried', async () => {
    const create = vi.fn().mockRejectedValue(Object.assign(new Error('404'), { status: 404 }));
    const c = clientWithMock(create);

    await expect(c.chatJson(['a:free', 'b:free', 'c:free'], 's', 'u')).rejects.toThrow(
      /All 3 OpenRouter models failed/,
    );
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('gives up immediately on a non-retryable error (e.g. auth)', async () => {
    const create = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('invalid api key'), { status: 401 }));
    const c = clientWithMock(create);

    await expect(c.chatJson(['a:free', 'b:free'], 's', 'u')).rejects.toThrow(/invalid api key/);
    expect(create).toHaveBeenCalledTimes(1); // did NOT waste calls on the rest
  });
});

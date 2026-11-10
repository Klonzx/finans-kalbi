import { FetchError } from 'ofetch';
import { describe, it, expect, vi } from 'vitest';

import { createJarvisApi, JarvisApiError, toJarvisError } from '@/composables/jarvisApi';

function httpError(status: number, data?: unknown): FetchError {
  const error = new FetchError(`HTTP ${status}`);
  Object.assign(error, { response: { status }, data });
  return error;
}

describe('jarvisApi', () => {
  it('parses health and freqtrade status responses', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url === '/health') {
        return {
          status: 'online',
          memory: 'connected',
          openrouter: 'configured',
          provider: 'openrouter',
          provider_status: 'configured',
        };
      }
      return { status: 'connected', mode: 'read-only', active_trades: 2 };
    });
    const api = createJarvisApi(fetcher);

    expect((await api.getHealth()).status).toBe('online');
    expect((await api.getFreqtradeStatus()).active_trades).toBe(2);
  });

  it('sends chat without conversation_id when none is given', async () => {
    const fetcher = vi.fn(async () => ({
      assistant: 'Jarvis',
      model: 'm',
      conversation_id: 'c1',
      reply: 'merhaba',
    }));
    const api = createJarvisApi(fetcher);

    const result = await api.sendChat('selam');

    expect(result.reply).toBe('merhaba');
    expect(fetcher).toHaveBeenCalledWith(
      '/chat',
      expect.objectContaining({
        method: 'POST',
        body: { message: 'selam' },
      }),
    );
  });

  it('keeps conversation_id when one is given', async () => {
    const fetcher = vi.fn(async () => ({
      assistant: 'Jarvis',
      model: null,
      conversation_id: 'c9',
      reply: null,
    }));
    const api = createJarvisApi(fetcher);

    await api.sendChat('devam', 'c9');

    expect(fetcher.mock.calls[0][1]?.body).toEqual({ message: 'devam', conversation_id: 'c9' });
  });

  it('rejects responses missing expected fields', async () => {
    const api = createJarvisApi(vi.fn(async () => ({ unexpected: true })));

    await expect(api.getFreqtradeStatus()).rejects.toMatchObject({ kind: 'bad_response' });
    await expect(api.getHealth()).rejects.toMatchObject({ kind: 'bad_response' });
    await expect(api.sendChat('x')).rejects.toMatchObject({ kind: 'bad_response' });
  });

  it('maps network failure to unreachable', () => {
    const error = toJarvisError(new FetchError('fetch failed'));
    expect(error.kind).toBe('unreachable');
  });

  it('maps timeouts to timeout', () => {
    const cause = new Error('timed out');
    cause.name = 'TimeoutError';
    const error = new FetchError('timeout');
    Object.assign(error, { cause });
    expect(toJarvisError(error).kind).toBe('timeout');
  });

  it('maps 401 and 403 to unauthorized', () => {
    expect(toJarvisError(httpError(401)).kind).toBe('unauthorized');
    expect(toJarvisError(httpError(403)).kind).toBe('unauthorized');
  });

  it('maps 503 to unavailable and keeps the backend detail', () => {
    const error = toJarvisError(
      httpError(503, { detail: 'Freqtrade API kimlik doğrulaması başarısız' }),
    );
    expect(error.kind).toBe('unavailable');
    expect(error.message).toBe('Freqtrade API kimlik doğrulaması başarısız');
    expect(error.status).toBe(503);
  });

  it('maps other HTTP errors to bad_response', () => {
    expect(toJarvisError(httpError(500)).kind).toBe('bad_response');
  });

  it('passes JarvisApiError through unchanged', () => {
    const original = new JarvisApiError('timeout', 'x');
    expect(toJarvisError(original)).toBe(original);
  });

  it('wraps a fetcher failure in JarvisApiError', async () => {
    const api = createJarvisApi(
      vi.fn(async () => {
        throw httpError(401);
      }),
    );

    await expect(api.getHealth()).rejects.toBeInstanceOf(JarvisApiError);
    await expect(api.getHealth()).rejects.toMatchObject({ kind: 'unauthorized' });
  });
});

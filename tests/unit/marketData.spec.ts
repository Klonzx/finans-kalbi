import { describe, it, expect, vi } from 'vitest';

import { createJarvisApi } from '@/composables/jarvisApi';
import {
  formatMarketPrice,
  marketDirection,
  normalizeFreqtradePair,
} from '@/utils/dashboard/market';

describe('getMarketTickers client', () => {
  it('sends symbols as a query and returns the snapshot', async () => {
    const snapshot = {
      provider: 'binance',
      status: 'ok',
      fetched_at: '2026-11-10T12:00:00+00:00',
      error: null,
      missing_symbols: [],
      tickers: [],
    };
    const fetcher = vi.fn(async () => snapshot);
    const api = createJarvisApi(fetcher);

    const result = await api.getMarketTickers(['BTC/USDT', 'ETH/USDT']);

    expect(result.status).toBe('ok');
    expect(fetcher).toHaveBeenCalledWith(
      '/api/market/tickers',
      expect.objectContaining({
        method: 'GET',
        query: { symbols: 'BTC/USDT,ETH/USDT', provider: 'binance' },
      }),
    );
  });

  it('rejects a response without a tickers array', async () => {
    const api = createJarvisApi(vi.fn(async () => ({ status: 'ok' })));
    await expect(api.getMarketTickers(['BTC/USDT'])).rejects.toMatchObject({
      kind: 'bad_response',
    });
  });
});

describe('marketDirection', () => {
  it('classifies moves using a flat band around zero', () => {
    expect(marketDirection(1.2)).toBe('up');
    expect(marketDirection(-3)).toBe('down');
    expect(marketDirection(0.3)).toBe('flat');
    expect(marketDirection(-0.5)).toBe('flat');
  });

  it('returns null without a change value', () => {
    expect(marketDirection(null)).toBeNull();
    expect(marketDirection(Number.NaN)).toBeNull();
  });
});

describe('normalizeFreqtradePair', () => {
  it('strips the futures settle suffix', () => {
    expect(normalizeFreqtradePair('BTC/USDT:USDT')).toBe('BTC/USDT');
    expect(normalizeFreqtradePair('ETH/USDT')).toBe('ETH/USDT');
  });
});

describe('formatMarketPrice', () => {
  it('uses more decimals for smaller prices', () => {
    expect(formatMarketPrice(65000.1)).toMatch(/65.000,10|65\.000,10/);
    expect(formatMarketPrice(2.5)).toMatch(/2,5000/);
    expect(formatMarketPrice(0.5)).toMatch(/0,500000/);
  });
});

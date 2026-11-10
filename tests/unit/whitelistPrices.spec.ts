import { describe, it, expect } from 'vitest';

import {
  addWatchlistSymbol,
  MAX_WATCHLIST_SYMBOLS,
  parseSymbolInput,
  pickClosePrice,
} from '@/utils/dashboard/whitelist';

describe('pickClosePrice', () => {
  it('reads the close column of the last candle', () => {
    expect(
      pickClosePrice({
        columns: ['close'],
        data: [[100], [101.5]],
      }),
    ).toBe(101.5);
  });

  it('finds the close column even when other columns are present', () => {
    expect(
      pickClosePrice({
        columns: ['open', 'close', 'volume'],
        data: [[1, 2, 3]],
      }),
    ).toBe(2);
  });

  it('returns null without a close column or data', () => {
    expect(pickClosePrice({ columns: ['open'], data: [[1]] })).toBeNull();
    expect(pickClosePrice({ columns: ['close'], data: [] })).toBeNull();
    expect(pickClosePrice({})).toBeNull();
  });
});

describe('parseSymbolInput', () => {
  it('normalizes case and whitespace', () => {
    expect(parseSymbolInput('  btc/usdt ')).toEqual({ ok: true, symbol: 'BTC/USDT' });
  });

  it('rejects empty and malformed input', () => {
    expect(parseSymbolInput('   ').ok).toBe(false);
    expect(parseSymbolInput('BTCUSDT').ok).toBe(false);
    expect(parseSymbolInput('BTC-USDT;drop').ok).toBe(false);
  });
});

describe('addWatchlistSymbol', () => {
  it('appends a valid new symbol', () => {
    expect(addWatchlistSymbol(['BTC/USDT'], 'eth/usdt')).toEqual({
      list: ['BTC/USDT', 'ETH/USDT'],
      error: null,
    });
  });

  it('reports duplicates without changing the list', () => {
    const result = addWatchlistSymbol(['BTC/USDT'], 'btc/usdt');
    expect(result.list).toEqual(['BTC/USDT']);
    expect(result.error).toMatch(/zaten/);
  });

  it('enforces the maximum count', () => {
    const full = Array.from({ length: MAX_WATCHLIST_SYMBOLS }, (_, i) => `A${i}/USDT`);
    const result = addWatchlistSymbol(full, 'NEW/USDT');
    expect(result.list).toHaveLength(MAX_WATCHLIST_SYMBOLS);
    expect(result.error).not.toBeNull();
  });
});

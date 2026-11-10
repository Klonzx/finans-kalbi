import { describe, it, expect } from 'vitest';

import {
  combinedWinRate,
  localIsoDate,
  summarizeClosedTrades,
  sumWhenSameCurrency,
  todayProfit,
} from '@/utils/dashboard/kpis';

describe('summarizeClosedTrades', () => {
  it('computes win rate, averages, profit factor from closed trades only', () => {
    const summary = summarizeClosedTrades([
      { is_open: false, profit_abs: 10 },
      { is_open: false, profit_abs: 30 },
      { is_open: false, profit_abs: -20 },
      { is_open: true, profit_abs: 999 }, // açık işlem sayılmaz
    ]);
    expect(summary.closedCount).toBe(3);
    expect(summary.winRate).toBeCloseTo(2 / 3);
    expect(summary.avgWin).toBe(20);
    expect(summary.avgLoss).toBe(-20);
    expect(summary.profitFactor).toBe(2); // 40 / 20
    expect(summary.totalRealized).toBe(20);
  });

  it('returns nulls when there is no data instead of inventing values', () => {
    const summary = summarizeClosedTrades([]);
    expect(summary.winRate).toBeNull();
    expect(summary.avgWin).toBeNull();
    expect(summary.avgLoss).toBeNull();
    expect(summary.profitFactor).toBeNull();
  });

  it('profit factor is null when there are no losses', () => {
    const summary = summarizeClosedTrades([{ is_open: false, profit_abs: 5 }]);
    expect(summary.profitFactor).toBeNull();
    expect(summary.winRate).toBe(1);
  });

  it('ignores trades without a profit_abs value', () => {
    const summary = summarizeClosedTrades([{ is_open: false }]);
    expect(summary.closedCount).toBe(0);
  });
});

describe('sumWhenSameCurrency', () => {
  it('sums values when currencies match', () => {
    expect(sumWhenSameCurrency([100, 250], true)).toBe(350);
  });

  it('refuses to sum across different stake currencies', () => {
    expect(sumWhenSameCurrency([100, 250], false)).toBeNull();
  });

  it('returns null when any value is missing', () => {
    expect(sumWhenSameCurrency([100, undefined], true)).toBeNull();
    expect(sumWhenSameCurrency([], true)).toBeNull();
  });
});

describe('combinedWinRate', () => {
  it('weights by trade counts, not by averaging per-bot rates', () => {
    // Bot A: 9 kazanç / 1 kayıp (%90). Bot B: 0 kazanç / 1 kayıp (%0).
    // Oranların ortalaması 0.45 olurdu. Doğru birleşik oran 9 / 11 ≈ 0.818.
    expect(combinedWinRate([9, 0], [1, 1])).toBeCloseTo(9 / 11);
  });

  it('returns null without trades or data', () => {
    expect(combinedWinRate([0], [0])).toBeNull();
    expect(combinedWinRate([undefined], [1])).toBeNull();
  });
});

describe('todayProfit', () => {
  const rows = [
    { date: '2026-11-09', abs_profit: 4 },
    { date: '2026-11-10', abs_profit: -12.5 },
  ];

  it('returns the value for today', () => {
    expect(todayProfit(rows, '2026-11-10')).toBe(-12.5);
  });

  it('returns 0 when data is loaded but has no row for today', () => {
    expect(todayProfit(rows, '2026-11-11')).toBe(0);
  });

  it('returns null when daily data has not loaded', () => {
    expect(todayProfit(undefined, '2026-11-10')).toBeNull();
  });
});

describe('localIsoDate', () => {
  it('formats a local date as yyyy-mm-dd with zero padding', () => {
    expect(localIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(localIsoDate(new Date(2026, 10, 10))).toBe('2026-11-10');
  });
});

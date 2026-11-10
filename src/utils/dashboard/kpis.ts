/**
 * Dashboard KPI hesapları. Saf fonksiyonlar: store'a bağımlı değildir, birim test edilebilir.
 * Hiçbir değer uydurulmaz; veri eksikse null döner ve arayüz bunu "Veri yok" olarak gösterir.
 */
import type { TradePerformance } from '@/types/dashboard';

interface ClosedCandidate {
  is_open: boolean;
  profit_abs?: number;
}

/** Kapalı işlemlerden performans özeti çıkarır. Açık işlemler ve profit_abs'ı olmayanlar sayılmaz. */
export function summarizeClosedTrades(trades: ClosedCandidate[]): TradePerformance {
  const closed = trades
    .filter((t) => t.is_open === false && typeof t.profit_abs === 'number')
    .map((t) => t.profit_abs as number);

  const wins = closed.filter((p) => p > 0);
  const losses = closed.filter((p) => p < 0);
  const grossWin = wins.reduce((acc, p) => acc + p, 0);
  const grossLoss = losses.reduce((acc, p) => acc + p, 0);

  return {
    closedCount: closed.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: closed.length > 0 ? wins.length / closed.length : null,
    avgWin: wins.length > 0 ? grossWin / wins.length : null,
    avgLoss: losses.length > 0 ? grossLoss / losses.length : null,
    // Kayıp yoksa profit factor tanımsızdır (sonsuz); null döner.
    profitFactor: grossLoss < 0 ? grossWin / -grossLoss : null,
    totalRealized: closed.reduce((acc, p) => acc + p, 0),
  };
}

/**
 * Birden çok botun aynı değerini toplar. Stake para birimleri farklıysa
 * veya bir değer eksikse toplam üretilmez (null).
 */
export function sumWhenSameCurrency(
  values: Array<number | null | undefined>,
  sameCurrency: boolean,
): number | null {
  if (!sameCurrency || values.length === 0) {
    return null;
  }
  if (values.some((v) => typeof v !== 'number')) {
    return null;
  }
  return (values as number[]).reduce((acc, v) => acc + v, 0);
}

/** Birden çok botun kazanma oranı: kazanan / (kazanan + kaybeden). Oran ortalaması alınmaz. */
export function combinedWinRate(
  winning: Array<number | null | undefined>,
  losing: Array<number | null | undefined>,
): number | null {
  const allNumbers = [...winning, ...losing].every((v) => typeof v === 'number');
  if (!allNumbers) {
    return null;
  }
  const wins = (winning as number[]).reduce((acc, v) => acc + v, 0);
  const losses = (losing as number[]).reduce((acc, v) => acc + v, 0);
  const total = wins + losses;
  return total > 0 ? wins / total : null;
}

/** Yerel tarihi yyyy-mm-dd biçiminde döndürür (günlük kayıtlarla aynı biçim). */
export function localIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Bugünkü kâr/zarar. Günlük veri hiç yüklenmediyse null (bilinmiyor).
 * Veri yüklendi ama bugün için satır yoksa 0 (bugün işlem yok).
 */
export function todayProfit(
  dailyRows: Array<{ date: string; abs_profit: number }> | undefined,
  today: string,
): number | null {
  if (!dailyRows) {
    return null;
  }
  const row = dailyRows.find((r) => r.date === today);
  return row ? row.abs_profit : 0;
}

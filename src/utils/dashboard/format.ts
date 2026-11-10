import { formatNumber, formatPercent, formatPriceCurrency } from '@/utils/formatters/numberformat';

/** Eksik değer göstergesi. Sahte sıfır üretmek yerine bu kullanılır. */
export const MISSING = '—';

/** Para tutarı. Stake para birimi yoksa sayı olarak gösterilir. */
export function formatMoney(value: number | null, currency: string | null): string {
  if (value === null) {
    return MISSING;
  }
  return currency ? formatPriceCurrency(value, currency, 2) : formatNumber(value, 2);
}

/** Oran (0-1) yüzde olarak. */
export function formatRatioPercent(value: number | null, decimals = 1): string {
  if (value === null) {
    return MISSING;
  }
  return formatPercent(value, decimals);
}

/** Kâr/zarar tonu: pozitif yeşil (profit), negatif kırmızı (loss), sıfır nötr. */
export function profitTone(value: number | null): 'profit' | 'loss' | 'neutral' {
  if (value === null || value === 0) {
    return 'neutral';
  }
  return value > 0 ? 'profit' : 'loss';
}

/** Whitelist fiyatı ve izleme listesi yardımcıları. Saf fonksiyonlar. */

/** JARVIS/Binance ile uyumlu parite biçimi: "BTC/USDT". */
export const SYMBOL_PATTERN = /^[A-Z0-9]{2,10}\/[A-Z0-9]{2,10}$/;
export const MAX_WATCHLIST_SYMBOLS = 10;

/** Freqtrade /pair_candles yanıtından son kapanış fiyatını alır. Sütun yoksa veya veri boşsa null. */
export function pickClosePrice(response: { columns?: string[]; data?: number[][] }): number | null {
  const closeIndex = response.columns?.indexOf('close') ?? -1;
  if (closeIndex === -1 || !response.data || response.data.length === 0) {
    return null;
  }
  const lastRow = response.data[response.data.length - 1];
  const value = lastRow?.[closeIndex];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export type SymbolInputResult = { ok: true; symbol: string } | { ok: false; reason: string };

/** Kullanıcı girdisini doğrular ve büyük harfe çevirir. */
export function parseSymbolInput(raw: string): SymbolInputResult {
  const symbol = raw.trim().toUpperCase();
  if (!symbol) {
    return { ok: false, reason: 'Parite boş olamaz.' };
  }
  if (!SYMBOL_PATTERN.test(symbol)) {
    return { ok: false, reason: 'Biçim BTC/USDT şeklinde olmalı.' };
  }
  return { ok: true, symbol };
}

/** Listeye parite ekler. Tekrar, üst sınır ve geçersiz girdi için açıklayıcı hata döner. */
export function addWatchlistSymbol(
  list: string[],
  raw: string,
  max = MAX_WATCHLIST_SYMBOLS,
): { list: string[]; error: string | null } {
  const parsed = parseSymbolInput(raw);
  if (!parsed.ok) {
    return { list, error: parsed.reason };
  }
  if (list.includes(parsed.symbol)) {
    return { list, error: 'Bu parite zaten listede.' };
  }
  if (list.length >= max) {
    return { list, error: `En fazla ${max} parite izlenebilir.` };
  }
  return { list: [...list, parsed.symbol], error: null };
}

/** Piyasa paneli yardımcıları. Saf fonksiyonlar; birim testle kapsanır. */

export type MarketDirection = 'up' | 'down' | 'flat';

/** 24s değişime göre yön. ±0.5% içindeki hareket yatay sayılır. Bu bir hesaplamadır, sinyal değildir. */
export function marketDirection(
  changePct: number | null,
  flatBandPct = 0.5,
): MarketDirection | null {
  if (changePct === null || !Number.isFinite(changePct)) {
    return null;
  }
  if (Math.abs(changePct) <= flatBandPct) {
    return 'flat';
  }
  return changePct > 0 ? 'up' : 'down';
}

/** Son güncelleme zamanı: yerel saat HH:mm:ss. Geçersiz tarihte null. */
export function formatUpdatedAt(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Freqtrade pariteleri "BTC/USDT:USDT" biçimindedir; genel piyasa notasyonuna çevrilir. */
export function normalizeFreqtradePair(pair: string): string {
  const colon = pair.indexOf(':');
  return colon === -1 ? pair : pair.slice(0, colon);
}

/** Fiyat: büyüklüğe göre ondalık sayısı. */
export function formatMarketPrice(value: number): string {
  const digits = Math.abs(value) >= 1000 ? 2 : Math.abs(value) >= 1 ? 4 : 6;
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Hacim: kısaltılmış (1,2 Mr gibi) biçim. */
export function formatCompactVolume(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return value.toLocaleString('tr-TR', { notation: 'compact', maximumFractionDigits: 2 });
}

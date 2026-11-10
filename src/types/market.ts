/** JARVIS /api/market/tickers yanıtı. Kaynak: JarvisAI/market_data. */

export interface MarketTicker {
  /** UI notasyonu, örn. "BTC/USDT" */
  symbol: string;
  last: number;
  change_pct_24h: number | null;
  high_24h: number | null;
  low_24h: number | null;
  quote_volume_24h: number | null;
  provider: string;
  fetched_at: string;
}

export type MarketStatus = 'ok' | 'stale' | 'unavailable';

export interface MarketSnapshot {
  provider: string;
  status: MarketStatus;
  /** En yeni veri zamanı (ISO, UTC). Hiç veri yoksa null. */
  fetched_at: string | null;
  /** Sağlayıcı hatası; status "stale" ise önbellekten gösterilir. */
  error: string | null;
  /** Sağlayıcının listelemediği istenen pariteler. */
  missing_symbols: string[];
  tickers: MarketTicker[];
}

import { useApi } from '@/composables/api';
import { useLoginInfo } from '@/composables/loginInfo';
import { normalizeFreqtradePair } from '@/utils/dashboard/market';
import { pickClosePrice } from '@/utils/dashboard/whitelist';

/** Tek yenilemede en fazla bu kadar parite sorgulanır. Fazlası gizlenmez, sayısı gösterilir. */
export const WHITELIST_PRICE_LIMIT = 20;
const REFRESH_MS = 60_000;

export interface WhitelistPriceRow {
  pair: string;
  botName: string;
  timeframe: string;
  /** Son kapanmış mumun kapanış fiyatı. Açık işlem varsa tercih edilen güncel kur ayrıca gelir. */
  closePrice: number | null;
  openTradeRate: number | null;
  error: string | null;
}

interface WhitelistSource {
  botId: string;
  botName: string;
  pair: string;
  timeframe: string;
  reducedPairCalls: boolean;
}

/**
 * Seçili botların whitelist'indeki pariteler için Freqtrade'den fiyat okur.
 * Yalnızca okuma yapar; paylaşılan candleData / grafik durumuna dokunmaz.
 */
export function useWhitelistPrices() {
  const botStore = useBotStore();
  const rows = ref<WhitelistPriceRow[]>([]);
  const omittedCount = ref(0);
  const loading = ref(false);
  const updatedAt = ref<string | null>(null);
  const apiByBot = new Map<string, ReturnType<typeof useApi>['api']>();

  function apiFor(botId: string) {
    let api = apiByBot.get(botId);
    if (!api) {
      api = useApi(useLoginInfo(botId), botId).api;
      apiByBot.set(botId, api);
    }
    return api;
  }

  function collectSources(): WhitelistSource[] {
    const seen = new Set<string>();
    const sources: WhitelistSource[] = [];
    for (const bot of botStore.selectedBots) {
      for (const pair of bot.whitelist) {
        if (seen.has(pair)) {
          continue;
        }
        seen.add(pair);
        sources.push({
          botId: bot.botId,
          botName: bot.botName,
          pair,
          timeframe: bot.timeframe,
          reducedPairCalls: bot.botFeatures.reducedPairCalls === true,
        });
      }
    }
    return sources;
  }

  async function fetchClose(source: WhitelistSource): Promise<number | null> {
    const api = apiFor(source.botId);
    const payload = {
      pair: source.pair,
      timeframe: source.timeframe,
      limit: 2,
      columns: ['close'],
    };
    const response = source.reducedPairCalls
      ? await api<{ columns?: string[]; data?: number[][] }>('/pair_candles', {
          method: 'POST',
          body: payload,
        })
      : await api<{ columns?: string[]; data?: number[][] }>('/pair_candles', {
          query: payload,
        });
    return pickClosePrice(response);
  }

  function openTradeRates(): Map<string, number> {
    const rates = new Map<string, number>();
    for (const trade of botStore.allOpenTradesSelectedBots) {
      if (typeof trade.current_rate === 'number') {
        rates.set(normalizeFreqtradePair(trade.pair), trade.current_rate);
      }
    }
    return rates;
  }

  async function refresh() {
    if (loading.value) {
      return;
    }
    loading.value = true;
    try {
      const all = collectSources();
      const sources = all.slice(0, WHITELIST_PRICE_LIMIT);
      omittedCount.value = all.length - sources.length;
      const rates = openTradeRates();

      rows.value = await Promise.all(
        sources.map(async (source): Promise<WhitelistPriceRow> => {
          const base = {
            pair: source.pair,
            botName: source.botName,
            timeframe: source.timeframe,
            openTradeRate: rates.get(normalizeFreqtradePair(source.pair)) ?? null,
          };
          try {
            return { ...base, closePrice: await fetchClose(source), error: null };
          } catch {
            return { ...base, closePrice: null, error: 'Freqtrade fiyatı alınamadı' };
          }
        }),
      );
      updatedAt.value = new Date().toISOString();
    } finally {
      loading.value = false;
    }
  }

  refresh();
  const timer = setInterval(refresh, REFRESH_MS);
  onScopeDispose(() => clearInterval(timer));

  return { rows, omittedCount, loading, updatedAt, refresh };
}

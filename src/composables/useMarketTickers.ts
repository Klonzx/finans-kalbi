import type { MaybeRefOrGetter } from 'vue';
import { toJarvisError, useJarvisApi } from '@/composables/jarvisApi';
import type { MarketSnapshot } from '@/types/market';

/** Varsayılan izlenen pariteler. Kullanıcı kendi listesini değiştirebilir (bkz. useWatchlist). */
export const DEFAULT_MARKET_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];

const REFRESH_MS = 30_000;

/**
 * Genel piyasa verisini periyodik olarak yeniler. Liste değişince hemen yeniden sorgular.
 * JARVIS erişilemezse snapshot null kalır ve hata gösterilir; Freqtrade verisi etkilenmez.
 */
export function useMarketTickers(symbols: MaybeRefOrGetter<string[]> = DEFAULT_MARKET_SYMBOLS) {
  const api = useJarvisApi();
  const snapshot = ref<MarketSnapshot | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  async function refresh() {
    if (loading.value) {
      return;
    }
    const list = toValue(symbols);
    if (list.length === 0) {
      snapshot.value = null;
      error.value = null;
      return;
    }
    loading.value = true;
    try {
      snapshot.value = await api.getMarketTickers(list);
      error.value = null;
    } catch (err) {
      error.value = toJarvisError(err).message;
    } finally {
      loading.value = false;
    }
  }

  watch(() => [...toValue(symbols)].join(','), refresh);
  refresh();
  const timer = setInterval(refresh, REFRESH_MS);
  onScopeDispose(() => clearInterval(timer));

  return { snapshot, error, loading, refresh };
}

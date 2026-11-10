import { DEFAULT_MARKET_SYMBOLS } from '@/composables/useMarketTickers';

const STORAGE_KEY = 'ftMarketSymbols';

/**
 * Kullanıcının izleme listesi (localStorage). Geçersiz kayıtlar varsayılana döner.
 * Sadece okuma/yazma; ağ çağrısı yoktur.
 */
export function useWatchlist() {
  const symbols = useLocalStorage<string[]>(STORAGE_KEY, [...DEFAULT_MARKET_SYMBOLS], {
    serializer: {
      read: (raw: string) => {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
            return parsed as string[];
          }
        } catch {
          // bozuk kayıt: varsayılana dön
        }
        return [...DEFAULT_MARKET_SYMBOLS];
      },
      write: (value: string[]) => JSON.stringify(value),
    },
  });

  function reset() {
    symbols.value = [...DEFAULT_MARKET_SYMBOLS];
  }

  return { symbols, reset };
}

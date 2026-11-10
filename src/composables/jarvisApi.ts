import { FetchError, ofetch } from 'ofetch';

import type { MarketSnapshot } from '@/types/market';
import type {
  JarvisChatRequest,
  JarvisChatResponse,
  JarvisFreqtradeStatus,
  JarvisHealth,
} from '@/types/jarvis';

/** Vite proxy öneki. Tarayıcı JARVIS'e bu yol üzerinden ulaşır (bkz. vite.config.ts). */
export const JARVIS_BASE_URL = '/jarvis';

/** Backend chat zaman aşımı 90 sn; istemci biraz daha uzun bekler. */
const CHAT_TIMEOUT_MS = 100_000;
const DEFAULT_TIMEOUT_MS = 8_000;

export type JarvisErrorKind =
  | 'unreachable' // JARVIS çalışmıyor ya da proxy hedefine ulaşılamıyor
  | 'timeout'
  | 'unauthorized' // 401/403
  | 'unavailable' // 502/503: backend yapılandırma eksik ya da Freqtrade'e ulaşamıyor
  | 'bad_response' // beklenen şekilde olmayan yanıt
  | 'unknown';

/** Tüm JARVIS istemci hataları bu sınıfla döner; ham FetchError arayüze sızmaz. */
export class JarvisApiError extends Error {
  readonly kind: JarvisErrorKind;
  readonly status?: number;

  constructor(kind: JarvisErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'JarvisApiError';
    this.kind = kind;
    this.status = status;
  }
}

/** İstek fonksiyonu. Testlerde sahte bir fetcher enjekte edilir. */
export type JarvisFetcher = (
  request: string,
  options?: {
    method?: 'GET' | 'POST';
    body?: unknown;
    query?: Record<string, string>;
    timeout?: number;
  },
) => Promise<unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Ham hatayı JarvisApiError'a çevirir. */
export function toJarvisError(error: unknown): JarvisApiError {
  if (error instanceof JarvisApiError) {
    return error;
  }

  if (error instanceof FetchError) {
    const status = error.response?.status;
    if (status === undefined) {
      const cause = error.cause as { name?: string } | undefined;
      if (cause?.name === 'TimeoutError' || cause?.name === 'AbortError') {
        return new JarvisApiError('timeout', 'JARVIS yanıt vermedi (zaman aşımı).');
      }
      return new JarvisApiError(
        'unreachable',
        "JARVIS'e ulaşılamadı. Servisin çalıştığını kontrol edin.",
      );
    }
    if (status === 401 || status === 403) {
      return new JarvisApiError('unauthorized', 'JARVIS yetkilendirme hatası verdi.', status);
    }
    if (status === 502 || status === 503) {
      const detail =
        isRecord(error.data) && typeof error.data.detail === 'string'
          ? error.data.detail
          : undefined;
      return new JarvisApiError(
        'unavailable',
        detail ?? 'JARVIS şu anda hizmet veremiyor.',
        status,
      );
    }
    return new JarvisApiError(
      'bad_response',
      `JARVIS beklenmeyen bir yanıt verdi (HTTP ${status}).`,
      status,
    );
  }

  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    return new JarvisApiError('timeout', 'JARVIS yanıt vermedi (zaman aşımı).');
  }

  return new JarvisApiError('unknown', 'JARVIS isteği beklenmeyen bir hatayla sonuçlandı.');
}

function expectRecord(value: unknown, endpoint: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new JarvisApiError('bad_response', `${endpoint} beklenen biçimde yanıt vermedi.`);
  }
  return value;
}

/**
 * JARVIS API istemcisi. Fetcher dışarıdan verilebildiği için birim testte gerçek servise gerek kalmaz.
 * Yazma yapan tek uç nokta POST /chat'tir. Freqtrade'e hiçbir yazma işlemi bu istemciden yapılmaz.
 */
export function createJarvisApi(fetcher: JarvisFetcher) {
  async function getHealth(): Promise<JarvisHealth> {
    const data = expectRecord(
      await run(() => fetcher('/health', { method: 'GET', timeout: DEFAULT_TIMEOUT_MS })),
      '/health',
    );
    if (typeof data.status !== 'string') {
      throw new JarvisApiError('bad_response', '/health yanıtında status alanı yok.');
    }
    return data as unknown as JarvisHealth;
  }

  async function getFreqtradeStatus(): Promise<JarvisFreqtradeStatus> {
    const data = expectRecord(
      await run(() =>
        fetcher('/api/freqtrade/status', { method: 'GET', timeout: DEFAULT_TIMEOUT_MS }),
      ),
      '/api/freqtrade/status',
    );
    if (typeof data.active_trades !== 'number') {
      throw new JarvisApiError('bad_response', 'Freqtrade durumunda active_trades alanı yok.');
    }
    return data as unknown as JarvisFreqtradeStatus;
  }

  async function sendChat(
    message: string,
    conversationId?: string | null,
  ): Promise<JarvisChatResponse> {
    const body: JarvisChatRequest = { message };
    if (conversationId) {
      body.conversation_id = conversationId;
    }
    const data = expectRecord(
      await run(() => fetcher('/chat', { method: 'POST', body, timeout: CHAT_TIMEOUT_MS })),
      '/chat',
    );
    if (typeof data.conversation_id !== 'string' || !('reply' in data)) {
      throw new JarvisApiError('bad_response', '/chat yanıtı beklenen alanları içermiyor.');
    }
    return data as unknown as JarvisChatResponse;
  }

  /** Genel piyasa verisi (JARVIS backend proxy'si üzerinden). Sembol listesi en fazla 10 öğedir. */
  async function getMarketTickers(
    symbols: string[],
    provider = 'binance',
  ): Promise<MarketSnapshot> {
    const data = expectRecord(
      await run(() =>
        fetcher('/api/market/tickers', {
          method: 'GET',
          query: { symbols: symbols.join(','), provider },
          timeout: DEFAULT_TIMEOUT_MS,
        }),
      ),
      '/api/market/tickers',
    );
    if (typeof data.status !== 'string' || !Array.isArray(data.tickers)) {
      throw new JarvisApiError('bad_response', '/api/market/tickers beklenen alanları içermiyor.');
    }
    return data as unknown as MarketSnapshot;
  }

  async function run(call: () => Promise<unknown>): Promise<unknown> {
    try {
      return await call();
    } catch (error) {
      throw toJarvisError(error);
    }
  }

  return { getHealth, getFreqtradeStatus, sendChat, getMarketTickers };
}

/** Uygulama içi varsayılan istemci. Retry kapalıdır; sohbet isteği iki kez gönderilmemeli. */
export function useJarvisApi() {
  const http = ofetch.create({ baseURL: JARVIS_BASE_URL, retry: false });
  const fetcher: JarvisFetcher = (request, options) =>
    http(request, options as Parameters<typeof http>[1]);
  return createJarvisApi(fetcher);
}

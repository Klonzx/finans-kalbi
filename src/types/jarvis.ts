/** JARVIS AI backend yanıt tipleri. Kaynak: JarvisAI/main.py, freqtrade_bridge.py. */

/** GET /health */
export interface JarvisHealth {
  status: 'online' | 'degraded' | string;
  memory: string;
  openrouter: string;
  provider: string;
  provider_status: string;
}

/** GET /api/freqtrade/status (salt okunur; yalnızca özet döner) */
export interface JarvisFreqtradeStatus {
  status: string;
  mode: string;
  active_trades: number;
}

/** POST /chat gövdesi */
export interface JarvisChatRequest {
  message: string;
  conversation_id?: string | null;
}

/** POST /chat yanıtı. reply null olabilir. */
export interface JarvisChatResponse {
  assistant: string;
  model: string | null;
  conversation_id: string;
  reply: string | null;
}

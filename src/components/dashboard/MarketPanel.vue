<script setup lang="ts">
import { useMarketTickers } from '@/composables/useMarketTickers';
import { useWatchlist } from '@/composables/useWatchlist';
import { useWhitelistPrices } from '@/composables/useWhitelistPrices';
import { MISSING } from '@/utils/dashboard/format';
import {
  formatCompactVolume,
  formatMarketPrice,
  formatUpdatedAt,
  marketDirection,
} from '@/utils/dashboard/market';
import { addWatchlistSymbol, MAX_WATCHLIST_SYMBOLS } from '@/utils/dashboard/whitelist';
import { TR } from '@/utils/trStrings';

const { symbols, reset: resetWatchlist } = useWatchlist();
const { snapshot, error, loading, refresh } = useMarketTickers(() => symbols.value);
const whitelist = useWhitelistPrices();

const newSymbol = ref('');
const inputError = ref<string | null>(null);

const STATUS_LABEL = {
  ok: 'Canlı',
  stale: 'Son bilinen veri',
  unavailable: 'Veri yok',
} as const;

const DIRECTION_LABEL = {
  up: 'Yükseliş',
  down: 'Düşüş',
  flat: 'Yatay',
} as const;

const updatedAt = computed(() => formatUpdatedAt(snapshot.value?.fetched_at ?? null));
const whitelistUpdatedAt = computed(() => formatUpdatedAt(whitelist.updatedAt.value));

function directionText(changePct: number | null): string {
  const direction = marketDirection(changePct);
  return direction === null ? MISSING : DIRECTION_LABEL[direction];
}

function changeClass(changePct: number | null): string {
  if (changePct === null || changePct === 0) {
    return '';
  }
  return changePct > 0 ? 'text-[var(--fk-profit)]' : 'text-[var(--fk-loss)]';
}

function addSymbol() {
  const result = addWatchlistSymbol(symbols.value, newSymbol.value);
  inputError.value = result.error;
  if (!result.error) {
    symbols.value = result.list;
    newSymbol.value = '';
  }
}

function removeSymbol(symbol: string) {
  symbols.value = symbols.value.filter((s) => s !== symbol);
}
</script>

<template>
  <section
    class="flex min-h-0 min-w-0 flex-col gap-2 rounded-sm xl:h-full xl:overflow-y-auto border border-[var(--fk-border)] bg-[var(--fk-surface)] p-3"
  >
    <header class="flex items-center justify-between gap-2">
      <h2 class="text-sm font-semibold text-[var(--fk-text)]">Piyasa</h2>
      <div class="flex items-center gap-2">
        <span v-if="snapshot" class="text-[10px] text-[var(--fk-text-muted)]">
          {{ STATUS_LABEL[snapshot.status] }}
        </span>
        <button
          type="button"
          class="rounded-sm border border-[var(--fk-border)] px-2 py-0.5 text-xs text-[var(--fk-text-muted)] hover:text-[var(--fk-accent)] disabled:opacity-50"
          :disabled="loading"
          @click="refresh"
        >
          Yenile
        </button>
      </div>
    </header>

    <!-- Genel piyasa: harici kaynak, JARVIS proxy'si üzerinden -->
    <div class="flex flex-col gap-1">
      <p class="text-[10px] text-[var(--fk-text-muted)]">
        Genel piyasa: {{ snapshot ? `${snapshot.provider} (harici)` : 'harici kaynak' }}
        <template v-if="updatedAt"> · Güncelleme {{ updatedAt }}</template>
      </p>

      <div v-if="!snapshot && error">
        <DataMissingNotice :message="TR.jarvisNotConnected" />
        <p class="mt-1 text-xs text-[var(--fk-text-muted)]">{{ error }}</p>
      </div>
      <p v-if="snapshot?.error" class="text-xs text-[var(--fk-warning)]">
        {{ snapshot.error }} Önbellekteki son değerler gösteriliyor.
      </p>

      <table v-if="snapshot && snapshot.tickers.length" class="w-full text-sm tabular-nums">
        <thead class="text-left text-[10px] uppercase text-[var(--fk-text-muted)]">
          <tr>
            <th class="py-1 font-normal">Parite</th>
            <th class="py-1 text-right font-normal">Fiyat</th>
            <th class="py-1 text-right font-normal">24s</th>
            <th class="py-1 text-right font-normal">Yön*</th>
            <th class="py-1 text-right font-normal">24s hacim</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in snapshot.tickers"
            :key="t.symbol"
            class="border-t border-[var(--fk-border)] text-[var(--fk-text)]"
          >
            <td class="py-1">{{ t.symbol }}</td>
            <td class="py-1 text-right">{{ formatMarketPrice(t.last) }}</td>
            <td class="py-1 text-right" :class="changeClass(t.change_pct_24h)">
              {{ t.change_pct_24h === null ? MISSING : `${t.change_pct_24h.toFixed(2)}%` }}
            </td>
            <td class="py-1 text-right text-xs text-[var(--fk-text-muted)]">
              {{ directionText(t.change_pct_24h) }}
            </td>
            <td class="py-1 text-right text-xs text-[var(--fk-text-muted)]">
              {{ formatCompactVolume(t.quote_volume_24h) }}
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="snapshot?.missing_symbols.length" class="text-xs text-[var(--fk-text-muted)]">
        Borsada listelenmeyen: {{ snapshot.missing_symbols.join(', ') }}
      </p>
      <p class="text-[10px] text-[var(--fk-text-muted)]">
        * Yön, 24 saatlik değişime göre hesaplanır (±0,5% yatay). Yatırım tavsiyesi değildir.
      </p>

      <!-- İzleme listesi düzenleme -->
      <form class="flex flex-wrap items-center gap-2" @submit.prevent="addSymbol">
        <input
          v-model="newSymbol"
          type="text"
          maxlength="21"
          placeholder="BTC/USDT"
          class="w-28 rounded-sm border border-[var(--fk-border)] bg-[var(--fk-bg)] px-2 py-0.5 text-xs text-[var(--fk-text)]"
        />
        <button
          type="submit"
          class="rounded-sm border border-[var(--fk-accent)] px-2 py-0.5 text-xs text-[var(--fk-accent)]"
        >
          Ekle
        </button>
        <button
          type="button"
          class="text-xs text-[var(--fk-text-muted)] hover:text-[var(--fk-accent)]"
          @click="resetWatchlist"
        >
          Varsayılana dön
        </button>
        <span v-if="inputError" class="text-xs text-[var(--fk-loss)]">{{ inputError }}</span>
      </form>
      <p class="text-[10px] text-[var(--fk-text-muted)]">
        {{ symbols.length }}/{{ MAX_WATCHLIST_SYMBOLS }} parite izleniyor
      </p>
      <ul class="flex flex-wrap gap-1">
        <li
          v-for="symbol in symbols"
          :key="symbol"
          class="flex items-center gap-1 rounded-sm border border-[var(--fk-border)] px-1.5 py-0.5 text-[10px] text-[var(--fk-text)]"
        >
          {{ symbol }}
          <button
            type="button"
            class="text-[var(--fk-text-muted)] hover:text-[var(--fk-loss)]"
            :aria-label="`${symbol} kaldır`"
            @click="removeSymbol(symbol)"
          >
            ×
          </button>
        </li>
      </ul>
    </div>

    <!-- Freqtrade verisi: bot whitelist'i -->
    <div class="flex flex-col gap-1 border-t border-[var(--fk-border)] pt-2">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold text-[var(--fk-text)]">Bot whitelist (Freqtrade)</h3>
        <button
          type="button"
          class="text-[10px] text-[var(--fk-text-muted)] hover:text-[var(--fk-accent)] disabled:opacity-50"
          :disabled="whitelist.loading.value"
          @click="whitelist.refresh"
        >
          Fiyatları yenile
        </button>
      </div>
      <p v-if="whitelist.rows.value.length === 0" class="text-xs text-[var(--fk-text-muted)]">
        {{ TR.dataMissing }}: seçili botta whitelist yok
      </p>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-xs tabular-nums">
          <thead class="text-left text-[10px] uppercase text-[var(--fk-text-muted)]">
            <tr>
              <th class="py-1 font-normal">Parite</th>
              <th class="py-1 font-normal">Bot</th>
              <th class="py-1 text-right font-normal">Son mum</th>
              <th class="py-1 text-right font-normal">Açık işlem kuru</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in whitelist.rows.value"
              :key="`${row.botName}|${row.pair}`"
              class="border-t border-[var(--fk-border)] text-[var(--fk-text)]"
            >
              <td class="py-1">{{ row.pair }}</td>
              <td class="py-1 text-[var(--fk-text-muted)]">{{ row.botName }}</td>
              <td class="py-1 text-right">
                <span v-if="row.error" class="text-[var(--fk-loss)]">{{ row.error }}</span>
                <span v-else-if="row.closePrice !== null">
                  {{ formatMarketPrice(row.closePrice) }}
                  <span class="text-[10px] text-[var(--fk-text-muted)]">{{ row.timeframe }}</span>
                </span>
                <span v-else class="text-[var(--fk-text-muted)]">{{ MISSING }}</span>
              </td>
              <td class="py-1 text-right">
                {{ row.openTradeRate === null ? MISSING : formatMarketPrice(row.openTradeRate) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="whitelist.omittedCount.value > 0" class="text-[10px] text-[var(--fk-warning)]">
        {{ whitelist.omittedCount.value }} parite fiyat sorgusu limiti nedeniyle gösterilmiyor.
      </p>
      <p class="text-[10px] text-[var(--fk-text-muted)]">
        Son mum: strateji zaman diliminin son mumunun kapanış değeri. Mum henüz oluşuyor olabilir,
        anlık tik değildir.
        <template v-if="whitelistUpdatedAt"> Güncelleme {{ whitelistUpdatedAt }}.</template>
      </p>
    </div>
  </section>
</template>

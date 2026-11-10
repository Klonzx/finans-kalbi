<script setup lang="ts">
import { toJarvisError, useJarvisApi } from '@/composables/jarvisApi';
import type { JarvisFreqtradeStatus, JarvisHealth } from '@/types/jarvis';
import { BRAND } from '@/utils/brand';
import { TR } from '@/utils/trStrings';

const api = useJarvisApi();

const health = ref<JarvisHealth | null>(null);
const freqtrade = ref<JarvisFreqtradeStatus | null>(null);
const statusError = ref<string | null>(null);
const statusLoading = ref(false);

const question = ref('');
const conversationId = ref<string | null>(null);
const answer = ref<string | null>(null);
const chatError = ref<string | null>(null);
const sending = ref(false);

async function refreshStatus() {
  statusLoading.value = true;
  statusError.value = null;
  try {
    health.value = await api.getHealth();
  } catch (error) {
    health.value = null;
    statusError.value = toJarvisError(error).message;
  }
  try {
    freqtrade.value = await api.getFreqtradeStatus();
  } catch (error) {
    freqtrade.value = null;
    statusError.value = statusError.value ?? toJarvisError(error).message;
  } finally {
    statusLoading.value = false;
  }
}

async function ask() {
  const message = question.value.trim();
  if (!message || sending.value) {
    return;
  }
  sending.value = true;
  chatError.value = null;
  try {
    const response = await api.sendChat(message, conversationId.value);
    conversationId.value = response.conversation_id;
    answer.value = response.reply ?? 'Yanıt boş döndü.';
    question.value = '';
  } catch (error) {
    chatError.value = toJarvisError(error).message;
  } finally {
    sending.value = false;
  }
}

onMounted(refreshStatus);
</script>

<template>
  <section
    class="flex min-h-0 min-w-0 flex-col gap-2 rounded-sm xl:h-full xl:overflow-y-auto border border-[var(--fk-border)] bg-[var(--fk-surface)] p-3"
  >
    <header class="flex items-center justify-between gap-2">
      <h2 class="text-sm font-semibold text-[var(--fk-text)]">{{ BRAND.assistantName }}</h2>
      <button
        type="button"
        class="rounded-sm border border-[var(--fk-border)] px-2 py-0.5 text-xs text-[var(--fk-text-muted)] hover:text-[var(--fk-accent)] disabled:opacity-50"
        :disabled="statusLoading"
        @click="refreshStatus"
      >
        Yenile
      </button>
    </header>

    <div v-if="statusError && !health" class="flex flex-col gap-1">
      <DataMissingNotice :message="TR.jarvisNotConnected" />
      <p class="text-xs text-[var(--fk-text-muted)]">{{ statusError }}</p>
    </div>

    <dl v-else class="grid grid-cols-2 gap-x-4 text-xs text-[var(--fk-text-muted)]">
      <dt>JARVIS</dt>
      <dd class="text-[var(--fk-text)]">{{ health?.status ?? '—' }}</dd>
      <dt>LLM sağlayıcı</dt>
      <dd class="text-[var(--fk-text)]">
        {{ health ? `${health.provider}: ${health.provider_status}` : '—' }}
      </dd>
      <dt>Freqtrade (salt okunur)</dt>
      <dd class="text-[var(--fk-text)]">
        {{
          freqtrade
            ? `${freqtrade.status}, ${freqtrade.active_trades} açık işlem`
            : (statusError ?? '—')
        }}
      </dd>
    </dl>

    <form class="flex flex-col gap-2" @submit.prevent="ask">
      <textarea
        v-model="question"
        rows="2"
        maxlength="4000"
        placeholder="JARVIS'e bir soru yazın"
        class="w-full resize-none rounded-sm border border-[var(--fk-border)] bg-[var(--fk-bg)] px-2 py-1 text-sm text-[var(--fk-text)]"
      />
      <div class="flex items-center justify-between gap-2">
        <span class="text-[10px] text-[var(--fk-text-muted)]">{{ TR.jarvisDisclaimer }}</span>
        <button
          type="submit"
          class="rounded-sm border border-[var(--fk-accent)] px-3 py-1 text-xs text-[var(--fk-accent)] disabled:opacity-50"
          :disabled="sending || !question.trim() || !health"
        >
          {{ sending ? 'Gönderiliyor…' : 'Sor' }}
        </button>
      </div>
    </form>

    <p v-if="chatError" class="text-xs text-[var(--fk-loss)]">{{ chatError }}</p>
    <div
      v-if="answer"
      class="max-h-40 overflow-auto whitespace-pre-wrap rounded-sm border border-[var(--fk-border)] p-2 text-sm text-[var(--fk-text)]"
    >
      {{ answer }}
    </div>
  </section>
</template>

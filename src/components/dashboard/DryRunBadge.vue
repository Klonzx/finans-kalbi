<script setup lang="ts">
import { TR } from '@/utils/trStrings';

/**
 * Bot modunu gösterir. dry_run=true ise bütün bakiye ve işlemler simülasyondur;
 * bu rozet gerçek para izlenimi oluşmasını önler.
 */
defineProps<{
  dryRun?: boolean;
}>();
</script>

<template>
  <span
    v-if="dryRun === undefined"
    class="inline-flex items-center rounded-sm border border-[var(--fk-border)] px-2 py-0.5 text-xs font-semibold tracking-wide text-[var(--fk-text-muted)]"
  >
    {{ TR.unknownMode }}
  </span>
  <span
    v-else-if="dryRun"
    class="inline-flex items-center rounded-sm border border-[var(--fk-warning)] px-2 py-0.5 text-xs font-semibold tracking-wide text-[var(--fk-warning)]"
  >
    {{ TR.simulation }}
  </span>
  <span
    v-else
    class="inline-flex items-center rounded-sm border border-[var(--fk-profit)] px-2 py-0.5 text-xs font-semibold tracking-wide text-[var(--fk-profit)]"
  >
    {{ TR.live }}
  </span>
</template>

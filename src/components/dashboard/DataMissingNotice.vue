<script setup lang="ts">
import { TR } from '@/utils/trStrings';

/** Eksik veri durumunu açıkça gösterir. Sahte değer üretmek yerine bu bileşen kullanılır. */
withDefaults(
  defineProps<{
    message?: string;
  }>(),
  {
    message: TR.dataMissing,
  },
);
</script>

<template>
  <div
    class="flex items-center justify-center rounded-sm border border-dashed border-[var(--fk-border)] px-3 py-4 text-sm text-[var(--fk-text-muted)]"
    role="status"
  >
    {{ message }}
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value: string;
    sub?: string;
    tone?: 'profit' | 'loss' | 'neutral';
  }>(),
  { sub: '', tone: 'neutral' },
);

const toneClass = {
  profit: 'text-[var(--fk-profit)]',
  loss: 'text-[var(--fk-loss)]',
  neutral: 'text-[var(--fk-text)]',
} as const;
</script>

<template>
  <div
    class="flex min-w-0 flex-col gap-1 rounded-sm border border-[var(--fk-border)] bg-[var(--fk-surface)] px-3 py-2"
  >
    <span class="truncate text-xs uppercase tracking-wide text-[var(--fk-text-muted)]">
      {{ label }}
    </span>
    <span class="truncate text-lg font-semibold tabular-nums" :class="toneClass[tone]">
      {{ value }}
    </span>
    <span v-if="sub" class="truncate text-xs text-[var(--fk-text-muted)]">{{ sub }}</span>
  </div>
</template>

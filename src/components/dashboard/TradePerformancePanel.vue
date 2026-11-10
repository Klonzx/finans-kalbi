<script setup lang="ts">
import { useDashboardKpis } from '@/composables/useDashboardKpis';
import { formatMoney, formatRatioPercent, MISSING } from '@/utils/dashboard/format';
import { formatPercent } from '@/utils/formatters/numberformat';
import { TR } from '@/utils/trStrings';

const { kpis, performance, maxDrawdown } = useDashboardKpis();

const stake = computed(() => kpis.value.stakeCurrency);
const profitFactorText = computed(() => {
  if (performance.value.profitFactor !== null) {
    return performance.value.profitFactor.toFixed(2);
  }
  // Kayıp yoksa profit factor tanımsızdır; kapalı işlem de yoksa veri yok demektir.
  return performance.value.closedCount > 0 ? 'Kayıp yok' : MISSING;
});
const drawdownText = computed(() =>
  maxDrawdown.value === null ? 'Tek botta gösterilir' : formatPercent(maxDrawdown.value, 2),
);

const rows = computed(() => [
  { label: 'Kapalı işlem', value: String(performance.value.closedCount) },
  { label: 'Kazanma oranı', value: formatRatioPercent(performance.value.winRate) },
  { label: 'Ortalama kazanç', value: formatMoney(performance.value.avgWin, stake.value) },
  { label: 'Ortalama kayıp', value: formatMoney(performance.value.avgLoss, stake.value) },
  { label: 'Profit factor', value: profitFactorText.value },
  { label: 'Maks. drawdown', value: drawdownText.value },
]);
</script>

<template>
  <section
    class="flex min-h-0 min-w-0 flex-col gap-2 rounded-sm xl:h-full xl:overflow-y-auto border border-[var(--fk-border)] bg-[var(--fk-surface)] p-3"
  >
    <h2 class="text-sm font-semibold text-[var(--fk-text)]">İşlem performansı</h2>
    <p v-if="performance.closedCount === 0" class="text-xs text-[var(--fk-text-muted)]">
      {{ TR.dataMissing }}: henüz kapalı işlem yok
    </p>
    <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-3">
      <div v-for="row in rows" :key="row.label" class="flex flex-col">
        <dt class="text-xs text-[var(--fk-text-muted)]">{{ row.label }}</dt>
        <dd class="tabular-nums text-[var(--fk-text)]">{{ row.value }}</dd>
      </div>
    </dl>
  </section>
</template>

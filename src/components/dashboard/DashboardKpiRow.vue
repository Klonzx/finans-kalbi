<script setup lang="ts">
import { useDashboardKpis } from '@/composables/useDashboardKpis';
import { formatMoney, formatRatioPercent, MISSING, profitTone } from '@/utils/dashboard/format';
import { TR } from '@/utils/trStrings';

const { kpis } = useDashboardKpis();

const mixedNote = computed(() =>
  kpis.value.mixedStakeCurrency ? 'Farklı stake para birimleri, toplam gösterilmez' : '',
);
</script>

<template>
  <div class="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
    <KpiCard
      label="Toplam bakiye"
      :value="formatMoney(kpis.totalBalance, kpis.stakeCurrency)"
      :sub="mixedNote || (kpis.totalBalance === null ? TR.notLoaded : '')"
    />
    <KpiCard
      label="Günlük K/Z"
      :value="formatMoney(kpis.todayProfit, kpis.stakeCurrency)"
      :tone="profitTone(kpis.todayProfit)"
      :sub="mixedNote || (kpis.todayProfit === null ? TR.notLoaded : '')"
    />
    <KpiCard
      label="Toplam kâr"
      :value="formatMoney(kpis.totalProfit, kpis.stakeCurrency)"
      :tone="profitTone(kpis.totalProfit)"
      :sub="mixedNote"
    />
    <KpiCard
      label="Açık pozisyon"
      :value="kpis.openPositions === null ? MISSING : String(kpis.openPositions)"
      :sub="`${kpis.selectedBotCount} bot seçili`"
    />
    <KpiCard
      label="Kazanma oranı"
      :value="formatRatioPercent(kpis.winRate)"
      :sub="kpis.winRate === null ? TR.dataMissing : ''"
    />
    <KpiCard
      label="Kullanılabilir"
      :value="formatMoney(kpis.availableBalance, kpis.stakeCurrency)"
      :sub="kpis.availableBalance === null ? TR.featureUnavailable : ''"
    />
  </div>
</template>

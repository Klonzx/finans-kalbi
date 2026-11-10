<script setup lang="ts">
import { useDashboardKpis } from '@/composables/useDashboardKpis';
import type { GridItemData } from '@/types';
import { BRAND } from '@/utils/brand';

const botStore = useBotStore();
const { kpis: dashboardKpis } = useDashboardKpis();

const layoutStore = useLayoutStore();
const currentBreakpoint = ref('');

function breakpointChanged(newBreakpoint: string) {
  // console.log('breakpoint:', newBreakpoint);
  currentBreakpoint.value = newBreakpoint;
}
const isResizableLayout = computed(() =>
  ['', 'sm', 'md', 'lg', 'xl'].includes(currentBreakpoint.value),
);
const isLayoutLocked = computed(() => {
  return layoutStore.layoutLocked || !isResizableLayout.value;
});

// Bu iki grafik üst grafik bandında (Profit over time, Cumulative Profit) gösterilir.
// Izgarada tekrar çizilmez; layout kaydında kalmaya devam ederler ki ayar sıfırlanmasın.
const TOP_CHART_IDS: number[] = [DashboardLayout.dailyChart, DashboardLayout.cumChartChart];

function gridOnly(layout: GridItemData[]): GridItemData[] {
  return layout.filter((item) => !TOP_CHART_IDS.includes(item.i as number));
}

const gridLayoutData = computed((): GridItemData[] => {
  if (isResizableLayout.value) {
    return gridOnly(layoutStore.dashboardLayout);
  }
  return gridOnly([...layoutStore.getDashboardLayoutSm]);
});

function layoutUpdatedEvent(newLayout: GridItemData[]) {
  if (isResizableLayout.value) {
    const topCharts = layoutStore.dashboardLayout.filter((item) =>
      TOP_CHART_IDS.includes(item.i as number),
    );
    layoutStore.dashboardLayout = [...newLayout, ...topCharts];
  }
}

const gridLayoutBotComparison = computed((): GridItemData => {
  return findGridLayout(gridLayoutData.value, DashboardLayout.botComparison);
});

const gridLayoutAllOpenTrades = computed((): GridItemData => {
  return findGridLayout(gridLayoutData.value, DashboardLayout.allOpenTrades);
});
const gridLayoutAllClosedTrades = computed((): GridItemData => {
  return findGridLayout(gridLayoutData.value, DashboardLayout.allClosedTrades);
});

const gridLayoutWalletHistory = computed((): GridItemData => {
  return findGridLayout(gridLayoutData.value, DashboardLayout.walletHistoryChart);
});

const gridLayoutProfitDistribution = computed((): GridItemData => {
  return findGridLayout(gridLayoutData.value, DashboardLayout.profitDistributionChart);
});
const gridLayoutTradesLogChart = computed((): GridItemData => {
  return findGridLayout(gridLayoutData.value, DashboardLayout.tradesLogChart);
});

const responsiveGridLayouts = computed(() => {
  return {
    sm: gridOnly([...layoutStore.getDashboardLayoutSm]),
  };
});

onMounted(async () => {
  botStore.allGetDaily({ timescale: 30 });
  // botStore.activeBot.getTrades();
  botStore.activeBot.getOpenTrades();
  botStore.activeBot.getProfit();
});
</script>

<template>
  <div class="flex h-full w-full flex-col gap-2 overflow-y-auto">
    <div class="shrink-0 space-y-2">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-baseline gap-2">
          <span class="text-sm font-semibold text-[var(--fk-text)]">{{ BRAND.name }}</span>
          <span class="text-xs text-[var(--fk-text-muted)]">{{ BRAND.terminalLabel }}</span>
        </div>
        <DryRunBadge :dry-run="dashboardKpis.dryRun" />
      </div>
      <DashboardKpiRow />
      <div class="grid shrink-0 gap-2 xl:h-[340px] xl:grid-cols-2">
        <div class="h-[300px] min-w-0 xl:h-full">
          <DraggableContainer
            :header="`Profit over time ${botStore.botCount > 1 ? 'combined' : ''}`"
          >
            <PeriodBreakdown multi-bot-view />
          </DraggableContainer>
        </div>
        <div class="h-[300px] min-w-0 xl:h-full">
          <DraggableContainer header="Cumulative Profit">
            <CumProfitChart
              :trades="botStore.allTradesSelectedBots"
              :open-trades="botStore.allOpenTradesSelectedBots"
              :show-title="false"
            />
          </DraggableContainer>
        </div>
      </div>
      <div class="grid shrink-0 gap-2 xl:h-[380px] xl:grid-cols-3">
        <TradePerformancePanel />
        <MarketPanel />
        <JarvisPanel />
      </div>
    </div>
  <GridLayout
    class="w-full shrink-0"
    style="padding: 1px"
    :row-height="50"
    :layout="gridLayoutData"
    :vertical-compact="false"
    :margin="[2, 2]"
    :responsive-layouts="responsiveGridLayouts"
    :is-resizable="!isLayoutLocked"
    :is-draggable="!isLayoutLocked"
    :responsive="true"
    :prevent-collision="true"
    :cols="{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }"
    :col-num="12"
    @layout-updated="layoutUpdatedEvent"
    @update:breakpoint="breakpointChanged"
  >
    <template #default="{ gridItemProps }">
      <GridItem
        v-bind="gridItemProps"
        :i="gridLayoutBotComparison.i"
        :x="gridLayoutBotComparison.x"
        :y="gridLayoutBotComparison.y"
        :w="gridLayoutBotComparison.w"
        :h="gridLayoutBotComparison.h"
        :min-w="3"
        :min-h="4"
        drag-allow-from=".drag-header"
      >
        <DraggableContainer header="Bot comparison">
          <BotComparisonList />
        </DraggableContainer>
      </GridItem>
      <GridItem
        v-bind="gridItemProps"
        :i="gridLayoutAllOpenTrades.i"
        :x="gridLayoutAllOpenTrades.x"
        :y="gridLayoutAllOpenTrades.y"
        :w="gridLayoutAllOpenTrades.w"
        :h="gridLayoutAllOpenTrades.h"
        :min-w="3"
        :min-h="4"
        drag-allow-from=".drag-header"
      >
        <DraggableContainer
          header="Open Trades"
          info-text="Open trades of all selected bots. Click on a trade to go to the trade page for that trade/bot."
        >
          <TradeList active-trades :trades="botStore.allOpenTradesSelectedBots" multi-bot-view />
        </DraggableContainer>
      </GridItem>
      <GridItem
        v-bind="gridItemProps"
        :i="gridLayoutWalletHistory.i"
        :x="gridLayoutWalletHistory.x"
        :y="gridLayoutWalletHistory.y"
        :w="gridLayoutWalletHistory.w"
        :h="gridLayoutWalletHistory.h"
        :min-w="3"
        :min-h="4"
        drag-allow-from=".drag-header"
      >
        <DraggableContainer header="Wallet History">
          <WalletHistoryChart :wallet-data="botStore.allBalanceHistory" :show-title="false" />
        </DraggableContainer>
      </GridItem>
      <GridItem
        v-bind="gridItemProps"
        :i="gridLayoutAllClosedTrades.i"
        :x="gridLayoutAllClosedTrades.x"
        :y="gridLayoutAllClosedTrades.y"
        :w="gridLayoutAllClosedTrades.w"
        :h="gridLayoutAllClosedTrades.h"
        :min-w="3"
        :min-h="4"
        drag-allow-from=".drag-header"
      >
        <DraggableContainer
          header="Closed Trades"
          info-text="Closed trades for all selected bots. Click on a trade to go to the trade page for that trade/bot."
        >
          <TradeList
            :active-trades="false"
            show-filter
            :trades="botStore.allClosedTradesSelectedBots"
            multi-bot-view
          />
        </DraggableContainer>
      </GridItem>
      <GridItem
        v-bind="gridItemProps"
        :i="gridLayoutProfitDistribution.i"
        :x="gridLayoutProfitDistribution.x"
        :y="gridLayoutProfitDistribution.y"
        :w="gridLayoutProfitDistribution.w"
        :h="gridLayoutProfitDistribution.h"
        :min-w="3"
        :min-h="4"
        drag-allow-from=".drag-header"
      >
        <DraggableContainer header="Profit Distribution">
          <ProfitDistributionChart :trades="botStore.allTradesSelectedBots" :show-title="false" />
        </DraggableContainer>
      </GridItem>
      <GridItem
        v-bind="gridItemProps"
        :i="gridLayoutTradesLogChart.i"
        :x="gridLayoutTradesLogChart.x"
        :y="gridLayoutTradesLogChart.y"
        :w="gridLayoutTradesLogChart.w"
        :h="gridLayoutTradesLogChart.h"
        :min-w="3"
        :min-h="4"
        drag-allow-from=".drag-header"
      >
        <DraggableContainer header="Trades Log">
          <TradesLogChart :trades="botStore.allTradesSelectedBots" :show-title="false" />
        </DraggableContainer>
      </GridItem>
    </template>
  </GridLayout>
  </div>
</template>

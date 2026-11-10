import type { DashboardKpis, TradePerformance } from '@/types/dashboard';
import {
  combinedWinRate,
  localIsoDate,
  summarizeClosedTrades,
  sumWhenSameCurrency,
  todayProfit,
} from '@/utils/dashboard/kpis';

/**
 * Seçili botlardan dashboard KPI'larını türetir. Veri okur, hiçbir şey yazmaz.
 * Stake para birimleri farklıysa toplamlar üretilmez (null + mixedStakeCurrency).
 */
export function useDashboardKpis() {
  const botStore = useBotStore();

  const selectedIds = computed<string[]>(() => botStore.selectedBots.map((bot) => bot.botId));

  const kpis = computed<DashboardKpis>(() => {
    const ids = selectedIds.value;
    const sameStake = botStore.allSelectedBotsSameStake && ids.length > 0;
    const stakeCurrency = sameStake ? (botStore.selectedBots[0]?.stakeCurrency ?? null) : null;
    const balances = botStore.allBalance;
    const profits = botStore.allProfit;
    const states = botStore.allBotState;
    const openCounts = botStore.allOpenTradeCount;
    const today = localIsoDate(new Date());

    const totalBalance = sumWhenSameCurrency(
      ids.map((id) => {
        const balance = balances[id];
        return balance ? (balance.total_bot ?? balance.total) : undefined;
      }),
      sameStake,
    );

    const availableBalance = sumWhenSameCurrency(
      ids.map((id) => states[id]?.available_balance),
      sameStake,
    );

    const todayPerBot = ids.map((id) =>
      todayProfit(botStore.botStores[id]?.dailyStats?.data, today),
    );

    const dryRunValues = ids.map((id) => states[id]?.dry_run);
    const dryRun =
      dryRunValues.length > 0 && dryRunValues.every((v) => v === dryRunValues[0])
        ? dryRunValues[0]
        : undefined;

    return {
      stakeCurrency,
      mixedStakeCurrency: ids.length > 0 && !botStore.allSelectedBotsSameStake,
      totalBalance,
      availableBalance,
      todayProfit: sumWhenSameCurrency(todayPerBot, sameStake),
      totalProfit: sumWhenSameCurrency(
        ids.map((id) => profits[id]?.profit_all_coin),
        sameStake,
      ),
      openPositions: sumWhenSameCurrency(
        ids.map((id) => openCounts[id]),
        ids.length > 0,
      ),
      winRate: combinedWinRate(
        ids.map((id) => profits[id]?.winning_trades),
        ids.map((id) => profits[id]?.losing_trades),
      ),
      selectedBotCount: ids.length,
      dryRun,
    };
  });

  /** Kapalı işlem performansı (seçili botlar). Yalnızca gerçekleşmiş işlemler kullanılır. */
  const performance = computed<TradePerformance>(() =>
    summarizeClosedTrades(botStore.allClosedTradesSelectedBots),
  );

  /** Maksimum drawdown yalnızca tek botta anlamlıdır; çoklu botta birleşik değer hesaplanmaz. */
  const maxDrawdown = computed<number | null>(() => {
    if (selectedIds.value.length !== 1) {
      return null;
    }
    return botStore.allProfit[selectedIds.value[0]]?.max_drawdown ?? null;
  });

  return { kpis, performance, maxDrawdown, selectedIds };
}

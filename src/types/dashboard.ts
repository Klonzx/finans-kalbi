/** Dashboard KPI ve performans tipleri. */

/** Kapalı işlemlerden çıkarılan performans özeti. Oranlar 0-1 aralığındadır. */
export interface TradePerformance {
  closedCount: number;
  winCount: number;
  lossCount: number;
  winRate: number | null;
  /** Ortalama kazanç, stake para biriminde (pozitif). */
  avgWin: number | null;
  /** Ortalama kayıp, stake para biriminde (negatif). */
  avgLoss: number | null;
  profitFactor: number | null;
  totalRealized: number;
}

/** Üst KPI şeridinin değerleri. null = veri yok (arayüzde "—" ve açıklama gösterilir). */
export interface DashboardKpis {
  stakeCurrency: string | null;
  /** Seçili botların stake para birimleri farklı; toplamlar üretilmez. */
  mixedStakeCurrency: boolean;
  totalBalance: number | null;
  availableBalance: number | null;
  todayProfit: number | null;
  totalProfit: number | null;
  openPositions: number | null;
  winRate: number | null;
  selectedBotCount: number;
  dryRun: boolean | undefined;
}

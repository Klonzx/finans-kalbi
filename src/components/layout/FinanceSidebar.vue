<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();

const sections = [
  {
    title: 'GENEL',
    items: [
      { label: 'Dashboard', icon: 'i-mdi-view-dashboard-outline', to: '/dashboard' },
      { label: 'Piyasalar', icon: 'i-mdi-chart-box-outline', to: '/pairlist' },
      { label: 'Pairlist Config', icon: 'i-mdi-format-list-group', to: '/pairlist_config' },
      { label: 'Grafik Terminali', icon: 'i-mdi-chart-line', to: '/graph' },
      { label: 'Ayarlar', icon: 'i-mdi-cog-outline', to: '/settings' },
    ],
  },
  {
    title: 'İŞLEM MERKEZİ',
    items: [
      { label: 'İşlem Paneli', icon: 'i-mdi-swap-horizontal', to: '/trade' },
      { label: 'Açık Pozisyonlar', icon: 'i-mdi-briefcase-outline', to: '/open_trades' },
      { label: 'İşlem Geçmişi', icon: 'i-mdi-history', to: '/trade_history' },
      { label: 'Portföy', icon: 'i-mdi-wallet-outline', to: '/balance' },
    ],
  },
  {
    title: 'ANALİZ',
    items: [
      { label: 'Backtesting', icon: 'i-mdi-chart-timeline-variant', to: '/backtest' },
      { label: 'Stratejiler', icon: 'i-mdi-brain', to: '/backtest' },
      { label: 'Veri İndirme', icon: 'i-mdi-database-arrow-down-outline', to: '/download_data' },
      { label: 'İşlem Kayıtları', icon: 'i-mdi-text-box-outline', to: '/logs' },
    ],
  },
];

const futureItems = [
  { label: 'Market Screener', icon: 'i-mdi-filter-variant' },
  { label: 'Alarm Merkezi', icon: 'i-mdi-bell-outline' },
  { label: 'JARVIS AI', icon: 'i-mdi-robot-outline' },
];
</script>

<template>
  <aside class="finance-sidebar hidden md:flex flex-col w-60 shrink-0">
    <div class="px-5 py-6 border-b border-white/10">
      <div class="flex items-center gap-3">
        <div class="brand-icon">
          <i class="i-mdi-lightning-bolt text-2xl text-cyan-300"></i>
        </div>
        <div>
          <div class="text-white font-bold text-lg tracking-wide">FINANS KALBI</div>
          <div class="text-cyan-400 text-[10px] tracking-[0.22em]">JARVIS TRADING</div>
        </div>
      </div>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-5">
      <div v-for="section in sections" :key="section.title" class="mb-7">
        <div class="px-3 mb-3 text-[10px] font-bold tracking-[0.18em] text-slate-500">
          {{ section.title }}
        </div>

        <RouterLink
          v-for="item in section.items"
          :key="item.label"
          :to="item.to"
          class="sidebar-link"
          :class="{ 'sidebar-link-active': route.path === item.to }"
        >
          <i :class="[item.icon, 'text-lg']"></i>
          <span>{{ item.label }}</span>
        </RouterLink>
      </div>

      <div class="mb-5">
        <div class="px-3 mb-3 text-[10px] font-bold tracking-[0.18em] text-slate-500">
          YAKINDA
        </div>

        <div v-for="item in futureItems" :key="item.label" class="sidebar-link sidebar-disabled">
          <i :class="[item.icon, 'text-lg']"></i>
          <span>{{ item.label }}</span>
          <span class="ml-auto text-[9px] text-slate-600">PLAN</span>
        </div>
      </div>
    </nav>

    <div class="p-4 border-t border-white/10">
      <div class="flex items-center gap-2 text-xs text-emerald-400">
        <span class="status-dot"></span>
        Finans Kalbi arayüzü aktif
      </div>
      <div class="text-[10px] text-slate-600 mt-2">JARVIS Trading Terminal · v0.1</div>
    </div>
  </aside>
</template>

<style scoped>
.finance-sidebar {
  background: #080e19;
  border-right: 1px solid rgba(148, 163, 184, 0.12);
  min-height: 0;
}

.brand-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 12px;
  background: rgba(8, 145, 178, 0.12);
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  margin: 3px 0;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  transition: all 150ms ease;
}

.sidebar-link:hover {
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.08);
}

.sidebar-link-active {
  color: #67e8f9;
  background: rgba(8, 145, 178, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.15);
}

.sidebar-disabled {
  opacity: 0.45;
  cursor: default;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
}
</style>

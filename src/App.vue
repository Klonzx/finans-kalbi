<script setup lang="ts">
const settingsStore = useSettingsStore();
const colorStore = useColorStore();

onMounted(() => {
  setTimezone(settingsStore.timezone);
  colorStore.updateProfitLossColor();
});

watch(
  () => settingsStore.timezone,
  (tz) => {
    console.log('timezone changed', tz);
    setTimezone(tz);
  },
);
</script>

<template>
  <UApp>
    <div id="app" class="flex flex-col h-dvh" :style="colorStore.cssVars">
      <NavBar />

      <div class="flex grow min-h-0 overflow-hidden finance-shell">
        <FinanceSidebar />

        <main class="min-w-0 flex-1 overflow-auto finance-content">
          <BodyLayout class="min-h-full" />
        </main>
      </div>

      <NavFooter />
    </div>
  </UApp>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.finance-shell {
  background: #0b1220;
}

.finance-content {
  background: #0b1220;
  color: #e2e8f0;
}
</style>

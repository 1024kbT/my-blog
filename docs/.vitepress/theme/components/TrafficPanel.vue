<script setup>
import { computed, onMounted, reactive } from "vue";
import { goatcounterConfig, trackedPages } from "../integrations";

const state = reactive({
  loading: false,
  error: "",
  counts: [],
});

const isConfigured = computed(() => Boolean(goatcounterConfig.code));
const maxVisits = computed(() => state.counts.reduce((max, item) => Math.max(max, item.value || 0), 0));

function getCounterBaseUrl() {
  return `https://${goatcounterConfig.code}.goatcounter.com`;
}

function getBarHeight(value) {
  if (!maxVisits.value) return 12;
  return Math.max(12, Math.round((value / maxVisits.value) * 100));
}

async function fetchCount(path) {
  const response = await fetch(`${getCounterBaseUrl()}/counter/${encodeURIComponent(path)}.json`);
  if (!response.ok) return 0;
  const payload = await response.json();
  return Number.parseInt(String(payload.count).replace(/,/g, ""), 10) || 0;
}

async function loadCounts() {
  if (!isConfigured.value) return;
  state.loading = true;
  state.error = "";

  try {
    state.counts = await Promise.all(
      trackedPages.map(async (item) => ({
        ...item,
        value: await fetchCount(item.path),
      })),
    );
  } catch (error) {
    state.error = error instanceof Error ? error.message : "统计读取失败";
  } finally {
    state.loading = false;
  }
}

onMounted(() => {
  loadCounts();
});
</script>

<template>
  <section class="vp-extension">
    <div v-if="!isConfigured" class="vp-extension-card vp-extension-warn">
      <h2>访问统计待配置</h2>
      <p>
        到 <code>docs/.vitepress/theme/integrations.js</code> 填写
        <code>goatcounterConfig.code</code>，并在 GoatCounter 后台开启公开访问计数。
      </p>
    </div>
    <div v-else class="vp-extension-card">
      <div class="vp-extension-head">
        <div>
          <h2>访问统计</h2>
          <p>用 GoatCounter 记录访问次数，再直接在文章页底部做一层轻量图表。</p>
        </div>
        <span class="vp-extension-note">{{ state.loading ? "同步中..." : "已同步" }}</span>
      </div>

      <div v-if="state.error" class="vp-extension-error">{{ state.error }}</div>

      <div class="vp-chart">
        <div v-for="item in state.counts" :key="item.path" class="vp-chart-col">
          <span class="vp-chart-value">{{ item.value }}</span>
          <div class="vp-chart-rail">
            <div class="vp-chart-bar" :style="{ height: `${getBarHeight(item.value)}%` }"></div>
          </div>
          <span class="vp-chart-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

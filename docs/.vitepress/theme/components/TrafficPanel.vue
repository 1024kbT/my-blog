<script setup>
import { computed, onMounted, onBeforeUnmount, reactive } from "vue";
import { busuanziConfig } from "../integrations";

const state = reactive({
  loading: false,
  error: "",
  sitePv: "",
  siteUv: "",
  pagePv: "",
});

const isConfigured = computed(() => Boolean(busuanziConfig.scriptUrl));

let observer = null;

function syncCounterValues() {
  state.sitePv = document.querySelector("#busuanzi_value_site_pv")?.textContent?.trim() || "";
  state.siteUv = document.querySelector("#busuanzi_value_site_uv")?.textContent?.trim() || "";
  state.pagePv = document.querySelector("#busuanzi_value_page_pv")?.textContent?.trim() || "";
  state.loading = !(state.sitePv || state.siteUv || state.pagePv);
}

function ensureBusuanziScript() {
  if (document.querySelector('script[data-busuanzi="true"]')) return;

  const script = document.createElement("script");
  script.src = busuanziConfig.scriptUrl;
  script.async = true;
  script.setAttribute("data-busuanzi", "true");
  script.onload = () => {
    window.setTimeout(syncCounterValues, 600);
  };
  script.onerror = () => {
    state.error = "不蒜子脚本加载失败";
    state.loading = false;
  };
  document.body.appendChild(script);
}

onMounted(() => {
  if (!isConfigured.value) return;
  state.loading = true;
  ensureBusuanziScript();
  syncCounterValues();

  observer = new MutationObserver(() => {
    syncCounterValues();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<template>
  <section class="vp-extension">
    <div v-if="!isConfigured" class="vp-extension-card vp-extension-warn">
      <h2>访问统计待配置</h2>
      <p>
        到 <code>docs/.vitepress/theme/integrations.js</code> 检查
        <code>busuanziConfig.scriptUrl</code> 是否可用。
      </p>
    </div>
    <div v-else class="vp-extension-card">
      <div class="vp-extension-head">
        <div>
          <h2>访问统计</h2>
          <p>已切到不蒜子统计，优先兼顾国内访问可用性。这里会展示站点访问量、访客量和当前页阅读量。</p>
        </div>
        <span class="vp-extension-note">{{ state.loading ? "同步中..." : "已同步" }}</span>
      </div>

      <div v-if="state.error" class="vp-extension-error">{{ state.error }}</div>

      <div class="domestic-stats">
        <div class="domestic-stats__card">
          <span class="domestic-stats__label">站点总访问量</span>
          <strong>{{ state.sitePv || "加载中" }}</strong>
        </div>
        <div class="domestic-stats__card">
          <span class="domestic-stats__label">站点总访客数</span>
          <strong>{{ state.siteUv || "加载中" }}</strong>
        </div>
        <div class="domestic-stats__card">
          <span class="domestic-stats__label">当前页阅读量</span>
          <strong>{{ state.pagePv || "加载中" }}</strong>
        </div>
      </div>

      <div class="busuanzi-hidden" aria-hidden="true">
        <span id="busuanzi_container_site_pv">本站总访问量 <span id="busuanzi_value_site_pv"></span></span>
        <span id="busuanzi_container_site_uv">本站总访客数 <span id="busuanzi_value_site_uv"></span></span>
        <span id="busuanzi_container_page_pv">本页阅读量 <span id="busuanzi_value_page_pv"></span></span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { live2dConfig } from "../live2d-config";

const hostRef = ref(null);
const loading = ref(false);
const failed = ref(false);
const mounted = ref(false);

const isConfigured = computed(() => Boolean(live2dConfig.enabled && live2dConfig.model.path));

let resizeHandler = null;

function getOptions() {
  const isMobile = window.innerWidth <= 960;
  const stageStyle = {
    ...live2dConfig.model.stageStyle,
    ...(isMobile
      ? {
          width: live2dConfig.mobile.width,
          height: live2dConfig.mobile.height,
        }
      : {}),
  };

  return {
    models: [
      {
        ...live2dConfig.model,
        scale: isMobile ? live2dConfig.mobile.scale : live2dConfig.model.scale,
        position: isMobile ? live2dConfig.mobile.position : live2dConfig.model.position,
        stageStyle,
      },
    ],
  };
}

function cleanupWidget() {
  hostRef.value?.replaceChildren();
  document.querySelector(".oml2d-stage")?.remove();
}

async function ensureScript() {
  if (window.OML2D?.loadOml2d) return;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-live2d="oml2d"]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = live2dConfig.scriptUrl;
    script.async = true;
    script.setAttribute("data-live2d", "oml2d");
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function mountWidget() {
  if (!isConfigured.value || !hostRef.value) return;

  loading.value = true;
  failed.value = false;
  cleanupWidget();

  try {
    await ensureScript();
    await window.OML2D.loadOml2d(getOptions());
    mounted.value = true;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await mountWidget();
  resizeHandler = () => {
    if (isConfigured.value) {
      mountWidget();
    }
  };
  window.addEventListener("resize", resizeHandler);
});

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
  }
});
</script>

<template>
  <div ref="hostRef" class="live2d-widget-host">
    <div v-if="!isConfigured" class="live2d-widget-placeholder">
      <strong>Live2D 已接入</strong>
      <p>当前未启用模型。把已授权模型地址填到 <code>docs/.vitepress/theme/live2d-config.js</code> 后即可显示。</p>
    </div>
    <div v-else-if="loading" class="live2d-widget-placeholder">
      <strong>看板娘加载中</strong>
      <p>正在初始化 Live2D 组件…</p>
    </div>
    <div v-else-if="failed" class="live2d-widget-placeholder">
      <strong>看板娘加载失败</strong>
      <p>请检查模型地址、跨域配置或资源可访问性。</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { twikooConfig } from "../integrations";

const containerRef = ref(null);
const isConfigured = computed(
  () => Boolean(twikooConfig.envId),
);

function getTwikooPath() {
  return twikooConfig.path || window.location.pathname;
}

async function mountTwikoo() {
  if (!isConfigured.value || !containerRef.value) return;

  if (!window.twikoo) {
    const module = await import("https://cdn.staticfile.org/twikoo/1.6.44/twikoo.all.min.js");
    window.twikoo = module.default || module;
  }

  containerRef.value.innerHTML = '<div id="twikoo-thread"></div>';

  await window.twikoo.init({
    envId: twikooConfig.envId,
    el: "#twikoo-thread",
    region: twikooConfig.region || undefined,
    path: getTwikooPath(),
    lang: twikooConfig.lang,
  });
}

onMounted(() => {
  mountTwikoo();
});
</script>

<template>
  <section class="vp-extension">
    <div v-if="!isConfigured" class="vp-extension-card vp-extension-warn">
      <h2>评论区待配置</h2>
      <p>
        先到 <code>docs/.vitepress/theme/integrations.js</code> 填写
        <code>twikooConfig.envId</code>。如果你用的是腾讯云托管环境，也可以顺手补
        <code>region</code>。
      </p>
    </div>
    <div v-else class="vp-extension-card">
      <h2>评论区</h2>
      <p>评论区已切到 Twikoo，更适合国内访问环境，也更适合静态博客长期使用。</p>
      <div ref="containerRef"></div>
    </div>
  </section>
</template>

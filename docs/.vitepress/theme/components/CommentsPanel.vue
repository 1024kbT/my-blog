<script setup>
import { computed, onMounted, ref } from "vue";
import { giscusConfig } from "../integrations";

const containerRef = ref(null);
const isConfigured = computed(
  () =>
    Boolean(
      giscusConfig.repo &&
        giscusConfig.repoId &&
        giscusConfig.category &&
        giscusConfig.categoryId,
    ),
);

function mountGiscus() {
  if (!isConfigured.value || !containerRef.value) return;

  containerRef.value.innerHTML = "";

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", giscusConfig.repo);
  script.setAttribute("data-repo-id", giscusConfig.repoId);
  script.setAttribute("data-category", giscusConfig.category);
  script.setAttribute("data-category-id", giscusConfig.categoryId);
  script.setAttribute("data-mapping", giscusConfig.mapping);
  script.setAttribute("data-strict", giscusConfig.strict ? "1" : "0");
  script.setAttribute("data-reactions-enabled", giscusConfig.reactionsEnabled ? "1" : "0");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", giscusConfig.inputPosition);
  script.setAttribute("data-theme", "preferred_color_scheme");
  script.setAttribute("data-lang", giscusConfig.lang);
  script.setAttribute("data-loading", "lazy");

  containerRef.value.appendChild(script);
}

onMounted(() => {
  mountGiscus();
});
</script>

<template>
  <section class="vp-extension">
    <div v-if="!isConfigured" class="vp-extension-card vp-extension-warn">
      <h2>评论区待配置</h2>
      <p>
        先到 <code>docs/.vitepress/theme/integrations.js</code> 填写 Giscus 的
        <code>repo</code>、<code>repoId</code>、<code>category</code> 和
        <code>categoryId</code>，再启用仓库 Discussions。
      </p>
    </div>
    <div v-else class="vp-extension-card">
      <h2>评论区</h2>
      <p>评论会直接写入 GitHub Discussions，适合长期维护的静态博客。</p>
      <div ref="containerRef"></div>
    </div>
  </section>
</template>

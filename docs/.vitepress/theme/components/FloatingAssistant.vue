<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

// 角落小助手：用纯前端实现一个可收起的小挂件，避免依赖外部受限模型资源。
const collapsed = ref(false);
const currentTip = ref(0);

const tips = [
  "新文章直接放进 docs/posts 就能继续扩内容。",
  "评论区和访问统计已经预留好了扩展入口。",
  "标签页、归档页、数据页现在都是内容站路线。",
  "想更像技术博客的话，后面可以继续补 RSS 和搜索优化。",
];

let timerId = 0;

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
}

onMounted(() => {
  timerId = window.setInterval(() => {
    currentTip.value = (currentTip.value + 1) % tips.length;
  }, 5200);
});

onBeforeUnmount(() => {
  if (timerId) {
    window.clearInterval(timerId);
  }
});
</script>

<template>
  <div class="floating-helper" :class="{ 'floating-helper--collapsed': collapsed }">
    <button class="floating-helper__toggle" type="button" @click="toggleCollapsed">
      {{ collapsed ? "展开助手" : "收起助手" }}
    </button>

    <div class="floating-helper__body">
      <div class="floating-helper__avatar" aria-hidden="true">
        <div class="floating-helper__halo"></div>
        <div class="floating-helper__head">
          <span class="floating-helper__eye"></span>
          <span class="floating-helper__eye"></span>
        </div>
        <div class="floating-helper__cloak"></div>
      </div>

      <div class="floating-helper__bubble">
        <span class="floating-helper__label">SITE ASSISTANT</span>
        <p>{{ tips[currentTip] }}</p>
      </div>
    </div>
  </div>
</template>

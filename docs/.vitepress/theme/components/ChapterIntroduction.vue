<script setup>
const props = defineProps({
  duration: {
    type: String,
    default: "",
  },
  tags: {
    type: Array,
    default: () => [],
  },
  coreOutput: {
    type: String,
    default: "",
  },
  expectedOutput: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <section class="easy-vibe-intro">
    <div class="easy-vibe-intro__meta">
      <div>
        <span class="easy-vibe-intro__label">预计耗时</span>
        <div class="easy-vibe-intro__value" v-html="duration" />
      </div>
      <div>
        <span class="easy-vibe-intro__label">核心产出</span>
        <div class="easy-vibe-intro__value">{{ coreOutput }}</div>
      </div>
      <div>
        <span class="easy-vibe-intro__label">预期结果</span>
        <div class="easy-vibe-intro__value">{{ expectedOutput }}</div>
      </div>
    </div>
    <div v-if="tags.length" class="easy-vibe-intro__tags">
      <span v-for="tag in tags" :key="tag">{{ tag }}</span>
    </div>
    <div class="easy-vibe-intro__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  active: {
    type: Number,
    default: 0,
  },
  items: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <div class="easy-vibe-stepbar">
    <div
      v-for="(item, index) in items"
      :key="`${item.title}-${index}`"
      class="easy-vibe-stepbar__item"
      :class="{
        'is-active': index === active,
        'is-done': index < active,
      }"
    >
      <div class="easy-vibe-stepbar__dot">{{ index + 1 }}</div>
      <strong>{{ item.title }}</strong>
      <span>{{ item.description }}</span>
    </div>
  </div>
</template>

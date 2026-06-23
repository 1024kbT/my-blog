<script setup>
import { provide, ref } from "vue";

const active = ref(0);
const labels = ref([]);
const setActive = (index) => {
  active.value = index;
};

provide("easyVibeTabs", {
  active,
  labels,
  setActive,
  register: (label) => {
    labels.value.push(label);
    return labels.value.length - 1;
  },
});
</script>

<template>
  <div class="easy-vibe-tabs">
    <div class="easy-vibe-tabs__nav">
      <button
        v-for="(label, index) in labels"
        :key="`${label}-${index}`"
        type="button"
        :class="{ 'is-active': active === index }"
        @click="setActive(index)"
      >
        {{ label }}
      </button>
    </div>
    <div class="easy-vibe-tabs__body">
      <slot />
    </div>
  </div>
</template>

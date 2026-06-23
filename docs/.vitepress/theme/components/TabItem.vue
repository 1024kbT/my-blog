<script setup>
import { computed, inject } from "vue";

const props = defineProps({
  label: {
    type: String,
    default: "Tab",
  },
});

const tabs = inject("easyVibeTabs");
const index = tabs?.register(props.label) ?? 0;
const visible = computed(() => (tabs ? tabs.active.value === index : true));
</script>

<template>
  <div v-show="visible" class="easy-vibe-tab-item">
    <slot />
  </div>
</template>

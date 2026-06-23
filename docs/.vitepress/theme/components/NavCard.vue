<script setup>
import { computed } from "vue";
import { withBase } from "vitepress";

const props = defineProps({
  href: {
    type: String,
    default: "#",
  },
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "",
  },
});

const resolvedHref = computed(() => {
  if (!props.href) {
    return "#";
  }

  if (
    props.href.startsWith("http://") ||
    props.href.startsWith("https://") ||
    props.href.startsWith("#") ||
    props.href.startsWith("mailto:") ||
    props.href.startsWith("tel:")
  ) {
    return props.href;
  }

  return withBase(props.href);
});
</script>

<template>
  <a class="easy-vibe-nav-card" :href="resolvedHref">
    <div class="easy-vibe-nav-card__head">
      <span v-if="icon" class="easy-vibe-nav-card__icon">{{ icon }}</span>
      <h3>{{ title }}</h3>
    </div>
    <p>{{ description }}</p>
  </a>
</template>

<script setup>
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
</script>

<template>
  <a class="easy-vibe-nav-card" :href="href">
    <div class="easy-vibe-nav-card__head">
      <span v-if="icon" class="easy-vibe-nav-card__icon">{{ icon }}</span>
      <h3>{{ title }}</h3>
    </div>
    <p>{{ description }}</p>
  </a>
</template>

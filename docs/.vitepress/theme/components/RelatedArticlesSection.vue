<script setup>
defineProps({
  title: {
    type: String,
    default: "延伸阅读",
  },
  description: {
    type: String,
    default: "",
  },
  items: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <section v-if="items.length" class="easy-vibe-related">
    <div class="easy-vibe-related__head">
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
    </div>
    <div class="easy-vibe-nav-grid">
      <NavCard
        v-for="item in items"
        :key="item.href"
        :href="item.href"
        :title="item.title"
        :description="item.description"
        :icon="item.icon"
      />
    </div>
  </section>
</template>

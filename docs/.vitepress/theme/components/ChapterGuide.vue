<script setup>
const props = defineProps({
  title: {
    type: String,
    default: "本章导读",
  },
  targetTitle: {
    type: String,
    default: "本章学习目标",
  },
  goals: {
    type: Array,
    default: () => [],
  },
  intro: {
    type: Array,
    default: () => [],
  },
  duration: {
    type: String,
    default: "",
  },
  outcome: {
    type: String,
    default: "",
  },
  outcomeNote: {
    type: String,
    default: "",
  },
  steps: {
    type: Array,
    default: () => [],
  },
  currentStep: {
    type: Number,
    default: 1,
  },
});
</script>

<template>
  <section class="chapter-guide">
    <div class="chapter-guide__panel">
      <h2 class="chapter-guide__title">{{ title }}</h2>

      <div class="chapter-guide__target">
        <p class="chapter-guide__target-title">{{ targetTitle }}</p>
        <div v-if="goals.length" class="chapter-guide__goal-list">
          <span
            v-for="goal in goals"
            :key="goal"
            class="chapter-guide__goal-chip"
          >
            {{ goal }}
          </span>
        </div>
      </div>

      <div class="chapter-guide__intro">
        <p v-for="paragraph in intro" :key="paragraph">
          {{ paragraph }}
        </p>
      </div>

      <div class="chapter-guide__meta">
        <div class="chapter-guide__meta-card">
          <span class="chapter-guide__meta-label">预计耗时</span>
          <strong>{{ duration }}</strong>
        </div>
        <div class="chapter-guide__meta-card">
          <span class="chapter-guide__meta-label">预期产出</span>
          <strong>{{ outcome }}</strong>
          <p v-if="outcomeNote">{{ outcomeNote }}</p>
        </div>
      </div>
    </div>

    <div v-if="steps.length" class="chapter-guide__steps">
      <div
        v-for="(step, index) in steps"
        :key="step"
        class="chapter-guide__step"
        :class="{ 'is-active': index + 1 === currentStep, 'is-done': index + 1 < currentStep }"
      >
        <div class="chapter-guide__step-dot">{{ index + 1 }}</div>
        <div class="chapter-guide__step-text">
          <span>Step {{ index + 1 }}</span>
          <strong>{{ step }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

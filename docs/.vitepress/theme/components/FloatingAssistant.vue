<script setup>
import { computed, nextTick, ref } from "vue";
import { useRouter } from "vitepress";

const router = useRouter();
const collapsed = ref(false);
const input = ref("");
const scrollerRef = ref(null);

const quickActions = [
  { label: "看归档", text: "带我去归档页" },
  { label: "看标签", text: "打开标签页" },
  { label: "看数据", text: "打开数据页" },
  { label: "推荐文章", text: "推荐几篇文章" },
];

const knowledge = [
  {
    keywords: ["归档", "archives", "时间线"],
    reply: "可以先去归档页，那里按时间整理了目前的文章。",
    links: [{ text: "打开归档页", href: "/pages/archives" }],
  },
  {
    keywords: ["标签", "分类", "topic"],
    reply: "标签页更适合按主题找内容，现在已经整理成 AI 工程、架构、AI 助手、随笔几个入口。",
    links: [{ text: "打开标签页", href: "/pages/tags" }],
  },
  {
    keywords: ["数据", "统计", "浏览量"],
    reply: "站点数据页可以看内容结构和一些基础统计，文章页底部还能看到访问量模块。",
    links: [{ text: "打开数据页", href: "/pages/site-data" }],
  },
  {
    keywords: ["ai", "助手", "架构"],
    reply: "如果你想看系统设计路线，建议从 AI 助手总览专题开始。",
    links: [
      { text: "整体架构与分层设计", href: "/posts/ai-architecture/overall-architecture-layered-design" },
      { text: "OpenCode 技术架构文档", href: "/posts/ai-architecture/opencode-technical-architecture-overview" },
    ],
  },
  {
    keywords: ["前端", "架构", "工程"],
    reply: "前端和工程侧内容主要集中在架构与 AI 工程两个方向。",
    links: [
      { text: "前端项目架构设计指南", href: "/posts/architecture/frontend-architecture-design" },
      { text: "做一个可维护的前端博客系统", href: "/posts/architecture/building-a-maintainable-frontend-blog-system" },
    ],
  },
  {
    keywords: ["推荐", "看看", "文章"],
    reply: "我先给你三篇适合快速进入这个博客的文章。",
    links: [
      { text: "我如何整理长期技术写作的素材池", href: "/posts/engineering/how-i-organize-long-term-technical-writing" },
      { text: "整体架构与分层设计", href: "/posts/ai-architecture/overall-architecture-layered-design" },
      { text: "一个好的个人博客，应该给人什么感觉", href: "/posts/essay/what-a-good-personal-blog-feels-like" },
    ],
  },
];

const messages = ref([
  {
    role: "assistant",
    text: "你好，我现在不是摆设了。你可以让我带路、推荐文章、打开归档/标签/数据页，或者问我这个博客里主要写什么。",
    links: [],
  },
]);

const helperTitle = computed(() => (collapsed.value ? "展开助手" : "收起助手"));

function normalize(text) {
  return text.trim().toLowerCase();
}

function scrollToBottom() {
  nextTick(() => {
    scrollerRef.value?.scrollTo({
      top: scrollerRef.value.scrollHeight,
      behavior: "smooth",
    });
  });
}

function pushAssistantReply(reply, links = []) {
  messages.value.push({
    role: "assistant",
    text: reply,
    links,
  });
  scrollToBottom();
}

function navigateTo(href) {
  router.go(href);
  pushAssistantReply("已经帮你打开对应页面。", []);
}

function answerQuestion(question) {
  const normalized = normalize(question);
  const matched = knowledge.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (matched) {
    pushAssistantReply(matched.reply, matched.links);
    return;
  }

  pushAssistantReply(
    "我暂时还听不太懂这个问题，不过你可以试试问我：推荐文章、打开归档页、打开标签页、打开数据页、AI 助手架构、前端架构。",
    [],
  );
}

function submitMessage(text = input.value) {
  const content = text.trim();
  if (!content) return;

  messages.value.push({
    role: "user",
    text: content,
    links: [],
  });

  input.value = "";
  scrollToBottom();
  answerQuestion(content);
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
}
</script>

<template>
  <div class="floating-helper" :class="{ 'floating-helper--collapsed': collapsed }">
    <button class="floating-helper__toggle" type="button" @click="toggleCollapsed">
      {{ helperTitle }}
    </button>

    <div class="floating-helper__panel">
      <div class="floating-helper__head">
        <div class="floating-helper__avatar" aria-hidden="true">
          <div class="floating-helper__halo"></div>
          <div class="floating-helper__head-shape">
            <span class="floating-helper__eye"></span>
            <span class="floating-helper__eye"></span>
          </div>
          <div class="floating-helper__cloak"></div>
        </div>
        <div>
          <strong>站点助手</strong>
          <p>给你带路、推荐文章、快速跳转</p>
        </div>
      </div>

      <div ref="scrollerRef" class="floating-helper__messages">
        <div
          v-for="(message, index) in messages"
          :key="`${message.role}-${index}`"
          class="floating-helper__message"
          :class="`floating-helper__message--${message.role}`"
        >
          <p>{{ message.text }}</p>
          <div v-if="message.links?.length" class="floating-helper__links">
            <button
              v-for="link in message.links"
              :key="link.href"
              type="button"
              class="floating-helper__link"
              @click="navigateTo(link.href)"
            >
              {{ link.text }}
            </button>
          </div>
        </div>
      </div>

      <div class="floating-helper__quick">
        <button
          v-for="action in quickActions"
          :key="action.label"
          type="button"
          class="floating-helper__quick-btn"
          @click="submitMessage(action.text)"
        >
          {{ action.label }}
        </button>
      </div>

      <div class="floating-helper__composer">
        <input
          v-model="input"
          type="text"
          placeholder="问我：推荐文章 / 打开归档页 / AI 助手架构"
          @keydown.enter.prevent="submitMessage()"
        />
        <button type="button" @click="submitMessage()">发送</button>
      </div>
    </div>
  </div>
</template>

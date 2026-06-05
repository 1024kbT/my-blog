<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vitepress";

const router = useRouter();
const route = useRoute();
const collapsed = ref(false);
const input = ref("");
const scrollerRef = ref(null);
const assistantMode = ref("guide");
const recentQueries = ref([]);
const lastContextPath = ref("");

const RECENT_QUERY_KEY = "site-assistant-recent-queries";

const quickActions = [
  { label: "看归档", text: "带我去归档页" },
  { label: "看标签", text: "打开标签页" },
  { label: "看数据", text: "打开数据页" },
  { label: "推荐文章", text: "推荐几篇文章" },
];

const articles = [
  {
    title: "整体架构与分层设计",
    description: "从终端交互层到基础设施层，快速建立整个系统的认知地图。",
    href: "/posts/ai-architecture/overall-architecture-layered-design",
    keywords: ["ai", "助手", "架构", "分层", "系统设计"],
    topic: "AI 助手总览",
  },
  {
    title: "OpenCode 技术架构文档",
    description: "从数据流、模块划分和系统定位出发，看一套终端 AI 助手如何组成整体。",
    href: "/posts/ai-architecture/opencode-technical-architecture-overview",
    keywords: ["opencode", "ai", "架构", "终端"],
    topic: "AI 助手总览",
  },
  {
    title: "我如何整理长期技术写作的素材池",
    description: "从碎片记录到正式发布，给长期写作留一条可以持续复用的工作流。",
    href: "/posts/engineering/how-i-organize-long-term-technical-writing",
    keywords: ["写作", "素材", "文章", "博客", "内容"],
    topic: "AI 工程",
  },
  {
    title: "做一个可维护的前端博客系统，我会先守住什么",
    description: "不是先卷花哨效果，而是先把内容结构、发布路径、分类方式和长期维护成本想清楚。",
    href: "/posts/architecture/building-a-maintainable-frontend-blog-system",
    keywords: ["前端", "博客", "架构", "维护", "系统"],
    topic: "架构",
  },
  {
    title: "前端项目架构设计指南",
    description: "结合 Vue 2 + TypeScript 项目，整理分层、目录、类型与工程规范。",
    href: "/posts/architecture/frontend-architecture-design",
    keywords: ["前端", "typescript", "vue", "工程", "架构"],
    topic: "架构",
  },
  {
    title: "你不知道的 Claude Code：架构、治理与工程实践",
    description: "从上下文、技能、工具、Hook 与子代理出发，梳理 AI 编程代理的工程方法。",
    href: "/posts/ai/claude-code-architecture-governance-engineering-practice",
    keywords: ["claude", "ai", "工程", "代理", "工具"],
    topic: "AI 工程",
  },
  {
    title: "一个好的个人博客，应该给人什么感觉",
    description: "比起多酷，我更在意一个博客是否让人愿意停下来继续看。",
    href: "/posts/essay/what-a-good-personal-blog-feels-like",
    keywords: ["博客", "个人站", "随笔", "内容", "设计"],
    topic: "随笔",
  },
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
  {
    keywords: ["你是谁", "你能做什么", "助手", "help"],
    reply: "我现在更像一个站内助手：可以给你推荐文章、按主题找内容、带你去归档页和标签页，也能回答这个博客主要写什么。",
    links: [
      { text: "推荐文章", href: "/posts/engineering/how-i-organize-long-term-technical-writing" },
      { text: "打开标签页", href: "/pages/tags" },
    ],
  },
  {
    keywords: ["模型", "llm", "gpt"],
    reply: "我不是接了外部大模型的在线助手，现在是站内本地知识助手，重点是帮你更快找到内容，而不是泛化闲聊。",
    links: [],
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
const currentArticle = computed(() => articles.find((item) => route.path.includes(item.href)));
const contextualSuggestions = computed(() => {
  if (!currentArticle.value) {
    return [
      { label: "推荐文章", text: "推荐几篇文章" },
      { label: "站点写什么", text: "这个博客主要写什么" },
    ];
  }

  return articles
    .filter((item) => item.topic === currentArticle.value.topic && item.href !== currentArticle.value.href)
    .slice(0, 2)
    .map((item) => ({
      label: `继续看：${item.title.slice(0, 8)}${item.title.length > 8 ? "..." : ""}`,
      text: item.title,
    }));
});

function normalize(text) {
  return text.trim().toLowerCase();
}

function tokenize(text) {
  return normalize(text)
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
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

function saveRecentQuery(query) {
  const nextQueries = [query, ...recentQueries.value.filter((item) => item !== query)].slice(0, 6);
  recentQueries.value = nextQueries;
  window.localStorage.setItem(RECENT_QUERY_KEY, JSON.stringify(nextQueries));
}

function searchArticles(question) {
  const tokens = tokenize(question);
  if (!tokens.length) return [];

  const scored = articles
    .map((article) => {
      const haystack = `${article.title} ${article.description} ${article.keywords.join(" ")}`.toLowerCase();
      const score = tokens.reduce((sum, token) => (haystack.includes(token) ? sum + 1 : sum), 0);
      return { article, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return scored.map((item) => ({
    text: item.article.title,
    href: item.article.href,
    description: item.article.description,
    topic: item.article.topic,
  }));
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

  const searchResults = searchArticles(question);
  if (searchResults.length) {
    assistantMode.value = "search";
    pushAssistantReply("我按你的问题在站内帮你找了几篇最接近的文章，可以先从这些开始看。", searchResults);
    return;
  }

  pushAssistantReply(
    "我暂时还没理解这个问题。你可以直接问我：推荐文章、打开归档页、打开标签页、打开数据页、AI 助手架构、前端架构、这个博客主要写什么。",
    [],
  );
}

function submitMessage(text = input.value) {
  const content = text.trim();
  if (!content) return;

  assistantMode.value = "guide";
  messages.value.push({
    role: "user",
    text: content,
    links: [],
  });

  saveRecentQuery(content);
  input.value = "";
  scrollToBottom();
  answerQuestion(content);
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
}

function handleShortcut(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    collapsed.value = false;
    nextTick(() => {
      document.querySelector(".floating-helper__composer input")?.focus();
    });
  }

  if (event.key === "Escape") {
    collapsed.value = true;
  }
}

function buildRouteContextReply() {
  if (!currentArticle.value) return;

  pushAssistantReply(
    `你现在正在看《${currentArticle.value.title}》。如果想继续同主题阅读，我可以继续给你推荐 ${currentArticle.value.topic} 里的文章。`,
    articles
      .filter((item) => item.topic === currentArticle.value.topic && item.href !== currentArticle.value.href)
      .slice(0, 2)
      .map((item) => ({ text: item.title, href: item.href })),
  );
}

onMounted(() => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(RECENT_QUERY_KEY) || "[]");
    if (Array.isArray(stored)) {
      recentQueries.value = stored.slice(0, 6);
    }
  } catch {}

  window.addEventListener("keydown", handleShortcut);
});

watch(
  () => route.path,
  (path) => {
    if (path === lastContextPath.value) return;
    lastContextPath.value = path;

    if (currentArticle.value) {
      assistantMode.value = "context";
      buildRouteContextReply();
    }
  },
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleShortcut);
});
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
          <p>
            {{
              assistantMode === "search"
                ? "站内检索 / 内容带路"
                : assistantMode === "context"
                  ? "当前页面相关推荐"
                  : "带路、推荐文章、快速跳转"
            }}
          </p>
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
              <span class="floating-helper__link-title">{{ link.text }}</span>
              <small v-if="link.topic || link.description" class="floating-helper__link-meta">
                {{ link.topic || "站内文章" }}{{ link.description ? ` · ${link.description}` : "" }}
              </small>
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
        <button
          v-for="action in contextualSuggestions"
          :key="action.label"
          type="button"
          class="floating-helper__quick-btn floating-helper__quick-btn--soft"
          @click="submitMessage(action.text)"
        >
          {{ action.label }}
        </button>
      </div>

      <div v-if="recentQueries.length" class="floating-helper__recent">
        <span class="floating-helper__recent-label">最近查询</span>
        <div class="floating-helper__recent-list">
          <button
            v-for="query in recentQueries"
            :key="query"
            type="button"
            class="floating-helper__recent-btn"
            @click="submitMessage(query)"
          >
            {{ query }}
          </button>
        </div>
      </div>

      <div class="floating-helper__composer">
        <input
          v-model="input"
          type="text"
          placeholder="问我：推荐文章 / 打开归档页 / AI 助手架构 / 这个博客写什么"
          @keydown.enter.prevent="submitMessage()"
        />
        <button type="button" @click="submitMessage()">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vitepress";
import {
  assistantArticles,
  assistantCommands,
  assistantIntents,
  assistantQuickActions,
} from "../assistant-knowledge";

const router = useRouter();
const route = useRoute();
const collapsed = ref(false);
const input = ref("");
const scrollerRef = ref(null);
const assistantMode = ref("guide");
const recentQueries = ref([]);
const lastContextPath = ref("");
const isMobile = ref(false);

const RECENT_QUERY_KEY = "site-assistant-recent-queries";

const messages = ref([
  {
    role: "assistant",
    text: "你好，我现在不是摆设了。你可以让我带路、推荐文章、打开归档/标签/数据页，或者问我这个博客里主要写什么。",
    links: [],
  },
]);

const helperTitle = computed(() => (collapsed.value ? "展开助手" : "收起助手"));
const currentArticle = computed(() => assistantArticles.find((item) => route.path.includes(item.href)));
const contextualSuggestions = computed(() => {
  if (!currentArticle.value) {
    return [
      { label: "推荐文章", text: "推荐几篇文章" },
      { label: "站点写什么", text: "这个博客主要写什么" },
    ];
  }

  return assistantArticles
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
  if (isMobile.value) {
    collapsed.value = true;
  }
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

  const scored = assistantArticles
    .map((article) => {
      const haystack = `${article.title} ${article.description} ${article.keywords.join(" ")}`.toLowerCase();
      const titleScore = tokens.reduce((sum, token) => (article.title.toLowerCase().includes(token) ? sum + 3 : sum), 0);
      const keywordScore = tokens.reduce(
        (sum, token) => (article.keywords.some((keyword) => keyword.includes(token)) ? sum + 2 : sum),
        0,
      );
      const textScore = tokens.reduce((sum, token) => (haystack.includes(token) ? sum + 1 : sum), 0);
      const score = titleScore + keywordScore + textScore;
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

function handleCommand(question) {
  const normalized = normalize(question);

  if (normalized.startsWith("/goto")) {
    const target = normalized.replace("/goto", "").trim();
    const pageMap = {
      archives: "/pages/archives",
      tags: "/pages/tags",
      data: "/pages/site-data",
      home: "/",
    };
    const href = pageMap[target];
    if (href) {
      pushAssistantReply(`我帮你定位到 ${target} 页面。`, [{ text: `打开 ${target}`, href }]);
      return true;
    }
    pushAssistantReply("`/goto` 目前支持：home、archives、tags、data。", []);
    return true;
  }

  if (normalized.startsWith("/topic")) {
    const topic = normalized.replace("/topic", "").trim();
    const matched = assistantArticles
      .filter((item) => normalize(item.topic).includes(topic) || item.keywords.some((keyword) => keyword.includes(topic)))
      .slice(0, 4)
      .map((item) => ({
        text: item.title,
        href: item.href,
        description: item.description,
        topic: item.topic,
      }));

    if (matched.length) {
      pushAssistantReply(`我帮你找到了和“${topic}”最相关的一组文章。`, matched);
    } else {
      pushAssistantReply("这个专题我还没匹配到，你可以试试：架构、AI 助手、AI 工程、随笔。", []);
    }
    return true;
  }

  if (normalized.startsWith("/search")) {
    const query = question.replace("/search", "").trim();
    const results = searchArticles(query);
    if (results.length) {
      pushAssistantReply(`我按“${query}”帮你搜到这些文章。`, results);
    } else {
      pushAssistantReply(`暂时没搜到和“${query}”足够接近的文章。`, []);
    }
    return true;
  }

  return false;
}

function answerQuestion(question) {
  const normalized = normalize(question);
  const matched = assistantIntents.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (handleCommand(question)) {
    assistantMode.value = "search";
    return;
  }

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
    assistantArticles
      .filter((item) => item.topic === currentArticle.value.topic && item.href !== currentArticle.value.href)
      .slice(0, 2)
      .map((item) => ({ text: item.title, href: item.href })),
  );
}

function syncViewportMode() {
  isMobile.value = window.innerWidth <= 960;
}

onMounted(() => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(RECENT_QUERY_KEY) || "[]");
    if (Array.isArray(stored)) {
      recentQueries.value = stored.slice(0, 6);
    }
  } catch {}

  syncViewportMode();
  window.addEventListener("resize", syncViewportMode);
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
  window.removeEventListener("resize", syncViewportMode);
  window.removeEventListener("keydown", handleShortcut);
});
</script>

<template>
  <div class="floating-helper" :class="{ 'floating-helper--collapsed': collapsed }">
    <button
      v-if="!collapsed && isMobile"
      type="button"
      class="floating-helper__overlay"
      aria-label="关闭助手"
      @click="collapsed = true"
    ></button>

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
        <button type="button" class="floating-helper__close" @click="collapsed = true">关闭</button>
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
          v-for="action in assistantQuickActions"
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

      <div class="floating-helper__commands">
        <span class="floating-helper__recent-label">可用指令</span>
        <div class="floating-helper__recent-list">
          <button
            v-for="command in assistantCommands"
            :key="command.command"
            type="button"
            class="floating-helper__recent-btn floating-helper__recent-btn--command"
            @click="submitMessage(command.command)"
          >
            {{ command.command }}
          </button>
        </div>
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
          placeholder="问我：推荐文章 / /search AI 助手 / /goto tags"
          @keydown.enter.prevent="submitMessage()"
        />
        <button type="button" @click="submitMessage()">发送</button>
      </div>
    </div>
  </div>
</template>

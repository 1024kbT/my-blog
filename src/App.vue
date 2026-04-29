<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

// 页面内容状态：集中放在一个地方，后续二开时改数据和改组件都会更顺手。
const state = reactive({
  theme: localStorage.getItem("astra-theme") || "dark",
  stats: [
    { value: "24", label: "已发布文章" },
    { value: "08", label: "专题系列" },
    { value: "∞", label: "深夜灵感" },
  ],
  spotlightPosts: [
    {
      type: "专题",
      title: "把博客做成你的数字展厅，而不是普通信息列表。",
      description:
        "通过视觉层次、标题节奏和强烈的封面氛围，把单纯的文章站点变成更有记忆点的个人表达界面。",
      featured: true,
    },
    {
      type: "代码",
      title: "GitHub Pages 部署很轻，但体验不必轻。",
      description: "Vue 项目结构更清晰，后续加组件、路由和数据源都更自然。",
      featured: false,
    },
    {
      type: "灵感",
      title: "在深色界面里留白，让内容自己发光。",
      description: "这套视觉比较适合技术博客、设计日志、产品随笔和个人作品站。",
      featured: false,
    },
  ],
  posts: [
    {
      tag: "Frontend",
      title: "如何用极少的前端代码，做出有空间感的首页氛围",
      description: "从层叠阴影、半透明边框到背景动画，几个点就足够把静态页面做得不无聊。",
      href: "#",
    },
    {
      tag: "Writing",
      title: "技术博客不只是知识记录，也是一种个人品牌设计",
      description: "当博客首页开始承担第一印象这件事，布局和文案会一起影响访客停留时间。",
      href: "#",
    },
    {
      tag: "Deploy",
      title: "为什么 GitHub Pages 仍然是个人站上线最省心的选择之一",
      description: "免费、稳定、版本化、和仓库天然绑定，对个人博客和作品展示都很友好。",
      href: "#",
    },
    {
      tag: "Design",
      title: "深色系并不等于沉闷，关键是节奏、发光和层次",
      description: "如果背景足够安静，内容区的高光和冷暖对比会显得非常干净利落。",
      href: "#",
    },
  ],
});

const featuredSpotlight = computed(
  () => state.spotlightPosts.find((item) => item.featured) || state.spotlightPosts[0],
);
const secondarySpotlights = computed(() =>
  state.spotlightPosts.filter((item) => item !== featuredSpotlight.value),
);

const canvasRef = ref(null);
const stars = [];
let animationFrameId = 0;
let resizeHandler = null;

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem("astra-theme", theme);
}

function createStar(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.8 + 0.4,
    speed: Math.random() * 0.18 + 0.04,
    alpha: Math.random() * 0.7 + 0.2,
  };
}

function setupStarfield() {
  const canvas = canvasRef.value;
  const context = canvas?.getContext("2d");

  if (!canvas || !context) return;

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars.length = 0;

    for (let index = 0; index < 80; index += 1) {
      stars.push(createStar(canvas.width, canvas.height));
    }
  };

  const drawStars = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const star of stars) {
      context.beginPath();
      context.fillStyle = `rgba(160, 220, 255, ${star.alpha})`;
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();

      star.y += star.speed;
      if (star.y > canvas.height + 4) {
        star.y = -4;
        star.x = Math.random() * canvas.width;
      }
    }

    animationFrameId = window.requestAnimationFrame(drawStars);
  };

  resizeCanvas();
  drawStars();

  resizeHandler = () => resizeCanvas();
  window.addEventListener("resize", resizeHandler);
}

watch(
  () => state.theme,
  (theme) => applyTheme(theme),
  { immediate: true },
);

onMounted(() => {
  setupStarfield();
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }

  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
  }
});
</script>

<template>
  <!-- 背景画布：用于营造赛博星空氛围。 -->
  <canvas ref="canvasRef" class="starfield" aria-hidden="true"></canvas>

  <div class="page-shell">
    <header class="topbar">
      <a class="brand" href="#home">
        <span class="brand-mark"></span>
        <span class="brand-text">
          <strong>Astra Flux</strong>
          <small>personal signal archive</small>
        </span>
      </a>

      <nav class="nav">
        <a href="#posts">文章</a>
        <a href="#spotlight">精选</a>
        <a href="#about">关于</a>
      </nav>

      <button class="theme-toggle" type="button" aria-label="切换主题" @click="toggleTheme">
        <span class="toggle-ring"></span>
      </button>
    </header>

    <main id="home">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">NEON BLOG TEMPLATE</p>
          <h1>给想写点有棱角内容的人，一个足够酷的博客首页。</h1>
          <p class="hero-text">
            现在这是标准的 Vue 项目入口，后面你要拆组件、接路由、接 Markdown 或接口都会顺很多。
          </p>
          <div class="hero-actions">
            <a class="button primary" href="#posts">进入文章区</a>
            <a class="button ghost" href="#about">看看作者页</a>
          </div>
          <ul class="hero-stats" aria-label="博客统计">
            <li v-for="item in state.stats" :key="item.label">
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </li>
          </ul>
        </div>

        <aside class="hero-panel">
          <div class="signal-card">
            <span class="signal-label">本周信号</span>
            <h2>在秩序和噪音之间，找到你自己的表达频段。</h2>
            <p>如果你后面要继续二开，我建议下一步直接把文章区拆成组件，再接一个内容数据层。</p>
          </div>

          <div class="floating-stack">
            <article class="mini-card">
              <span>Featured</span>
              <strong>设计、代码与叙事</strong>
            </article>
            <article class="mini-card mini-card-alt">
              <span>Latest Drop</span>
              <strong>这次是真的 Vue 项目了</strong>
            </article>
          </div>
        </aside>
      </section>

      <section id="spotlight" class="section-heading">
        <div>
          <p class="eyebrow">SPOTLIGHT</p>
          <h2>精选内容</h2>
        </div>
        <p>精选区已经是标准列表渲染，后续接 CMS、Markdown 或 JSON 都方便。</p>
      </section>

      <section class="spotlight-grid">
        <article class="spotlight-card spotlight-large">
          <span class="chip">{{ featuredSpotlight.type }}</span>
          <h3>{{ featuredSpotlight.title }}</h3>
          <p>{{ featuredSpotlight.description }}</p>
        </article>

        <article v-for="item in secondarySpotlights" :key="item.title" class="spotlight-card">
          <span class="chip">{{ item.type }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </section>

      <section id="posts" class="section-heading">
        <div>
          <p class="eyebrow">LATEST POSTS</p>
          <h2>最新文章</h2>
        </div>
        <p>这块现在是 Vue 数据驱动，后面很好拆成 `PostCard.vue`。</p>
      </section>

      <section class="posts-grid">
        <article v-for="post in state.posts" :key="post.title" class="post-card">
          <span class="post-tag">{{ post.tag }}</span>
          <h3>{{ post.title }}</h3>
          <p>{{ post.description }}</p>
          <a :href="post.href">继续阅读</a>
        </article>
      </section>

      <section id="about" class="about-panel">
        <div>
          <p class="eyebrow">ABOUT</p>
          <h2>你好，我在这里记录产品、代码和那些有意思的想法。</h2>
        </div>
        <p>你刚刚指出的问题是对的，所以现在已经收成真正的 Vue 工程骨架了。</p>
      </section>
    </main>
  </div>
</template>

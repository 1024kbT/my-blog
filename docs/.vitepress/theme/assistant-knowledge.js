// 站点助手知识库：把文章索引、意图匹配、快捷指令从组件里拆出去，便于后续持续维护。
export const assistantQuickActions = [
  { label: "看归档", text: "带我去归档页" },
  { label: "看标签", text: "打开标签页" },
  { label: "看数据", text: "打开数据页" },
  { label: "推荐文章", text: "推荐几篇文章" },
];

export const assistantArticles = [
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

export const assistantIntents = [
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

export const assistantCommands = [
  {
    command: "/goto",
    description: "快速跳转站点页，例如 /goto tags",
  },
  {
    command: "/topic",
    description: "查看专题文章，例如 /topic 架构",
  },
  {
    command: "/search",
    description: "按关键词搜文章，例如 /search AI 助手",
  },
];

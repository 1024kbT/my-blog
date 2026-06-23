import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  // 统一站点标题，前台标题栏与页面标题都会使用这里的名称。
  title: "忘西的博客",
  description: "一个基于 VitePress 的个人博客",
  base: "/my-blog/",
  // GitHub Pages 没有无后缀路由重写能力，这里关闭 cleanUrls，避免静态访问时出现 404。
  cleanUrls: false,
  lastUpdated: true,
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "归档", link: "/pages/archives" },
      { text: "标签", link: "/pages/tags" },
      { text: "数据", link: "/pages/site-data" },
    ],
    search: {
      provider: "local",
    },
    socialLinks: [{ icon: "github", link: "https://github.com/1024kbT/my-blog" }],
    sidebar: {
      "/posts/": [
        {
          text: "随笔",
          collapsed: false,
          items: [
            { text: "城市夜骑之后，我重新理解了慢节奏", link: "/posts/essay/city-night-riding" },
            { text: "为什么我想要一个“能长期写下去”的博客", link: "/posts/essay/why-a-real-blog-matters" },
          ],
        },
        {
          text: "技术",
          collapsed: false,
          items: [
            // 把偏实操的账号与订阅文章也收进技术分组，方便从首页和侧边栏同时进入。
            { text: "土区账号注册与订阅教程", link: "/posts/dev/turkey-region-registration-playbook" },
            { text: "把个人博客从展示页收成内容系统", link: "/posts/dev/from-showcase-to-content-system" },
            { text: "GitHub Pages + VitePress 的部署踩坑记录", link: "/posts/dev/github-pages-vitepress-notes" },
          ],
        },
        {
          // 把本地整理过来的架构类文档集中到一个分组里，方便后续继续补内容。
          text: "架构",
          collapsed: false,
          items: [{ text: "前端项目架构设计指南", link: "/posts/architecture/frontend-architecture-design" }],
        },
        {
          text: "AI 工程",
          collapsed: false,
          items: [
            {
              text: "AI 产品与应用开发学习地图",
              link: "/posts/engineering/ai-building-learning-map",
            },
            {
              text: "零基础入门：从会用到会搭一个 AI 小工具",
              link: "/posts/engineering/ai-building-stage-1-foundation",
            },
            {
              text: "初中级进阶：把 AI Demo 做成真正可用的小产品",
              link: "/posts/engineering/ai-building-stage-2-productization",
            },
            {
              text: "高级开发：从功能实现走向系统设计",
              link: "/posts/engineering/ai-building-stage-3-advanced-systems",
            },
            {
              text: "产品实战：从点子到第一个 AI 产品 Demo",
              link: "/posts/engineering/ai-building-product-practice",
            },
            {
              text: "业务思维：做 AI 应用时到底该想什么",
              link: "/posts/engineering/ai-building-business-thinking",
            },
            {
              text: "附录：AI 应用开发的资料、练习与项目清单",
              link: "/posts/engineering/ai-building-appendix-resources",
            },
            {
              text: "你不知道的 Claude Code：架构、治理与工程实践",
              link: "/posts/ai/claude-code-architecture-governance-engineering-practice",
            },
            {
              text: "AI 开发协作 Prompt（Vue2 + TypeScript + class 风格）",
              link: "/posts/engineering/ai-collaboration-prompt-vue2-typescript",
            },
            {
              text: "Karpathy Coding Guidelines：编码约束与执行准则",
              link: "/posts/engineering/karpathy-coding-guidelines",
            },
          ],
        },
        {
          // 把新增的一组系统设计文档单独整理成专题，避免和通用 AI 工程文章混在一起。
          text: "AI 助手总览",
          collapsed: false,
          items: [
            { text: "整体架构与分层设计", link: "/posts/ai-architecture/overall-architecture-layered-design" },
            { text: "OpenCode 技术架构文档", link: "/posts/ai-architecture/opencode-technical-architecture-overview" },
            { text: "构建终端 AI 助手的核心功能清单", link: "/posts/ai-architecture/core-feature-build-checklist" },
          ],
        },
        {
          text: "AI 助手核心能力",
          collapsed: false,
          items: [
            { text: "CLI 入口层设计", link: "/posts/ai-core/cli-entry-layer-design" },
            { text: "应用编排层 (App) 设计", link: "/posts/ai-core/application-orchestration-layer-design" },
            { text: "Agent 多轮对话引擎设计", link: "/posts/ai-core/agent-multi-turn-dialog-engine-design" },
            { text: "提示词模板系统设计", link: "/posts/ai-core/prompt-template-system-design" },
            { text: "记忆机制的数据结构与信息提取", link: "/posts/ai-core/memory-structure-and-information-extraction" },
            { text: "LLM 多提供商集成设计", link: "/posts/ai-core/llm-multi-provider-integration-design" },
            { text: "工具集 (Tool System) 设计", link: "/posts/ai-core/tool-system-design" },
          ],
        },
        {
          text: "AI 助手基础设施",
          collapsed: false,
          items: [
            { text: "日志系统设计", link: "/posts/ai-infra/logging-system-design" },
            { text: "本地数据持久化设计", link: "/posts/ai-infra/local-data-persistence-design" },
            { text: "配置管理设计", link: "/posts/ai-infra/configuration-management-design" },
            { text: "事件总线 (Pub/Sub) 设计", link: "/posts/ai-infra/event-bus-design" },
          ],
        },
      ],
    },
    footer: {
      message: "忘西的博客 · 长期写作 · 内容归档 · GitHub Pages",
      copyright: "Copyright © 2026-present 1024kbT",
    },
    outline: {
      level: "deep",
      label: "目录",
    },
  },
});

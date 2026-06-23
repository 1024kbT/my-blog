import { defineConfig } from "vitepress";

const easyVibeSidebar = [
  {
    text: "总览",
    collapsed: false,
    items: [
      { text: "Easy-Vibe 首页", link: "/easy-vibe/zh-cn/" },
      { text: "Stage 1 学习地图", link: "/easy-vibe/zh-cn/stage-1/learning-map/" },
      { text: "Stage 2 课程首页", link: "/easy-vibe/zh-cn/stage-2/" },
      { text: "Stage 3 课程首页", link: "/easy-vibe/zh-cn/stage-3/" },
      { text: "附录知识库", link: "/easy-vibe/zh-cn/appendix/" },
    ],
  },
  {
    text: "新手入门 Stage 1",
    collapsed: false,
    items: [
      { text: "学习地图", link: "/easy-vibe/zh-cn/stage-1/learning-map/" },
      { text: "AI 时代，会说话就会编程", link: "/easy-vibe/zh-cn/stage-1/introduction-to-ai-ide/" },
      { text: "找到好点子", link: "/easy-vibe/zh-cn/stage-1/finding-great-idea/" },
      { text: "搭建产品原型", link: "/easy-vibe/zh-cn/stage-1/building-prototype/" },
      { text: "接入 AI 能力", link: "/easy-vibe/zh-cn/stage-1/integrating-ai-capabilities/" },
      { text: "完整项目实战", link: "/easy-vibe/zh-cn/stage-1/complete-project-practice/" },
      { text: "从游戏理解 AI 能力", link: "/easy-vibe/zh-cn/stage-1/ai-capabilities-through-games/" },
    ],
  },
  {
    text: "Stage 1 附录",
    collapsed: true,
    items: [
      { text: "产品思维与方案设计", link: "/easy-vibe/zh-cn/stage-1/appendix-a-product-thinking/" },
      { text: "常见错误", link: "/easy-vibe/zh-cn/stage-1/appendix-b-common-errors/" },
      { text: "AI 消费场景灵感", link: "/easy-vibe/zh-cn/stage-1/appendix-c-consumer-scenarios/" },
      { text: "AI 消费场景补充", link: "/easy-vibe/zh-cn/stage-1/appendix-consumer-scenarios/" },
      { text: "双钻模型", link: "/easy-vibe/zh-cn/stage-1/appendix-double-diamond/" },
      { text: "从哪里找点子", link: "/easy-vibe/zh-cn/stage-1/appendix-idea-sources/" },
      { text: "AI 行业应用场景", link: "/easy-vibe/zh-cn/stage-1/appendix-industry-scenarios/" },
      { text: "Jobs to Be Done", link: "/easy-vibe/zh-cn/stage-1/appendix-jobs-to-be-done/" },
      { text: "MOM 测试", link: "/easy-vibe/zh-cn/stage-1/appendix-mom-test/" },
    ],
  },
  {
    text: "初中级开发 Stage 2",
    collapsed: false,
    items: [
      { text: "课程总览", link: "/easy-vibe/zh-cn/stage-2/" },
      { text: "素材生产 Agent", link: "/easy-vibe/zh-cn/stage-2/frontend/lovart-assets/" },
      { text: "Figma 与 MasterGo", link: "/easy-vibe/zh-cn/stage-2/frontend/figma-mastergo/" },
      { text: "UI 设计入门", link: "/easy-vibe/zh-cn/stage-2/frontend/ui-design/" },
      { text: "多产品界面规范", link: "/easy-vibe/zh-cn/stage-2/frontend/multi-product-ui/" },
      { text: "用 LLM Skills 美化界面", link: "/easy-vibe/zh-cn/stage-2/frontend/llm-skills-beautiful/" },
      { text: "霍格沃茨画像实战", link: "/easy-vibe/zh-cn/stage-2/frontend/hogwarts-portraits/" },
      { text: "设计稿到代码", link: "/easy-vibe/zh-cn/stage-2/frontend/design-to-code/" },
      { text: "现代组件库升级", link: "/easy-vibe/zh-cn/stage-2/frontend/modern-component-library/" },
      { text: "Git 与 Github", link: "/easy-vibe/zh-cn/stage-2/backend/git-workflow/" },
      { text: "数据库与 Supabase", link: "/easy-vibe/zh-cn/stage-2/backend/database-supabase/" },
      { text: "后端接口开发", link: "/easy-vibe/zh-cn/stage-2/backend/ai-interface-code/" },
      { text: "Zeabur 部署", link: "/easy-vibe/zh-cn/stage-2/backend/zeabur-deployment/" },
      { text: "CLI AI 编程工具", link: "/easy-vibe/zh-cn/stage-2/backend/modern-cli/" },
      { text: "Stripe 支付集成", link: "/easy-vibe/zh-cn/stage-2/backend/stripe-payment/" },
      { text: "Dify 与知识库", link: "/easy-vibe/zh-cn/stage-2/ai-capabilities/dify-knowledge-base/" },
    ],
  },
  {
    text: "Stage 2 大作业与扩展",
    collapsed: true,
    items: [
      { text: "大作业 1：文案生成 SaaS", link: "/easy-vibe/zh-cn/stage-2/assignments/copywriting-platform-supabase/" },
      { text: "大作业 2：在线考试系统", link: "/easy-vibe/zh-cn/stage-2/assignments/exam-management-express/" },
      { text: "现代落地页工程", link: "/easy-vibe/zh-cn/stage-2/assignments/modern-landing-page/" },
      { text: "类 Dify 智能体平台", link: "/easy-vibe/zh-cn/stage-2/assignments/custom-dify-agent-platform/" },
      { text: "旅行规划 Agent 平台", link: "/easy-vibe/zh-cn/stage-2/assignments/travel-planning-agent-platform/" },
      { text: "Spring Boot 电影推荐", link: "/easy-vibe/zh-cn/stage-2/assignments/movie-recommendation-springboot/" },
      { text: "生鲜电商微服务系统", link: "/easy-vibe/zh-cn/stage-2/assignments/simple-grocery-microservices/" },
      { text: "Go 交通数据可视化", link: "/easy-vibe/zh-cn/stage-2/assignments/traffic-data-visualization-go/" },
    ],
  },
  {
    text: "高级开发 Stage 3",
    collapsed: false,
    items: [
      { text: "课程总览", link: "/easy-vibe/zh-cn/stage-3/" },
      { text: "Claude Code 核心指南", link: "/easy-vibe/zh-cn/stage-3/core-skills/basics/" },
      { text: "MCP 完全指南", link: "/easy-vibe/zh-cn/stage-3/core-skills/mcp/" },
      { text: "Skills 完全指南", link: "/easy-vibe/zh-cn/stage-3/core-skills/skills/" },
      { text: "长时间任务处理", link: "/easy-vibe/zh-cn/stage-3/core-skills/long-running-tasks/" },
      { text: "Agent Teams", link: "/easy-vibe/zh-cn/stage-3/core-skills/agent-teams/" },
      { text: "Superpowers 工程级开发", link: "/easy-vibe/zh-cn/stage-3/core-skills/superpowers/" },
      { text: "工作流最佳实践", link: "/easy-vibe/zh-cn/stage-3/core-skills/workflow/" },
      { text: "Spec Coding", link: "/easy-vibe/zh-cn/stage-3/core-skills/spec-coding/" },
      { text: "Claude Agent SDK", link: "/easy-vibe/zh-cn/stage-3/core-skills/claude-agent-sdk/" },
      { text: "移动端开发", link: "/easy-vibe/zh-cn/stage-3/core-skills/mobile-development/" },
    ],
  },
  {
    text: "Stage 3 多平台与高级 AI",
    collapsed: true,
    items: [
      { text: "平台选型", link: "/easy-vibe/zh-cn/stage-3/cross-platform/choose-platform/" },
      { text: "微信小程序", link: "/easy-vibe/zh-cn/stage-3/cross-platform/wechat-miniprogram/" },
      { text: "微信小程序（含后端）", link: "/easy-vibe/zh-cn/stage-3/cross-platform/wechat-miniprogram-backend/" },
      { text: "Android 应用开发", link: "/easy-vibe/zh-cn/stage-3/cross-platform/android-app/" },
      { text: "iOS 应用开发", link: "/easy-vibe/zh-cn/stage-3/cross-platform/ios-app/" },
      { text: "PWA 本地应用", link: "/easy-vibe/zh-cn/stage-3/cross-platform/pwa-local-app/" },
      { text: "浏览器 AI 插件", link: "/easy-vibe/zh-cn/stage-3/cross-platform/browser-ai-extension/" },
      { text: "Electron 桌面应用", link: "/easy-vibe/zh-cn/stage-3/cross-platform/electron-voice-to-text/" },
      { text: "NFT 铸造", link: "/easy-vibe/zh-cn/stage-3/cross-platform/nft-minting/" },
      { text: "VS Code 插件开发", link: "/easy-vibe/zh-cn/stage-3/cross-platform/vscode-extension/" },
      { text: "Qt 工业桌面应用", link: "/easy-vibe/zh-cn/stage-3/cross-platform/qt-industrial-hmi/" },
      { text: "个人网页与博客", link: "/easy-vibe/zh-cn/stage-3/personal-brand/personal-website-blog/" },
      { text: "RAG 入门", link: "/easy-vibe/zh-cn/stage-3/ai-advanced/rag-introduction/" },
      { text: "LangGraph 高级 RAG", link: "/easy-vibe/zh-cn/stage-3/ai-advanced/langgraph-advanced-rag/" },
      { text: "企业知识库", link: "/easy-vibe/zh-cn/stage-3/ai-advanced/llamaindex-enterprise-knowledge-base/" },
    ],
  },
  {
    text: "知识附录 Appendix",
    collapsed: true,
    items: [
      { text: "附录首页", link: "/easy-vibe/zh-cn/appendix/" },
      { text: "计算机基础", link: "/easy-vibe/zh-cn/appendix/1-computer-fundamentals/vibe-coding-fullstack" },
      { text: "开发环境与工具", link: "/easy-vibe/zh-cn/appendix/2-development-tools/ide-basics" },
      { text: "调试的艺术", link: "/easy-vibe/zh-cn/appendix/2-development-tools/debugging-art/" },
      { text: "浏览器与前端", link: "/easy-vibe/zh-cn/appendix/3-browser-and-frontend/javascript-deep-dive" },
      { text: "服务器与后端", link: "/easy-vibe/zh-cn/appendix/4-server-and-backend/backend-languages" },
      { text: "数据基础", link: "/easy-vibe/zh-cn/appendix/5-data/database-fundamentals" },
      { text: "架构与系统设计", link: "/easy-vibe/zh-cn/appendix/6-architecture-and-system-design/system-design-methodology" },
      { text: "基础设施与运维", link: "/easy-vibe/zh-cn/appendix/7-infrastructure-and-operations/cloud-platforms" },
      { text: "人工智能", link: "/easy-vibe/zh-cn/appendix/8-artificial-intelligence/llm-principles" },
      { text: "工程素养", link: "/easy-vibe/zh-cn/appendix/9-engineering-excellence/testing-strategies" },
    ],
  },
  {
    text: "Vibe Stories",
    collapsed: true,
    items: [
      { text: "故事 1", link: "/easy-vibe/zh-cn/vibe-stories/story-1/" },
      { text: "故事 2", link: "/easy-vibe/zh-cn/vibe-stories/story-2/" },
      { text: "故事 3", link: "/easy-vibe/zh-cn/vibe-stories/story-3/" },
      { text: "故事 4", link: "/easy-vibe/zh-cn/vibe-stories/story-4/" },
    ],
  },
];

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
      { text: "Easy-Vibe 全套教程", link: "/easy-vibe/zh-cn/" },
      { text: "数据", link: "/pages/site-data" },
    ],
    search: {
      provider: "local",
    },
    socialLinks: [{ icon: "github", link: "https://github.com/1024kbT/my-blog" }],
    sidebar: {
      "/easy-vibe/zh-cn/": easyVibeSidebar,
      "/posts/engineering/": [
        {
          text: "新手入门",
          collapsed: false,
          items: [
            { text: "学习地图", link: "/posts/engineering/ai-building-learning-map" },
            { text: "AI 时代，会说话就会编程", link: "/posts/engineering/ai-era-conversational-programming" },
          ],
        },
        {
          text: "产品原型实战",
          collapsed: false,
          items: [
            { text: "学会 AI 编程工具", link: "/posts/engineering/ai-tools-for-builders" },
            { text: "找到好点子", link: "/posts/engineering/how-to-find-good-ai-product-ideas" },
            { text: "搭建产品原型", link: "/posts/engineering/building-ai-product-prototype" },
            { text: "接入 AI 能力", link: "/posts/engineering/integrating-ai-capabilities-into-product" },
            { text: "完整项目实战", link: "/posts/engineering/complete-ai-project-practice" },
          ],
        },
        {
          text: "附录：业务思维",
          collapsed: false,
          items: [
            { text: "产品思维与方案设计", link: "/posts/engineering/product-thinking-and-solution-design" },
            { text: "AI 行业应用场景参考（B端）", link: "/posts/engineering/b2b-ai-scenario-reference" },
            { text: "AI 消费场景灵感参考（C端）", link: "/posts/engineering/c2c-ai-scenario-reference" },
          ],
        },
        {
          text: "附录：用户研究与需求验证",
          collapsed: false,
          items: [
            { text: "从哪里找点子：3 种最适合新手的参考来源", link: "/posts/engineering/where-to-find-good-ideas" },
            { text: "双钻模型：先做对的事，再把事做对", link: "/posts/engineering/double-diamond-for-ai-validation" },
            { text: "用 Jobs to Be Done 找到用户真正想完成的事", link: "/posts/engineering/jobs-to-be-done-for-ai-products" },
          ],
        },
        {
          text: "延伸阅读",
          collapsed: true,
          items: [
            { text: "零基础入门：从会用到会搭一个 AI 小工具", link: "/posts/engineering/ai-building-stage-1-foundation" },
            { text: "初中级进阶：把 AI Demo 做成真正可用的小产品", link: "/posts/engineering/ai-building-stage-2-productization" },
            { text: "高级开发：从功能实现走向系统设计", link: "/posts/engineering/ai-building-stage-3-advanced-systems" },
            { text: "产品实战：从点子到第一个 AI 产品 Demo", link: "/posts/engineering/ai-building-product-practice" },
            { text: "业务思维：做 AI 应用时到底该想什么", link: "/posts/engineering/ai-building-business-thinking" },
            { text: "附录：AI 应用开发的资料、练习与项目清单", link: "/posts/engineering/ai-building-appendix-resources" },
          ],
        },
      ],
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

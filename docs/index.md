---
layout: home

hero:
  name: 忘西的博客
  text: 记录系统设计、生活观察与长期思考
  tagline: 把零散灵感整理成可检索、可沉淀、可持续更新的个人内容中枢。
  image:
    src: /logo.svg
    alt: 忘西的博客
  actions:
    - theme: brand
      text: 进入专题
      link: /posts/ai-architecture/overall-architecture-layered-design
    - theme: alt
      text: 查看归档
      link: /pages/archives

features:
  - title: 内容中枢
    details: 把文章、笔记、专题与项目沉淀收束到同一个入口，不再四散丢失。
  - title: 持续迭代
    details: 直接用 Markdown 维护内容，新增主题后也能快速补到博客体系里。
  - title: 可扩展发布
    details: 已预留评论、统计与自动部署能力，站点可以继续向更完整的内容产品演进。
---

<div class="home-tech-band">
  <div class="home-tech-band__panel">
    <span class="home-tech-band__label">NOW SIGNAL</span>
    <h2>把博客做成一个会持续生长的知识界面</h2>
    <p>
      这里不只是放文章，而是把技术拆解、架构思考、项目方法和生活随笔整理成能被长期回看的内容系统。
    </p>
  </div>
  <div class="home-tech-band__grid">
    <div class="home-tech-stat">
      <span class="home-tech-stat__label">专题</span>
      <strong>AI 助手架构</strong>
      <p>从总览、核心能力到基础设施，形成一条完整的阅读路径。</p>
    </div>
    <div class="home-tech-stat">
      <span class="home-tech-stat__label">写作方式</span>
      <strong>Markdown First</strong>
      <p>先沉淀内容，再组织展示，减少为排版本身付出的精力。</p>
    </div>
    <div class="home-tech-stat">
      <span class="home-tech-stat__label">当前状态</span>
      <strong>持续补全中</strong>
      <p>一边写、一边整理分类，让博客从展示页变成真正的内容库。</p>
    </div>
  </div>
</div>

## 最新文章

<div class="home-post-grid">
  <a class="home-post-card" href="./posts/ai-architecture/overall-architecture-layered-design">
    <span class="home-post-card__tag">AI 助手总览</span>
    <h3>整体架构与分层设计</h3>
    <p>从终端交互层到基础设施层，快速建立整个系统的认知地图。</p>
  </a>
  <a class="home-post-card" href="./posts/ai-architecture/opencode-technical-architecture-overview">
    <span class="home-post-card__tag">AI 助手总览</span>
    <h3>OpenCode 技术架构文档</h3>
    <p>从数据流、模块划分和系统定位出发，看一套终端 AI 助手如何组成整体。</p>
  </a>
  <a class="home-post-card" href="./posts/ai-core/agent-multi-turn-dialog-engine-design">
    <span class="home-post-card__tag">AI 助手核心能力</span>
    <h3>Agent 多轮对话引擎设计</h3>
    <p>围绕异步执行、事件流与取消机制，拆开终端 Agent 的核心对话引擎。</p>
  </a>
  <a class="home-post-card" href="./posts/ai-core/llm-multi-provider-integration-design">
    <span class="home-post-card__tag">AI 助手核心能力</span>
    <h3>LLM 多提供商集成设计</h3>
    <p>统一抽象不同模型厂商的 API，让切换模型和能力检测都更可控。</p>
  </a>
  <a class="home-post-card" href="./posts/architecture/frontend-architecture-design">
    <span class="home-post-card__tag">架构</span>
    <h3>前端项目架构设计指南</h3>
    <p>结合 Vue 2 + TypeScript 项目，整理分层、目录、类型与工程规范。</p>
  </a>
  <a class="home-post-card" href="./posts/ai/claude-code-architecture-governance-engineering-practice">
    <span class="home-post-card__tag">AI 工程</span>
    <h3>你不知道的 Claude Code：架构、治理与工程实践</h3>
    <p>从上下文、技能、工具、Hook 与子代理出发，梳理 AI 编程代理的工程方法。</p>
  </a>
</div>

## 专题导航

<div class="home-topic-grid">
  <a class="home-topic-card" href="./posts/ai-architecture/overall-architecture-layered-design">
    <span class="home-topic-card__kicker">SERIES 01</span>
    <h3>终端 AI 助手架构</h3>
    <p>适合按顺序阅读，从系统总览一路看到核心能力和基础设施设计。</p>
  </a>
  <a class="home-topic-card" href="./posts/architecture/frontend-architecture-design">
    <span class="home-topic-card__kicker">SERIES 02</span>
    <h3>前端架构与协作</h3>
    <p>聚焦前端项目分层、AI 协作提示词和编码执行准则，偏工程落地。</p>
  </a>
  <a class="home-topic-card" href="./posts/essay/city-night-riding">
    <span class="home-topic-card__kicker">SERIES 03</span>
    <h3>生活与随笔</h3>
    <p>留一点不那么工具化的内容，把感受、节奏和观察也放进这个站点里。</p>
  </a>
</div>

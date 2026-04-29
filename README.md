# 忘西的博客

一个基于 **VitePress** 搭建、部署到 **GitHub Pages** 的个人博客项目。

当前仓库已经完成这些能力：

- VitePress 博客结构
- 首页、归档页、标签页
- Markdown 文章写作
- GitHub Pages 自动部署
- 评论区扩展入口
- 访问统计扩展入口

---

## 1. 本地启动

先安装依赖：

```bash
npm install
```

启动本地开发环境：

```bash
npm run dev
```

本地预览构建结果：

```bash
npm run build
npm run preview
```

---

## 2. 项目结构

```text
.
├── .github/workflows/deploy.yml      # GitHub Pages 自动部署工作流
├── docs
│   ├── .vitepress
│   │   ├── config.mjs                # VitePress 主配置
│   │   └── theme
│   │       ├── components            # 评论区、统计面板等主题扩展组件
│   │       ├── custom.css            # 自定义样式
│   │       ├── index.js              # 主题扩展入口
│   │       └── integrations.js       # 第三方服务配置
│   ├── index.md                      # 首页
│   ├── pages
│   │   ├── archives.md               # 归档页
│   │   └── tags.md                   # 标签页
│   ├── posts                         # 博客文章
│   └── public                        # 静态资源
├── index.html                        # 仓库根入口说明页
└── package.json
```

---

## 3. 如何新增文章

文章统一放在：

```text
docs/posts/
```

当前示例分了两类：

- `docs/posts/essay/`
- `docs/posts/dev/`

你可以直接新增一个 Markdown 文件，例如：

```text
docs/posts/dev/my-first-post.md
```

文章头部推荐这样写：

```md
---
title: 我的第一篇文章
description: 这是一篇示例文章
outline: deep
---

# 我的第一篇文章

正文开始。
```

新增文章后，记得同步更新这些地方：

1. `docs/.vitepress/config.mjs` 里的侧边栏
2. `docs/pages/archives.md`
3. `docs/pages/tags.md`

---

## 4. GitHub Pages 部署

当前仓库使用 **GitHub Actions** 自动部署。

工作流文件：

```text
.github/workflows/deploy.yml
```

只要推送到 `main`，GitHub 就会自动：

1. 安装依赖
2. 构建 VitePress
3. 发布到 GitHub Pages

当前站点使用的是项目仓库部署，因此在 VitePress 配置中设置了：

```js
base: "/my-blog/"
```

对应访问地址：

```text
https://1024kbt.github.io/my-blog/
```

---

## 5. 评论区配置

评论区使用 **Giscus + GitHub Discussions**。

配置文件：

```text
docs/.vitepress/theme/integrations.js
```

需要填写这些字段：

```js
export const giscusConfig = {
  repo: "",
  repoId: "",
  category: "",
  categoryId: "",
  mapping: "pathname",
  strict: false,
  reactionsEnabled: true,
  inputPosition: "top",
  lang: "zh-CN",
};
```

使用前请确认：

1. GitHub 仓库已开启 **Discussions**
2. 已在 Giscus 配置页拿到对应参数

---

## 6. 访问统计配置

访问统计使用 **GoatCounter**。

配置文件同样是：

```text
docs/.vitepress/theme/integrations.js
```

需要填写：

```js
export const goatcounterConfig = {
  code: "",
};
```

例如：

```js
export const goatcounterConfig = {
  code: "my-blog-stats",
};
```

然后在 GoatCounter 后台开启公开访问计数功能。

---

## 7. 当前状态说明

当前仓库已经完成从自定义 Vue 页面到 **VitePress 博客** 的迁移，但有两部分还是“待你填真实配置”：

1. `Giscus` 评论区参数
2. `GoatCounter` 统计参数

如果这些参数不填，站点也能正常运行，只是评论区和统计面板会显示“待配置”提示。

---

## 8. 后续建议

这个仓库下一步比较值得继续做的是：

1. 自动生成归档页和标签页，减少手工维护
2. 批量补文章
3. 首页改成更贴近个人品牌风格
4. 增加文章封面、上一篇/下一篇、阅读时长
5. 增加 RSS 和 sitemap

---

## 9. 常用命令

```bash
npm run dev
npm run build
npm run preview
git add .
git commit -m "update blog"
git push origin main
```

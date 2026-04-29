import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "Astra Flux",
  description: "一个基于 VitePress 的个人博客",
  base: "/my-blog/",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "归档", link: "/pages/archives" },
      { text: "标签", link: "/pages/tags" },
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
            { text: "把个人博客从展示页收成内容系统", link: "/posts/dev/from-showcase-to-content-system" },
            { text: "GitHub Pages + VitePress 的部署踩坑记录", link: "/posts/dev/github-pages-vitepress-notes" },
          ],
        },
      ],
    },
    footer: {
      message: "Astra Flux · 写给长期内容的个人博客",
      copyright: "Copyright © 2026-present 1024kbT",
    },
    outline: {
      level: "deep",
      label: "目录",
    },
  },
});

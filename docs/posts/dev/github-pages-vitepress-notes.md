---
title: GitHub Pages + VitePress 的部署踩坑记录
description: 这次把项目发到 GitHub Pages 时踩到的几个典型问题。
outline: deep
---

# GitHub Pages + VitePress 的部署踩坑记录

把 VitePress 部署到 GitHub Pages 并不难，但有几个点很容易把人绊住。

## 1. base 要和仓库名对齐

如果仓库地址是：

`https://github.com/1024kbT/my-blog.git`

那么站点 `base` 就应该是：

`/my-blog/`

不然静态资源路径会错，最终页面就是一片空白或 404。

## 2. Pages 源要选 GitHub Actions

不是随便开了 Pages 就行。因为这里不是直接发静态根目录，而是先由 GitHub Actions 构建，再把产物发布出去。

## 3. Workflow 配置别假定一定有 lock 文件

如果 workflow 里开了 `cache: npm`，但仓库没有 `package-lock.json`，就很容易直接失败。

所以在这个项目里，先用了更稳的做法：直接 `npm install`，不预设缓存。

## 4. 404 不一定是地址错

很多时候 404 只是因为：

- workflow 失败了
- Pages 还没真正部署成功
- 等待生效还需要几分钟

所以第一件事永远应该先看 `Actions`。

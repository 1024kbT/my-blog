// 统一放第三方集成参数，后面只需要改这里。
export const goatcounterConfig = {
  // 例如：my-blog-stats；对应 https://my-blog-stats.goatcounter.com
  code: "1024kbt",
};

export const trackedPages = [
  { label: "首页", path: "/" },
  { label: "归档", path: "/pages/archives" },
  { label: "标签", path: "/pages/tags" },
  { label: "夜骑", path: "/posts/essay/city-night-riding" },
  { label: "迁移", path: "/posts/dev/from-showcase-to-content-system" },
];

export const giscusConfig = {
  repo: "1024kbt/my-blog",
  repoId: "R_kgDOSPrnUw",
  category: "Announcements",
  categoryId: "DIC_kwDOSPrnU84C786k",
  mapping: "pathname",
  strict: false,
  reactionsEnabled: true,
  inputPosition: "top",
  lang: "zh-CN",
  loading: "lazy",
};

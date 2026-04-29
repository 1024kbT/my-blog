// 统一放第三方集成参数，后面只需要改这里。
export const goatcounterConfig = {
  // 例如：my-blog-stats；对应 https://my-blog-stats.goatcounter.com
  code: "",
};

export const trackedPages = [
  { label: "首页", path: "/" },
  { label: "归档", path: "/pages/archives" },
  { label: "标签", path: "/pages/tags" },
  { label: "夜骑", path: "/posts/essay/city-night-riding" },
  { label: "迁移", path: "/posts/dev/from-showcase-to-content-system" },
];

export const giscusConfig = {
  // 例如：1024kbT/my-blog
  repo: "",
  // 例如：R_kgDOxxxxxx
  repoId: "",
  // 例如：General
  category: "",
  // 例如：DIC_kwDOxxxxxx4Cxxxx
  categoryId: "",
  mapping: "pathname",
  strict: false,
  reactionsEnabled: true,
  inputPosition: "top",
  lang: "zh-CN",
};

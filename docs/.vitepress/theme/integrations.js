// 统一放第三方集成参数，后面只需要改这里。
export const busuanziConfig = {
  // 使用国内常见的不蒜子计数脚本。
  scriptUrl: "//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js",
};

export const trackedPages = [
  { label: "首页", path: "/" },
  { label: "归档", path: "/pages/archives" },
  { label: "标签", path: "/pages/tags" },
  { label: "夜骑", path: "/posts/essay/city-night-riding" },
  { label: "迁移", path: "/posts/dev/from-showcase-to-content-system" },
];

export const twikooConfig = {
  // 例如：https://your-service.netlify.app/.netlify/functions/twikoo
  envId: "",
  // 例如：ap-shanghai；如果你使用腾讯云环境可以按需填写。
  region: "",
  path: "",
  lang: "zh-CN",
  loading: "lazy",
};

// Live2D 配置：
// 使用官方文档里可访问的示例模型源，避免页面长期停在“加载失败”状态。
export const live2dConfig = {
  enabled: true,
  scriptUrl: "https://unpkg.com/oh-my-live2d@latest",
  model: {
    // 当前使用官方示例模型，仅适合本地体验或学习用途。
    path: "https://model.hacxy.cn/HK416-1-normal/model.json",
    scale: 0.08,
    position: [0, 60],
    volume: 0,
    stageStyle: {
      width: 320,
      height: 420,
    },
  },
  mobile: {
    width: 180,
    height: 220,
    scale: 0.06,
    position: [0, 32],
  },
};

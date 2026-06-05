// Live2D 配置：
// 这里先把框架接好，但默认不附带任何“仅供学习”的第三方模型资源。
// 如果你后面有可商用授权的模型，只需要把 enabled 打开并填好 model.path 即可。
export const live2dConfig = {
  enabled: true,
  scriptUrl: "https://unpkg.com/oh-my-live2d@latest",
  model: {
    // 当前使用示例模型，仅适合本地体验或学习用途。
    path: "https://model.oml2d.com/shizuku/shizuku.model.json",
    scale: 0.2,
    position: [70, 70],
    volume: 0,
    stageStyle: {
      width: 400,
      height: 370,
    },
  },
  mobile: {
    width: 220,
    height: 250,
    scale: 0.15,
    position: [36, 36],
  },
};

// Live2D 配置：
// 这里先把框架接好，但默认不附带任何“仅供学习”的第三方模型资源。
// 如果你后面有可商用授权的模型，只需要把 enabled 打开并填好 model.path 即可。
export const live2dConfig = {
  enabled: false,
  scriptUrl: "https://unpkg.com/oh-my-live2d@latest",
  model: {
    path: "",
    scale: 0.18,
    position: [0, 20],
    volume: 0,
    stageStyle: {
      width: 280,
      height: 320,
    },
  },
  mobile: {
    width: 180,
    height: 220,
    scale: 0.14,
    position: [0, 0],
  },
};

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// GitHub Pages 下如果使用用户/仓库路径，这里可以按需改成仓库名。
export default defineConfig({
  plugins: [vue()],
});

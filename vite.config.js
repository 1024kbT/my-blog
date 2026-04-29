import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// GitHub Pages 项目仓库部署时，需要把 base 设为仓库名路径。
export default defineConfig({
  base: "/my-blog/",
  plugins: [vue()],
});

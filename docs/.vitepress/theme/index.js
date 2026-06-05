import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import "./custom.css";
import CommentsPanel from "./components/CommentsPanel.vue";
import FloatingAssistant from "./components/FloatingAssistant.vue";
import TrafficPanel from "./components/TrafficPanel.vue";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "doc-after": () => [h(TrafficPanel), h(CommentsPanel)],
      "layout-bottom": () => h(FloatingAssistant),
    });
  },
};

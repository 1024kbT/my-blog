import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import "./custom.css";
import ChapterGuide from "./components/ChapterGuide.vue";
import CommentsPanel from "./components/CommentsPanel.vue";
import Live2DWidget from "./components/Live2DWidget.vue";
import SiteOverviewPanel from "./components/SiteOverviewPanel.vue";
import TrafficPanel from "./components/TrafficPanel.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("ChapterGuide", ChapterGuide);
  },
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "aside-outline-before": () => h(SiteOverviewPanel),
      "doc-after": () => [h(TrafficPanel), h(CommentsPanel)],
      "layout-bottom": () => h(Live2DWidget),
    });
  },
};

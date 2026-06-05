import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import "./custom.css";
import CommentsPanel from "./components/CommentsPanel.vue";
import Live2DWidget from "./components/Live2DWidget.vue";
import SiteOverviewPanel from "./components/SiteOverviewPanel.vue";
import TrafficPanel from "./components/TrafficPanel.vue";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "aside-outline-before": () => h(SiteOverviewPanel),
      "doc-after": () => [h(TrafficPanel), h(CommentsPanel)],
      "layout-bottom": () => h(Live2DWidget),
    });
  },
};

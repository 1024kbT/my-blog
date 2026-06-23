import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import "./custom.css";
import AppendixFlowMap from "./components/AppendixFlowMap.vue";
import ChapterIntroduction from "./components/ChapterIntroduction.vue";
import ChapterGuide from "./components/ChapterGuide.vue";
import CommentsPanel from "./components/CommentsPanel.vue";
import Live2DWidget from "./components/Live2DWidget.vue";
import NavCard from "./components/NavCard.vue";
import NavGrid from "./components/NavGrid.vue";
import RelatedArticlesSection from "./components/RelatedArticlesSection.vue";
import SiteOverviewPanel from "./components/SiteOverviewPanel.vue";
import StepBar from "./components/StepBar.vue";
import TabItem from "./components/TabItem.vue";
import Tabs from "./components/Tabs.vue";
import TrafficPanel from "./components/TrafficPanel.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("AppendixFlowMap", AppendixFlowMap);
    app.component("ChapterIntroduction", ChapterIntroduction);
    app.component("ChapterGuide", ChapterGuide);
    app.component("NavCard", NavCard);
    app.component("NavGrid", NavGrid);
    app.component("RelatedArticlesSection", RelatedArticlesSection);
    app.component("StepBar", StepBar);
    app.component("TabItem", TabItem);
    app.component("Tabs", Tabs);
  },
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "aside-outline-before": () => h(SiteOverviewPanel),
      "doc-after": () => [h(TrafficPanel), h(CommentsPanel)],
      "layout-bottom": () => h(Live2DWidget),
    });
  },
};

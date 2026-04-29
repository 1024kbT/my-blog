---
title: 前端项目架构设计指南
description: 围绕 Vue 2 + TypeScript + class 风格的前端项目架构分层、目录设计与工程规范整理。
outline: deep
---

# 前端项目架构设计指南

> 技术栈：**Vue 2 + TypeScript + vue-property-decorator**  
> 适用场景：公司统一底座，中大型业务子应用。

---

## 一、整体架构分层

```
┌──────────────────────────────────────────────┐
│              视图层 View（.vue）               │
│   Template 渲染 + 用户交互 + 生命周期调度      │
├──────────────────────────────────────────────┤
│           逻辑封装层 Class / Mixin             │
│   数据处理 Class + 通用行为 Mixin              │
├──────────────────────────────────────────────┤
│           服务层 Service（接口调用）            │
│   统一 Promise 化封装 + 参数/返回值类型定义     │
├──────────────────────────────────────────────┤
│           工具层 Utils / Config               │
│   纯函数 + 常量 + 全局类型声明                 │
└──────────────────────────────────────────────┘
```

**原则：上层依赖下层，禁止下层反向引用上层。视图层不写业务逻辑，逻辑层不引用 Vue 实例。**

---

## 二、目录结构

```
src/
├── assets/                   # 静态资源（图片/字体/图标）
│   └── img/
├── class/                    # 数据处理 Class（不依赖 Vue）
│   ├── TztGet.ts             #   行情/资讯数据获取与解析
│   └── BaseService.ts        #   基类（公共 Promise 封装）
├── components/               # 组件库
│   ├── common/               #   通用无业务组件（跨项目复用）
│   │   ├── BaseCard/
│   │   │   ├── index.vue
│   │   │   └── types.ts
│   │   └── BaseList/
│   └── business/             #   业务组件（含业务逻辑，项目内复用）
│       ├── CardItem/
│       └── StockTag/
├── composables/              # 逻辑复用（函数式，不依赖 Vue 实例）
│   └── useTimeLine.ts        #   时间轴相关逻辑
├── mixins/                   # Mixin（仅限通用 UI 行为）
│   └── LoadingMixin.ts
├── router/                   # 路由
│   ├── index.ts
│   └── guards.ts             #   路由守卫
├── store/                    # Vuex 状态管理（按模块拆分）
│   ├── index.ts
│   └── modules/
│       └── user.ts
├── styles/                   # 全局样式
│   ├── variables.less        #   Less 变量
│   ├── mixin.less            #   Less Mixin
│   └── global.less           #   全局基础样式
├── types/                    # TypeScript 类型
│   ├── global.d.ts           #   window 全局变量声明
│   ├── api.d.ts              #   接口返回值类型
│   └── components.d.ts       #   组件 Props 类型
├── utils/                    # 纯函数工具（无副作用）
│   ├── format.ts             #   数据格式化
│   ├── ItemConfig.ts         #   配置驱动映射表
│   └── validate.ts           #   校验函数
└── views/                    # 页面（与路由一一对应）
    └── home/
        ├── index.vue         #   页面入口（只做调度）
        ├── components/       #   页面私有组件
        └── hooks/            #   页面私有逻辑
```

---

## 三、Class Component 编写规范

### 3.1 类内成员顺序（必须遵守）

```typescript
import {
  Component,
  Vue,
  Prop,
  Watch,
  Emit,
  Mixins,
} from "vue-property-decorator";
import { Action, State } from "vuex-class";

@Component({ components: { ChildComp } })
export default class MyComponent extends Vue {
  // ① @Prop —— 外部输入，声明类型与默认值
  @Prop({ type: String, required: true }) title!: string;
  @Prop({ type: Array, default: () => [] }) items!: Item[];

  // ② @State / @Action（Vuex，如有）
  @State("userInfo") userInfo!: UserInfo;

  // ③ 本地响应式数据
  private loading: boolean = false;
  private listData: CardItem[] = [];

  // ④ 生命周期（按执行顺序）
  created() {}
  mounted() {}
  beforeDestroy() {}

  // ⑤ 计算属性
  get filteredList(): CardItem[] {
    return this.listData.filter((item) => item.visible);
  }

  // ⑥ @Watch
  @Watch("title", { immediate: true })
  onTitleChange(val: string) {}

  // ⑦ @Emit
  @Emit("change")
  handleChange(value: string) {
    return value; // 返回值即为 emit 的 payload
  }

  // ⑧ 私有方法（内部逻辑）
  private formatData(raw: any[]): CardItem[] {
    return [];
  }

  // ⑨ 公有方法（供父组件 $ref 调用）
  public refresh() {}
}
```

### 3.2 Prop 规范

```typescript
// ✅ 必须：类型 + 默认值或 required + ! 非空断言
@Prop({ type: Number, required: true }) id!: number;
@Prop({ type: Object, default: () => ({}) }) config!: ChartConfig;

// ✅ 数组默认值必须用工厂函数
@Prop({ type: Array, default: () => [] }) list!: Item[];

// ❌ 禁止：无类型声明
@Prop() data: any;

// ❌ 禁止：在子组件内修改 Prop（单向数据流）
this.config.title = "xxx"; // 应 $emit 通知父组件修改
```

### 3.3 Watch 规范

```typescript
// ✅ 监听对象需声明 deep: true
@Watch("formData", { deep: true })
onFormDataChange(val: FormData) {
  this.validate(val);
}

// ✅ 高频触发场景使用防抖，并在 beforeDestroy 取消
private doSearch = _.debounce(async (keyword: string) => {
  this.list = await this.service.search(keyword);
}, 300);

@Watch("keyword")
onKeywordChange(val: string) {
  this.doSearch(val);
}

beforeDestroy() {
  this.doSearch.cancel();
}

// ❌ 禁止：在 Watch 里直接 await 请求而不处理竞态
@Watch("id")
async onIdChange(val: string) {
  this.data = await fetch(val); // 快速切换 id 时结果乱序
}
```

---

## 四、逻辑封装模块化

### 4.1 数据处理 Class（核心：与 Vue 解耦）

将**数据获取、参数构造、返回值解析**从组件中抽离，放入独立 Class。  
Class 不持有 Vue 实例，可单独测试，可跨组件复用。

```typescript
// class/TztGet.ts
export class TztGet {
  // 统一入口，Promise 化回调式 SDK
  getData(param: ApiParam): Promise<any> {
    const win = window as any;
    const api = param.isFuncHQ
      ? win.funcHQ
      : param.isFuncZX
      ? win.funcZX
      : win.funcJY;
    if (!api) return Promise.reject(new Error("api not found"));

    return new Promise((resolve, reject) => {
      api.getData(
        param,
        (data: any) =>
          resolve(
            param.isParse ? data : this["get" + param.action](data, param),
          ),
        (err: any) => reject(err),
      );
    });
  }

  // 每个 action 对应独立解析方法，命名：get + action 编号
  // 内部用 any 吸收 SDK 原始数据，对外暴露强类型返回值
  get50172(data: any, param: ApiParam): ListResult {
    /* ... */
  }
  get51613(data: any, param: ApiParam): MarketResult {
    /* ... */
  }
  get50037(data: any, param: ApiParam): TradeResult {
    /* ... */
  }

  // 提取公共逻辑为私有方法，消除重复
  private resolveMarket(marketNo: string): string {
    return (window as any).MarketParse.stockThree.hqversion === "3.0"
      ? marketDict[marketNo].market3
      : marketNo;
  }
}
```

**组件中使用（组件只负责调度，不写解析逻辑）：**

```typescript
@Component
export default class MyPage extends Vue {
  private tztGet = new TztGet();
  private listData: CardItem[] = [];
  private loading = false;

  private async fetchData() {
    this.loading = true;
    try {
      const result = await this.tztGet.getData({
        action: "50172",
        isFuncZX: true,
      });
      this.listData = result.list;
    } catch (err) {
      console.error("[fetchData]", err);
    } finally {
      this.loading = false;
    }
  }
}
```

### 4.2 Mixin（仅用于通用 UI 行为）

```typescript
// mixins/LoadingMixin.ts
@Component
export class LoadingMixin extends Vue {
  protected loading = false;

  protected async withLoading<T>(fn: () => Promise<T>): Promise<T | undefined> {
    this.loading = true;
    try {
      return await fn();
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}

// 使用
@Component
export default class MyPage extends Mixins(LoadingMixin) {
  private tztGet = new TztGet();

  async fetchData() {
    await this.withLoading(() =>
      this.tztGet.getData({ action: "50172", isFuncZX: true }),
    );
  }
}
```

**Mixin 使用原则：**

```
✅ 适合：loading 状态、页面曝光埋点、滚动监听等通用 UI 行为
❌ 不适合：包含接口调用、业务数据处理（放 Class）
❌ 不适合：同一组件混入超过 2 个 Mixin（来源不透明）
```

### 4.3 配置驱动渲染（替代 if-else 链）

```typescript
// utils/ItemConfig.ts —— 将分支逻辑映射表化
export const configKeyMap: Record<string, CardConfig> = {
  热点日历: {
    component: "text",
    icon: require("@/assets/img/rmbk.png"),
    isShowTime: true,
  },
  龙虎榜: {
    component: "text",
    icon: require("@/assets/img/lhb.png"),
    isShowTime: false,
  },
  大宗交易: {
    component: "card",
    icon: require("@/assets/img/dzjy.png"),
    isShowTime: true,
  },
  投资日历: {
    component: "text",
    icon: require("@/assets/img/tzrl.png"),
    isShowTime: true,
  },
};

// 组件中：O(1) 查表，无分支
const { component, icon, isShowTime } = configKeyMap[name];

// ❌ 不推荐
if (name === "热点日历") {
  component = "text";
} else if (name === "龙虎榜") {
  component = "text";
} else if (name === "大宗交易") {
  component = "card";
}
```

### 4.4 工具函数（纯函数，零副作用）

```typescript
// utils/format.ts
// ✅ 相同输入永远返回相同输出，不依赖外部状态，不发请求，不操作 DOM
export function formatTradeTime(tradeTime: string): string {
  const t = TZT.styleTime();
  return t.getYTD(t.dayChange(tradeTime)).split("年")[1];
}

export function formatAmount(num: number): string {
  return (num / 10000).toFixed(2) + "万";
}

// ❌ 工具函数内部混入接口调用（职责混乱，不可复用）
export async function fetchAndFormat(id: string) {
  const data = await axios.get("/api/" + id);
  return format(data);
}
```

---

## 五、类型系统规范

### 5.1 全局变量类型声明

```typescript
// types/global.d.ts —— 集中声明所有挂在 window 上的 SDK
declare const TZT: {
  styleTime(): TimeUtil;
};
declare const T: {
  readFileMesg(key: string, cb: (data: string | null) => void): void;
};

declare global {
  interface Window {
    MarketParse: {
      CommonStock: new (code: string, market: string) => MarketInstance;
      stockThree: { hqversion: "2.0" | "3.0" };
      PlateType: new () => PlateTypeInstance;
    };
    funcHQ: TztApiInstance;
    funcZX: TztApiInstance;
    funcJY: TztApiInstance;
  }
}
```

### 5.2 接口类型定义

```typescript
// types/api.d.ts

interface ApiParam {
  action: string | number;
  isFuncHQ?: boolean;
  isFuncZX?: boolean;
  isFuncJY?: boolean;
  isParse?: boolean;
  [key: string]: any;
}

interface CardItem {
  name: string;
  cardName: string;
  time: string;
  value: string;
  component: "text" | "stock" | "card";
  icon: string;
  linkUrl: string;
  slotDom?: string;
  cardData?: StockRef[];
}

interface StockRef {
  stockCode: string;
  stockName: string;
  market: string;
  chgPct?: string;
  colorType?: string;
}

interface ListResult {
  action: string;
  list: Record<number, CardItem[]>;
  tradeTime: string;
  stockNameMap: Map<string, StockRef[]>;
}
```

### 5.3 严禁滥用 any

```typescript
// ❌ 禁止：对外暴露 any 类型
get50172(data: any, param: any): any { /* ... */ }

// ✅ Class 层内部吸收 any，对外方法有强类型签名
get50172(data: any, param: ApiParam): ListResult {
  // 内部解析时可用 any，但返回值必须是 ListResult
  const grid = data.GRID0 as string[];
  return { list: {}, tradeTime: "", stockNameMap: new Map() };
}

// ✅ 调用方完全感知类型，无需猜测
const result: ListResult = await this.tztGet.getData({ action: "50172" });
```

---

## 六、组件设计规范

### 6.1 三类组件职责划分

```
通用组件  components/common/
  ├── 不含任何业务逻辑
  ├── 只接收 Props 渲染，数据完全由外部控制
  ├── 可跨项目复用
  └── 示例：BaseCard、BaseList、BaseEmpty

业务组件  components/business/
  ├── 含业务展示逻辑（如涨跌色、链接格式）
  ├── 不发起接口请求，数据通过 Props 传入
  ├── 项目内跨页面复用
  └── 示例：StockTag（带涨跌色个股标签）、CardItem（卡片渲染）

页面组件  views/xxx/index.vue
  ├── 对应路由，负责数据调度（发请求 + 分发数据给子组件）
  ├── 不写 HTML 业务结构（拆成子组件）
  ├── 不写数据解析逻辑（放 Class）
  └── 示例：views/home/index.vue
```

### 6.2 组件通信原则

```
父 → 子：Props（子组件不直接修改 Prop 值）
子 → 父：@Emit（明确事件名与 payload 类型）
兄弟通信：通过父组件中转，或 Vuex（复杂场景）
跨层级：Vuex（全局共享）/ provide+inject（局部共享）

❌ 禁止：用 EventBus 传递业务数据（难以追踪，易内存泄漏）
✅ EventBus 仅用于：全局主题切换等纯 UI 广播事件
```

### 6.3 内存泄漏防范（beforeDestroy 必检项）

```typescript
@Component
export default class MyPage extends Vue {
  // ① 定时器
  private timer: ReturnType<typeof setInterval> | null = null;
  mounted() {
    this.timer = setInterval(this.poll, 5000);
  }
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ② EventBus 订阅（必须传同一个函数引用）
  mounted() {
    EventBus.$on("theme", this.onTheme);
  }
  beforeDestroy() {
    EventBus.$off("theme", this.onTheme);
  }

  // ③ 第三方库实例（ECharts、BetterScroll 等）
  private chart: echarts.ECharts | null = null;
  mounted() {
    this.chart = echarts.init(this.$el as HTMLElement);
  }
  beforeDestroy() {
    this.chart?.dispose();
    this.chart = null;
  }

  // ④ Lodash 防抖/节流
  private doSearch = _.debounce(this.search, 300);
  beforeDestroy() {
    this.doSearch.cancel();
  }
}
```

---

## 七、状态管理规范（Vuex）

### 7.1 状态归属判断

```
本地 data                      ← 只本组件使用的 UI 状态
provide / inject               ← 同一页面组件树内共享
Vuex module                    ← 多个不相关页面共享，或需持久化
```

### 7.2 Module 结构

```typescript
// store/modules/user.ts
interface UserState {
  info: UserInfo | null;
}

const state: UserState = { info: null };

const mutations = {
  SET_USER(state: UserState, user: UserInfo) {
    state.info = user;
  },
};

const actions = {
  async fetchUser({ commit }, id: string) {
    const data = await getUserInfo(id);
    commit("SET_USER", data);
  },
};

// 组件中用装饰器访问
@State((s: RootState) => s.user.info) userInfo!: UserInfo | null;
@Action("user/fetchUser") fetchUser!: (id: string) => Promise<void>;
```

---

## 八、样式规范

### 8.1 Less 变量集中管理

```less
// styles/variables.less —— 所有颜色、字号从这里取，禁止硬编码
@color-up: #f91d1d; // 涨
@color-down: #00b388; // 跌
@color-dark: #1a1a1a;
@color-grey: #9199a6;
@color-bg: #f7f8fa;

@font-sm: 22px;
@font-base: 26px;
@font-lg: 30px;
@font-xl: 32px;

@radius-base: 20px;
@radius-card: 24px;
```

### 8.2 BEM 命名

```less
// Block__Element--Modifier
.card-item                       // Block
.card-item__title                // Element
.card-item__title--highlight     // Modifier

// <style scoped lang="less">
.card-item {
  &__header {
    height: 80px;
  }
  &__body {
    padding: 20px;
  }
  &--active {
    border: 2px solid @color-up;
  }
}
```

### 8.3 暗色主题

```less
// 统一在根节点 data-theme 属性下覆盖，不散落在各组件内
html[data-theme="black-theme"] {
  .card-item {
    background: #000;
  }
  .card-item__title {
    color: #fff;
  }
  .card-item--active {
    border-color: @color-up;
  }
}
```

---

## 九、代码质量规范

### 9.1 命名约定

```
文件/目录         kebab-case            card-list-item.vue
Class / 组件      PascalCase            CardListItem
函数 / 变量       camelCase             getStockData()
私有成员          private 修饰符         private listData = []
常量              UPPER_SNAKE_CASE      MAX_RETRY_COUNT
接口/类型         PascalCase            interface CardItem {}
CSS class         BEM                   .card-item__title--active
```

### 9.2 ESLint 关键规则

```json
{
  "rules": {
    "eqeqeq": ["error", "always"],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### 9.3 禁止事项清单

```
❌ 组件内直接写接口调用（应在 Class 层）
❌ 模板中写复杂表达式（抽成计算属性）
❌ 使用 == 宽松比较（必须 ===）
❌ 忘记在 beforeDestroy 清除定时器 / 事件监听 / 第三方库实例
❌ 在子组件内直接修改 Prop 对象属性
❌ 无类型的 @Prop() data: any
❌ 注释死代码长期保留（用 git 管理历史）
❌ console.log 遗留在提交代码中
❌ switch/case 中使用 const 而不加块级作用域 {}
❌ 用 .map() 替代 .forEach() 做纯副作用操作（无返回值场景）
```

---

## 十、工程化规范

### 10.1 Git Commit 规范

```
格式：<type>(<scope>): <subject>

type:
  feat      新功能
  fix       Bug 修复
  refactor  重构（不增加功能，不修复 bug）
  style     代码格式调整（不影响逻辑）
  perf      性能优化
  chore     构建 / 依赖 / 工具链
  docs      文档更新

示例：
feat(card): 新增热门板块卡片组件
fix(tztget): 修复 get50152 数组越界导致返回 undefined 的问题
refactor(class): 提取 resolveMarket 方法消除重复三元表达式
```

### 10.2 分支策略

```
main            ← 生产分支，只接受 PR 合并，禁止直接 push
develop         ← 集成测试分支
feature/xxx     ← 功能开发，从 develop 切出，完成后 PR 回 develop
fix/xxx         ← Bug 修复
release/x.x.x  ← 发版准备，冻结功能只修 Bug
```

### 10.3 Code Review 检查清单

```
□ @Prop 是否有完整类型声明和默认值
□ 是否有遗留 console.log
□ 异步操作是否处理了 loading / error 状态
□ beforeDestroy 是否清除了定时器和事件监听
□ 列表渲染是否绑定了稳定的 :key
□ 是否有 == 宽松比较（应为 ===）
□ Class 解析方法是否有强类型返回值
□ switch case 中有 const 声明时是否加了 {} 块作用域
□ 新增 npm 依赖是否评审了包大小影响
□ 业务逻辑是否写在了组件模板表达式中（应抽计算属性）
```

---

## 十一、新业务模块接入规范

新增一个业务模块，按以下固定顺序完成，每层只做自己的事：

```
步骤 1  types/api.d.ts         定义接口入参和返回值类型
步骤 2  class/XxxGet.ts        实现数据获取和解析方法（Promise 化）
步骤 3  utils/XxxConfig.ts     定义配置映射表（有多分支逻辑时）
步骤 4  components/business/   实现业务展示组件（只接收 Props）
步骤 5  views/xxx/index.vue    页面入口，调度数据，分发给子组件
步骤 6  router/index.ts        注册路由（懒加载）
```

**验收标准：页面组件里不出现解析逻辑，Class 里不出现 Vue 实例引用。**

---

> **核心理念：模块化不是拆文件，是拆职责。**  
> 每个 Class 只负责一类数据的获取与解析；每个组件只负责一个 UI 单元的展示；每个 utils 函数只做一件纯粹的事。职责清晰了，协作、排查、复用才能真正高效。

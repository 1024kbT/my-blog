---
title: 应用编排层 (App) 设计
description: 围绕服务初始化、生命周期管理与模块协调整理应用编排层设计。
outline: deep
---

# 应用编排层 (App) 设计

基于 OpenCode 项目，梳理如何协调和管理各个服务模块，构建系统的"中枢神经"。

---

## 1. 设计目标

- **服务协调**：统一管理会话、消息、Agent、权限等模块的生命周期
- **初始化编排**：按正确顺序初始化所有依赖服务
- **优雅关闭**：确保资源释放、连接断开、数据保存
- **模块解耦**：通过接口和事件总线降低模块间耦合

---

## 2. App 结构

App 是系统的核心协调者，持有所有服务的引用：

```go
type App struct {
    Sessions    session.Service    // 会话管理服务
    Messages    message.Service    // 消息管理服务
    History     history.Service    // 文件变更历史服务
    Permissions permission.Service // 权限管理服务
    CoderAgent  agent.Service      // 编码 Agent（核心 AI）
    LSPClients  map[string]*lsp.Client  // LSP 客户端映射（语言 -> 客户端）
}
```

**设计意图**

- 单一入口持有所有服务，便于上层（TUI/CLI）调用
- 服务通过接口抽象，便于 Mock 和测试
- App 本身不实现业务逻辑，只负责协调和转发

---

## 3. 初始化流程

### 3.1 启动顺序

```
1. 解析命令行参数
   ↓
2. 加载配置（全局 + 本地）
   ↓
3. 连接数据库（SQLite）
   - 自动执行迁移（goose）
   ↓
4. 创建 App 实例
   - 初始化各个 Service
   - 创建 Agent（注入工具列表）
   - 初始化 LSP 客户端
   ↓
5. 初始化 MCP 工具（异步）
   ↓
6. 启动 TUI 或执行非交互模式
```

### 3.2 服务创建顺序

```go
func New(ctx context.Context, conn *sql.DB) (*App, error) {
    // 1. 创建数据库查询器（sqlc 生成）
    querier := db.New(conn)
    
    // 2. 创建基础服务（无依赖或依赖简单）
    sessions := session.NewService(querier)
    messages := message.NewService(querier)
    history := history.NewService(querier)
    permissions := permission.NewService()
    
    // 3. 创建 Agent（依赖 sessions、messages）
    coderAgent, err := agent.NewAgent(
        config.AgentCoder,
        sessions,
        messages,
        tools.GetAllTools(),  // 注入所有工具
    )
    
    // 4. 创建 App
    app := &App{
        Sessions:    sessions,
        Messages:    messages,
        History:     history,
        Permissions: permissions,
        CoderAgent:  coderAgent,
        LSPClients:  make(map[string]*lsp.Client),
    }
    
    // 5. 初始化 LSP（异步）
    app.initLSP(ctx)
    
    return app, nil
}
```

**设计要点**

- 基础服务先创建（数据库、会话、消息）
- Agent 依赖基础服务，后创建
- LSP 和 MCP 初始化耗时较长，异步执行

---

## 4. 核心职责

### 4.1 服务协调

App 作为上层（TUI/CLI）与下层服务之间的桥梁：

```
TUI 请求创建会话
  ↓
App.Sessions.Create()
  ↓
返回 Session 对象

TUI 请求发送消息
  ↓
App.CoderAgent.Run(sessionID, content)
  ↓
启动异步对话流程
  ↓
通过事件总线推送结果到 TUI
```

### 4.2 非交互模式执行

App 提供非交互模式的统一入口：

```go
func (app *App) RunNonInteractive(ctx context.Context, prompt, outputFormat string, quiet bool) error {
    // 1. 创建临时会话
    session, _ := app.Sessions.Create(ctx, "Non-interactive")
    
    // 2. 运行 Agent（阻塞等待结果）
    events, _ := app.CoderAgent.Run(ctx, session.ID, prompt)
    
    // 3. 消费事件流
    for event := range events {
        if event.Type == AgentEventTypeResponse {
            // 4. 按格式输出
            if outputFormat == "json" {
                printJSON(event.Message)
            } else {
                printText(event.Message)
            }
        }
    }
    
    return nil
}
```

**特点**
- 自动创建临时会话
- 自动批准所有权限（适合脚本化）
- 支持文本/JSON 两种输出格式
- 支持静默模式（无加载动画）

### 4.3 优雅关闭

App 负责资源清理：

```go
func (app *App) Shutdown() {
    // 1. 关闭 LSP 客户端
    for _, client := range app.LSPClients {
        client.Close()
    }
    
    // 2. 关闭文件 watcher
    if app.fileWatcher != nil {
        app.fileWatcher.Close()
    }
    
    // 3. 其他清理...
}
```

---

## 5. 事件订阅管理

App 负责建立服务到 TUI 的事件转发通道：

```go
func setupSubscriptions(app *App, ctx context.Context) (chan tea.Msg, func()) {
    ch := make(chan tea.Msg, 100)  // 缓冲 channel
    
    // 订阅各类事件，转发到 TUI
    setupSubscriber(ctx, "logging", logging.Subscribe, ch)
    setupSubscriber(ctx, "sessions", app.Sessions.Subscribe, ch)
    setupSubscriber(ctx, "messages", app.Messages.Subscribe, ch)
    setupSubscriber(ctx, "permissions", app.Permissions.Subscribe, ch)
    setupSubscriber(ctx, "coderAgent", app.CoderAgent.Subscribe, ch)
    
    // 返回清理函数
    cleanup := func() {
        cancel()           // 取消所有订阅
        waitForCleanup()   // 等待 goroutine 结束
        close(ch)          // 关闭 channel
    }
    
    return ch, cleanup
}
```

**设计要点**

- 每个服务都是事件发布者（通过 pubsub.Broker）
- App 将各服务的事件统一转发到 TUI
- 使用缓冲 channel 防止阻塞
- 支持超时丢弃（慢消费者保护）

---

## 6. LSP 客户端管理

App 负责语言服务器的生命周期：

### 6.1 初始化

```go
func (app *App) initLSP(ctx context.Context) {
    cfg := config.Get()
    for lang, lspConfig := range cfg.LSP {
        if lspConfig.Disabled {
            continue
        }
        // 启动语言服务器进程
        client := lsp.NewClient(lspConfig.Command, lspConfig.Args...)
        app.LSPClients[lang] = client
    }
}
```

### 6.2 文件变更通知

当 AI 修改文件后，App 通知对应的语言服务器：

```go
func (app *App) notifyFileChanged(path string) {
    // 根据文件扩展名确定语言
    lang := detectLanguage(path)
    if client, ok := app.LSPClients[lang]; ok {
        client.DidChange(path)
    }
}
```

### 6.3 诊断信息获取

AI 可通过 diagnostics 工具获取代码错误：

```go
func (app *App) GetDiagnostics(path string) ([]Diagnostic, error) {
    lang := detectLanguage(path)
    if client, ok := app.LSPClients[lang]; ok {
        return client.GetDiagnostics(path)
    }
    return nil, fmt.Errorf("no LSP client for %s", lang)
}
```

---

## 7. 模块间关系图

```
                    ┌─────────────┐
                    │   TUI / CLI │
                    └──────┬──────┘
                           │ 调用
                    ┌──────▼──────┐
                    │     App     │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
   │Sessions │      │ Messages  │     │Permissions│
   └────┬────┘      └─────┬─────┘     └─────┬─────┘
        │                 │                 │
        │            ┌────▼────┐           │
        └───────────►│  Agent  │◄──────────┘
                     └────┬────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
         ┌────▼────┐ ┌───▼────┐ ┌───▼────┐
         │Provider │ │ Tools  │ │ LSP    │
         └─────────┘ └────────┘ └────────┘
```

**关系说明**

- App 持有所有服务的引用，协调它们之间的交互
- Sessions 和 Messages 是数据层，提供 CRUD 和事件通知
- Agent 是业务核心，依赖 Sessions、Messages 和 Tools
- Permissions 被 Agent 调用，用于工具执行前的权限检查
- Provider 被 Agent 调用，与 LLM API 通信
- LSP 被 Tools（diagnostics）和 App 调用，提供代码智能

---

## 8. 设计亮点

| 设计点 | 说明 |
|--------|------|
| **单一协调者** | App 作为中心节点，简化上层调用 |
| **接口抽象** | 所有服务通过接口定义，便于测试和替换 |
| **顺序初始化** | 按依赖关系有序创建服务，避免初始化错误 |
| **异步 LSP/MCP** | 耗时操作异步初始化，不阻塞主流程 |
| **事件转发** | 统一将各服务事件转发到 TUI，解耦模块 |
| **优雅关闭** | 确保资源释放，避免数据丢失 |

---

## 9. 一句话概括

OpenCode 的应用编排层 = **"系统的'中枢神经'，负责初始化、协调、连接所有模块，让各个服务像一个有机整体一样协同工作"**。

它不实现具体业务逻辑，而是让业务逻辑得以顺畅运行的"舞台管理者"。

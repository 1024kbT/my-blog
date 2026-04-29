---
title: CLI 入口层设计
description: 梳理终端 AI 助手在命令行入口、模式路由与启动流程上的设计思路。
outline: deep
---

# CLI 入口层设计

基于 OpenCode 项目，梳理命令行界面的入口设计和模式路由策略。

---

## 1. 设计目标

- **双模式支持**：同时支持交互式 TUI 和非交互式 CLI
- **参数解析**：支持 debug、工作目录、模型选择等配置
- **快速启动**：最小化启动时间，及时进入主流程
- **优雅退出**：确保资源释放，数据不丢失

---

## 2. 支持的运行模式

### 2.1 交互模式（默认）

启动完整的终端用户界面：

```bash
opencode              # 启动 TUI
opencode -d           # 启动 TUI + Debug 日志
opencode -c /path     # 在指定目录启动
```

**适用场景**：日常开发辅助，需要与 AI 进行多轮对话。

### 2.2 非交互模式

命令行直接传入提示词，执行后退出：

```bash
opencode -p "解释这段代码"                    # 文本输出
opencode -p "解释这段代码" -f json           # JSON 输出
opencode -p "解释这段代码" -q                # 静默模式（无动画）
```

**适用场景**：脚本化使用、CI/CD 集成、快速获取答案。

### 2.3 版本查询

```bash
opencode -v           # 打印版本号并退出
```

---

## 3. 命令行参数设计

| 参数 | 短参 | 说明 | 默认值 |
|------|------|------|--------|
| `--debug` | `-d` | 启用 Debug 日志 | false |
| `--cwd` | `-c` | 设置工作目录 | 当前目录 |
| `--prompt` | `-p` | 非交互模式提示词 | "" |
| `--output-format` | `-f` | 输出格式（text/json） | text |
| `--quiet` | `-q` | 静默模式（无加载动画） | false |
| `--version` | `-v` | 显示版本 | false |
| `--help` | `-h` | 显示帮助 | false |

---

## 4. 启动流程

### 4.1 整体流程

```
1. 解析命令行参数
   ↓
2. 如果 --help → 打印帮助信息并退出
   如果 --version → 打印版本并退出
   ↓
3. 加载配置
   - 全局配置（~/.config/opencode/.opencode.json）
   - 本地配置（工作目录/.opencode.json）
   - 环境变量覆盖
   ↓
4. 连接数据库
   - SQLite 连接
   - 自动执行迁移（goose）
   ↓
5. 创建 App 实例
   - 初始化所有服务
   - 创建 Agent（注入工具）
   - 启动 LSP 客户端
   ↓
6. 如果 --prompt → 执行非交互模式
   否则 → 启动 TUI 交互模式
   ↓
7. 清理资源并退出
```

### 4.2 初始化顺序的重要性

```
配置加载  →  数据库连接  →  App 初始化  →  模式路由
    ↑                              ↑
   必须先确定工作目录          必须先完成所有依赖
```

**原因**
- 配置加载需要知道工作目录（加载本地配置）
- App 初始化需要数据库连接（创建服务）
- 模式路由需要 App 就绪（执行对话）

---

## 5. 模式路由逻辑

### 5.1 路由判断

```go
func run(cmd *cobra.Command, args []string) error {
    // 1. 解析参数
    debug, _ := cmd.Flags().GetBool("debug")
    cwd, _ := cmd.Flags().GetString("cwd")
    prompt, _ := cmd.Flags().GetString("prompt")
    outputFormat, _ := cmd.Flags().GetString("output-format")
    quiet, _ := cmd.Flags().GetBool("quiet")
    
    // 2. 切换工作目录
    if cwd != "" {
        os.Chdir(cwd)
    }
    
    // 3. 加载配置
    config.Load(cwd, debug)
    
    // 4. 连接数据库
    conn, _ := db.Connect()
    
    // 5. 创建 App
    app, _ := app.New(ctx, conn)
    defer app.Shutdown()
    
    // 6. 初始化 MCP（异步）
    initMCPTools(ctx, app)
    
    // 7. 模式路由
    if prompt != "" {
        // 非交互模式
        return app.RunNonInteractive(ctx, prompt, outputFormat, quiet)
    }
    
    // 交互模式
    return runTUI(ctx, app)
}
```

### 5.2 交互模式启动

```go
func runTUI(ctx context.Context, app *app.App) error {
    // 1. 初始化 TUI
    program := tea.NewProgram(tui.New(app), tea.WithAltScreen())
    
    // 2. 设置事件订阅（将服务事件转发到 TUI）
    ch, cancelSubs := setupSubscriptions(app, ctx)
    
    // 3. 启动消息处理 goroutine
    go func() {
        for msg := range ch {
            program.Send(msg)  // 将事件发送到 TUI
        }
    }()
    
    // 4. 运行 TUI（阻塞）
    _, err := program.Run()
    
    // 5. 清理
    cancelSubs()
    
    return err
}
```

### 5.3 非交互模式启动

```go
func runNonInteractive(ctx context.Context, app *app.App, prompt string) error {
    // 1. 创建临时会话
    session, _ := app.Sessions.Create(ctx, "Non-interactive")
    
    // 2. 运行 Agent
    events, _ := app.CoderAgent.Run(ctx, session.ID, prompt)
    
    // 3. 消费事件流
    var result AgentEvent
    for event := range events {
        if event.Type == AgentEventTypeResponse {
            result = event
        }
    }
    
    // 4. 输出结果
    if outputFormat == "json" {
        fmt.Println(toJSON(result))
    } else {
        fmt.Println(result.Message.Content())
    }
    
    return nil
}
```

---

## 6. 配置加载策略

### 6.1 配置优先级（从高到低）

1. 命令行参数
2. 环境变量
3. 本地配置文件（工作目录/.opencode.json）
4. 全局配置文件（~/.config/opencode/.opencode.json）
5. 默认值

### 6.2 工作目录处理

```go
if cwd != "" {
    // 用户指定了工作目录
    os.Chdir(cwd)
} else {
    // 使用当前目录
    cwd, _ = os.Getwd()
}
```

**设计意图**：
- 支持在任意目录启动（-c 参数）
- 默认使用当前目录，符合直觉
- 工作目录决定加载哪个本地配置

---

## 7. 错误处理

### 7.1 启动阶段错误

```go
// 配置加载失败
if err := config.Load(cwd, debug); err != nil {
    return fmt.Errorf("failed to load config: %w", err)
}

// 数据库连接失败
if conn, err := db.Connect(); err != nil {
    return fmt.Errorf("failed to connect database: %w", err)
}
```

**策略**：启动阶段遇到错误直接退出，打印错误信息。

### 7.2 运行时错误

- **TUI 错误**：通过事件总线通知，TUI 展示错误弹窗
- **非交互错误**：打印到 stderr，非零退出码退出

### 7.3 崩溃恢复

```go
defer logging.RecoverPanic("main", func() {
    logging.ErrorPersist("Application terminated due to unhandled panic")
})
```

**策略**：捕获未处理的 panic，记录日志，优雅退出。

---

## 8. 资源管理

### 8.1 初始化资源

- 数据库连接：通过 `db.Connect()` 创建
- App 实例：通过 `app.New()` 创建
- TUI 程序：通过 `tea.NewProgram()` 创建

### 8.2 清理资源（defer 链）

```go
func main() {
    // 1. panic 恢复
    defer logging.RecoverPanic("main", nil)
    
    // 2. 配置加载...
    
    // 3. 数据库连接
    conn, _ := db.Connect()
    
    // 4. 创建 App（内部通过 defer 清理）
    app, _ := app.New(ctx, conn)
    defer app.Shutdown()  // 关闭 LSP、watcher 等
    
    // 5. 运行...
}
```

**设计意图**：使用 Go 的 defer 机制确保资源释放，即使发生 panic 也能执行清理。

---

## 9. 设计亮点

| 设计点 | 说明 |
|--------|------|
| **双模式** | 同一入口支持交互和非交互两种模式 |
| **参数分层** | 命令行 > 环境变量 > 本地配置 > 全局配置 > 默认值 |
| **工作目录** | 支持 -c 参数在任意目录启动，默认使用当前目录 |
| **延迟初始化** | MCP 等耗时操作异步初始化，不阻塞主流程 |
| **panic 恢复** | 捕获未处理异常，记录日志，优雅退出 |
| **defer 清理** | 确保资源释放，防止内存泄漏 |

---

## 10. 一句话概括

OpenCode 的 CLI 入口层 = **"系统的'大门'，负责解析用户意图（交互还是脚本化），按正确顺序启动所有依赖，并将用户引导到合适的运行模式"**。

它是用户与系统交互的第一个接触点，决定了初次体验的流畅度。

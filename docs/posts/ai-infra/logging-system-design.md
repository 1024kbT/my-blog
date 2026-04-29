---
title: 日志系统设计
description: 整理终端 AI 助手的日志分级、输出通道、持久化与调试支持方案。
outline: deep
---

# 日志系统设计

基于 OpenCode 项目，梳理分级日志、持久化和 TUI 集成的设计策略。

---

## 1. 设计目标

- **分级记录**：区分 Debug、Info、Warn、Error 不同级别
- **双通道输出**：同时输出到 TUI 界面和本地文件
- **结构化日志**：支持 key-value 字段，便于检索和分析
- **实时查看**：用户可在 TUI 中实时查看日志
- **性能友好**：日志不影响主流程性能

---

## 2. 日志级别

| 级别 | 用途 | 输出位置 |
|------|------|----------|
| **Debug** | 详细调试信息（API 请求/响应、工具调用详情） | 文件（仅 Debug 模式） |
| **Info** | 一般信息（会话创建、模型切换、操作完成） | 文件 + TUI |
| **Warn** | 警告（配置缺失、降级处理、超时） | 文件 + TUI |
| **Error** | 错误（API 失败、数据库错误、Panic） | 文件 + TUI + 持久化 |

---

## 3. 日志输出通道

### 3.1 文件日志

**存储位置**

```
~/.opencode/
  └── debug.log          # 日志文件
  └── messages/          # 消息目录（调试时使用）
```

**格式**

```
time=2026-04-28T14:30:00Z level=INFO msg="Session created" session_id=xxx title="New Session"
time=2026-04-28T14:30:05Z level=DEBUG msg="API request" model=claude-3.7-sonnet tokens=1500
```

**特点**
- 结构化格式（key=value），便于 grep 和解析
- 自动轮转（虽然当前未实现，但可扩展）
- Debug 模式下记录更详细信息

### 3.2 TUI 日志

通过事件总线将日志推送到 TUI：

```
Logger → Publish(LogEvent) → Event Bus → TUI Logs Page
```

**展示方式**
- Logs 页面以表格形式展示日志列表
- 支持按级别筛选
- 点击可查看详细内容

### 3.3 持久化错误

关键错误持久化到 SQLite，确保不丢失：

```go
func ErrorPersist(msg string) {
    // 写入持久化存储（即使日志文件写入失败也能保留）
    // 当前实现直接写入文件，未来可扩展为写入数据库
}
```

---

## 4. 日志接口

```go
type Logger interface {
    Debug(msg string, args ...any)      // 调试日志
    Info(msg string, args ...any)       // 信息日志
    Warn(msg string, args ...any)       // 警告日志
    Error(msg string, args ...any)      // 错误日志
    ErrorPersist(msg string)            // 持久化错误
}
```

**使用示例**

```go
// 普通日志
logging.Info("Session created", "id", session.ID, "title", session.Title)

// 调试日志
logging.Debug("API request", "model", model.ID, "tokens", len(prompt))

// 错误日志
logging.Error("Failed to send message", "error", err, "session", sessionID)

// 持久化错误（关键错误）
logging.ErrorPersist(fmt.Sprintf("Panic recovered: %v", rec))
```

---

## 5. 与 TUI 的集成

### 5.1 日志事件流

```
业务代码调用 logging.Info()
  ↓
Logger 写入文件
  ↓
Logger 发布 LogEvent 到事件总线
  ↓
TUI 订阅者收到事件
  ↓
更新 Logs 页面
```

### 5.2 TUI 展示

- **日志列表**：按时间倒序展示所有日志
- **级别筛选**：可只显示 Warn/Error
- **详细信息**：点击某条日志查看完整字段
- **实时更新**：新日志自动追加到列表

### 5.3 快捷键

| 快捷键 | 动作 |
|--------|------|
| `Ctrl+L` | 切换到 Logs 页面 |
| `Backspace` / `q` | 返回 Chat 页面 |

---

## 6. 工具结果记录

Debug 模式下，记录每次 Tool Use Loop 的详细结果：

```go
if cfg.Debug {
    // 保存工具调用结果到 JSON 文件
    filepath := logging.WriteToolResultsJson(sessionID, seqId, toolResults)
    logging.Info("Tool results saved", "filepath", filepath)
}
```

**用途**
- 调试 AI 的工具调用行为
- 分析工具执行失败的原因
- 优化提示词和工具设计

---

## 7. Panic 恢复

### 7.1 全局 Panic 捕获

```go
func main() {
    defer logging.RecoverPanic("main", func() {
        logging.ErrorPersist("Application terminated due to unhandled panic")
    })
    
    cmd.Execute()
}
```

### 7.2 goroutine Panic 捕获

每个 goroutine 都包裹 panic 恢复：

```go
go func() {
    defer logging.RecoverPanic("agent.Run", func() {
        events <- AgentEvent{Type: Error, Error: fmt.Errorf("panic")}
    })
    
    // 执行业务逻辑
}()
```

**设计意图**
- 防止单个 goroutine 的 panic 导致整个程序崩溃
- 记录 panic 信息，便于排查问题
- 优雅降级，尽量保持其他功能正常

---

## 8. 设计亮点

| 设计点 | 说明 |
|--------|------|
| **分级日志** | Debug/Info/Warn/Error 四级，按需记录 |
| **双通道** | 同时输出到文件和 TUI，满足不同场景 |
| **结构化** | key-value 格式，便于检索和分析 |
| **事件驱动** | 通过事件总线推送到 TUI，解耦模块 |
| **Panic 恢复** | 全局和 goroutine 级别捕获，防止崩溃 |
| **工具结果** | Debug 模式保存工具调用详情，便于调试 |
| **持久化错误** | 关键错误持久化存储，确保不丢失 |

---

## 9. 一句话概括

OpenCode 的日志系统 = **"通过分级、结构化、双通道的设计，既满足调试需求，又不干扰用户体验，同时通过 panic 恢复保证系统稳定性"**。

它是系统的"黑匣子"，记录运行状态，帮助排查问题。

---
title: 事件总线 (Pub/Sub) 设计
description: 整理模块间解耦通信所需的事件驱动机制、订阅模型与生命周期管理。
outline: deep
---

# 事件总线 (Pub/Sub) 设计

基于 OpenCode 项目，梳理模块间解耦通信的事件驱动机制。

---

## 1. 设计目标

- **模块解耦**：发布者不需要知道订阅者是谁
- **类型安全**：使用 Go 泛型确保事件类型正确
- **实时通知**：状态变更立即通知所有关注者
- **生命周期管理**：支持取消订阅和资源清理

---

## 2. 核心抽象：Broker

事件总线的核心是泛型化的 Broker：

```go
type Broker[T any] struct {
    subscribers map[string]chan Event[T]  // 订阅者映射
    mu          sync.RWMutex               // 读写锁
}

type Event[T any] struct {
    Type EventType  // Created / Updated / Deleted
    Data T          // 事件数据
}

type EventType string

const (
    CreatedEvent EventType = "created"
    UpdatedEvent EventType = "updated"
    DeletedEvent EventType = "deleted"
)
```

**设计意图**

- `Broker[T]`：泛型设计，可为任意类型创建事件总线
- `subscribers`：每个订阅者有自己的 channel，避免互相阻塞
- `EventType`：区分创建、更新、删除三种操作

---

## 3. Broker 接口

```go
type Suscriber[T any] interface {
    Subscribe(ctx context.Context) <-chan Event[T]  // 订阅事件
}

type Publisher[T any] interface {
    Publish(eventType EventType, data T)  // 发布事件
}
```

**使用方式**

```go
// 创建 Broker
broker := pubsub.NewBroker[Message]()

// 订阅事件
ch := broker.Subscribe(ctx)
for event := range ch {
    fmt.Println(event.Type, event.Data)
}

// 发布事件
broker.Publish(CreatedEvent, newMessage)
```

---

## 4. 事件类型

系统中存在多种事件总线，每种对应不同的数据类型：

| 事件总线 | 数据类型 | 发布者 | 订阅者 |
|----------|----------|--------|--------|
| **Message** | Message | Message Service | TUI（消息列表） |
| **Session** | Session | Session Service | TUI（会话列表） |
| **Agent** | AgentEvent | Agent | TUI（对话状态） |
| **Permission** | PermissionEvent | Permission Service | TUI（权限对话框） |
| **Log** | LogEntry | Logger | TUI（日志页面） |

---

## 5. 订阅机制

### 5.1 订阅流程

```go
func (b *Broker[T]) Subscribe(ctx context.Context) <-chan Event[T] {
    b.mu.Lock()
    defer b.mu.Unlock()
    
    // 创建缓冲 channel
    ch := make(chan Event[T], 100)
    
    // 生成唯一 ID
    id := uuid.New().String()
    b.subscribers[id] = ch
    
    // 当 context 取消时自动清理
    go func() {
        <-ctx.Done()
        b.mu.Lock()
        delete(b.subscribers, id)
        close(ch)
        b.mu.Unlock()
    }()
    
    return ch
}
```

### 5.2 发布流程

```go
func (b *Broker[T]) Publish(eventType EventType, data T) {
    b.mu.RLock()
    defer b.mu.RUnlock()
    
    event := Event[T]{Type: eventType, Data: data}
    
    // 向所有订阅者发送事件
    for id, ch := range b.subscribers {
        select {
        case ch <- event:
            // 发送成功
        default:
            // channel 满了，丢弃事件（防止阻塞）
            log.Warn("Event dropped, slow consumer", "subscriber", id)
        }
    }
}
```

**设计要点**

- **缓冲 channel**：防止发布者被慢消费者阻塞
- **超时丢弃**：如果消费者处理太慢，丢弃事件保证系统稳定
- **自动清理**：context 取消时自动删除订阅者，避免内存泄漏

---

## 6. 事件转发

App 层负责将各服务的事件转发到 TUI：

```go
func setupSubscriptions(app *App, ctx context.Context) (chan tea.Msg, func()) {
    ch := make(chan tea.Msg, 100)
    
    // 订阅各类事件，统一转发到 TUI
    setupSubscriber(ctx, "logging", logging.Subscribe, ch)
    setupSubscriber(ctx, "sessions", app.Sessions.Subscribe, ch)
    setupSubscriber(ctx, "messages", app.Messages.Subscribe, ch)
    setupSubscriber(ctx, "permissions", app.Permissions.Subscribe, ch)
    setupSubscriber(ctx, "coderAgent", app.CoderAgent.Subscribe, ch)
    
    // 返回清理函数
    cleanup := func() {
        cancel()  // 触发所有订阅的 context 取消
        waitForCleanup()  // 等待 goroutine 结束
        close(ch)
    }
    
    return ch, cleanup
}
```

**转发逻辑**

```go
func setupSubscriber[T any](
    ctx context.Context,
    name string,
    subscriber func(context.Context) <-chan pubsub.Event[T],
    outputCh chan<- tea.Msg,
) {
    go func() {
        subCh := subscriber(ctx)
        
        for {
            select {
            case event, ok := <-subCh:
                if !ok {
                    return  // channel 关闭，退出
                }
                
                // 转发到 TUI channel
                select {
                case outputCh <- event:
                case <-time.After(2 * time.Second):
                    log.Warn("Event dropped due to slow consumer", "name", name)
                case <-ctx.Done():
                    return
                }
                
            case <-ctx.Done():
                return
            }
        }
    }()
}
```

**设计意图**

- 每个服务的事件类型不同，使用泛型统一处理
- 超时保护：TUI 如果卡住，事件丢弃而不是阻塞整个系统
- context 驱动生命周期：App 关闭时自动清理所有订阅

---

## 7. 典型事件流

### 7.1 消息创建事件流

```
用户输入消息
  ↓
MessageService.Create()
  ↓
写入数据库
  ↓
Publish(CreatedEvent, message)
  ↓
TUI 订阅者收到事件
  ↓
更新消息列表界面
```

### 7.2 Agent 回复事件流

```
Agent 生成内容增量
  ↓
Publish(AgentEvent{Type: Response, Message: msg})
  ↓
TUI 订阅者收到事件
  ↓
更新对话内容（打字机效果）
```

### 7.3 权限请求事件流

```
Agent 执行敏感工具
  ↓
PermissionService 检查权限
  ↓
需要用户确认
  ↓
Publish(PermissionEvent{Type: Request, Tool: "bash"})
  ↓
TUI 弹出权限确认对话框
```

---

## 8. 背压处理

当消费者处理速度跟不上生产者时，系统采用**丢弃策略**：

```go
select {
case ch <- event:
    // 发送成功
case <-time.After(2 * time.Second):
    // 超时，丢弃事件
    log.Warn("Event dropped", "subscriber", id)
}
```

**为什么不用阻塞？**

- 如果阻塞，发布者（如 Agent）会被卡住，影响用户体验
- TUI 渲染是重操作，偶尔慢是正常的
- 丢失一个中间状态事件比卡住整个系统要好

**为什么不用无限缓冲？**

- 无限缓冲会导致内存无限增长
- 如果 TUI 彻底卡死，内存会被耗尽
- 有界缓冲 + 丢弃是更安全的策略

---

## 9. 生命周期管理

### 9.1 订阅生命周期

```
订阅创建
  ↓
context 存活期间持续接收事件
  ↓
context 取消（用户退出或切换会话）
  ↓
自动删除订阅者
  ↓
关闭 channel
  ↓
goroutine 退出
```

### 9.2 清理流程

```go
cleanup := func() {
    // 1. 取消 context，触发所有订阅退出
    cancel()
    
    // 2. 等待所有 goroutine 结束（带超时）
    waitCh := make(chan struct{})
    go func() {
        wg.Wait()
        close(waitCh)
    }()
    
    select {
    case <-waitCh:
        log.Info("All subscriptions cleaned up")
    case <-time.After(5 * time.Second):
        log.Warn("Subscription cleanup timeout")
    }
    
    // 3. 关闭 TUI channel
    close(ch)
}
```

---

## 10. 设计亮点

| 设计点 | 说明 |
|--------|------|
| **泛型 Broker** | 一套代码支持任意类型的事件总线 |
| **缓冲 Channel** | 防止发布者被慢消费者阻塞 |
| **超时丢弃** | 消费者太慢时丢弃事件，保证系统稳定 |
| **Context 驱动** | 通过 context 管理订阅生命周期，自动清理 |
| **统一转发** | App 层将各服务事件统一转发到 TUI |
| **类型安全** | 编译时检查事件类型，避免类型错误 |

---

## 11. 一句话概括

OpenCode 的事件总线 = **"基于泛型 channel 的发布-订阅系统，通过缓冲、超时和 context 管理，实现模块间解耦通信和生命周期自动清理"**。

它是系统各模块之间的"神经系统"，让状态变更能实时传递到需要知道的地方。

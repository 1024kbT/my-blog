---
title: 记忆机制的数据结构与信息提取
description: 围绕项目级与会话级记忆，整理终端 AI 助手的存储结构与信息提取机制。
outline: deep
---

# 记忆机制的数据结构与信息提取

基于 OpenCode 项目，详细分析终端 AI 助手如何存储记忆、保留有效信息以及提取上下文。

---

## 1. 记忆的两个层级

OpenCode 的记忆机制分为两个独立层级：

```
┌─────────────────────────────────────────────┐
│           项目级记忆（跨会话共享）              │
│  存储方式：OpenCode.md 文件（磁盘）            │
│  作用域：所有会话自动加载                       │
│  内容：项目规范、常用命令、代码风格              │
├─────────────────────────────────────────────┤
│           会话级记忆（单会话内）                │
│  存储方式：SQLite 数据库（本地）               │
│  作用域：当前会话及其子会话                     │
│  内容：对话历史、摘要、Token 消耗               │
└─────────────────────────────────────────────┘
```

---

## 2. 数据库表结构设计

使用 SQLite 作为本地存储，包含三张核心表：

### 2.1 sessions 表（会话表）

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,                    -- 会话唯一标识（UUID）
    parent_session_id TEXT,                 -- 父会话ID（支持会话树结构）
    title TEXT NOT NULL,                    -- 会话标题
    message_count INTEGER DEFAULT 0,        -- 消息数量（自动维护）
    prompt_tokens INTEGER DEFAULT 0,        -- 输入Token总数
    completion_tokens INTEGER DEFAULT 0,    -- 输出Token总数
    cost REAL DEFAULT 0.0,                  -- 总成本（美元）
    summary_message_id TEXT,                -- 摘要消息ID（关键字段）
    updated_at INTEGER NOT NULL,            -- 更新时间戳
    created_at INTEGER NOT NULL             -- 创建时间戳
);
```

**关键字段说明**

- **summary_message_id**：指向本会话中作为"摘要"的消息记录。如果该字段有值，表示此会话已经历过摘要压缩，后续加载消息时会从该消息开始截取
- **parent_session_id**：支持父子会话关系，但目前主要用于标题生成和任务子会话，不用于上下文继承
- **message_count**：通过数据库触发器自动维护，插入消息时 +1，删除时 -1

### 2.2 messages 表（消息表）

```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,                    -- 消息唯一标识（UUID）
    session_id TEXT NOT NULL,               -- 所属会话ID
    role TEXT NOT NULL,                     -- 角色：user / assistant / tool
    parts TEXT NOT NULL DEFAULT '[]',       -- 消息内容（JSON数组）
    model TEXT,                             -- 使用的模型ID
    created_at INTEGER NOT NULL,            -- 创建时间戳
    updated_at INTEGER NOT NULL,            -- 更新时间戳
    finished_at INTEGER                     -- 完成时间戳（流式结束时设置）
);
```

**设计要点**

- **parts 字段为 JSON 文本**：支持存储复杂的多段内容结构
- **role 字段**：区分 User（用户输入）、Assistant（AI回复）、Tool（工具结果）
- **model 字段**：记录该消息使用的模型，便于追溯和成本分析
- **finished_at**：流式响应结束时设置，用于统计响应耗时

### 2.3 files 表（文件历史表）

```sql
CREATE TABLE files (
    id TEXT PRIMARY KEY,                    -- 文件版本唯一标识
    session_id TEXT NOT NULL,               -- 所属会话ID
    path TEXT NOT NULL,                     -- 文件路径
    content TEXT NOT NULL,                  -- 文件内容快照
    version TEXT NOT NULL,                  -- 版本标识
    created_at INTEGER NOT NULL,            -- 创建时间戳
    updated_at INTEGER NOT NULL,            -- 更新时间戳
    UNIQUE(path, session_id, version)       -- 联合唯一约束
);
```

**用途**：追踪文件变更历史，支持查看和回滚操作。

---

## 3. 消息内容的存储结构（Parts）

### 3.1 为什么用 JSON 数组？

一条消息可能包含多种类型的内容片段，例如：
- AI 回复中同时包含文本说明和工具调用请求
- 工具结果消息中包含多个工具的执行结果
- 图片消息包含二进制数据和文本描述

因此采用 **"一条消息 = 多个 Part"** 的设计，每个 Part 有独立的类型和数据。

### 3.2 Part 类型定义

```go
// 所有 Part 类型都实现 ContentPart 接口
type ContentPart interface {
    isPart()
}

// 文本内容
type TextContent struct {
    Text string
}

// AI 思考过程（Reasoning）
type ReasoningContent struct {
    Thinking string
}

// 工具调用请求
type ToolCall struct {
    ID       string  // 调用唯一标识
    Name     string  // 工具名称
    Input    string  // 参数（JSON字符串）
    Type     string  // 类型
    Finished bool    // 是否完成参数填写
}

// 工具执行结果
type ToolResult struct {
    ToolCallID string  // 对应 ToolCall 的 ID
    Name       string  // 工具名称
    Content    string  // 结果内容
    Metadata   string  // 元数据
    IsError    bool    // 是否执行出错
}

// 消息结束标记
type Finish struct {
    Reason FinishReason  // 结束原因
    Time   int64         // 结束时间戳
}

// 图片 URL（用于在线图片）
type ImageURLContent struct {
    URL    string
    Detail string
}

// 二进制内容（用于本地图片/文件附件）
type BinaryContent struct {
    Path     string   // 文件路径
    MIMEType string   // MIME类型
    Data     []byte   // 二进制数据（Base64编码存储）
}
```

### 3.3 存储格式（序列化）

Parts 在存入数据库前，通过 JSON 序列化为以下格式：

```json
[
  {
    "type": "text",
    "data": {"text": "这是一个文本片段"}
  },
  {
    "type": "tool_call",
    "data": {
      "id": "call_abc123",
      "name": "view",
      "input": "{\"file_path\": \"/path/to/file\"}",
      "type": "function",
      "finished": true
    }
  },
  {
    "type": "finish",
    "data": {
      "reason": "end_turn",
      "time": 1714291200
    }
  }
]
```

**序列化逻辑**

- 遍历 Parts 数组，为每个 Part 添加 `"type"` 字段标识类型
- 使用 Go 的 `json.Marshal` 序列化为 JSON 字符串
- 存入数据库的 `parts` 字段（TEXT 类型）

**反序列化逻辑**

- 从数据库读取 JSON 字符串
- 先解析外层数组，获取每个 Part 的 `type` 字段
- 根据 `type` 值，将 `data` 反序列化为对应的结构体
- 还原为 `[]ContentPart` 供程序使用

### 3.4 为什么这样设计？

**优点**

- **灵活性**：一条消息可包含任意数量和类型的 Part
- **可扩展性**：新增 Part 类型只需扩展接口，不影响已有数据
- **流式友好**：AI 回复过程中逐步追加 Part（先文本、再工具调用、再结束标记）
- **类型安全**：Go 的类型断言确保运行时类型正确

**缺点**

- JSON 序列化/反序列化有一定性能开销
- 数据库中无法直接查询 Part 内部字段（需要全量读取后解析）

---

## 4. 会话级记忆：摘要机制

### 4.1 为什么需要摘要？

LLM 有上下文窗口限制（如 200K tokens）。长对话会导致：
- Token 消耗激增
- 响应速度下降
- 超出窗口限制报错

**解决方案**：将历史对话压缩为摘要，用摘要替代原始消息。

### 4.2 摘要的数据结构

摘要本质上是一条**普通的 Assistant 消息**，存储在 messages 表中：

```go
// 摘要消息的结构
Message {
    ID:        "msg_summary_xxx",        // 唯一标识
    SessionID: "session_xxx",            // 所属会话
    Role:      "assistant",              // 角色为 Assistant
    Parts: [
        TextContent{Text: "摘要文本..."}, // 摘要内容
        Finish{Reason: "end_turn", ...}  // 结束标记
    ],
    Model: "claude-3.5-sonnet",          // 使用的摘要模型
}
```

会话通过 `summary_message_id` 字段指向这条消息：

```
Session {
    ID:               "session_xxx"
    SummaryMessageID: "msg_summary_xxx"  -- 指向摘要消息
}
```

### 4.3 摘要的内容提取策略

**提取方式**：调用专门的 Summarizer Agent，将完整对话历史发送给轻量级模型，要求其生成摘要。

**提取提示词**：
```
Provide a detailed but concise summary of our conversation above. 
Focus on information that would be helpful for continuing the conversation, 
including what we did, what we're doing, which files we're working on, 
and what we're going to do next.
```

**摘要保留的关键信息**

- 已完成的任务
- 正在进行的工作
- 正在修改的文件
- 下一步计划
- 重要的决策或结论

### 4.4 摘要的加载策略

加载会话历史时，如果存在摘要，执行**智能截断**：

```go
// 加载会话的所有消息
msgs := messages.List(sessionID)

// 如果存在摘要消息
if session.SummaryMessageID != "" {
    // 找到摘要消息在数组中的位置
    summaryIndex := findMessageIndex(msgs, session.SummaryMessageID)
    
    if summaryIndex != -1 {
        // 从摘要消息开始截取（丢弃之前的原始消息）
        msgs = msgs[summaryIndex:]
        
        // 将摘要消息的角色改为 User
        // 这样 AI 会将其视为"用户提供的背景信息"而非自己的回复
        msgs[0].Role = "user"
    }
}
```

**截断效果**

```
原始历史：[Msg1] [Msg2] [Msg3] [Msg4] [Summary] [Msg5] [Msg6]
                                    ↑
                              截断点
                                    
加载后：[Summary] [Msg5] [Msg6] [新用户消息]
        ↑
   角色改为 User（模拟用户输入摘要）
```

**设计巧妙之处**

- 摘要消息本身保留在历史中（不删除原始消息）
- 将摘要角色改为 User，让 AI 将其视为"上下文背景"而非"自己的回复"
- 保留了摘要之后的原始对话，确保近期上下文不丢失
- 对 AI 来说，就像"之前的同事交接了一份备忘录"

---

## 5. 项目级记忆：OpenCode.md

### 5.1 存储方式

与数据库存储不同，项目级记忆使用**文件系统**：

- 文件位置：项目根目录的 `OpenCode.md`
- 文件格式：Markdown 纯文本
- 编码方式：UTF-8

### 5.2 内容结构建议

```markdown
# OpenCode Project Memory

## Build Commands
- Build: `go build -o app`
- Test: `go test ./...`
- Lint: `golangci-lint run`

## Code Style
- Use snake_case for file names
- Error handling: wrap errors with fmt.Errorf
- No inline comments unless complex logic

## Project Structure
- `cmd/`: CLI entry points
- `internal/`: Core logic
- `pkg/`: Public packages

## Important Notes
- Use context.Context for all async operations
- Never commit API keys
```

### 5.3 加载机制

系统启动时，从配置中的 `contextPaths` 读取：

```go
defaultContextPaths = []string{
    ".github/copilot-instructions.md",
    ".cursorrules",
    "CLAUDE.md",
    "OpenCode.md",        // 项目记忆文件
    "opencode.local.md",  // 本地覆盖（不提交Git）
}
```

**加载逻辑**

- 使用 `sync.Once` 确保进程内只加载一次（缓存机制）
- goroutine 并发读取多个文件
- 文件不存在则静默跳过
- 读取成功后注入到 Coder 和 Task Agent 的系统提示词末尾

### 5.4 更新机制

**渐进式积累**：AI 在使用过程中发现新项目知识时，主动询问用户是否添加到 OpenCode.md。

**示例对话**

```
用户：请帮我修复这个bug
AI：[修复代码]
AI：我发现这个项目的测试命令是 `npm run test:unit`，我可以把它记录到 OpenCode.md 中以便下次使用吗？
用户：好的
AI：[更新 OpenCode.md]
```

**设计意图**

- 不是 AI 擅自修改，而是征得用户同意
- 避免记忆文件被污染
- 让用户对 AI 的"记忆"有控制权

---

## 6. 记忆的提取与使用流程

### 6.1 对话开始时的记忆加载

```
1. 用户打开应用 / 切换到某会话
   ↓
2. 从数据库加载 Session 信息
   - 读取 summary_message_id
   ↓
3. 加载该会话的消息历史
   - 查询 messages 表中 session_id = 当前会话的所有记录
   - 按 created_at 排序
   - 反序列化每个消息的 parts JSON
   ↓
4. 摘要截断（如果存在 summary_message_id）
   - 找到摘要消息位置
   - 从该位置截取后续消息
   - 将摘要角色改为 User
   ↓
5. 组装系统提示词
   - 基础角色提示词（Coder/Task）
   - 提供商适配
   - 环境信息注入
   - 项目上下文（OpenCode.md 等）
   ↓
6. 构造完整消息历史
   [System] + [Summary/User] + [Msg5] + [Msg6] + [新用户输入]
   ↓
7. 发送给 LLM 开始对话
```

### 6.2 对话过程中的记忆更新

```
1. 用户发送新消息
   ↓
2. 创建 User 消息记录（写入数据库）
   ↓
3. 调用 LLM StreamResponse
   ↓
4. 实时接收流式事件
   - ContentDelta → 追加到 Assistant 消息的 TextContent
   - ToolUseStart → 添加 ToolCall Part
   - ToolUseStop → 标记 ToolCall 完成
   - Complete → 添加 Finish Part，更新 Token 使用量
   ↓
5. 每个增量实时更新数据库
   ↓
6. 如果 AI 调用工具
   - 执行工具
   - 创建 Tool 消息（包含 ToolResult Parts）
   - 追加到消息历史
   - 再次调用 LLM（Tool Use Loop）
   ↓
7. 对话结束，更新 Session 统计
   - prompt_tokens、completion_tokens、cost
```

### 6.3 摘要触发时的记忆重构

```
1. 触发条件：手动触发 或 Token 使用量达到阈值（如 95%）
   ↓
2. 获取会话全部消息历史（包括被截断前的原始消息）
   ↓
3. 构造摘要请求
   - 将所有消息发送给 Summarizer Agent
   - 附加摘要指令提示词
   ↓
4. AI 生成摘要文本
   ↓
5. 创建摘要消息（Assistant 角色）
   - 存入 messages 表
   ↓
6. 更新 Session
   - summary_message_id = 新摘要消息的 ID
   ↓
7. 后续对话加载时
   - 从摘要消息开始截取
   - 丢弃摘要之前的原始消息（节省 Token）
```

---

## 7. 数据关系的 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  sessions   │       │  messages   │       │   files     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ PK: id      │──1:N──│ FK:         │       │ FK:         │
│    title    │       │    session  │       │    session  │
│    summary  │──────→│ PK: id      │       │ PK: id      │
│    _msg_id  │       │    role     │       │    path     │
│    ...      │       │    parts    │       │    content  │
└─────────────┘       │    model    │       │    version  │
                      └─────────────┘       └─────────────┘
                            ↑
                            │
                      summary_message_id 
                      指向 messages.id
```

**关系说明**

- **Session : Message = 1 : N**：一个会话包含多条消息
- **Session.summary_message_id → Message.id**：会话通过外键指向自己的摘要消息（可选）
- **Session : File = 1 : N**：一个会话可记录多个文件版本快照

---

## 8. 设计亮点与权衡

### 8.1 设计亮点

| 设计点 | 说明 |
|--------|------|
| **JSON Parts** | 灵活的多类型内容存储，支持流式追加 |
| **摘要截断** | 通过 SummaryMessageID 实现历史压缩，节省 Token |
| **角色转换** | 摘要消息加载时改为 User 角色，让 AI 正确理解上下文 |
| **文件记忆** | OpenCode.md 跨会话共享，渐进式积累项目知识 |
| **实时持久化** | 每条消息增量都写入数据库，防崩溃丢失 |
| **自动统计** | 数据库触发器自动维护 message_count |

### 8.2 潜在问题与权衡

| 问题 | 说明 | 权衡方案 |
|------|------|----------|
| **信息丢失** | 摘要必然丢失细节 | 保留摘要后的原始消息，关键操作可人工记录到 OpenCode.md |
| **单点存储** | SQLite 单文件，无法多设备同步 | 适合本地工具定位，可通过 Git 同步项目级记忆 |
| **JSON 查询难** | 无法直接 SQL 查询 Parts 内部 | 按会话加载是主要场景，全量读取后内存解析 |
| **存储膨胀** | 长期积累大量消息和文件快照 | 可定期清理或归档旧会话 |
| **摘要质量** | 依赖 Summarizer 模型能力 | 使用轻量模型降低成本，关键信息可人工补充 |

---

## 9. 一句话概括

OpenCode 的记忆机制 = **"数据库持久化会话历史 + JSON 灵活存储多类型消息 + 摘要截断压缩上下文 + 项目文件共享跨会话知识"**。

它通过精巧的数据结构设计，在有限的 LLM 上下文窗口内，最大化保留了有效信息。

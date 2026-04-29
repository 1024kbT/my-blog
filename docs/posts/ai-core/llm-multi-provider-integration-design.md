---
title: LLM 多提供商集成设计
description: 梳理多家大模型 API 的统一抽象、流式响应与模型能力适配方案。
outline: deep
---

# LLM 多提供商集成设计

基于 OpenCode 项目，梳理如何统一封装多家 LLM API，实现模型的可插拔和流式交互。

---

## 1. 设计目标

- **统一接口**：无论底层是 OpenAI、Anthropic 还是本地模型，上层调用方式一致
- **流式响应**：支持 SSE/Streaming，实时展示 AI 输出
- **多模型共存**：不同任务可配置不同模型（编码用 Claude，标题生成用轻量模型）
- **能力检测**：自动识别模型特性（是否支持附件、Reasoning、Function Calling 等）

---

## 2. 核心抽象：Provider 接口

所有 LLM 提供商都实现统一的接口：

```go
type Provider interface {
    // 发送消息并获取完整响应（非流式）
    SendMessages(ctx context.Context, msgs []Message, tools []Tool) (Response, error)
    
    // 流式发送消息，通过 channel 返回事件
    StreamResponse(ctx context.Context, msgs []Message, tools []Tool) <-chan Event
    
    // 获取当前使用的模型信息
    Model() Model
}
```

**设计意图**

- `SendMessages`：用于不需要流式展示的场景（如标题生成、会话摘要）
- `StreamResponse`：用于交互式对话，实时推送内容增量
- `Model()`：返回模型元数据（ID、提供商、Token 限制、成本等）

---

## 3. 模型元数据设计

每个支持的模型都有详细的元数据定义：

```go
type Model struct {
    ID                  ModelID           // 模型唯一标识
    Name                string            // 展示名称
    Provider            ModelProvider     // 所属提供商
    ContextWindow       int64             // 上下文窗口大小
    DefaultMaxTokens    int64             // 默认最大输出 token
    SupportsAttachments bool              // 是否支持附件（图片等）
    CanReason           bool              // 是否支持 Reasoning（思考过程）
    CostPer1MIn         float64           // 输入 token 单价（每百万）
    CostPer1MOut        float64           // 输出 token 单价（每百万）
    CostPer1MInCached   float64           // 缓存输入 token 单价
    CostPer1MOutCached  float64           // 缓存输出 token 单价
}
```

**用途**

- **模型选择**：用户切换模型时，根据 ID 查找对应元数据
- **能力判断**：发送消息前检查模型是否支持附件、Reasoning 等
- **成本计算**：对话完成后根据 Token 使用量计算成本
- **上下文管理**：根据 ContextWindow 判断是否触发自动摘要

---

## 4. 消息格式统一

不同 LLM 提供商的 API 格式差异很大，需要内部统一：

### 4.1 内部消息结构

```go
type Message struct {
    ID        string        // 消息唯一标识
    Role      MessageRole   // user / assistant / tool / system
    Parts     []ContentPart // 多段内容（文本、工具调用、工具结果等）
    Model     ModelID       // 使用的模型
    CreatedAt int64         // 创建时间戳
}
```

### 4.2 角色映射

| 内部角色 | OpenAI | Anthropic | Gemini |
|----------|--------|-----------|--------|
| User | user | user | user |
| Assistant | assistant | assistant | model |
| Tool | tool | user (with tool_result) | function |
| System | system | system (或顶层 system 参数) | system |

### 4.3 内容转换

**OpenAI 格式**
```json
{
  "role": "assistant",
  "content": "文本内容",
  "tool_calls": [
    {"id": "call_xxx", "type": "function", "function": {"name": "view", "arguments": "{}"}}
  ]
}
```

**Anthropic 格式**
```json
{
  "role": "assistant",
  "content": [
    {"type": "text", "text": "文本内容"},
    {"type": "tool_use", "id": "toolu_xxx", "name": "view", "input": {}}
  ]
}
```

**内部统一格式**
```go
// 文本内容
type TextContent struct { Text string }

// 工具调用
type ToolCall struct {
    ID    string  // 调用标识
    Name  string  // 工具名
    Input string  // 参数 JSON
}

// 工具结果
type ToolResult struct {
    ToolCallID string  // 对应 ToolCall.ID
    Content    string  // 结果文本
    IsError    bool    // 是否出错
}
```

**转换逻辑**

- 发送前：将内部 Message 转换为提供商特定格式
- 接收后：将提供商响应解析为内部 Event
- 工具调用：OpenAI 用 `tool_calls`/`tool`，Anthropic 用 `tool_use`/`tool_result`

---

## 5. 流式事件设计

`StreamResponse` 返回的事件流是 Provider 层的核心设计：

### 5.1 事件类型

```go
type ProviderEvent struct {
    Type     EventType    // 事件类型
    Content  string       // 文本内容（增量）
    ToolCall *ToolCall    // 工具调用信息
    Response *Response    // 完整响应（仅在 Complete 时）
    Error    error        // 错误信息
}
```

### 5.2 事件类型枚举

| 事件类型 | 说明 | 触发时机 |
|----------|------|----------|
| **ContentDelta** | 内容增量 | AI 生成文本片段时 |
| **ThinkingDelta** | 思考增量 | AI 展示 Reasoning 过程时 |
| **ToolUseStart** | 工具调用开始 | AI 发起工具调用时 |
| **ToolUseDelta** | 工具参数增量 | AI 逐步填写工具参数时 |
| **ToolUseStop** | 工具调用完成 | AI 完成工具参数填写时 |
| **Error** | 错误 | 流式传输发生错误时 |
| **Complete** | 完成 | AI 完成全部响应时 |

### 5.3 事件流示例

```
Event 1: {Type: ContentDelta, Content: "我来"}
Event 2: {Type: ContentDelta, Content: "帮你"}
Event 3: {Type: ContentDelta, Content: "查看"}
Event 4: {Type: ToolUseStart, ToolCall: {ID: "call_1", Name: "view"}}
Event 5: {Type: ToolUseDelta, ToolCall: {ID: "call_1", Input: "{\"file"}}
Event 6: {Type: ToolUseDelta, ToolCall: {ID: "call_1", Input: "_path\": \"/"}}
Event 7: {Type: ToolUseStop, ToolCall: {ID: "call_1", Input: "path/to/file\"}"}}
Event 8: {Type: Complete, Response: {FinishReason: "tool_use", Usage: {...}}}
```

**设计意图**

- 细粒度事件让上层能精确控制展示逻辑
- ContentDelta 支持打字机效果
- ToolUseStart/Stop 标记工具调用边界
- Complete 事件携带 Token 使用量等元数据

---

## 6. 提供商实现要点

### 6.1 OpenAI 提供商

**特点**
- 使用官方的 openai-go SDK
- 支持 Functions 格式（老版）和 Tools 格式（新版）
- 支持 Reasoning Effort 配置（low/medium/high）

**流式处理**
- 使用 SSE（Server-Sent Events）流
- 解析 `delta.content` 获取文本增量
- 解析 `delta.tool_calls` 获取工具调用

### 6.2 Anthropic 提供商

**特点**
- 使用官方的 anthropic-sdk-go
- 支持 Tools 格式和 Thinking 参数
- 支持 Prompt Caching

**流式处理**
- 使用 SSE 流
- 解析 `content_block.delta.text` 获取文本
- 解析 `content_block_start` 获取工具调用开始

### 6.3 Gemini 提供商

**特点**
- 使用 Google 的 genai SDK
- 支持 Function Calling
- 支持多模态（图片、文档）

### 6.4 本地模型提供商

**特点**
- 通过 OpenAI 兼容接口（如 Ollama、vLLM）接入
- 使用 OpenAI 的 API 格式
- 模型列表通常需要动态获取

---

## 7. 配置与模型选择

### 7.1 提供商配置

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-xxx",
      "disabled": false
    },
    "openai": {
      "apiKey": "sk-xxx",
      "disabled": false
    },
    "gemini": {
      "apiKey": "gemini-xxx",
      "disabled": false
    }
  }
}
```

### 7.2 Agent 模型配置

```json
{
  "agents": {
    "coder": {
      "model": "claude-3.7-sonnet",
      "maxTokens": 5000
    },
    "task": {
      "model": "claude-3.7-sonnet",
      "maxTokens": 5000
    },
    "title": {
      "model": "claude-3.7-sonnet",
      "maxTokens": 80
    },
    "summarizer": {
      "model": "claude-3.7-sonnet",
      "maxTokens": 2000
    }
  }
}
```

### 7.3 自动模型选择

如果用户未配置模型，系统按优先级自动选择：

1. GitHub Copilot（如果已认证）
2. Anthropic（如果配置了 API Key）
3. OpenAI（如果配置了 API Key）
4. Google Gemini（如果配置了 API Key）
5. 其他提供商...

---

## 8. Token 使用追踪

每次对话完成后，系统计算并记录 Token 使用量：

```go
// Token 使用统计
type TokenUsage struct {
    InputTokens         int64  // 输入 token 数
    OutputTokens        int64  // 输出 token 数
    CacheCreationTokens int64  // 缓存创建 token 数
    CacheReadTokens     int64  // 缓存读取 token 数
}

// 成本计算
func CalculateCost(model Model, usage TokenUsage) float64 {
    return model.CostPer1MInCached/1e6 * float64(usage.CacheCreationTokens) +
           model.CostPer1MOutCached/1e6 * float64(usage.CacheReadTokens) +
           model.CostPer1MIn/1e6 * float64(usage.InputTokens) +
           model.CostPer1MOut/1e6 * float64(usage.OutputTokens)
}
```

**用途**
- 显示给用户看（成本透明）
- 触发自动摘要（当接近上下文上限时）
- 限制成本（未来可添加预算限制功能）

---

## 9. 设计亮点

| 设计点 | 说明 |
|--------|------|
| **统一接口** | Provider 接口屏蔽底层差异，上层无感知 |
| **流式事件** | 细粒度事件类型支持精确的 UI 更新 |
| **模型元数据** | 完整的模型信息支持能力检测和成本计算 |
| **自动选择** | 根据可用 API Key 自动选择默认模型 |
| **角色映射** | 内部统一角色概念，转换时适配各提供商格式 |
| **Token 追踪** | 精确到每次对话的成本统计 |

---

## 10. 扩展新提供商的步骤

如需支持新的 LLM 提供商：

1. **添加模型定义**：在 `models.go` 中定义新提供商支持的模型及其元数据
2. **创建 Provider 实现**：实现 `Provider` 接口，封装该提供商的 SDK 或 HTTP API
3. **消息格式转换**：实现内部 Message 到该提供商格式的转换逻辑
4. **流式解析**：解析该提供商的 SSE 流，转换为内部 Event 类型
5. **配置支持**：在配置系统中添加该提供商的配置项（API Key、Endpoint 等）
6. **注册到工厂**：在 Provider 工厂中注册新提供商，使其可通过名称创建实例

---

## 11. 一句话概括

OpenCode 的 LLM 集成层 = **"通过统一接口和流式事件抽象，将多家 LLM 的差异封装到底层，让上层以一致的方式与任何模型交互"**。

它让"切换模型"像"切换主题"一样简单。

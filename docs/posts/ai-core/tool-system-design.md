---
title: 工具集 (Tool System) 设计
description: 围绕文件、命令、搜索等能力，整理 AI 助手工具系统的接口与权限设计。
outline: deep
---

# 工具集 (Tool System) 设计

基于 OpenCode 项目，梳理如何为 AI 提供操作本地环境的能力，使其从"聊天机器人"变成"能动手干活的助手"。

---

## 1. 设计目标

- **赋予 AI 行动力**：让 AI 能读文件、写代码、执行命令、搜索代码库
- **标准化接口**：所有工具遵循统一接口，便于扩展和管理
- **权限控制**：敏感操作（写文件、执行命令）需要用户确认
- **并发执行**：独立的工具调用可并行执行，提升效率

---

## 2. 核心抽象：Tool 接口

所有工具都实现统一的接口：

```go
type Tool interface {
    // 返回工具的元信息（名称、描述、参数 schema）
    Info() ToolInfo
    
    // 执行工具
    Run(ctx context.Context, input ToolCallInput) (ToolResult, error)
}

type ToolInfo struct {
    Name        string          // 工具唯一名称
    Description string          // 工具功能描述（LLM 通过此描述理解工具用途）
    InputSchema json.RawMessage // 参数 JSON Schema（LLM 据此构造参数）
}

type ToolCallInput struct {
    ID    string // 调用唯一标识
    Name  string // 工具名称
    Input string // 参数（JSON 字符串）
}

type ToolResult struct {
    Content  string // 执行结果文本
    Metadata string // 元数据（如文件路径、命令退出码等）
    IsError  bool   // 是否执行出错
}
```

**设计意图**

- `Info()`：向 LLM 描述工具能力，LLM 根据描述决定何时调用哪个工具
- `InputSchema`：使用 JSON Schema 定义参数格式，LLM 生成符合 schema 的 JSON 参数
- `Run()`：执行实际逻辑，返回结果给 LLM

---

## 3. 工具分类

### 3.1 文件操作工具

**view：查看文件内容**

- 功能：读取文件内容，支持分页（offset/limit）
- 参数：`file_path`（必需）、`offset`（可选）、`limit`（可选）
- 权限：只读，无需确认
- 典型用途：AI 查看代码文件、配置文件、日志文件

**write：写入文件**

- 功能：创建新文件或覆盖已有文件
- 参数：`file_path`（必需）、`content`（必需）
- 权限：写操作，需要用户确认
- 典型用途：AI 创建新代码文件、写入配置

**edit：编辑文件**

- 功能：对文件内容进行字符串替换
- 参数：`file_path`（必需）、`old_string`（必需）、`new_string`（必需）
- 权限：写操作，需要用户确认
- 典型用途：AI 修改代码中的特定行或段落

**patch：应用补丁**

- 功能：应用 unified diff 格式的补丁
- 参数：`file_path`（必需）、`diff`（必需）
- 权限：写操作，需要用户确认
- 典型用途：AI 进行复杂的多处修改

**ls：列出目录**

- 功能：列出指定目录下的文件和子目录
- 参数：`path`（可选，默认为当前目录）
- 权限：只读，无需确认
- 典型用途：AI 了解项目结构

**glob：文件查找**

- 功能：按通配符模式查找文件
- 参数：`pattern`（必需）、`path`（可选）
- 权限：只读，无需确认
- 典型用途：AI 查找所有 `.go` 文件、测试文件等

**grep：内容搜索**

- 功能：在文件内容中搜索匹配的行
- 参数：`pattern`（必需）、`path`（可选）、`include`（可选文件过滤器）
- 权限：只读，无需确认
- 典型用途：AI 搜索函数定义、变量使用等

### 3.2 命令执行工具

**bash：执行 Shell 命令**

- 功能：在终端执行任意命令
- 参数：`command`（必需）、`timeout`（可选，毫秒）
- 权限：敏感操作，需要用户确认
- 典型用途：运行测试、编译代码、安装依赖、Git 操作
- 安全限制：可配置超时，防止长时间挂起

### 3.3 外部数据工具

**fetch：抓取网页**

- 功能：获取 URL 内容，转换为 Markdown
- 参数：`url`（必需）、`format`（必需，text/markdown/html）
- 权限：网络访问，需要用户确认
- 典型用途：AI 获取文档、API 参考、Stack Overflow 答案

**sourcegraph：代码搜索**

- 功能：在公共代码仓库中搜索代码
- 参数：`query`（必需）、`count`（可选）
- 权限：网络访问，需要用户确认
- 典型用途：AI 查找开源实现参考

### 3.4 代码智能工具

**diagnostics：获取诊断信息**

- 功能：从 LSP 语言服务器获取代码错误和警告
- 参数：`file_path`（可选）
- 权限：只读，无需确认
- 典型用途：AI 检查代码是否有编译错误、类型错误

---

## 4. 工具注册与发现

### 4.1 工具注册

Agent 初始化时，将工具列表注入到 Provider：

```go
// 创建工具实例
tools := []Tool{
    NewViewTool(),
    NewWriteTool(),
    NewEditTool(),
    NewBashTool(),
    NewLsTool(),
    NewGlobTool(),
    NewGrepTool(),
    NewFetchTool(),
    NewDiagnosticsTool(),
}

// 注入到 Agent
agent := NewAgent(coderAgent, sessions, messages, tools)
```

### 4.2 LLM 工具发现

发送消息给 LLM 时，同时传递工具的 `Info()` 信息：

```json
{
  "tools": [
    {
      "name": "view",
      "description": "View the contents of a file",
      "input_schema": {
        "type": "object",
        "properties": {
          "file_path": {"type": "string", "description": "Path to the file"},
          "offset": {"type": "integer", "description": "Line offset"},
          "limit": {"type": "integer", "description": "Max lines to read"}
        },
        "required": ["file_path"]
      }
    }
  ]
}
```

LLM 根据任务需求，自主决定调用哪些工具。

---

## 5. 工具调用执行流程

### 5.1 完整流程

```
1. AI 分析用户需求
   ↓
2. AI 决定调用工具（在响应中嵌入 ToolCall）
   ↓
3. Agent 解析 ToolCall（提取工具名和参数）
   ↓
4. 查找对应的 Tool 实例
   ↓
5. 权限检查
   ├─ 只读工具（view/ls/glob）→ 直接执行
   └─ 敏感工具（write/bash/edit）→ 请求用户确认
       ↓
       用户选择：
       ├─ Allow（允许本次）→ 执行
       ├─ Allow for Session（本会话不再询问）→ 执行并记录
       └─ Deny（拒绝）→ 返回错误
   ↓
6. 执行工具（Run 方法）
   ↓
7. 构造 ToolResult
   ↓
8. 创建 Tool 消息（包含 ToolResult）
   ↓
9. 追加到对话历史
   ↓
10. 再次调用 LLM，让 AI 基于结果继续
```

### 5.2 并发执行

当 AI 在一次响应中请求多个独立的工具调用时，可以并行执行：

```go
// AI 同时请求调用 view 和 ls
toolCalls := [
    {ID: "call_1", Name: "view", Input: "{...}"},
    {ID: "call_2", Name: "ls", Input: "{...}"}
]

// 并行执行
var wg sync.WaitGroup
results := make([]ToolResult, len(toolCalls))

for i, call := range toolCalls {
    wg.Add(1)
    go func(idx int, tc ToolCall) {
        defer wg.Done()
        tool := findTool(tc.Name)
        result, _ := tool.Run(ctx, ToolCallInput{...})
        results[idx] = result
    }(i, call)
}

wg.Wait()
```

**设计意图**：独立的工具调用互不依赖，并行执行可减少总耗时。

---

## 6. 权限控制机制

### 6.1 工具分类

| 类别 | 工具 | 默认策略 |
|------|------|----------|
| 只读 | view、ls、glob、grep、diagnostics | 无需确认 |
| 写操作 | write、edit、patch | 需要确认 |
| 执行 | bash | 需要确认 |
| 网络 | fetch、sourcegraph | 需要确认 |

### 6.2 权限决策流程

```
工具执行前
  ↓
检查该工具是否需要权限
  ↓
否 → 直接执行
  ↓
是 → 查询权限服务
        ↓
        用户之前是否已授权（会话级）？
        ├─ 是 → 直接执行
        └─ 否 → 弹出权限确认对话框
                    ↓
                    用户选择：
                    ├─ Allow → 执行
                    ├─ Allow for Session → 执行并缓存授权
                    └─ Deny → 返回 PermissionDenied 错误
```

### 6.3 权限持久化

会话级的权限决策会记录在内存中（通过 `sync.Map`），会话结束后失效。不持久化到磁盘，确保安全。

---

## 7. 工具结果格式

### 7.1 成功结果

```go
ToolResult{
    Content:  "文件内容...",
    Metadata: "file_path: /path/to/file",
    IsError:  false,
}
```

### 7.2 错误结果

```go
ToolResult{
    Content:  "文件不存在: /path/to/file",
    Metadata: "",
    IsError:  true,
}
```

### 7.3 结果在对话中的呈现

工具结果作为一条 `Tool` 角色的消息追加到对话历史：

```
User: 帮我看看 main.go 文件
Assistant: [ToolCall: view("main.go")]
Tool: [ToolResult: "package main..."]
Assistant: 这个文件是入口文件，包含...
```

LLM 通过 ToolResult 的内容继续推理和回答。

---

## 8. 错误处理策略

### 8.1 工具执行错误

当工具执行失败时：

- 设置 `IsError = true`
- 将错误信息放入 `Content`
- 返回给 LLM，让 AI 决定如何处理

**示例**

```
AI: 调用 bash("rm -rf /") 
Tool: [IsError: true, Content: "Permission denied"]
AI: 我没有权限执行这个命令，让我尝试其他方式...
```

### 8.2 工具不存在

当 AI 请求了一个不存在的工具：

- 返回错误结果：`Tool not found: xxx`
- AI 会收到错误反馈，通常会尝试其他工具或询问用户

### 8.3 权限拒绝

当用户拒绝授权：

- 返回错误结果：`Permission denied`
- 当前 Assistant 消息标记为 `FinishReasonPermissionDenied`
- 后续未执行的工具调用全部标记为取消

---

## 9. 设计亮点

| 设计点 | 说明 |
|--------|------|
| **统一接口** | 所有工具实现相同接口，便于管理和扩展 |
| **JSON Schema** | 工具参数通过 schema 描述，LLM 自动生成合法参数 |
| **权限分级** | 只读工具直接执行，敏感工具需要确认 |
| **并发执行** | 独立的工具调用并行执行，提升效率 |
| **错误传递** | 工具错误返回给 LLM，AI 自主决定重试或换方案 |
| **结果标准化** | 统一的 ToolResult 格式，便于 LLM 理解 |

---

## 10. 扩展新工具的步骤

如需添加新工具：

1. **定义工具结构体**：实现 `Tool` 接口
2. **实现 Info 方法**：返回工具名称、描述、参数 schema
3. **实现 Run 方法**：编写工具的执行逻辑
4. **注册到 Agent**：将工具实例添加到 Agent 的工具列表
5. **配置权限**：决定该工具是否需要用户确认

**示例框架**

```go
type MyTool struct{}

func (t *MyTool) Info() ToolInfo {
    return ToolInfo{
        Name:        "my_tool",
        Description: "Does something useful",
        InputSchema: []byte(`{
            "type": "object",
            "properties": {
                "param1": {"type": "string"}
            },
            "required": ["param1"]
        }`),
    }
}

func (t *MyTool) Run(ctx context.Context, input ToolCallInput) (ToolResult, error) {
    // 解析参数
    // 执行逻辑
    // 返回结果
    return ToolResult{Content: "Done", IsError: false}, nil
}
```

---

## 11. 一句话概括

OpenCode 的工具集 = **"通过标准化接口和权限控制，赋予 AI 操作本地环境的能力，让它从'说'变成'做'"**。

工具是 Agent 的手和脚，没有工具，AI 只是聊天机器人；有了工具，AI 才是真正的编程助手。

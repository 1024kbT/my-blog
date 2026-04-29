---
title: 配置管理设计
description: 梳理多层级配置覆盖、Provider 发现与运行时配置管理机制。
outline: deep
---

# 配置管理设计

基于 OpenCode 项目，梳理多层级配置系统的设计与实现策略。

---

## 1. 设计目标

- **多层级覆盖**：支持全局、项目本地、环境变量、命令行参数多层配置
- **Provider 自动发现**：根据环境变量自动检测可用的 LLM 提供商
- **智能默认值**：未配置时自动选择最优模型
- **热更新支持**：部分配置可在运行时修改（如主题、模型）

---

## 2. 配置层级

配置按优先级从高到低排列：

```
┌─────────────────────────────────────┐
│  第 1 层：命令行参数                  │
│  --debug, --cwd, --prompt            │
├─────────────────────────────────────┤
│  第 2 层：环境变量                    │
│  ANTHROPIC_API_KEY, OPENAI_API_KEY   │
├─────────────────────────────────────┤
│  第 3 层：本地配置                    │
│  工作目录/.opencode.json              │
├─────────────────────────────────────┤
│  第 4 层：全局配置                    │
│  ~/.config/opencode/.opencode.json   │
├─────────────────────────────────────┤
│  第 5 层：默认值                      │
│  代码中硬编码的默认值                  │
└─────────────────────────────────────┘
```

**优先级规则**：上层配置覆盖下层配置。例如，环境变量中的 API Key 会覆盖配置文件中的值。

---

## 3. 配置文件结构

### 3.1 完整配置示例

```json
{
  "$schema": "./opencode-schema.json",
  "data": {
    "directory": ".opencode"
  },
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
  },
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
  },
  "shell": {
    "path": "/bin/bash",
    "args": ["-l"]
  },
  "contextPaths": [
    "OpenCode.md",
    ".cursorrules"
  ],
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  },
  "lsp": {
    "go": {
      "command": "gopls"
    }
  },
  "autoCompact": true,
  "debug": false
}
```

### 3.2 配置项说明

| 配置项 | 说明 |
|--------|------|
| `data.directory` | 数据存储目录（数据库、日志等） |
| `providers` | LLM 提供商配置（API Key、禁用状态） |
| `agents` | Agent 角色配置（模型、maxTokens） |
| `shell` | Shell 配置（路径、参数） |
| `contextPaths` | 自动加载的项目上下文文件路径 |
| `mcpServers` | MCP 服务器配置 |
| `lsp` | 语言服务器配置 |
| `autoCompact` | 是否启用自动会话摘要 |
| `debug` | 是否启用 Debug 日志 |

---

## 4. 环境变量映射

### 4.1 API Key 环境变量

| 环境变量 | 对应配置 | 说明 |
|----------|----------|------|
| `ANTHROPIC_API_KEY` | `providers.anthropic.apiKey` | Anthropic Claude |
| `OPENAI_API_KEY` | `providers.openai.apiKey` | OpenAI GPT |
| `GEMINI_API_KEY` | `providers.gemini.apiKey` | Google Gemini |
| `GROQ_API_KEY` | `providers.groq.apiKey` | Groq |
| `OPENROUTER_API_KEY` | `providers.openrouter.apiKey` | OpenRouter |
| `GITHUB_TOKEN` | `providers.copilot.apiKey` | GitHub Copilot |
| `AZURE_OPENAI_ENDPOINT` | `providers.azure` | Azure OpenAI |

### 4.2 其他环境变量

| 环境变量 | 说明 |
|----------|------|
| `SHELL` | 默认 shell 路径 |
| `VERTEXAI_PROJECT` | Google Cloud VertexAI 项目 |
| `VERTEXAI_LOCATION` | Google Cloud VertexAI 区域 |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock 访问密钥 |
| `AWS_SECRET_ACCESS_KEY` | AWS Bedrock 秘密密钥 |
| `AWS_REGION` | AWS 区域 |

---

## 5. 自动模型选择

当用户未配置 `agents` 时，系统按优先级自动选择默认模型：

```
1. GitHub Copilot
   - 检查 GITHUB_TOKEN 或 ~/.config/github-copilot/hosts.json
   - 默认模型：GPT-4o

2. Anthropic
   - 检查 ANTHROPIC_API_KEY
   - 默认模型：Claude 4 Sonnet

3. OpenAI
   - 检查 OPENAI_API_KEY
   - 默认模型：GPT-4.1

4. Google Gemini
   - 检查 GEMINI_API_KEY
   - 默认模型：Gemini 2.5

5. Groq
   - 检查 GROQ_API_KEY
   - 默认模型：QWEN QWQ

6. OpenRouter
   - 检查 OPENROUTER_API_KEY
   - 默认模型：Claude 3.7 Sonnet

7. AWS Bedrock
   - 检查 AWS 凭证
   - 默认模型：Claude 3.7 Sonnet

8. Azure OpenAI
   - 检查 AZURE_OPENAI_ENDPOINT
   - 默认模型：GPT-4.1

9. Google Cloud VertexAI
   - 检查 VERTEXAI_PROJECT + VERTEXAI_LOCATION
   - 默认模型：Gemini 2.5
```

**设计意图**：用户只需配置 API Key，无需关心具体模型选择，降低使用门槛。

---

## 6. 上下文路径配置

### 6.1 默认加载的文件

系统启动时自动检查以下文件：

```
.github/copilot-instructions.md
.cursorrules
.cursor/rules/
CLAUDE.md
CLAUDE.local.md
opencode.md
opencode.local.md
OpenCode.md
OpenCode.local.md
OPENCODE.md
OPENCODE.local.md
```

### 6.2 自定义上下文路径

用户可通过配置添加自定义路径：

```json
{
  "contextPaths": [
    "README.md",
    "docs/",
    "CONTRIBUTING.md"
  ]
}
```

**加载规则**
- 文件不存在则静默跳过
- 支持目录路径（递归读取该目录下所有文件）
- 使用 sync.Once 缓存，进程内只加载一次

---

## 7. 配置加载流程

### 7.1 加载顺序

```
1. 设置默认值
   ↓
2. 读取全局配置文件
   - ~/.config/opencode/.opencode.json
   - ~/.opencode.json
   ↓
3. 读取本地配置文件
   - 工作目录/.opencode.json
   - 合并到全局配置（本地优先）
   ↓
4. 读取环境变量
   - API Key 等
   - 覆盖配置文件中的值
   ↓
5. 应用命令行参数
   - --debug, --cwd 等
   - 覆盖所有之前的值
   ↓
6. 验证配置
   - 检查模型 ID 是否有效
   - 检查提供商是否可用
   - 设置默认模型（如果未配置）
```

### 7.2 使用 Viper 框架

OpenCode 使用 Viper 作为配置管理框架：

```go
// 设置配置名和类型
viper.SetConfigName(".opencode")
viper.SetConfigType("json")

// 添加搜索路径
viper.AddConfigPath("$HOME")
viper.AddConfigPath("$XDG_CONFIG_HOME/opencode")

// 设置环境变量前缀
viper.SetEnvPrefix("OPENCODE")
viper.AutomaticEnv()

// 读取配置
viper.ReadInConfig()
```

**Viper 优势**
- 支持多种格式（JSON、YAML、TOML）
- 自动环境变量映射
- 配置合并和覆盖
- 默认值设置

---

## 8. 运行时配置更新

部分配置支持运行时修改：

### 8.1 切换模型

```go
func (a *Agent) Update(agentName AgentName, modelID ModelID) (Model, error) {
    // 1. 更新内存中的配置
    config.UpdateAgentModel(agentName, modelID)
    
    // 2. 重新创建 Provider
    newProvider, _ := createAgentProvider(agentName)
    
    // 3. 替换 Agent 的 Provider
    a.provider = newProvider
    
    return newProvider.Model(), nil
}
```

### 8.2 切换主题

```go
func UpdateTheme(themeName string) error {
    // 1. 更新内存配置
    cfg.TUI.Theme = themeName
    
    // 2. 写入配置文件
    return updateCfgFile(func(config *Config) {
        config.TUI.Theme = themeName
    })
}
```

**限制**：并非所有配置都支持热更新（如 API Key 修改后需要重启）。

---

## 9. 配置验证

### 9.1 验证内容

- **模型有效性**：检查配置的模型 ID 是否在支持列表中
- **提供商可用性**：检查模型对应的提供商是否配置了 API Key
- **Token 限制**：检查 maxTokens 是否合理（不超过上下文窗口一半）
- **推理参数**：检查 reasoningEffort 是否合法（low/medium/high）

### 9.2 自动修复

当配置无效时，系统尝试自动修复：

```go
// 模型不存在 → 回退到默认模型
if !modelExists {
    setDefaultModelForAgent(agentName)
}

// 提供商未启用 → 检查环境变量
if provider.Disabled {
    if apiKey := getProviderAPIKey(provider); apiKey != "" {
        enableProvider(provider, apiKey)
    }
}

// maxTokens 不合理 → 调整到合理范围
if maxTokens > contextWindow/2 {
    maxTokens = contextWindow / 2
}
```

---

## 10. 设计亮点

| 设计点 | 说明 |
|--------|------|
| **五层优先级** | 命令行 > 环境变量 > 本地配置 > 全局配置 > 默认值 |
| **自动发现** | 根据环境变量自动检测可用的 LLM 提供商 |
| **智能默认** | 未配置时按优先级自动选择最优模型 |
| **生态兼容** | 同时读取 Cursor、Copilot、Claude 的规则文件 |
| **运行时更新** | 部分配置（主题、模型）支持热切换 |
| **自动修复** | 配置无效时自动回退到默认值 |
| **JSON Schema** | 提供 schema 文件，IDE 可自动补全配置 |

---

## 11. 一句话概括

OpenCode 的配置管理 = **"通过五层优先级和自动发现机制，让用户只需配置 API Key 就能开始使用，同时保留高级用户精细化配置的能力"**。

它降低了入门门槛，又不限制高级用法。

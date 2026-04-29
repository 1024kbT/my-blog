---
title: 本地数据持久化设计
description: 围绕 SQLite schema、迁移和访问模式整理本地数据持久化设计。
outline: deep
---

# 本地数据持久化设计

基于 OpenCode 项目，梳理 SQLite 数据库的 schema 设计、迁移策略和访问模式。

---

## 1. 设计目标

- **零配置**：无需安装和配置数据库服务，开箱即用
- **单文件存储**：数据库就是一个文件，便于备份和迁移
- **跨平台**：Windows/macOS/Linux 都能使用
- **数据安全**：即使程序崩溃，已保存的数据不会丢失
- **Schema 演进**：支持平滑的数据库结构升级

---

## 2. 数据库选型：SQLite

### 2.1 为什么选择 SQLite？

| 特性 | SQLite | MySQL/PostgreSQL |
|------|--------|------------------|
| 部署 | 零部署，内嵌到应用 | 需要独立安装和配置 |
| 存储 | 单文件 | 多文件/目录 |
| 并发 | 适合读多写少 | 高并发性能好 |
| 资源占用 | 极低 | 较高 |
| 跨平台 | 完美支持 | 需要额外配置 |
| 备份 | 复制文件即可 | 需要专用工具 |

**OpenCode 的场景特点**：
- 单机使用，无多用户并发
- 读操作（加载历史）远多于写操作
- 需要离线工作
- 用户不懂数据库运维

SQLite 完美匹配这些需求。

### 2.2 WAL 模式

启用 Write-Ahead Logging 模式提升并发性能：

```sql
PRAGMA journal_mode = WAL;
```

**WAL 优势**
- 读操作不会阻塞写操作
- 写操作不会阻塞读操作
- 崩溃恢复更快

---

## 3. 数据库 Schema

### 3.1 实体关系

```
sessions (会话)
  ├── id: TEXT PK
  ├── parent_session_id: TEXT FK (自引用)
  ├── title: TEXT
  ├── message_count: INTEGER
  ├── prompt_tokens: INTEGER
  ├── completion_tokens: INTEGER
  ├── cost: REAL
  ├── summary_message_id: TEXT
  ├── created_at: INTEGER
  └── updated_at: INTEGER

messages (消息)
  ├── id: TEXT PK
  ├── session_id: TEXT FK → sessions
  ├── role: TEXT (user/assistant/tool)
  ├── parts: TEXT (JSON)
  ├── model: TEXT
  ├── created_at: INTEGER
  ├── updated_at: INTEGER
  └── finished_at: INTEGER

files (文件历史)
  ├── id: TEXT PK
  ├── session_id: TEXT FK → sessions
  ├── path: TEXT
  ├── content: TEXT
  ├── version: TEXT
  ├── created_at: INTEGER
  └── updated_at: INTEGER
```

### 3.2 表结构详解

**sessions 表**

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    parent_session_id TEXT,
    title TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
    prompt_tokens INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
    completion_tokens INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
    cost REAL NOT NULL DEFAULT 0.0 CHECK (cost >= 0.0),
    updated_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
```

**关键设计**
- `id`：使用 TEXT 存储 UUID，便于生成和阅读
- `parent_session_id`：支持会话树结构（虽然当前主要用于标题/任务子会话）
- `message_count`：通过触发器自动维护，无需应用层计算
- `CHECK` 约束：确保数值字段不为负数

**messages 表**

```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    parts TEXT NOT NULL DEFAULT '[]',
    model TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    finished_at INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
);
```

**关键设计**
- `parts`：JSON 文本存储复杂的多段内容结构
- `role`：区分 user / assistant / tool 三种角色
- `finished_at`：流式响应结束时设置，用于统计响应时间
- `ON DELETE CASCADE`：删除会话时自动删除关联消息

**files 表**

```sql
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    path TEXT NOT NULL,
    content TEXT NOT NULL,
    version TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
    UNIQUE(path, session_id, version)
);
```

**关键设计**
- `content`：保存文件修改前的快照，支持回滚
- `version`：标识文件版本，支持同一文件的多次修改
- `UNIQUE(path, session_id, version)`：防止重复记录

---

## 4. 数据库触发器

### 4.1 自动更新时间戳

```sql
CREATE TRIGGER update_sessions_updated_at
AFTER UPDATE ON sessions
BEGIN
    UPDATE sessions SET updated_at = strftime('%s', 'now')
    WHERE id = new.id;
END;
```

**作用**：每次更新记录时自动更新 `updated_at` 字段。

### 4.2 自动维护消息计数

```sql
-- 插入消息时 +1
CREATE TRIGGER update_session_message_count_on_insert
AFTER INSERT ON messages
BEGIN
    UPDATE sessions SET message_count = message_count + 1
    WHERE id = new.session_id;
END;

-- 删除消息时 -1
CREATE TRIGGER update_session_message_count_on_delete
AFTER DELETE ON messages
BEGIN
    UPDATE sessions SET message_count = message_count - 1
    WHERE id = old.session_id;
END;
```

**作用**：无需应用层维护，数据库自动保证 `message_count` 的准确性。

---

## 5. 数据访问层

### 5.1 技术选型：sqlc

OpenCode 使用 sqlc 从 SQL 生成类型安全的 Go 代码：

**优势**
- 写 SQL 查询，自动生成 Go 结构体和方法
- 编译时检查 SQL 语法
- 类型安全，避免运行时类型错误
- 支持复杂查询和连接

**工作流程**

```
1. 编写 SQL 查询文件（.sql）
   ↓
2. 运行 sqlc generate
   ↓
3. 自动生成：
   - 数据模型结构体（models.go）
   - 查询接口（querier.go）
   - 查询实现（db.go）
```

### 5.2 查询示例

**创建会话**

```sql
-- name: CreateSession :one
INSERT INTO sessions (
    id, parent_session_id, title, updated_at, created_at
) VALUES (
    ?, ?, ?, ?, ?
) RETURNING *;
```

生成的方法：

```go
func (q *Queries) CreateSession(ctx context.Context, arg CreateSessionParams) (Session, error)
```

**查询会话消息**

```sql
-- name: ListMessagesBySession :many
SELECT * FROM messages
WHERE session_id = ?
ORDER BY created_at ASC;
```

生成的方法：

```go
func (q *Queries) ListMessagesBySession(ctx context.Context, sessionID string) ([]Message, error)
```

### 5.3 Service 层封装

在 sqlc 生成的代码之上，封装 Service 层提供业务语义：

```go
type Service interface {
    Create(ctx context.Context, title string) (Session, error)
    Get(ctx context.Context, id string) (Session, error)
    List(ctx context.Context) ([]Session, error)
    Save(ctx context.Context, session Session) (Session, error)
    Delete(ctx context.Context, id string) error
}
```

**设计意图**

- sqlc 处理底层 SQL 和类型转换
- Service 层处理业务逻辑和事件发布
- 两者分离，便于测试和维护

---

## 6. 数据序列化

### 6.1 Message Parts 的 JSON 序列化

消息内容使用 JSON 存储在 `messages.parts` 字段：

```go
// 内存中的 Parts（多种类型）
parts := []ContentPart{
    TextContent{Text: "Hello"},
    ToolCall{ID: "call_1", Name: "view", Input: "{}"},
    Finish{Reason: "end_turn"},
}

// 序列化为 JSON
jsonData, _ := json.Marshal(parts)
// 存储到数据库: '[{"type":"text","data":{"text":"Hello"}}, ...]'

// 从数据库读取后反序列化
parts, _ := unmarshallParts(jsonData)
```

**为什么用 JSON？**

- SQLite 不支持数组类型，JSON 是最佳替代
- 灵活支持多种内容类型（文本、工具调用、图片等）
- 便于调试（可直接查看数据库中的 JSON 内容）

**缺点**

- 无法直接 SQL 查询 Parts 内部字段
- 序列化/反序列化有性能开销
- 但按会话加载的场景下，开销可接受

---

## 7. 数据库迁移

### 7.1 迁移工具：goose

使用 goose 管理数据库 schema 的演进：

**迁移文件命名**

```
20250424200609_initial.sql
20250515105448_add_summary_message_id.sql
```

**迁移文件内容**

```sql
-- +goose Up
-- +goose StatementBegin
ALTER TABLE sessions ADD COLUMN summary_message_id TEXT;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE sessions DROP COLUMN summary_message_id;
-- +goose StatementEnd
```

### 7.2 迁移流程

```
应用启动
  ↓
连接 SQLite 数据库
  ↓
检查当前迁移版本
  ↓
如果有未执行的迁移
  ↓
按顺序执行迁移文件
  ↓
更新迁移版本记录
  ↓
继续启动
```

**设计意图**

- 版本化 schema 变更，可追踪历史
- 支持回滚（Down 迁移）
- 自动执行，用户无感知

---

## 8. 文件存储位置

### 8.1 数据库文件

```
~/.opencode/
  └── opencode.db          # SQLite 数据库文件
  └── opencode.db-wal      # WAL 日志文件
  └── opencode.db-shm      # 共享内存文件
```

### 8.2 配置数据目录

```json
{
  "data": {
    "directory": ".opencode"
  }
}
```

- 默认：`~/.opencode/`
- 可配置为其他路径

---

## 9. 设计亮点

| 设计点 | 说明 |
|--------|------|
| **SQLite 零配置** | 无需安装数据库服务，单文件存储 |
| **WAL 模式** | 提升读写并发性能 |
| **触发器** | 自动维护 message_count 和时间戳 |
| **CASCADE 删除** | 删除会话时自动清理关联数据 |
| **sqlc 代码生成** | 从 SQL 生成类型安全的 Go 代码 |
| **JSON Parts** | 灵活存储复杂消息结构 |
| **goose 迁移** | 版本化 schema 演进，自动执行 |
| **CHECK 约束** | 数据库层保证数据合法性 |

---

## 10. 一句话概括

OpenCode 的数据持久化 = **"通过 SQLite + sqlc + goose 的组合，实现零配置、类型安全、可演进的数据存储，让开发者专注于业务逻辑而非数据库运维"**。

它是系统的"记忆仓库"，所有对话历史、文件变更都安全地保存在本地。

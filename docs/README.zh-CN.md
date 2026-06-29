# url-to-markdown

[English](../README.md)

MCP 服务器，提取网页内容并转换为干净的 Markdown 格式。

## 功能特性

- 使用 Mozilla Readability 从任意 URL 提取可读内容
- 使用 Turndown 将 HTML 转换为干净的 Markdown
- 内置重试逻辑处理瞬时故障
- SSRF 防护阻止访问私有网络
- Readability 失败时自动降级提取

## 安装

```bash
pnpm install
pnpm build
```

## 使用方法

### 配合 Claude Desktop

在 Claude MCP 配置中添加:

```json
{
  "mcpServers": {
    "url-to-markdown": {
      "command": "node",
      "args": ["/path/to/url-to-markdown/build/index.js"]
    }
  }
}
```

### 工具: `extract`

从 URL 提取内容并返回 Markdown。

**参数:**
- `url` (string, 必填): 要提取内容的 URL（必须以 http:// 或 https:// 开头）

**返回:** Markdown 内容或错误信息。

### 工具: `search`

搜索微信公众号文章。

**参数:**
- `query` (string, 必填): 搜索关键词
- `page` (number, 可选): 页码，默认 1

**返回:** 搜索结果列表或错误消息。

## 开发

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 监听模式 |
| `pnpm test` | 运行测试 |
| `pnpm build` | 编译 |
| `pnpm lint` | 代码检查 |
| `pnpm format` | 代码格式化 |

## 贡献

参见 [CONTRIBUTING.md](../CONTRIBUTING.md)。

## 许可证

本项目基于 [GNU 宽松通用公共许可证 v2.1](../LICENSE) 发布。

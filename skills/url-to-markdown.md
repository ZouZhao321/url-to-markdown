---
name: url-to-markdown
description: 从 URL 提取内容并转换为 Markdown，支持搜索微信公众号文章
---

## 工具

- `extract`: 从 URL 提取干净可读的内容并转换为 Markdown
- `search`: 搜索微信公众号文章

## 规则

1. 用户要搜索微信文章 → 调用 `search(query)`
2. 用户要获取文章正文 → 调用 `extract(url)`
3. 用户给了 URL 要提取内容 → 调用 `extract(url)`
4. 用户要搜索并提取 → 先 `search`，再对结果调用 `extract`
5. 遇到反爬错误 → 告知用户稍后重试，不要自动重试

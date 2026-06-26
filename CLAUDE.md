# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 操作此仓库时提供指引。

## Karpathy 编码准则

1. **先想再写** — 明确假设再动手，不确定就问，不猜
2. **保持简单** — 最小代码解决问题，无超前抽象，200 行能 50 行则重写
3. **手术刀式修改** — 只动该动的，不改周围代码，不重构未坏之物
4. **目标驱动** — 先定义验证标准再执行，写 test 复现 bug 再修

## 需用户明确要求的操作

以下操作只有在用户明确要求时才可执行，不得主动操作：

- **合并 PR** — 只能创建 PR，合并需用户明确指示；合并前必须先获取 CI 状态，CI 检查失败的 PR 不得合并
- **删除 git 分支** — `git branch -D` 等删除操作
- **删除 git worktree** — `git worktree remove` 等操作

## Git 规范

- 提交前必须执行 `git status` 和 `git log -10`，确认当前分支状态和最近提交记录
- 提交格式：`type(scope): 中文描述` — 遵循 Conventional Commits
- type: feat / fix / chore / docs / refactor / style / test
- 分支命名：`type/description`（如 `feat/dark-mode`）
- Worktree 命名：匹配分支名去掉 `type/` 前缀（如 `feat/dark-mode` → `dark-mode`）

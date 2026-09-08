# 全屏退出按钮实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全屏时在左上角显示退出全屏按钮，退出后隐藏，并重新部署主站。

**Architecture:** 保持单文件应用结构，在现有全局设置按钮旁新增独立全局按钮。由 `syncFullscreenUI` 根据 Fullscreen API 状态控制可见性，`exitFullscreen` 执行退出并处理失败。

**Tech Stack:** 原生 HTML/CSS/JavaScript、Fullscreen API、Node test runner、Cloudflare Pages。

---

### Task 1: 实现全屏退出按钮

**Files:**
- Modify: `index.html`

- [ ] 增加左上角退出全屏图标按钮及无障碍名称。
- [ ] 增加 `.fullscreen-only` 隐藏规则与全屏状态显示规则。
- [ ] 增加 `syncFullscreenUI()` 与 `exitFullscreen()`。
- [ ] 监听 `fullscreenchange`，按钮点击停止冒泡。

### Task 2: 回归与界面验证

**Files:**
- Test: `tests/logic.test.mjs`

- [ ] 运行脚本语法检查。
- [ ] 运行 6 组逻辑测试。
- [ ] 在 390×844 视口验证按钮位置、显示/隐藏、退出不抽号。

### Task 3: 部署

**Files:**
- Update generated: `dist/index.html`

- [ ] 复制最新文件到 `dist`。
- [ ] 部署到 Cloudflare Pages 项目 `random5261`。
- [ ] 验证 `https://random5261.pages.dev/` 返回新版内容与 200。
- [ ] 提交并推送 GitHub。

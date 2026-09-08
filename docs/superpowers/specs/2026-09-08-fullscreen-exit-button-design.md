# 全屏退出按钮设计

日期：2026-09-08
状态：用户授权直接执行

## 目标

为随机抽号器添加全屏状态下的显式退出按钮，并将更新重新部署到 Cloudflare Pages 主地址 `https://random5261.pages.dev/`。

## 交互

- 左上角放置 44×44px 的图标按钮，使用四个向内角标示“退出全屏”。
- 仅当浏览器 `document.fullscreenElement` 存在时显示，非全屏时隐藏；右上角设置齿轮始终不变。
- 点击按钮调用 `document.exitFullscreen()`；事件停止冒泡，不能触发重新抽号。
- 监听 `fullscreenchange`，确保系统返回键、浏览器 UI 操作或按钮退出后，按钮状态立刻同步。
- 不支持 Fullscreen API 的浏览器与 iOS standalone 模式保持隐藏，静默降级。

## 验证

- 函数单元测试继续全通过。
- 浏览器内通过可控的 Fullscreen API stub 验证：进入状态显示按钮、点击调用退出且不抽取、退出状态隐藏按钮。
- 发布 `index.html` 与图标到 Cloudflare Pages 的 `random5261` 项目，验证生产地址和静态资源返回 200。

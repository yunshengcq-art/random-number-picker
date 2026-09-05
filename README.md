# 随机抽号器

课堂/活动用的随机数抽取工具。大转盘动画 → 号码占满全屏 → 点屏幕再抽。

## 在线地址

- **Cloudflare Pages（国内推荐）**：https://random-number-picker.pages.dev/
- GitHub Pages（备用）：https://yunshengcq-art.github.io/random-number-picker/

## 手机安装（Android）

1. 手机浏览器（Chrome）打开在线地址（或把 `index.html` 传到手机用 Chrome 打开）。
2. 菜单 → **安装应用 / 添加到主屏幕**，之后从桌面图标全屏启动。

## 手机安装（iOS / iPhone）

1. iPhone 上用 **Safari** 打开在线地址（推荐 Cloudflare Pages 那个）。
2. 底部中间的**分享按钮** → 下滑找到 **「添加到主屏幕」** → 确认。
3. 主屏出现「抽号器」图标，点开即无浏览器工具栏全屏运行（localStorage 数据不受 Safari 7 天清限影响）。

> 若只是临时玩一下而不装成 app：AirDrop/微信把 `index.html` 存到 iPhone「文件」，
> 在文件 App 里点开可预览运行，但体验打折（无全屏、无主屏图标）。

> 想要更接近原生 app 的体验（安装提示、启动画面、生成 WebAPK），把 `index.html`
> 上传到任意静态托管（Cloudflare Pages / GitHub Pages / Netlify 等）后用手机
> 访问该网址再「安装应用」即可；此方式打开时需要联网（本地文件方式则完全离线可用）。

## 使用

- **点一下屏幕**：开始转盘抽取；转动中点击无效。
- **结果页**：号码占满全屏，点任意处再抽。
- **右上角齿轮**：任何界面都能进设置——范围（1–9999 内任意整数区间）、「不重复抽取」、查看/清空最近 20 条记录。
- 「不重复抽取」开启后，抽过的号不再出现；抽完会提示重置抽取池。

## 开发

- 单元测试：`node --test tests/logic.test.mjs`
- 本地预览：`python3 -m http.server 8137` 后访问 `http://127.0.0.1:8137/index.html`

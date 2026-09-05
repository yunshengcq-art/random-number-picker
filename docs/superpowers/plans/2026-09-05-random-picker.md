# 随机数抽号器 PWA 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 单文件 HTML PWA：大转盘动画 → 结果数字撑满全屏 → 点屏幕重抽，范围可设置。

**Architecture:** 一个自包含 `index.html`（内联 CSS/JS）。JS 分两层：`/*__PURE_START__*/…/*__PURE_END__*/` 之间的纯逻辑（可在 Node 里单测），其余为 DOM/Canvas 层（浏览器验收）。状态机三态：转盘（idle/spinning）→ 结果 → 设置弹层。

**Tech Stack:** 原生 HTML/CSS/JS、Canvas 2D、`crypto.getRandomValues`、`<dialog>`、data-URL manifest、Node 内置 test runner（仅测纯逻辑）。

**Spec:** `docs/superpowers/specs/2026-09-05-random-picker-design.md`

---

## 文件结构

- `index.html` — 全部应用代码（HTML + CSS + 内联 JS）
- `tests/logic.test.mjs` — 纯逻辑单元测试（node --test）
- `README.md` — 手机安装/使用指引

所有 JS 追加在 `index.html` 末尾的 `<script>` 内；纯逻辑必须放在哨兵注释之间，供测试提取。

---

### Task 1: HTML 骨架 + CSS + PWA meta

**Files:**
- Create: `index.html`

- [ ] **Step 1: 写入完整骨架**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#111827">
<meta name="mobile-web-app-capable" content="yes">
<title>随机抽号器</title>
<link rel="manifest" href='data:application/manifest+json,{"name":"随机抽号器","short_name":"抽号器","start_url":".","display":"fullscreen","background_color":"%23111827","theme_color":"%23111827","icons":[{"src":"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 rx=%2720%27 fill=%27%234f46e5%27/%3E%3Ctext x=%2750%27 y=%2768%27 font-size=%2752%27 text-anchor=%27middle%27 fill=%27white%27 font-family=%27sans-serif%27%3E%E6%8A%BD%3C/text%3E%3C/svg%3E","sizes":"any","type":"image/svg+xml","purpose":"any"}]}'>
<style>
:root { color-scheme: dark; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  background: #111827; color: #f8fafc; overflow: hidden;
  font-family: system-ui, -apple-system, "PingFang SC", "Noto Sans SC", sans-serif;
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
  touch-action: manipulation; cursor: pointer;
}
.scene { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; }
#resultScene { display: none; transition: background .3s; }
body.showing-result #wheelScene { display: none; }
body.showing-result #resultScene { display: flex; }
#wheelWrap { position: relative; }
#wheelCanvas { display: block; }
#pointer {
  position: absolute; top: -16px; left: 50%; transform: translateX(-50%); z-index: 2;
  width: 0; height: 0; border: 16px solid transparent; border-top: 30px solid #f8fafc; border-bottom: 0;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / .4));
}
#wheelCenterNum {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-variant-numeric: tabular-nums; pointer-events: none;
}
#wheelHint, #resultHint {
  position: fixed; bottom: max(28px, env(safe-area-inset-bottom)); left: 0; right: 0;
  text-align: center; color: rgb(248 250 252 / .65); font-size: 17px; letter-spacing: .12em; pointer-events: none;
}
#gearBtn {
  position: fixed; top: max(16px, env(safe-area-inset-top)); right: 16px; z-index: 5;
  width: 44px; height: 44px; border-radius: 50%; cursor: pointer;
  border: 1px solid rgb(248 250 252 / .25); background: rgb(248 250 252 / .08);
  display: flex; align-items: center; justify-content: center;
}
#gearBtn svg { width: 22px; height: 22px; fill: #f8fafc; }
body.showing-result #gearBtn { display: none; }
#resultNum {
  font-weight: 900; line-height: 1; font-variant-numeric: tabular-nums; color: #f8fafc;
  text-shadow: 0 8px 40px rgb(0 0 0 / .45); animation: pop .35s ease-out;
}
@keyframes pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
dialog {
  width: min(92vw, 400px); border: 0; border-radius: 16px; padding: 20px;
  background: #1f2937; color: #f8fafc; cursor: default;
}
dialog::backdrop { background: rgb(0 0 0 / .6); backdrop-filter: blur(2px); }
dialog h2 { font-size: 17px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
dialog h2.sub { margin-top: 18px; }
.row { display: flex; gap: 12px; }
.field { flex: 1; }
.field label { display: block; font-size: 13px; color: #9ca3af; margin-bottom: 6px; }
.field input, dialog input[type="number"] {
  width: 100%; padding: 10px 12px; border-radius: 8px; font-size: 18px;
  border: 1px solid #374151; background: #111827; color: #f8fafc;
}
#settingsError { color: #f87171; font-size: 13px; min-height: 1.2em; margin: 6px 0 2px; }
.switchRow { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; font-size: 15px; }
.switchRow input { width: 20px; height: 20px; accent-color: #4f46e5; }
#poolRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 0 2px; }
#poolStatus { font-size: 13px; color: #9ca3af; }
#historyList { list-style: none; max-height: 170px; overflow: auto; display: flex; flex-wrap: wrap; gap: 6px; }
#historyList li { background: #111827; border: 1px solid #374151; padding: 4px 12px; border-radius: 999px; font-size: 14px; font-variant-numeric: tabular-nums; }
#historyList li.empty { border: 0; background: none; color: #6b7280; }
.linkBtn { border: 0; background: none; color: #818cf8; font-size: 14px; cursor: pointer; }
.btns { display: flex; gap: 10px; margin-top: 18px; }
.btns .primary { flex: 1; padding: 12px; border-radius: 10px; border: 0; background: #4f46e5; color: #fff; font-size: 16px; cursor: pointer; }
.btns .ghost, #poolResetBtn {
  flex: 1; padding: 12px; border-radius: 10px; border: 1px solid #374151;
  background: transparent; color: #e5e7eb; font-size: 16px; cursor: pointer;
}
#poolResetBtn { flex: 0 0 auto; padding: 6px 14px; font-size: 13px; }
#toast {
  position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%) translateY(8px); z-index: 9;
  background: rgb(31 41 55 / .95); border: 1px solid #374151; padding: 10px 16px; border-radius: 10px;
  font-size: 14px; opacity: 0; transition: .25s; pointer-events: none; white-space: nowrap;
}
#toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
</style>
</head>
<body>
<section id="wheelScene" class="scene">
  <button id="gearBtn" aria-label="设置" type="button">
    <svg viewBox="0 0 24 24"><path d="M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.6.22l2.39-.96c.5.39 1.05.7 1.63.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.58-.24 1.13-.55 1.63-.94l2.39.96c.2.1.47.01.6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>
  </button>
  <div id="wheelWrap">
    <div id="pointer"></div>
    <canvas id="wheelCanvas"></canvas>
    <div id="wheelCenterNum">?</div>
  </div>
  <p id="wheelHint">点一下屏幕开始</p>
</section>
<section id="resultScene" class="scene">
  <div id="resultNum"></div>
  <p id="resultHint">点击屏幕再抽一次</p>
</section>
<dialog id="settingsDialog">
  <h2>设置</h2>
  <div class="row">
    <div class="field"><label for="minInput">起始数字</label><input id="minInput" type="number" inputmode="numeric" min="1" max="9999" step="1"></div>
    <div class="field"><label for="maxInput">结束数字</label><input id="maxInput" type="number" inputmode="numeric" min="1" max="9999" step="1"></div>
  </div>
  <p id="settingsError"></p>
  <div class="switchRow">
    <label for="noRepeatChk">不重复抽取（抽过的号不再出现）</label>
    <input id="noRepeatChk" type="checkbox">
  </div>
  <div id="poolRow" hidden>
    <span id="poolStatus"></span>
    <button id="poolResetBtn" type="button">重置抽取池</button>
  </div>
  <h2 class="sub">最近记录 <button id="clearHistoryBtn" class="linkBtn" type="button">清空</button></h2>
  <ol id="historyList"></ol>
  <div class="btns">
    <button id="closeDialogBtn" class="ghost" type="button">取消</button>
    <button id="saveBtn" class="primary" type="button">保存</button>
  </div>
</dialog>
<div id="toast" role="status"></div>
<script>
'use strict';
/*__PURE_START__*/
/*__PURE_END__*/
</script>
</body>
</html>
```

- [ ] **Step 2: 语法检查（此时 script 仅哨兵注释，应通过）**

Run: `node -e "const s=require('fs').readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1]; new Function(s); console.log('syntax OK')"`
Expected: `syntax OK`

- [ ] **Step 3: 浏览器打开确认骨架无报错**

Run: `npx -y serve -l 8123 .` 后用浏览器打开 `http://localhost:8123`（或直接 file:// 打开）。
Expected: 深色背景、居中「?」与「点一下屏幕开始」、右上角齿轮；控制台无报错。

- [ ] **Step 4: Commit**

```bash
git add index.html && git commit -m "feat: 页面骨架与样式"
```

---

### Task 2: 纯逻辑层（TDD）

**Files:**
- Create: `tests/logic.test.mjs`
- Modify: `index.html`（`/*__PURE_START__*/` 与 `/*__PURE_END__*/` 之间）

- [ ] **Step 1: 写失败测试 `tests/logic.test.mjs`**

```js
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/\/\*__PURE_START__\*\/([\s\S]*?)\/\*__PURE_END__\*\//);
assert.ok(match, 'index.html 中未找到 /*__PURE_START__*/ … /*__PURE_END__*/ 纯逻辑块');
const api = ['createStorage', 'loadJSON', 'saveJSON', 'randomInt', 'validateRange', 'buildPool', 'drawFromPool', 'removeFromPool', 'pushHistory'];
const scope = {};
new Function('scope', match[1] + '\n' + api.map((n) => `scope.${n} = ${n};`).join('\n'))(scope);
const { randomInt, validateRange, buildPool, drawFromPool, removeFromPool, pushHistory, createStorage, loadJSON, saveJSON } = scope;

const stubRng = (value) => (buf) => { buf[0] = value >>> 0; };

test('randomInt 边界与确定性', () => {
  assert.equal(randomInt(5, 10, stubRng(0)), 5);
  assert.equal(randomInt(5, 10, stubRng(5)), 10);
  assert.equal(randomInt(3, 3, stubRng(999)), 3);
});

test('randomInt 真实随机都在范围内', () => {
  for (let i = 0; i < 500; i++) {
    const v = randomInt(1, 7);
    assert.ok(v >= 1 && v <= 7, `越界值 ${v}`);
  }
  for (let i = 0; i < 100; i++) {
    const v = randomInt(1, 9999);
    assert.ok(v >= 1 && v <= 9999);
  }
});

test('validateRange 校验规则', () => {
  assert.deepEqual(validateRange('1', '100'), { ok: true, min: 1, max: 100 });
  assert.deepEqual(validateRange(5, 5), { ok: true, min: 5, max: 5 });
  assert.equal(validateRange('10', '2').ok, false);
  assert.equal(validateRange('2.5', '10').ok, false);
  assert.equal(validateRange('', '10').ok, false);
  assert.equal(validateRange('0', '10').ok, false);
  assert.equal(validateRange('1', '10000').ok, false);
});

test('抽取池操作', () => {
  assert.deepEqual(buildPool(1, 3), [1, 2, 3]);
  const pool = [10, 20, 30, 40];
  assert.equal(drawFromPool(pool, stubRng(7)), 30);
  assert.equal(drawFromPool([], stubRng(7)), null);
  removeFromPool(pool, 20);
  assert.deepEqual(pool, [10, 30, 40]);
  removeFromPool(pool, 99);
  assert.deepEqual(pool, [10, 30, 40]);
});

test('历史记录上限 20 条、新的在前', () => {
  let h = [];
  for (let i = 1; i <= 25; i++) h = pushHistory(h, i);
  assert.equal(h.length, 20);
  assert.equal(h[0], 25);
});

test('存储降级与 JSON 读写', () => {
  const store = createStorage();
  saveJSON(store, 'k', { a: 1 });
  assert.deepEqual(loadJSON(store, 'k', null), { a: 1 });
  assert.equal(loadJSON(store, 'missing', 'fb'), 'fb');
  store.setItem('bad', '{oops');
  assert.equal(loadJSON(store, 'bad', 'fb'), 'fb');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test tests/`
Expected: FAIL（`scope.randomInt is not a function` 等因纯逻辑块为空）

- [ ] **Step 3: 在哨兵注释之间写入纯逻辑**

```js
function createStorage() {
  try {
    const t = '__rp_probe__';
    globalThis.localStorage.setItem(t, '1');
    globalThis.localStorage.removeItem(t);
    return globalThis.localStorage;
  } catch (e) {
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
    };
  }
}

function loadJSON(store, key, fallback) {
  try {
    const raw = store.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function saveJSON(store, key, value) {
  try { store.setItem(key, JSON.stringify(value)); } catch (e) { /* 降级：不持久化 */ }
}

function randomInt(min, max, rng) {
  const getRandom = rng || ((buf) => crypto.getRandomValues(buf));
  const range = max - min + 1;
  const limit = Math.floor(4294967296 / range) * range;
  const buf = new Uint32Array(1);
  let v;
  do { getRandom(buf); v = buf[0]; } while (v >= limit);
  return min + (v % range);
}

function validateRange(minVal, maxVal) {
  const toInt = (v) => {
    if (v === '' || v === null || v === undefined) return NaN;
    const n = Number(v);
    return Number.isInteger(n) ? n : NaN;
  };
  const min = toInt(minVal);
  const max = toInt(maxVal);
  if (Number.isNaN(min) || Number.isNaN(max)) return { ok: false, error: '请输入整数' };
  if (min < 1 || max > 9999) return { ok: false, error: '范围需在 1–9999 之间' };
  if (min > max) return { ok: false, error: '起始数字不能大于结束数字' };
  return { ok: true, min, max };
}

function buildPool(min, max) {
  const pool = [];
  for (let n = min; n <= max; n++) pool.push(n);
  return pool;
}

function drawFromPool(pool, rng) {
  if (!pool.length) return null;
  return pool[randomInt(0, pool.length - 1, rng)];
}

function removeFromPool(pool, value) {
  const i = pool.indexOf(value);
  if (i >= 0) pool.splice(i, 1);
  return pool;
}

function pushHistory(list, value, cap = 20) {
  return [value, ...list].slice(0, cap);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/`
Expected: 全部 `pass`（6 个测试文件级用例组，0 fail）

- [ ] **Step 5: Commit**

```bash
git add index.html tests/ && git commit -m "feat: 纯逻辑层（均匀随机/校验/抽取池/历史/存储降级）+ 单元测试"
```

---

### Task 3: 转盘渲染 + 旋转动画 + 点击抽取主线

**Files:**
- Modify: `index.html`（`/*__PURE_END__*/` 之后追加）

- [ ] **Step 1: 追加 DOM 层代码**

```js
const KEY_SETTINGS = 'rp.settings.v1';
const KEY_HISTORY = 'rp.history.v1';
const KEY_POOL = 'rp.pool.v1';
const HISTORY_CAP = 20;
const PALETTE = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

const store = createStorage();
const state = {
  scene: 'wheel',
  spinning: false,
  settings: { min: 1, max: 100, noRepeat: false },
  pool: null,
  history: [],
  rotation: -Math.PI / 2,
};
let cssSize = 0;

const $ = (id) => document.getElementById(id);
const els = {
  canvas: $('wheelCanvas'), centerNum: $('wheelCenterNum'), resultNum: $('resultNum'),
  resultScene: $('resultScene'), dialog: $('settingsDialog'), minInput: $('minInput'),
  maxInput: $('maxInput'), noRepeatChk: $('noRepeatChk'), poolRow: $('poolRow'),
  poolStatus: $('poolStatus'), poolResetBtn: $('poolResetBtn'), historyList: $('historyList'),
  clearHistoryBtn: $('clearHistoryBtn'), saveBtn: $('saveBtn'), closeDialogBtn: $('closeDialogBtn'),
  settingsError: $('settingsError'), toast: $('toast'), gearBtn: $('gearBtn'),
};
const ctx = els.canvas.getContext('2d');

function loadState() {
  const merged = { min: 1, max: 100, noRepeat: false, ...loadJSON(store, KEY_SETTINGS, {}) };
  const v = validateRange(merged.min, merged.max);
  if (v.ok) state.settings = merged;
  const history = loadJSON(store, KEY_HISTORY, []);
  state.history = Array.isArray(history) ? history.slice(0, HISTORY_CAP) : [];
  if (state.settings.noRepeat) {
    let pool = loadJSON(store, KEY_POOL, null);
    if (!Array.isArray(pool) || !pool.every((n) => Number.isInteger(n))) pool = null;
    pool = pool === null ? buildPool(state.settings.min, state.settings.max)
      : pool.filter((n) => n >= state.settings.min && n <= state.settings.max);
    state.pool = pool;
  }
}

function saveState() {
  saveJSON(store, KEY_SETTINGS, state.settings);
  saveJSON(store, KEY_HISTORY, state.history);
  if (state.pool) saveJSON(store, KEY_POOL, state.pool); else store.removeItem(KEY_POOL);
}

function resizeCanvas() {
  cssSize = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.86);
  const dpr = window.devicePixelRatio || 1;
  els.canvas.style.width = cssSize + 'px';
  els.canvas.style.height = cssSize + 'px';
  els.canvas.width = Math.round(cssSize * dpr);
  els.canvas.height = Math.round(cssSize * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  els.centerNum.style.fontSize = Math.round(cssSize * 0.115) + 'px';
  if (!state.spinning) drawWheel(state.rotation);
}

function drawWheel(rotation) {
  const c = cssSize / 2;
  const R = c - 4;
  ctx.clearRect(0, 0, cssSize, cssSize);
  const n = PALETTE.length;
  for (let i = 0; i < n; i++) {
    const a0 = rotation + (i * 2 * Math.PI) / n;
    const a1 = a0 + (2 * Math.PI) / n;
    ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, R, a0, a1); ctx.closePath();
    ctx.fillStyle = PALETTE[i]; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(c, c, R, 0, 2 * Math.PI);
  ctx.lineWidth = Math.max(4, cssSize * 0.015); ctx.strokeStyle = '#f8fafc'; ctx.stroke();
  ctx.beginPath(); ctx.arc(c, c, cssSize * 0.21, 0, 2 * Math.PI);
  ctx.fillStyle = '#111827'; ctx.fill();
  ctx.lineWidth = Math.max(2, cssSize * 0.008); ctx.strokeStyle = '#f8fafc'; ctx.stroke();
}

function pickNumber() {
  if (state.settings.noRepeat) return drawFromPool(state.pool);
  return randomInt(state.settings.min, state.settings.max);
}

function startSpin() {
  if (state.spinning) return;
  if (state.settings.noRepeat && (!state.pool || !state.pool.length)) {
    showToast('所有号码已抽完，请重置抽取池');
    openDialog();
    return;
  }
  const result = pickNumber();
  if (state.settings.noRepeat) {
    removeFromPool(state.pool, result);
    saveJSON(store, KEY_POOL, state.pool);
  }
  state.history = pushHistory(state.history, result, HISTORY_CAP);
  saveJSON(store, KEY_HISTORY, state.history);
  renderHistory();

  state.spinning = true;
  els.centerNum.textContent = '';
  const turns = 5 + Math.floor(Math.random() * 4);
  const start = state.rotation;
  const target = start + turns * 2 * Math.PI + Math.random() * 2 * Math.PI;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 900 : 3500;
  const t0 = performance.now();
  let lastFlash = 0;

  function frame(now) {
    const t = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    state.rotation = start + (target - start) * eased;
    if (t < 1) {
      if (now - lastFlash > 80) {
        els.centerNum.textContent = String(randomInt(state.settings.min, state.settings.max));
        lastFlash = now;
      }
      drawWheel(state.rotation);
      requestAnimationFrame(frame);
    } else {
      state.rotation = target;
      drawWheel(state.rotation);
      els.centerNum.textContent = String(result);
      state.spinning = false;
      setTimeout(() => showResult(result), 300);
    }
  }
  requestAnimationFrame(frame);
}

function showResult(result) {
  state.scene = 'result';
  document.body.classList.add('showing-result');
  els.resultNum.textContent = String(result);
  els.resultScene.style.background = `hsl(${((result * 137.508) % 360).toFixed(1)} 65% 16%)`;
  fitResultFont();
}

function fitResultFont() {
  const len = Math.max(1, (els.resultNum.textContent || '').length);
  const size = Math.min(window.innerHeight * 0.72, (window.innerWidth * 0.92) / (0.62 * len));
  els.resultNum.style.fontSize = size + 'px';
}

function showWheelScene() {
  state.scene = 'wheel';
  document.body.classList.remove('showing-result');
  resizeCanvas();
}

function requestFullscreenOnce() {
  if (document.fullscreenElement) return;
  try {
    const p = document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* 不支持则静默降级 */ }
}

function onTap() {
  if (els.dialog.open || state.spinning) return;
  requestFullscreenOnce();
  if (state.scene === 'result') showWheelScene();
  startSpin();
}

let toastTimer = 0;
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function renderHistory() {
  els.historyList.innerHTML = '';
  if (!state.history.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = '暂无记录';
    els.historyList.appendChild(li);
    return;
  }
  for (const n of state.history) {
    const li = document.createElement('li');
    li.textContent = n;
    els.historyList.appendChild(li);
  }
}

function openDialog() {
  els.minInput.value = state.settings.min;
  els.maxInput.value = state.settings.max;
  els.noRepeatChk.checked = state.settings.noRepeat;
  els.settingsError.textContent = '';
  updatePoolUI();
  renderHistory();
  els.dialog.showModal();
}

function updatePoolUI() {
  const on = state.settings.noRepeat;
  els.poolRow.hidden = !on;
  if (!on) return;
  const total = state.settings.max - state.settings.min + 1;
  els.poolStatus.textContent = `剩余 ${state.pool ? state.pool.length : total} / ${total}`;
}

function bindEvents() {
  document.addEventListener('click', onTap);
  window.addEventListener('resize', () => { resizeCanvas(); if (state.scene === 'result') fitResultFont(); });
  els.gearBtn.addEventListener('click', (e) => { e.stopPropagation(); openDialog(); });
  els.dialog.addEventListener('click', (e) => e.stopPropagation());
  els.noRepeatChk.addEventListener('change', () => { els.poolRow.hidden = !els.noRepeatChk.checked; updatePoolUI(); });
  els.poolResetBtn.addEventListener('click', () => {
    state.pool = buildPool(state.settings.min, state.settings.max);
    saveState(); updatePoolUI(); showToast('抽取池已重置');
  });
  els.clearHistoryBtn.addEventListener('click', () => { state.history = []; saveState(); renderHistory(); });
  els.closeDialogBtn.addEventListener('click', () => els.dialog.close());
  els.saveBtn.addEventListener('click', () => {
    const v = validateRange(els.minInput.value.trim(), els.maxInput.value.trim());
    if (!v.ok) { els.settingsError.textContent = v.error; return; }
    const rangeChanged = v.min !== state.settings.min || v.max !== state.settings.max;
    const noRepeatOn = els.noRepeatChk.checked;
    state.settings = { min: v.min, max: v.max, noRepeat: noRepeatOn };
    if (noRepeatOn && (rangeChanged || !state.pool)) state.pool = buildPool(v.min, v.max);
    if (!noRepeatOn) state.pool = null;
    saveState();
    els.dialog.close();
    showToast('设置已保存');
  });
}

function init() {
  loadState();
  bindEvents();
  renderHistory();
  resizeCanvas();
}

init();
```

- [ ] **Step 2: 语法检查**

Run: `node -e "const s=require('fs').readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1]; new Function(s); console.log('syntax OK')"`
Expected: `syntax OK`

- [ ] **Step 3: 浏览器验证主线**

浏览器打开页面，点击屏幕：转盘加速旋转约 3.5s 减速停下，中央数字先滚动后定格为结果，随后切到结果页大数字；再点一下回到转盘并自动再转。转动中连点无效果（不中断、不重转）。结果页不显示齿轮。
Expected: 全流程可复现；控制台无报错。

- [ ] **Step 4: Commit**

```bash
git add index.html && git commit -m "feat: 转盘渲染/旋转动画/点击抽取主线与全屏"
```

---

### Task 4: 设置弹层联调与边界验证

**Files:**
- Modify: 无新代码（Task 3 已包含全部弹层代码，本任务为验证与修复）

- [ ] **Step 1: 浏览器验证设置项**

依次验证并记录结果：
1. 齿轮 → 改范围 1–5 保存 → 连抽 6 次：第 6 次时若开「不重复」应提示「所有号码已抽完」并自动打开设置；不开则正常。
2. 输入 `min=10, max=2` → 红字「起始数字不能大于结束数字」，不保存。
3. 输入 `2.5` / 空 / `0` / `10000` → 各自红字提示。
4. 开「不重复」→ 显示「剩余 X / Y」；重置抽取池 → 剩余恢复满额。
5. 抽几次后关闭页面重开：设置、历史、剩余池均保留（localStorage）。
6. 「清空」历史 → 列表显示「暂无记录」。

- [ ] **Step 2: 修复发现的问题（如有），重跑 Task 2 测试**

Run: `node --test tests/`
Expected: 全部 pass

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "fix: 设置弹层联调与边界修复"
```

---

### Task 5: README 与最终验收

**Files:**
- Create: `README.md`

- [ ] **Step 1: 写 README**

```markdown
# 随机抽号器

课堂/活动用的随机数抽取工具。大转盘动画 → 号码占满全屏 → 点屏幕再抽。

## 手机安装（Android）

1. 把 `index.html` 传到手机（微信文件传输 / 网盘 / 数据线均可）。
2. 用 **Chrome** 打开该文件（文件管理器 → 用浏览器打开）。
3. 菜单 → **添加到主屏幕**，之后从桌面图标全屏启动。

> 想要完整 PWA 体验（可离线、可安装提示），把 `index.html` 上传到任意静态托管
> （GitHub Pages / Netlify 等）后用手机访问该网址再「添加到主屏幕」即可。

## 使用

- **点一下屏幕**：开始转盘抽取；转动中点击无效。
- **结果页**：号码占满全屏，点任意处再抽。
- **右上角齿轮**：设置范围（1–9999 内任意整数区间）、「不重复抽取」、查看/清空最近 20 条记录。
- 「不重复抽取」开启后，抽过的号不再出现；抽完会提示重置抽取池。

## 开发

- 单元测试：`node --test tests/`
- 本地预览：`npx serve .`
```

- [ ] **Step 2: 最终验收（浏览器 GUI 黑盒测试）**

用浏览器自动化逐项验收：首次加载 → 点击 → 转盘动画（截图确认转动中与停止帧不同）→ 结果大数字占屏（截图确认字号接近满屏且不溢出）→ 点击重抽 → 设置各边界（同 Task 4 清单）→ 竖屏 390×844 与桌面 1280×800 两种视口各过一遍。

- [ ] **Step 3: Commit**

```bash
git add README.md && git commit -m "docs: 使用与安装指引"
```

---

## Self-Review

- **Spec 覆盖**：转盘动画(T3)、结果满屏(T3/T5)、点击重抽(T3)、范围设置/校验(T1/T2/T3)、不重复+池(T2/T3)、历史(T3)、存储降级(T2)、Fullscreen/静默降级(T3)、PWA meta(T1)、README(T5)。✓
- **占位符**：无 TBD/TODO；所有代码块完整。✓
- **类型一致性**：`randomInt(min,max,rng?)`、`drawFromPool(pool,rng?)`、`pushHistory(list,value,cap=20)`、`validateRange(minVal,maxVal)` 在 T2/T3 用法一致；`els.*` 与 T1 的 DOM id 一一对应。✓

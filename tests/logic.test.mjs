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
  assert.equal(drawFromPool(pool, stubRng(7)), 40); // 7 % 4 = 3 → pool[3]
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

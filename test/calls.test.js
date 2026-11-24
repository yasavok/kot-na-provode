// node --test
const test = require('node:test');
const assert = require('node:assert');
const { CATS, CALLS, COMEBACK } = require('../data/calls.js');

test('хватает на три дня: 12 обманов и 9 честных', () => {
  assert.ok(CALLS.filter(c => c.scam).length >= 12);
  assert.ok(CALLS.filter(c => !c.scam).length >= 9);
});
test('id не повторяются, жильцов шестеро', () => {
  assert.strictEqual(new Set(CALLS.map(c => c.id)).size, CALLS.length);
  assert.strictEqual(new Set(CATS.map(c => c.id)).size, 6);
});
test('второй обман заполнен', () => {
  for (const k of ['from', 'ask', 'call', 'look', 'why']) assert.ok(COMEBACK[k]);
  assert.ok(COMEBACK.scam && COMEBACK.sum > 0 && COMEBACK.ask.includes('{name}'));
});
test('каждому жильцу кто-то звонит', () => { for (const c of CATS) assert.ok(CALLS.some(x => x.to === c.id), c.id); });
for (const c of CALLS) test(c.id + ': заполнен правильно', () => {
  assert.ok(CATS.some(x => x.id === c.to));
  assert.ok(['call', 'sms', 'chat', 'mail'].includes(c.kind));
  for (const k of ['from', 'ask', 'call', 'look', 'why']) assert.ok(c[k] && c[k].length > 5 || k === 'from' && c[k], k);
  assert.ok(c.lines.length);
  assert.strictEqual(c.scam, c.sum > 0, 'сумма нужна у обмана и только у него');
  for (const d of c.lines.join(' ').match(/[a-z0-9_-]+\.[a-z]{2,}/gi) || []) assert.match(d, /\.(example|apk)$/i, 'только адреса .example: ' + d);
});

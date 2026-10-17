// Симуляция партий: случайные игроки (проверка устойчивости) и «разумные» боты (баланс сложности).
// Запуск: node test/sim.mjs [партий на режим]
import { newGame, act, matching, total, reqOf, DIFFS, furyLeft, score, D } from '../js/game.js?v=1';
import { CARDS, matches } from '../js/cards.js?v=1';
import assert from 'node:assert/strict';

function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function check(s, size) {
  assert.equal(total(s), size, 'карты не теряются');
  assert.ok(s.row.length <= 5);
  assert.ok(s.threat >= 0 && s.threat <= D(s).limit);
  assert.ok(s.log.length <= 30);
  if (s.dice) assert.ok(s.dice.length === 5 && s.dice.every(v => v >= 1 && v <= 6));
  if (s.phase === 'play') assert.ok(s.row.length > 0, 'в ряду есть чудовища, пока идёт игра');
  for (const p of s.players) for (const id of p.army) assert.ok(CARDS[id] && !CARDS[id].boss);
  assert.ok(JSON.stringify(s).length < 6000, 'состояние компактно');
}

// ---------- Случайный игрок: любые действия, в том числе недопустимые ----------
function randomGame(seed, n, diff) {
  const r = rng(seed);
  const s = newGame(Array.from({ length: n }, (_, i) => ({ name: 'P' + i, key: 'k' + i })), diff, r);
  const size = total(s);
  let steps = 0, errors = 0;
  while (s.phase === 'play') {
    assert.ok(++steps < 20000, 'партия не зависает');
    const p = r() < 0.8 ? s.turn : Math.floor(r() * n);
    const kinds = ['roll', 'reroll', 'card', 'beat', 'pass', 'beat', 'beat', 'card'];
    const a = { t: kinds[Math.floor(r() * kinds.length)], p };
    a.idx = [0, 1, 2, 3, 4].filter(() => r() < 0.5);
    a.die = Math.floor(r() * 6) - (r() < 0.05 ? 1 : 0);
    a.sign = r() < 0.5 ? 1 : -1;
    a.i = Math.floor(r() * (s.players[p].army.length + 1));
    a.r = Math.floor(r() * 6);
    const before = JSON.stringify(s);
    try { act(s, a, r); } catch (e) {
      errors++;
      assert.ok(e instanceof Error && e.message);
      // Ошибочное действие не должно менять состояние (кроме списка событий).
      const b = JSON.parse(before), c = JSON.parse(JSON.stringify(s));
      b.ev = c.ev = [];
      assert.deepEqual(c, b, 'недопустимое действие не меняет состояние: ' + a.t + ' ' + e.message);
    }
    check(s, size);
  }
  return { s, steps, errors };
}

// ---------- Бот ----------
const ALL = [0, 1, 2, 3, 4];
const subsets = Array.from({ length: 31 }, (_, m) => ALL.filter(i => (m + 1) >> i & 1)); // непустые

function chance(s, idx, r, samples = 40) {
  const reqs = s.row.map(x => reqOf(s, x.c));
  let ok = 0;
  const d = s.dice.slice();
  for (let k = 0; k < samples; k++) {
    for (const i of idx) d[i] = 1 + Math.floor(r() * 6);
    if (reqs.some(q => matches(q, d))) ok++;
  }
  return ok / samples;
}
function bestReroll(s, r) {
  let best = null, bp = -1;
  for (const idx of subsets) {
    const p = chance(s, idx, r);
    if (p > bp) { bp = p; best = idx; }
  }
  return { idx: best, p: bp };
}
function priority(s, i) {
  const x = s.row[i];
  return x.c === 0 ? -100 : furyLeft(s, x) * 10 - CARDS[x.c].tier;
}
// Одна карта армии (своя или товарища), которая сразу даёт победу над чудовищем.
function oneCardWin(s) {
  for (let p = 0; p < s.players.length; p++) {
    const army = s.players[p].army;
    for (let i = 0; i < army.length; i++) {
      const ab = CARDS[army[i]].ab;
      for (let die = 0; die < 5; die++) {
        for (const sign of ab === '±' ? [1, -1] : [1]) {
          const v = s.dice[die];
          const nv = ab === '+' ? v + 1 : ab === '-' ? v - 1 : ab === '±' ? v + sign : ab === '~' ? 7 - v : 0;
          if (nv < 1 || nv > 6) continue;
          const d = s.dice.slice(); d[die] = nv;
          if (s.row.some(x => matches(reqOf(s, x.c), d))) return { t: 'card', p, i, die, sign };
        }
      }
    }
  }
  return null;
}
// Две карты подряд (например, +1 и зеркало) — перебор всех пар.
function twoCardWin(s) {
  const opts = [];
  s.players.forEach((pl, p) => pl.army.forEach((id, i) => {
    const ab = CARDS[id].ab;
    if ('+-±~'.includes(ab)) for (let die = 0; die < 5; die++) for (const sign of ab === '±' ? [1, -1] : [1]) opts.push({ p, i, ab, die, sign });
  }));
  const ap = (d, o) => {
    const v = d[o.die];
    const nv = o.ab === '+' ? v + 1 : o.ab === '-' ? v - 1 : o.ab === '±' ? v + o.sign : 7 - v;
    if (nv < 1 || nv > 6) return false;
    d[o.die] = nv; return true;
  };
  for (const a of opts) for (const b of opts) {
    if (a.p === b.p && a.i === b.i) continue;
    const d = s.dice.slice();
    if (!ap(d, a) || !ap(d, b)) continue;
    if (s.row.some(x => matches(reqOf(s, x.c), d))) return { t: 'card', p: a.p, i: a.i, die: a.die, sign: a.sign };
  }
  return null;
}

function botGame(seed, n, diff) {
  const r = rng(seed);
  const s = newGame(Array.from({ length: n }, (_, i) => ({ name: 'P' + i, key: 'k' + i })), diff, r);
  const size = total(s);
  let steps = 0;
  const go = a => { act(s, a, r); check(s, size); };
  while (s.phase === 'play') {
    assert.ok(++steps < 5000, 'бот не зависает');
    const me = s.turn;
    // Щит — когда до поражения одна угроза.
    if (s.threat >= D(s).limit - 1) {
      const pi = s.players.findIndex(p => p.army.some(id => CARDS[id].ab === '#'));
      if (pi >= 0) { go({ t: 'card', p: pi, i: s.players[pi].army.findIndex(id => CARDS[id].ab === '#') }); continue; }
    }
    if (!s.dice) { go({ t: 'roll', p: me }); continue; }
    const m = matching(s);
    if (m.length) { go({ t: 'beat', p: me, r: m.sort((a, b) => priority(s, a) - priority(s, b))[0] }); continue; }
    const one = oneCardWin(s);
    if (one) { go(one); continue; }
    if (s.free <= 0) { const two = twoCardWin(s); if (two) { go(two); continue; } }
    if (s.free > 0) { go({ t: 'reroll', p: me, idx: bestReroll(s, r).idx }); continue; }
    const rp = s.players.findIndex(p => p.army.some(id => CARDS[id].ab === '@'));
    if (rp >= 0) {
      go({ t: 'card', p: rp, i: s.players[rp].army.findIndex(id => CARDS[id].ab === '@'), idx: bestReroll(s, r).idx });
      continue;
    }
    go({ t: 'pass', p: me });
  }
  return s;
}

const N = +process.argv[2] || 300;
let t0 = Date.now();
for (const diff of Object.keys(DIFFS)) {
  for (let n = 1; n <= 5; n++) {
    for (let k = 0; k < 40; k++) randomGame(k * 31 + n * 7 + diff.length, n, diff);
  }
}
console.log(`Случайные партии: 800 штук без ошибок (${Date.now() - t0} мс)`);

t0 = Date.now();
for (const diff of Object.keys(DIFFS)) {
  const res = [1, 2, 4].map(n => {
    let win = 0, turns = 0, sc = 0, fled = 0, fails = 0;
    for (let k = 0; k < N; k++) {
      const s = botGame(1000 + k * 13 + n, n, diff);
      if (s.phase === 'win') { win++; sc += score(s); }
      turns += s.turns; fled += s.fled; fails += s.threat;
    }
    return `${n} игр.: победы ${Math.round(100 * win / N)}%, ходов ~${Math.round(turns / N)}, очки ~${win ? Math.round(sc / win) : 0}, ушло ${(fled / N).toFixed(1)}`;
  });
  console.log(`${DIFFS[diff].name.padEnd(9)} ${res.join(' | ')}`);
}
console.log(`Боты: ${Date.now() - t0} мс`);

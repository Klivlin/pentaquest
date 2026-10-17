// Логика кооперативной партии. Чистые функции над состоянием — работают и в браузере, и в Node.
import { CARDS, BOSS_REQ, MIRROR, matches, ABILITIES } from './cards.js?v=1';

// Баланс подобран симуляцией (test/sim.mjs): боты выигрывают ~99% / ~65% / ~20% / ~6%.
export const DIFFS = {
  easy:   { name: 'Новичок',  icon: '🌱', limit: 6, fury: 7, size: 20, maxTier: 2, hp: 1, free: 2, first: 3 },
  normal: { name: 'Искатель', icon: '⚔️', limit: 8, fury: 7, size: 28, maxTier: 3, hp: 2, free: 1, first: 2 },
  hero:   { name: 'Герой',    icon: '🔥', limit: 7, fury: 7, size: 36, maxTier: 3, hp: 2, free: 1, first: 2 },
  doom:   { name: 'Кошмар',   icon: '💀', limit: 6, fury: 7, size: 40, maxTier: 3, hp: 3, free: 2, first: 2 },
};
export const DIFF_DESC = {
  easy: '20 простых чудовищ, 6 угроз, 2 переброса за ход',
  normal: '28 чудовищ, 8 угроз, босс с 2 жизнями',
  hero: '36 чудовищ, 7 угроз, босс с 2 жизнями',
  doom: 'все 40 чудовищ, 6 угроз, босс с 3 жизнями',
};
export const ROW = 5;
export const MAX_PLAYERS = 5;
export const COLORS = ['#d9534f', '#3b7dd8', '#3fa34d', '#e0a526', '#9b59b6'];

export const card = id => CARDS[id];
// Требование карты в ряду (у босса оно меняется с потерей жизней).
export const reqOf = (s, id) => (id === 0 ? BOSS_REQ[(s.bossHp - 1) % BOSS_REQ.length] : CARDS[id].req);
export const D = s => DIFFS[s.diff];

function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const die = rnd => 1 + Math.floor(rnd() * 6);

export function newGame(players, diff = 'normal', rnd = Math.random) {
  const d = DIFFS[diff] || DIFFS.normal;
  const pool = shuffle(CARDS.filter(c => !c.boss && c.tier <= d.maxTier).map(c => c.id), rnd).slice(0, d.size);
  const s = {
    gid: Math.random().toString(36).slice(2, 10),
    born: Date.now(),
    seq: 0,
    by: '',
    diff: DIFFS[diff] ? diff : 'normal',
    players: players.slice(0, MAX_PLAYERS).map((p, i) => ({ key: p.key, name: p.name, color: COLORS[i], army: [] })),
    deck: pool.concat([0]),       // босс — последняя карта колоды
    row: [],                      // [{ c: id, a: сколько ходов чудовище ждёт }]
    disc: 0,                      // сброшено карт армии
    slain: 0,                     // побеждено чудовищ (включая босса)
    fled: 0,                      // чудовищ, которые напали и ушли
    threat: 0,
    bossHp: d.hp,
    turn: 0,
    turns: 0,
    dice: null,
    free: d.first,
    phase: 'play',                // play | win | lose
    log: [],
    ev: [],
  };
  refill(s);
  log(s, `Начало похода. Сложность: ${d.name}. Колода: ${s.deck.length + s.row.length} карт.`);
  return s;
}

function refill(s) {
  while (s.row.length < ROW && s.deck.length) s.row.push({ c: s.deck.shift(), a: 0 });
}
function log(s, text) {
  s.log.push(text);
  if (s.log.length > 30) s.log = s.log.slice(-30);
}
const pname = (s, i) => s.players[i].name;

export const matching = s => (s.dice ? s.row.map((r, i) => (matches(reqOf(s, r.c), s.dice) ? i : -1)).filter(i => i >= 0) : []);
// Сколько ходов осталось до атаки чудовища.
export const furyLeft = (s, r) => D(s).fury - r.a;

// Все карты партии на месте — для проверок.
export function total(s) {
  return s.deck.length + s.row.length + s.disc + s.fled + (s.bossHp <= 0 ? 1 : 0) + s.players.reduce((n, p) => n + p.army.length, 0);
}

function checkDice(s, idx) {
  if (!Array.isArray(idx) || !idx.length || idx.length > 5) throw new Error('Выберите кубики');
  if (new Set(idx).size !== idx.length || idx.some(i => !Number.isInteger(i) || i < 0 || i > 4)) throw new Error('Неверные кубики');
}
function checkDie(s, i) {
  if (!Number.isInteger(i) || i < 0 || i > 4) throw new Error('Выберите кубик');
}

// Действие игрока: { t, p, ... }. p — индекс игрока, который действует.
// Меняет s на месте; при недопустимом действии бросает Error с понятным текстом.
export function act(s, a, rnd = Math.random) {
  if (s.phase !== 'play') throw new Error('Партия окончена');
  const p = a.p;
  if (!s.players[p]) throw new Error('Нет такого игрока');
  const mine = p === s.turn;
  s.ev = [];
  switch (a.t) {
    case 'roll':
      if (!mine) throw new Error('Сейчас не ваш ход');
      if (s.dice) throw new Error('Кубики уже брошены');
      s.dice = [0, 1, 2, 3, 4].map(() => die(rnd));
      s.ev.push({ k: 'roll', idx: [0, 1, 2, 3, 4] });
      break;
    case 'reroll':
      if (!mine) throw new Error('Сейчас не ваш ход');
      if (!s.dice) throw new Error('Сначала бросьте кубики');
      if (s.free <= 0) throw new Error('Бесплатные перебросы закончились');
      checkDice(s, a.idx);
      for (const i of a.idx) s.dice[i] = die(rnd);
      s.free--;
      s.ev.push({ k: 'roll', idx: a.idx });
      break;
    case 'card': {
      const pl = s.players[p];
      const id = pl.army[a.i];
      if (id === undefined) throw new Error('Нет такой карты');
      const ab = CARDS[id].ab;
      if (ab === '#') {
        if (s.threat <= 0) throw new Error('Угрозы и так нет');
        s.threat--;
      } else {
        if (!s.dice) throw new Error('Сначала нужно бросить кубики');
        if (ab === '@') {
          checkDice(s, a.idx);
          for (const i of a.idx) s.dice[i] = die(rnd);
          s.ev.push({ k: 'roll', idx: a.idx });
        } else {
          checkDie(s, a.die);
          const v = s.dice[a.die];
          let nv;
          if (ab === '+') nv = v + 1;
          else if (ab === '-') nv = v - 1;
          else if (ab === '±') nv = v + (a.sign < 0 ? -1 : 1);
          else nv = MIRROR(v);
          if (nv < 1 || nv > 6) throw new Error('Кубик не может стать ' + nv);
          s.dice[a.die] = nv;
          s.ev.push({ k: 'mod', idx: [a.die] });
        }
      }
      pl.army.splice(a.i, 1);
      s.disc++;
      log(s, `${pl.name}${mine ? ' —' : ' помогает:'} ${ABILITIES[ab].name} (${ABILITIES[ab].icon})`);
      s.ev.push({ k: 'card', p, c: id });
      break;
    }
    case 'beat': {
      if (!mine) throw new Error('Сейчас не ваш ход');
      const r = s.row[a.r];
      if (!r) throw new Error('Нет такого чудовища');
      if (!matches(reqOf(s, r.c), s.dice)) throw new Error('Кубики не подходят');
      if (r.c === 0) {
        s.bossHp--;
        s.ev.push({ k: 'beat', p, c: 0 });
        if (s.bossHp > 0) {
          r.a = 0;
          log(s, `${pname(s, p)} ранит Повелителя Тьмы! Осталось жизней: ${s.bossHp}`);
        } else {
          s.row.splice(a.r, 1);
          s.slain++;
          log(s, `${pname(s, p)} сражает Повелителя Тьмы!`);
        }
      } else {
        s.row.splice(a.r, 1);
        s.players[p].army.push(r.c);
        s.slain++;
        log(s, `${pname(s, p)} побеждает: ${CARDS[r.c].name}`);
        s.ev.push({ k: 'beat', p, c: r.c });
      }
      endTurn(s, true);
      break;
    }
    case 'pass':
      if (!mine) throw new Error('Сейчас не ваш ход');
      if (!s.dice) throw new Error('Сначала бросьте кубики');
      log(s, `${pname(s, p)} не смог никого победить`);
      s.ev.push({ k: 'fail', p });
      endTurn(s, false);
      break;
    default:
      throw new Error('Неизвестное действие');
  }
  return s;
}

function endTurn(s) {
  const d = D(s);
  // Чудовище, которое слишком долго ждёт, нападает и уходит разорять земли (босс остаётся).
  for (const r of s.row.slice()) {
    r.a++;
    if (r.a < d.fury) continue;
    s.threat++;
    s.ev.push({ k: 'attack', c: r.c });
    if (r.c === 0) {
      r.a = 0;
      log(s, 'Повелитель Тьмы наносит удар! Угроза +1');
    } else {
      s.row.splice(s.row.indexOf(r), 1);
      s.fled++;
      log(s, `${CARDS[r.c].name} нападает и уходит! Угроза +1`);
    }
  }
  s.turns++;
  if (s.threat >= d.limit) {
    s.threat = d.limit;
    s.phase = 'lose';
    log(s, 'Тьма поглотила королевство. Поражение…');
  } else if (!s.deck.length && !s.row.length) {
    s.phase = 'win';
    log(s, 'Королевство спасено! Победа!');
  }
  s.turn = (s.turn + 1) % s.players.length;
  s.dice = null;
  s.free = d.free;
  refill(s);
}

export function score(s) {
  const army = s.players.reduce((n, p) => n + p.army.length, 0);
  return s.phase === 'win' ? army + 3 * (D(s).limit - s.threat) : s.slain;
}

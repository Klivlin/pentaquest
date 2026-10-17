import { CARDS, ABILITIES, matches, reqText } from './cards.js?v=1';
import { newGame, act, matching, reqOf, furyLeft, score, D, DIFFS, DIFF_DESC, MAX_PLAYERS, COLORS } from './game.js?v=1';
import { dieSVG, reqHTML, monsterSVG, HEART, SKULL } from './art.js?v=1';
import * as net from './net.js?v=1';

const $ = s => document.querySelector(s);
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* приватный режим */ } },
};
const uid = () => Math.random().toString(36).slice(2, 10);
const clone = s => JSON.parse(JSON.stringify(s));
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const app = {
  mode: 'menu',          // menu | lobby | game
  kind: null,            // online | local
  code: null,
  myKey: store.get('pq-key') || uid(),
  lobby: null,           // { owner, players, diff, v }
  seen: {},              // key -> когда игрок последний раз был в сети
  state: null,
  broker: null,          // самое новое состояние, пришедшее с брокеров
  conn: null,
  sel: [],               // выбранные кубики (только у себя)
  pend: null,            // карта армии, ждущая цели: { p, i, ab, sign }
  hover: -1,             // чудовище под курсором
  ghosts: {},            // key -> что сейчас делает другой игрок
  chat: [],
  finalShown: false,
  diff: store.get('pq-diff') || 'normal',
};
store.set('pq-key', app.myKey);
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__app = app;

// ---------- Тема ----------
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  for (const b of document.querySelectorAll('.theme-toggle')) b.textContent = t === 'dark' ? '☀️' : '🌙';
  document.querySelector('meta[name=theme-color]').content = t === 'dark' ? '#1f1a29' : '#fbf8ff';
}
let theme = store.get('pq-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
for (const b of document.querySelectorAll('.theme-toggle')) {
  b.onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; store.set('pq-theme', theme); applyTheme(theme); };
}
applyTheme(theme);

// ---------- Правила ----------
const RULES = `<summary>Правила кооператива</summary>
<p>Вы — отряд героев. Вместе нужно одолеть всю колоду чудовищ и последним — <b>Повелителя Тьмы</b>.</p>
<ul>
<li>На столе всегда до 5 чудовищ. Внизу карты — какие кубики нужны: цифры — точные значения, <b>солнца</b> — одинаковые кубики любого значения, <b>луны</b> — другая группа одинаковых (может совпасть с солнцами), «подряд» — стрит.</li>
<li>В свой ход бросьте 5 кубиков. Можно бесплатно перебросить выбранные кубики (обычно 1 раз за ход, в первый ход партии — больше).</li>
<li>Как только кубики подходят — нажмите на чудовище: оно побеждено и встаёт в вашу <b>армию</b>. За ход — одно чудовище.</li>
<li>Карта армии — разовая способность: ${Object.values(ABILITIES).map(a => `<b>${a.icon}</b> ${a.desc}`).join('; ')}.</li>
<li><b>Помощь:</b> армии общие по духу — в чужой ход любой герой может потратить свою карту на кубики того, кто ходит. Договаривайтесь в чате!</li>
<li>Если победить никого не вышло — передайте ход.</li>
<li><b>Угроза.</b> Точки под чудовищем — сколько ходов оно ещё ждёт. Когда они кончаются, чудовище нападает (угроза +1) и уходит. Шкала угрозы заполнилась — поражение.</li>
<li><b>Повелитель Тьмы</b> — последняя карта колоды. У него несколько жизней, и с каждой раной требование меняется: фулл-хаус → пять подряд → каре. Он не уходит, а бьёт снова и снова.</li>
<li>Победа — когда колода и стол пусты. Слава = оставшиеся карты армии + 3 за каждое свободное деление угрозы.</li>
</ul>`;
for (const d of document.querySelectorAll('details.rules')) d.innerHTML = RULES;

// ---------- Экраны ----------
function show(mode) {
  app.mode = mode;
  for (const id of ['menu', 'lobby', 'game']) $('#' + id).classList.toggle('hidden', id !== mode);
  window.scrollTo(0, 0);
}
function myName() {
  const n = $('#name').value.trim();
  if (n) store.set('pq-name', n);
  return n || store.get('pq-name') || '';
}
const menuMsg = t => { $('#menu-msg').textContent = t; };
const lobbyMsg = t => { $('#lobby-msg').textContent = t; };
const gameMsg = t => { $('#game-msg').textContent = t; };
function netBanner(t) {
  const b = $('#net-banner');
  b.textContent = t ? '⚠️ ' + t : '';
  b.classList.toggle('hidden', !t);
}

function renderDiffs(box, editable, diff, onChange) {
  box.replaceChildren(...Object.entries(DIFFS).map(([id, d]) => {
    const label = document.createElement('label');
    label.className = 'mode' + (diff === id ? ' on' : '');
    label.innerHTML = `<input type="radio" name="${box.id}"><span class="mi"></span><span><b></b><small></small></span>`;
    const rb = label.querySelector('input');
    rb.checked = diff === id;
    rb.disabled = !editable;
    label.querySelector('.mi').textContent = d.icon;
    label.querySelector('b').textContent = d.name;
    label.querySelector('small').textContent = DIFF_DESC[id];
    rb.onchange = () => onChange(id);
    return label;
  }));
}

function initMenu() {
  $('#name').value = store.get('pq-name') || '';
  const setDiff = d => { app.diff = d; store.set('pq-diff', d); renderDiffs($('#diffs'), true, d, setDiff); };
  setDiff(app.diff);
  const box = $('#local-names');
  const saved = store.get('pq-local-names') || ['', ''];
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const inp = document.createElement('input');
    inp.placeholder = `Герой ${i + 1}`;
    inp.value = saved[i] || '';
    inp.maxLength = 16;
    box.append(inp);
  }
  const room = (new URLSearchParams(location.search).get('room') || '').toUpperCase();
  if (room) $('#code').value = room;

  const resume = $('#resume');
  const last = store.get('pq-last-room');
  const lastSaved = last && store.get('pq-room-' + last);
  if (lastSaved && (lastSaved.state ? lastSaved.state.phase === 'play' : lastSaved.lobby)) {
    const b = document.createElement('button');
    b.textContent = `Вернуться в онлайн-игру (комната ${last})`;
    b.onclick = () => { if (myName()) startOnline(last, false); else menuMsg('Введите имя'); };
    resume.append(b);
  }
  const l = store.get('pq-local');
  if (l && l.phase === 'play') {
    const b = document.createElement('button');
    b.textContent = 'Продолжить поход на одном устройстве';
    b.onclick = () => startLocal(l);
    resume.append(b);
  }

  $('#btn-host').onclick = () => {
    if (!myName()) return menuMsg('Введите имя');
    startOnline(net.randomCode(), true);
  };
  $('#btn-join').onclick = () => {
    const code = $('#code').value.trim().toUpperCase();
    if (!myName()) return menuMsg('Введите имя');
    if (code.length !== 5) return menuMsg('Код комнаты — 5 символов');
    startOnline(code, false);
  };
  $('#code').onkeydown = e => { if (e.key === 'Enter') $('#btn-join').click(); };
  $('#btn-local').onclick = () => {
    const names = [...box.querySelectorAll('input')].map(i => i.value.trim());
    store.set('pq-local-names', names);
    const ps = names.filter(Boolean);
    if (!ps.length) return menuMsg('Впишите хотя бы одного героя');
    startLocal(newGame(ps.map(name => ({ name, key: uid() })), app.diff));
  };

  // Перезагрузили страницу посреди онлайн-партии — сразу возвращаемся в комнату.
  if (room && room === last && lastSaved && myName()) startOnline(room, false);
}

// ---------- Игра на одном устройстве ----------
function startLocal(state) {
  app.kind = 'local';
  app.finalShown = state.phase !== 'play';
  history.replaceState(null, '', location.pathname);
  show('game');
  setState(state);
}

// ---------- Онлайн без хоста ----------
// Состояние лежит на брокерах (retained); каждое действие публикует тот, кто его сделал.
// Одновременные действия с одним seq разрешаются одинаково у всех — по ключу автора.
const newer = (a, b) => !!a && (!b || (a.gid !== b.gid ? a.born > b.born : a.seq !== b.seq ? a.seq > b.seq : (a.by || '') > (b.by || '')));
const isOnline = k => app.kind === 'local' || k === app.myKey || Date.now() - (app.seen[k] || app.joinedAt) < net.TIMEOUT;

function pubLobby(l) {
  l.v = (l.v || 0) + 1;
  app.conn.lobby(l);
}

function startOnline(code, creating) {
  app.kind = 'online';
  app.code = code;
  app.joinedAt = Date.now();
  const saved = store.get('pq-room-' + code);
  app.state = saved ? saved.state : null;
  app.lobby = saved ? saved.lobby : null;
  if (creating) app.lobby = { owner: app.myKey, players: [{ name: myName(), key: app.myKey }], diff: app.diff, v: 0 };
  app.chat = store.get('pq-chat-' + code) || [];
  app.finalShown = !!(app.state && app.state.phase !== 'play');
  store.set('pq-last-room', code);
  history.replaceState(null, '', '?room=' + code);
  lobbyMsg(creating ? 'Создаю комнату…' : 'Подключение…');
  app.conn = net.room(code, app.myKey, myName(), {
    onStatus: t => { lobbyMsg(t); netBanner(t); },
    onReady() {
      if (app.lobby && app.lobby.owner === app.myKey && !app.state) pubLobby(app.lobby);
      lastLive = '';
      sendLive();
      // Если на брокере нет состояния новее нашего — восстанавливаем его из своей копии.
      setTimeout(() => {
        if (app.state && newer(app.state, app.broker)) app.conn.state(app.state);
        if (!app.lobby && !app.state) lobbyMsg('Комната не найдена. Проверьте код.');
      }, 3000);
    },
    onLobby(l) {
      if (app.lobby && (l.v || 0) < (app.lobby.v || 0)) return;
      app.lobby = l;
      save();
      update();
    },
    onState(s) {
      if (!s || !s.gid) return;
      if (newer(s, app.broker)) app.broker = s;
      if (newer(s, app.state)) setState(s);
      else if (newer(app.state, s)) app.conn.state(app.state);
    },
    onPing(k, name) {
      const was = isOnline(k);
      if (!app.seen[k]) app.conn.ping();
      app.seen[k] = Date.now();
      const l = app.lobby;
      if (l && l.owner === app.myKey && !app.state && !l.players.some(p => p.key === k)) {
        const same = l.players.find(p => p.name === name && p.key !== app.myKey && !isOnline(p.key));
        if (same) same.key = k;
        else if (l.players.length < MAX_PLAYERS) l.players.push({ name, key: k });
        pubLobby(l);
      }
      if (!was) update();
    },
    onChat: addChat,
    onLive(msg) {
      const g = app.ghosts[msg.key];
      if (g && (msg.t || 0) < (g.t || 0)) return;
      app.ghosts[msg.key] = msg;
      renderTable();
    },
  });
  show(app.state ? 'game' : 'lobby');
  renderChat();
  update();
}

function save() {
  if (app.kind === 'local') store.set('pq-local', app.state);
  else if (app.kind === 'online') store.set('pq-room-' + app.code, { state: app.state, lobby: app.lobby });
}

// Новое состояние партии (своё или пришедшее по сети).
function setState(s) {
  const prev = app.state;
  app.state = s;
  const fresh = !prev || prev.gid !== s.gid || prev.seq !== s.seq;
  if (fresh) {
    if (prev && prev.gid !== s.gid) app.finalShown = false;
    // Кубики переброшены или ход сменился — выбор сбрасываем.
    if (!prev || prev.gid !== s.gid || prev.turn !== s.turn || prev.turns !== s.turns ||
      (s.ev || []).some(e => e.k === 'roll' || e.k === 'mod')) app.sel = [];
    if (app.pend && !(s.players[app.pend.p] && s.players[app.pend.p].army[app.pend.i] !== undefined &&
      CARDS[s.players[app.pend.p].army[app.pend.i]].ab === app.pend.ab)) app.pend = null;
    if (prev && prev.gid === s.gid && prev.seq < s.seq) animate(prev, s);
    else anim = { roll: [], mod: [], enter: [] };
  }
  save();
  if (app.mode !== 'game') show('game');
  update();
}

// Применить действие к копии состояния и опубликовать результат.
function commit(a) {
  const next = clone(app.state);
  try { act(next, a); } catch (e) { gameMsg(e.message); return false; }
  next.seq++;
  next.by = app.myKey;
  gameMsg('');
  setState(next);
  if (app.kind === 'online') {
    app.conn.state(next);
    if (!app.conn.connected()) gameMsg('Нет связи с сервером — ход отправится, как только связь вернётся.');
  }
  return true;
}

function leave() {
  if (app.conn) app.conn.destroy();
  history.replaceState(null, '', location.pathname);
  location.reload();
}

// Зашли с другого устройства или очистили браузер: занимаем место игрока с тем же именем.
function claimSeat(i) {
  const next = clone(app.state);
  next.players[i].key = app.myKey;
  next.log.push(`${next.players[i].name} вернулся в игру`);
  next.log = next.log.slice(-30);
  next.ev = [];
  next.seq++;
  next.by = app.myKey;
  setState(next);
  app.conn.state(next);
}

// ---------- Чат и реакции ----------
const REACTS = ['👍', '😂', '😮', '😱', '🙏', '🎉'];
function sendChat(text, react = false) {
  text = text.trim();
  if (!text || app.kind !== 'online') return;
  const m = { id: uid(), key: app.myKey, name: myName(), text: text.slice(0, 200), react, ts: Date.now() };
  addChat(m);
  app.conn.chat(m, app.chat.slice(-20));
}
function addChat(m) {
  if (!m || !m.id || app.chat.some(c => c.id === m.id)) return;
  app.chat.push(m);
  app.chat.sort((a, b) => a.ts - b.ts);
  app.chat = app.chat.slice(-100);
  store.set('pq-chat-' + app.code, app.chat);
  renderChat();
  if (m.react) floatReaction(m);
}
const colorOf = k => {
  const ps = (app.state && app.state.players) || (app.lobby && app.lobby.players) || [];
  const i = ps.findIndex(p => p.key === k);
  return i < 0 ? '#888' : ps[i].color || COLORS[i];
};
function renderChat() {
  const list = $('#chat-list');
  list.replaceChildren(...app.chat.slice(-50).map(m => {
    const li = document.createElement('li');
    li.innerHTML = '<b></b> <span></span>';
    li.querySelector('b').textContent = m.name + ':';
    li.querySelector('b').style.color = colorOf(m.key);
    li.querySelector('span').textContent = m.text;
    if (m.react) li.classList.add('react');
    return li;
  }));
  list.scrollTop = list.scrollHeight;
}
function floatReaction(m) {
  if (Date.now() - m.ts > 15000) return;
  const el = document.createElement('div');
  el.className = 'react-float';
  el.innerHTML = '<span></span><small></small>';
  el.querySelector('span').textContent = m.text;
  el.querySelector('small').textContent = m.name;
  el.querySelector('small').style.background = colorOf(m.key);
  el.style.left = (window.innerWidth * (0.2 + Math.random() * 0.6)) + 'px';
  el.style.top = (window.innerHeight * 0.7) + 'px';
  document.body.append(el);
  setTimeout(() => el.remove(), 2600);
}
function initChat() {
  $('#reacts').replaceChildren(...REACTS.map(e => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = e;
    b.onclick = () => sendChat(e, true);
    return b;
  }));
  $('#chat-form').onsubmit = ev => {
    ev.preventDefault();
    sendChat($('#chat-input').value);
    $('#chat-input').value = '';
  };
}

// ---------- Живой показ: какие кубики выбраны, на какое чудовище смотрим, какую карту тратим ----------
let lastLive = '', liveTimer = null, liveAt = 0;
function sendLive() {
  if (app.kind !== 'online' || !app.conn || !app.state || app.state.phase !== 'play') return;
  const msg = { gid: app.state.gid, seq: app.state.seq, sel: app.sel, hover: app.hover, pend: app.pend && app.pend.ab };
  const str = JSON.stringify(msg);
  if (str === lastLive) return;
  lastLive = str;
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { liveAt = Date.now(); app.conn.live({ ...msg, t: liveAt }); }, Math.max(0, 120 - (Date.now() - liveAt)));
}
// Живые подсказки других игроков к текущему состоянию.
function ghostsNow() {
  const s = app.state;
  return Object.entries(app.ghosts)
    .filter(([k, g]) => g.gid === s.gid && g.seq === s.seq && isOnline(k) && s.players.some(p => p.key === k))
    .map(([k, g]) => ({ ...g, key: k, color: colorOf(k) }));
}

// ---------- Ход ----------
const meIdx = () => (app.kind === 'local' ? app.state.turn : app.state.players.findIndex(p => p.key === app.myKey));
const myTurn = () => app.state && app.state.phase === 'play' && (app.kind === 'local' || app.state.players[app.state.turn].key === app.myKey);
// Можно ли тратить карты армии игрока p (в локальной игре — любые).
const canUseArmy = p => app.state && app.state.phase === 'play' && (app.kind === 'local' || app.state.players[p].key === app.myKey);

function clickDie(i) {
  const s = app.state;
  if (!s.dice) return;
  if (app.pend && '+-±~'.includes(app.pend.ab)) {
    const { p, i: ci, ab, sign } = app.pend;
    if (commit({ t: 'card', p, i: ci, die: i, sign })) app.pend = null;
    update();
    return;
  }
  if (!myTurn() && !(app.pend && app.pend.ab === '@')) return;
  app.sel = app.sel.includes(i) ? app.sel.filter(x => x !== i) : [...app.sel, i].sort();
  update();
}

function clickArmy(p, i) {
  const s = app.state;
  if (!canUseArmy(p)) return;
  const ab = CARDS[s.players[p].army[i]].ab;
  if (app.pend && app.pend.p === p && app.pend.i === i) { app.pend = null; update(); return; }
  if (ab === '#') {
    if (s.threat <= 0) return gameMsg('Угрозы пока нет — щит можно приберечь.');
    commit({ t: 'card', p, i });
    return;
  }
  if (!s.dice) return gameMsg(myTurn() ? 'Сначала бросьте кубики.' : 'Подождите, пока кубики будут брошены.');
  app.pend = { p, i, ab, sign: 1 };
  gameMsg('');
  update();
}

function clickMonster(r) {
  if (!myTurn() || !app.state.dice) return;
  const m = matching(app.state);
  if (!m.includes(r)) {
    const c = app.state.row[r];
    return gameMsg(`Нужно: ${reqText(reqOf(app.state, c.c))}.`);
  }
  commit({ t: 'beat', p: app.state.turn, r });
}

// ---------- Анимации ----------
let anim = { roll: [], mod: [], enter: [] };
function animate(prev, s) {
  anim = { roll: [], mod: [], enter: [] };
  for (const e of s.ev || []) {
    if (e.k === 'roll') anim.roll.push(...e.idx);
    if (e.k === 'mod') anim.mod.push(...e.idx);
  }
  const had = new Set(prev.row.map(r => r.c));
  anim.enter = s.row.filter(r => !had.has(r.c)).map(r => r.c);
  if (s.threat > prev.threat) {
    const t = $('#threat');
    t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit');
    const att = (s.ev || []).filter(e => e.k === 'attack');
    if (att.length) toast(att.map(e => CARDS[e.c].name).join(', ') + ' нападает!', 'bad');
  }
  const beat = (s.ev || []).find(e => e.k === 'beat');
  if (beat) toast(beat.c === 0 && s.bossHp > 0 ? 'Повелитель ранен!' : `${CARDS[beat.c].name} побеждён!`, 'good');
  const help = (s.ev || []).find(e => e.k === 'card' && e.p !== s.turn);
  if (help && s.players[help.p].key !== app.myKey) toast(`${s.players[help.p].name} помогает!`, 'good');
}
function toast(text, kind) {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 1600);
}

// ---------- Отрисовка ----------
function update() {
  if (app.mode === 'lobby') renderLobby();
  if (app.mode === 'game' && app.state) renderGame();
  sendLive();
}

function renderLobby() {
  const l = app.lobby;
  $('#lobby-code').textContent = app.code;
  $('#invite').value = location.origin + location.pathname + '?room=' + app.code;
  if (!l) {
    $('#lobby-players').replaceChildren();
    $('#lobby-diffs').replaceChildren();
    $('#btn-start').classList.add('hidden');
    return;
  }
  const owner = l.owner === app.myKey;
  $('#lobby-players').replaceChildren(...l.players.map((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="dot" style="background:${COLORS[i]}"></span><span></span>`;
    li.lastChild.textContent = p.name + (p.key === l.owner ? ' 👑' : '') + (p.key === app.myKey ? ' (вы)' : '');
    if (!isOnline(p.key)) { li.classList.add('off'); li.insertAdjacentHTML('beforeend', '<span class="off-tag">не в сети</span>'); }
    return li;
  }));
  renderDiffs($('#lobby-diffs'), owner, l.diff, d => { l.diff = d; app.diff = d; store.set('pq-diff', d); pubLobby(l); update(); });
  $('#btn-start').classList.toggle('hidden', !owner);
  $('#lobby-wait').textContent = owner ? 'Когда все соберутся — начинайте. Можно и в одиночку.' : 'Ждём, пока создатель комнаты начнёт поход…';
  if (!l.players.some(p => p.key === app.myKey) && l.players.length >= MAX_PLAYERS) $('#lobby-wait').textContent = 'Комната заполнена (5 героев).';
}

function renderGame() {
  const s = app.state;
  const d = D(s);
  $('#room-info').textContent = app.kind === 'online' ? `Комната ${app.code}` : 'На одном устройстве';
  $('#threat').innerHTML = '<span class="lbl">Угроза</span>' + Array.from({ length: d.limit }, (_, i) => SKULL.replace('class="sym skull"', `class="sym skull${i < s.threat ? ' on' : ''}"`)).join('');
  $('#deck-info').textContent = `${d.icon} ${d.name} · колода ${s.deck.length} · побеждено ${s.slain}`;
  $('#chat').classList.toggle('hidden', app.kind !== 'online');
  renderTable();
  renderPlayers();
  $('#log').replaceChildren(...s.log.slice().reverse().map(t => { const li = document.createElement('li'); li.textContent = t; return li; }));
  renderFinal();
}

function renderTable() {
  const s = app.state;
  if (!s || app.mode !== 'game') return;
  const mine = myTurn();
  const cur = s.players[s.turn];
  const m = matching(s);
  const gh = ghostsNow();
  const g = gh.find(x => x.key === cur.key);

  // Чей ход.
  const ti = $('#turn-info');
  if (s.phase !== 'play') ti.innerHTML = s.phase === 'win' ? '🏆 Победа!' : '💀 Поражение';
  else {
    const who = app.kind === 'local' ? `Ходит ${esc(cur.name)}` : mine ? 'Ваш ход' : `Ходит ${esc(cur.name)}`;
    let sub = !s.dice ? 'бросьте кубики' : m.length ? 'можно победить подсвеченное чудовище' : s.free > 0 ? `бесплатных перебросов: ${s.free}` : 'перебросы кончились — помогите картами армии';
    if (!mine && app.kind === 'online') sub = !s.dice ? 'ждём броска' : m.length ? 'кубики подходят!' : 'можно помочь картами армии';
    ti.innerHTML = `<span class="dot" style="background:${cur.color}"></span>${who} <span class="sub2">— ${sub}</span>`;
  }

  // Ряд чудовищ.
  const row = $('#row');
  const cards = s.row.map((r, i) => {
    const c = CARDS[r.c];
    const b = document.createElement('button');
    b.type = 'button';
    const left = furyLeft(s, r);
    b.className = 'mcard' + (c.boss ? ' boss' : '') + (left <= 2 ? ' angry' : '') +
      (m.includes(i) ? (mine ? ' can' : ' ok') : '') + (anim.enter.includes(r.c) ? ' enter' : '') +
      (g && g.hover === i && !mine ? ' ghost' : '');
    if (g) b.style.setProperty('--gc', g.color);
    const req = reqOf(s, r.c);
    const ab = c.ab ? ABILITIES[c.ab] : null;
    b.innerHTML = monsterSVG(r.c) +
      (ab ? `<span class="ab" title="${ab.name}: ${ab.desc}">${ab.icon}</span>` : '') +
      (c.boss ? `<span class="hp">${HEART.repeat(s.bossHp)}</span>` : '') +
      `<span class="nm">${esc(c.name)}</span>${reqHTML(req)}` +
      `<span class="fury" title="Нападёт через ${left} ход.">${Array.from({ length: D(s).fury }, (_, k) => `<i class="${k < left ? 'on' : ''}"></i>`).join('')}</span>`;
    b.title = `${c.name}\nНужно: ${reqText(req)}` + (ab ? `\nВ армии: ${ab.name} — ${ab.desc}` : '\nБосс') + `\nНападёт через ${left} ход.`;
    b.onclick = () => clickMonster(i);
    b.onpointerenter = () => { if (mine) { app.hover = i; sendLive(); } };
    b.onpointerleave = () => { if (app.hover === i) { app.hover = -1; sendLive(); } };
    return b;
  });
  while (cards.length < 5) { const e = document.createElement('div'); e.className = 'empty-slot'; cards.push(e); }
  row.replaceChildren(...cards);

  // Кубики.
  const targeting = app.pend && '+-±~'.includes(app.pend.ab);
  const gsel = g && !mine ? g.sel || [] : [];
  $('#dice').replaceChildren(...[0, 1, 2, 3, 4].map(i => {
    const b = document.createElement('button');
    b.type = 'button';
    const v = s.dice ? s.dice[i] : 0;
    b.className = 'die' + (!s.dice ? ' blank' : '') + (app.sel.includes(i) ? ' sel' : '') + (gsel.includes(i) ? ' gsel' : '') +
      (targeting && s.dice ? ' target' : '') + (anim.roll.includes(i) ? ' roll' : '') + (anim.mod.includes(i) ? ' mod' : '');
    if (g) b.style.setProperty('--gc', g.color);
    b.innerHTML = dieSVG(v || 6);
    b.onclick = () => clickDie(i);
    return b;
  }));
  anim.roll = []; anim.mod = []; anim.enter = [];

  const play = s.phase === 'play';
  $('#btn-roll').classList.toggle('hidden', !(play && mine && !s.dice));
  const rr = $('#btn-reroll');
  rr.classList.toggle('hidden', !(play && mine && s.dice && s.free > 0));
  rr.disabled = !app.sel.length;
  rr.textContent = app.sel.length ? `⟳ Перебросить выбранные (${app.sel.length}) · осталось ${s.free}` : `⟳ Выберите кубики для переброса · осталось ${s.free}`;
  const pass = $('#btn-pass');
  pass.classList.toggle('hidden', !(play && mine && s.dice));

  // Подсказка для карты, ждущей цели.
  const pr = $('#prompt');
  if (app.pend && play) {
    const a = ABILITIES[app.pend.ab];
    const owner = s.players[app.pend.p];
    const help = app.pend.p !== s.turn ? ` (помощь для ${esc(cur.name)})` : '';
    let html = `<span class="grow"><b>${a.icon} ${a.name}</b>${help}: `;
    if (app.pend.ab === '@') html += `выберите кубики и нажмите «Перебросить».</span><button id="pr-go" ${app.sel.length ? '' : 'disabled'}>⟳ Перебросить (${app.sel.length})</button>`;
    else html += 'нажмите на кубик.</span>';
    if (app.pend.ab === '±') html += `<button id="pr-plus" class="${app.pend.sign > 0 ? 'on' : ''}">+1</button><button id="pr-minus" class="${app.pend.sign < 0 ? 'on' : ''}">−1</button>`;
    html += '<button id="pr-cancel">Отмена</button>';
    pr.innerHTML = html;
    pr.classList.remove('hidden');
    if (app.kind === 'local') pr.querySelector('.grow').insertAdjacentText('afterbegin', owner.name + ': ');
    const go = $('#pr-go');
    if (go) go.onclick = () => { if (commit({ t: 'card', p: app.pend.p, i: app.pend.i, idx: app.sel })) app.pend = null; update(); };
    if ($('#pr-plus')) {
      $('#pr-plus').onclick = () => { app.pend.sign = 1; update(); };
      $('#pr-minus').onclick = () => { app.pend.sign = -1; update(); };
    }
    $('#pr-cancel').onclick = () => { app.pend = null; update(); };
  } else if (play && !mine && app.kind === 'online' && gh.some(x => x.pend)) {
    const x = gh.find(y => y.pend);
    const nm = s.players.find(p => p.key === x.key).name;
    pr.innerHTML = `<span class="grow">${esc(nm)} готовит карту: <b>${ABILITIES[x.pend].icon} ${ABILITIES[x.pend].name}</b></span>`;
    pr.classList.remove('hidden');
  } else pr.classList.add('hidden');

  // Можно ли занять место (зашли с другого устройства).
  if (app.kind === 'online' && play && meIdx() < 0) {
    const free = s.players.map((p, i) => [p, i]).filter(([p]) => !isOnline(p.key));
    pr.classList.remove('hidden');
    pr.innerHTML = `<span class="grow">Вы зритель. ${free.length ? 'Если вы — один из героев не в сети, займите место:' : ''}</span>`;
    for (const [p, i] of free) {
      const b = document.createElement('button');
      b.textContent = 'Я — ' + p.name;
      b.onclick = () => claimSeat(i);
      pr.append(b);
    }
  }
}

function renderPlayers() {
  const s = app.state;
  $('#players').replaceChildren(...s.players.map((p, pi) => {
    const box = document.createElement('div');
    box.className = 'pl' + (pi === s.turn && s.phase === 'play' ? ' turn' : '') + (isOnline(p.key) ? '' : ' off');
    const me = app.kind === 'online' && p.key === app.myKey;
    box.innerHTML = `<div class="ph"><span class="dot" style="background:${p.color}"></span><span class="nm"></span><small>армия: ${p.army.length}</small></div><div class="army"></div>`;
    box.querySelector('.nm').textContent = p.name + (me ? ' (вы)' : '') + (isOnline(p.key) ? '' : ' · не в сети');
    const army = box.querySelector('.army');
    const usable = canUseArmy(pi);
    if (!p.army.length) army.innerHTML = '<span class="empty">Армия пуста — побеждайте чудовищ</span>';
    p.army.forEach((id, i) => {
      const c = CARDS[id], a = ABILITIES[c.ab];
      const b = document.createElement('button');
      b.type = 'button';
      const pend = app.pend && app.pend.p === pi && app.pend.i === i;
      b.className = 'acard' + (usable ? ' use' : '') + (pend ? ' pend' : '');
      b.disabled = !usable;
      b.title = `${c.name}: ${a.name} — ${a.desc}`;
      b.innerHTML = `<span class="ai">${a.icon}</span><span class="an"></span>`;
      b.querySelector('.an').textContent = a.name;
      b.onclick = () => clickArmy(pi, i);
      army.append(b);
    });
    return box;
  }));
}

function renderFinal() {
  const s = app.state;
  const over = s.phase !== 'play';
  $('#final').classList.toggle('hidden', !over || app.finalShown);
  if (!over) return;
  const win = s.phase === 'win';
  $('#final-title').textContent = win ? '🏆 Королевство спасено!' : '💀 Тьма победила';
  $('#final-text').textContent = win
    ? `Сложность «${D(s).name}». Слава отряда: ${score(s)}. Ушло чудовищ: ${s.fled}, угроза ${s.threat}/${D(s).limit}.`
    : `Сложность «${D(s).name}». Побеждено чудовищ: ${s.slain}, в колоде оставалось ${s.deck.length}${s.bossHp > 0 && !s.deck.length ? ', Повелитель устоял' : ''}.`;
  $('#final-list').replaceChildren(...s.players.map(p => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="dot" style="background:${p.color}"></span><span></span>`;
    li.lastChild.textContent = `${p.name} — карт в армии: ${p.army.length}`;
    return li;
  }));
}

// ---------- Кнопки ----------
$('#btn-roll').onclick = () => { if (myTurn()) commit({ t: 'roll', p: app.state.turn }); };
$('#btn-reroll').onclick = () => { if (myTurn() && app.sel.length) commit({ t: 'reroll', p: app.state.turn, idx: app.sel }); };
$('#btn-pass').onclick = () => {
  if (!myTurn()) return;
  const m = matching(app.state);
  if (m.length && !confirm('Кубики подходят под чудовище! Всё равно передать ход?')) return;
  if (!m.length && app.state.free > 0 && !confirm('Остались бесплатные перебросы. Передать ход?')) return;
  commit({ t: 'pass', p: app.state.turn });
};
$('#btn-menu').onclick = () => {
  if (app.kind === 'local') save();
  leave();
};
$('#btn-leave').onclick = leave;
$('#btn-copy').onclick = () => {
  const inp = $('#invite');
  inp.select();
  (navigator.clipboard ? navigator.clipboard.writeText(inp.value) : Promise.reject()).catch(() => document.execCommand('copy'));
  $('#btn-copy').textContent = 'Скопировано';
  setTimeout(() => { $('#btn-copy').textContent = 'Копировать'; }, 1500);
};
$('#btn-start').onclick = () => {
  const l = app.lobby;
  if (!l || l.owner !== app.myKey) return;
  const s = newGame(l.players, l.diff);
  s.by = app.myKey;
  app.conn.state(s);
  setState(s);
};
$('#btn-again').onclick = () => {
  const s = app.state;
  const n = newGame(s.players.map(p => ({ name: p.name, key: p.key })), s.diff);
  n.by = app.myKey;
  app.finalShown = false;
  setState(n);
  if (app.kind === 'online') app.conn.state(n);
};
$('#btn-close-final').onclick = () => { app.finalShown = true; update(); };

window.addEventListener('keydown', e => {
  if (app.mode !== 'game' || !app.state || e.target.tagName === 'INPUT') return;
  if (e.key >= '1' && e.key <= '5') clickDie(+e.key - 1);
  else if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (!$('#btn-roll').classList.contains('hidden')) $('#btn-roll').click();
    else if (!$('#btn-reroll').classList.contains('hidden') && app.sel.length) $('#btn-reroll').click();
  } else if (e.key === 'Escape') { app.pend = null; app.sel = []; update(); }
});

// Раз в несколько секунд обновляем отметки «в сети».
setInterval(() => { if (app.kind === 'online') update(); }, 5000);

initChat();
initMenu();

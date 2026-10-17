// Вся графика рисуется здесь программно (SVG): кубики, символы, чудовища.

const PIPS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

export function dieSVG(v, cls = '') {
  const pips = (PIPS[v] || []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5"/>`).join('');
  return `<svg class="die-svg ${cls}" viewBox="0 0 100 100" aria-label="${v}"><rect x="4" y="4" width="92" height="92" rx="20"/><g>${pips}</g></svg>`;
}

const SUN = `<svg class="sym sun" viewBox="0 0 100 100"><g stroke-width="9" stroke-linecap="round">${
  Array.from({ length: 8 }, (_, i) => {
    const a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    return `<line x1="${50 + 30 * c}" y1="${50 + 30 * s}" x2="${50 + 44 * c}" y2="${50 + 44 * s}"/>`;
  }).join('')}</g><circle cx="50" cy="50" r="21"/></svg>`;
const MOON = `<svg class="sym moon" viewBox="0 0 100 100"><path d="M62 8a44 44 0 1 0 30 70A36 36 0 1 1 62 8z"/></svg>`;

// Требование карты в виде значков.
export function reqHTML(req) {
  if (req[0] === 'R') {
    const k = +req[1];
    return `<span class="req run" title="${k} значений подряд">${dieSVG(1, 'mini')}<b>→</b>${dieSVG(k, 'mini')}<small>подряд</small></span>`;
  }
  const parts = [];
  for (const ch of req) parts.push(ch === 'S' ? SUN : ch === 'M' ? MOON : dieSVG(+ch, 'mini'));
  return `<span class="req">${parts.join('')}</span>`;
}

function rng(seed) {
  let x = seed * 9301 + 49297;
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
}

// Чудовище по номеру карты: форма тела, цвет, глаза, рога, пасть — всё из «зерна».
export function monsterSVG(id) {
  const r = rng(id * 7 + 3);
  const boss = id === 0;
  const hue = boss ? 275 : Math.floor(r() * 360);
  const body = `hsl(${hue} ${boss ? 45 : 50 + r() * 25}% ${boss ? 28 : 42 + r() * 14}%)`;
  const dark = `hsl(${hue} 45% ${boss ? 15 : 24}%)`;
  const light = `hsl(${hue} 60% ${boss ? 45 : 70}%)`;
  const shape = boss ? 0 : Math.floor(r() * 4);
  let out = '';
  // Фон — небо/пещера.
  out += `<rect width="100" height="100" fill="hsl(${(hue + 180) % 360} 25% ${boss ? 12 : 22}%)"/>`;
  out += `<circle cx="${20 + r() * 60}" cy="18" r="${boss ? 14 : 8}" fill="hsl(${(hue + 160) % 360} 40% ${boss ? 30 : 40}%)" opacity=".5"/>`;
  // Рога / уши / щупальца позади тела.
  const horns = boss ? 2 : Math.floor(r() * 3);
  if (horns === 1) out += `<path d="M30 40 L18 12 L42 32Z M70 40 L82 12 L58 32Z" fill="${light}"/>`;
  if (horns === 2) out += `<path d="M34 36 C20 30 16 14 26 6 C28 18 34 24 42 30Z M66 36 C80 30 84 14 74 6 C72 18 66 24 58 30Z" fill="${boss ? '#d8c8a0' : light}"/>`;
  if (!boss && r() < 0.35) {
    for (let i = 0; i < 4; i++) {
      const x = 22 + i * 18;
      out += `<path d="M${x} 80 q ${-6 + r() * 12} 12 ${-4 + r() * 8} 20" stroke="${dark}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    }
  }
  // Тело.
  if (shape === 0) out += `<path d="M18 92 C14 52 28 26 50 26 C72 26 86 52 82 92Z" fill="${body}"/>`;
  else if (shape === 1) out += `<ellipse cx="50" cy="62" rx="34" ry="30" fill="${body}"/>`;
  else if (shape === 2) {
    let d = 'M';
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, rr = i % 2 ? 26 : 36;
      d += `${50 + rr * Math.cos(a)} ${62 + rr * 0.85 * Math.sin(a)} `;
    }
    out += `<path d="${d}Z" fill="${body}"/>`;
  } else out += `<path d="M26 96 L30 40 Q50 14 70 40 L74 96Z" fill="${body}"/>`;
  // Брюшко.
  out += `<ellipse cx="50" cy="78" rx="18" ry="12" fill="${light}" opacity=".35"/>`;
  // Глаза.
  const eyes = boss ? 2 : 1 + Math.floor(r() * 3);
  const eyeY = 50 + (shape === 1 ? 2 : 0);
  const iris = boss ? '#ff3b30' : `hsl(${(hue + 120) % 360} 90% 55%)`;
  const xs = eyes === 1 ? [50] : eyes === 2 ? [39, 61] : [34, 50, 66];
  for (const x of xs) {
    const er = eyes === 1 ? 11 : 7.5;
    out += `<circle cx="${x}" cy="${eyeY}" r="${er}" fill="#fff8e6"/><circle cx="${x}" cy="${eyeY + 1}" r="${er * 0.5}" fill="${iris}"/><circle cx="${x}" cy="${eyeY + 1}" r="${er * 0.22}" fill="#111"/>`;
  }
  if (boss || r() < 0.5) out += `<path d="M${xs[0] - 9} ${eyeY - 11} L${xs[0] + 5} ${eyeY - 7} M${xs.at(-1) + 9} ${eyeY - 11} L${xs.at(-1) - 5} ${eyeY - 7}" stroke="${dark}" stroke-width="3.5" stroke-linecap="round"/>`;
  // Пасть с зубами.
  const my = eyeY + 18, mw = 12 + r() * 8;
  out += `<path d="M${50 - mw} ${my} Q50 ${my + 14} ${50 + mw} ${my}Z" fill="${dark}"/>`;
  const teeth = 2 + Math.floor(r() * 3);
  for (let i = 0; i < teeth; i++) {
    const x = 50 - mw + 4 + i * ((2 * mw - 8) / Math.max(1, teeth - 1));
    out += `<path d="M${x - 2.5} ${my} L${x} ${my + 5} L${x + 2.5} ${my}Z" fill="#fff8e6"/>`;
  }
  if (boss) out += `<path d="M32 22 L36 8 L43 18 L50 4 L57 18 L64 8 L68 22Z" fill="#e8b923" stroke="#8a6a10" stroke-width="1.5"/><circle cx="50" cy="15" r="2.6" fill="#ff3b30"/>`;
  return `<svg class="monster" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${out}</svg>`;
}

export const HEART = '<svg class="sym heart" viewBox="0 0 100 100"><path d="M50 88 C10 60 4 36 18 22 C30 10 46 16 50 30 C54 16 70 10 82 22 C96 36 90 60 50 88Z"/></svg>';
export const SKULL = '<svg class="sym skull" viewBox="0 0 100 100"><path d="M50 8C28 8 14 24 14 44c0 12 6 20 14 25v15h44V69c8-5 14-13 14-25C86 24 72 8 50 8z"/><circle cx="36" cy="46" r="9" class="hole"/><circle cx="64" cy="46" r="9" class="hole"/><path d="M45 64h10l-5-9z" class="hole"/></svg>';

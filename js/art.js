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

export const HEART = '<svg class="sym heart" viewBox="0 0 100 100"><path d="M50 88 C10 60 4 36 18 22 C30 10 46 16 50 30 C54 16 70 10 82 22 C96 36 90 60 50 88Z"/></svg>';
export const SKULL = '<svg class="sym skull" viewBox="0 0 100 100"><path d="M50 8C28 8 14 24 14 44c0 12 6 20 14 25v15h44V69c8-5 14-13 14-25C86 24 72 8 50 8z"/><circle cx="36" cy="46" r="9" class="hole"/><circle cx="64" cy="46" r="9" class="hole"/><path d="M45 64h10l-5-9z" class="hole"/></svg>';

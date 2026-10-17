// Бестиарий: каждое чудовище нарисовано вручную в духе гравюры — тушь, штриховка, пергамент.
// Холст 100×80, главное — в полосе y 10…70 (на телефоне верх и низ обрезаются).

const INK = '#2a1e14';
const F = { L: '#f8efd9', M: '#e3cfa5', S: '#c9ad7f', D: INK, H: 'url(#pq-h)', X: 'url(#pq-x)', N: 'none' };
const fill = f => F[f] || f;
const p = (d, f = 'L', w = 1.3) => `<path d="${d}" fill="${fill(f)}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
const ln = (d, w = 1.1) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const sh = d => `<path d="${d}" fill="url(#pq-h)"/>`;
const xs = d => `<path d="${d}" fill="url(#pq-x)"/>`;
const mir = s => `<g transform="matrix(-1 0 0 1 100 0)">${s}</g>`;
const both = s => s + mir(s);
const tube = (d, w, f = 'L') => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 2.6}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${fill(f)}" stroke-width="${w}" stroke-linecap="round"/>`;
const tubeH = (d, w) => tube(d, w) + `<path d="${d}" fill="none" stroke="url(#pq-h)" stroke-width="${w * 0.45}" stroke-linecap="round" transform="translate(${w * 0.18} ${w * 0.18})"/>`;
const eye = (x, y, r, c = '#f0b81c') =>
  `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${c}" opacity=".22"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${INK}" stroke-width=".9"/><ellipse cx="${x}" cy="${y}" rx="${r * 0.32}" ry="${r * 0.8}" fill="${INK}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.22}" fill="#fff"/>`;
const glowEye = (x, y, r, c = '#ff4b2b') => `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="${c}" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="#fff6c8"/>`;
const flame = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 Q-8 -4 -5 -14 Q-2 -9 -1 -13 Q0 -20 3 -26 Q10 -15 7 -6 Q6 -1 0 0Z" fill="#e8742a" stroke="${INK}" stroke-width="1"/><path d="M1 -2 Q-3 -5 -1 -10 Q1 -8 2 -12 Q6 -7 4 -3Z" fill="#f7cf3c"/></g>`;
const ground = (w = 30, y = 75) => `<ellipse cx="50" cy="${y}" rx="${w}" ry="3.6" fill="url(#pq-h)" opacity=".8"/>` + ln(`M${50 - w} ${y} q3 -4 4 0 M${50 + w - 6} ${y} q2 -5 4 0 M${50 - w + 10} ${y + 1} q1 -3 3 0`, 0.8);
const teeth = (x1, x2, y, n, h = 3, down = true) => {
  let d = '';
  const st = (x2 - x1) / n;
  for (let i = 0; i < n; i++) { const x = x1 + i * st; d += `M${x} ${y} L${x + st / 2} ${y + (down ? h : -h)} L${x + st} ${y}Z `; }
  return p(d, 'L', 0.8);
};
const fur = (x1, y1, x2, y2, n) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
    d += `M${x} ${y} l${1.5 + (i % 3)} ${3 + (i % 2) * 2} `;
  }
  return ln(d, 0.7);
};
const stars = () => ln('M14 14 l0 4 M12 16 l4 0 M84 12 l0 3 M82.5 13.5 l3 0 M88 30 l0 2 M87 31 l2 0', 0.7);
const moon = (x = 80, y = 18) => p(`M${x} ${y - 7} a7 7 0 1 0 6 11 a6 6 0 1 1 -6 -11Z`, 'L', 0.9);

// ---------- Архетипы ----------
const A = {
  goblin(v = {}) {
    const skin = v.skin || 'L';
    return ground(18) +
      p('M38 76 Q36 58 50 54 Q64 58 62 76Z', 'M') + sh('M54 56 Q62 60 62 76 L56 76 Q58 64 52 57Z') +
      ln('M44 62 L50 66 L56 62 M50 66 V76', 0.8) +
      both(p('M37 34 L12 22 Q18 32 31 41Z', skin) + sh('M16 25 L31 38 L29 33Z')) +
      (v.horns ? both(p('M40 24 Q34 12 38 6 Q41 16 45 21Z', 'M')) : '') +
      p('M34 36 Q34 18 50 18 Q66 18 66 36 Q66 52 50 55 Q34 52 34 36Z', skin) +
      sh('M58 21 Q66 26 66 36 Q66 48 57 53 Q63 44 62 34 Q61 26 58 21Z') +
      p('M37 30 Q50 25 63 30 L62 32 Q50 28 38 32Z', 'D', 0.6) +
      eye(43.5, 35, 3.2, v.eye || '#f0b81c') + eye(56.5, 35, 3.2, v.eye || '#f0b81c') +
      ln('M50 35 Q45 44 49 45.5 Q53 45 52 41') +
      p('M41 47.5 Q50 53 59 47.5 Q50 50 41 47.5Z', 'D', 0.8) + teeth(43, 57, 48.2, 4, 2.2) +
      (v.spear
        ? ln('M70 76 L82 14', 2.2) + p('M82 14 L79 22 L85 23Z', 'M', 1) + p('M64 66 Q70 62 72 66 Q70 70 65 69Z', skin, 1)
        : p('M65 63 L81 42 L83.5 44 L67.5 65Z', 'L', 1) + ln('M80 46 L67 63', 0.5) + ln('M62 60 L69 67', 3) + p('M61 62 Q66 58 69 63 Q67 68 62 66Z', skin, 1));
  },
  slime() {
    return `<ellipse cx="50" cy="75" rx="34" ry="4" fill="url(#pq-h)"/>` +
      p('M16 75 Q14 54 28 46 Q32 26 50 24 Q68 26 72 46 Q86 54 84 75Z', '#cfe0a6') +
      sh('M70 46 Q86 54 84 75 L72 75 Q76 58 66 50Z') +
      p('M28 75 Q28 82 31 82 Q34 82 33 75 M60 75 Q61 80 63 80 Q65 80 65 75', '#cfe0a6', 1) +
      p('M33 56 Q36 51 41 54 Q38 60 33 56Z', 'L', 0.7) + `<g opacity=".55">${p('M58 60 Q58 54 63 54 Q68 54 68 60 Q68 63 66 64 L66 66 L60 66 L60 64 Q58 63 58 60Z', 'L', 0.8)}<circle cx="61" cy="59" r="1.3" fill="${INK}"/><circle cx="65" cy="59" r="1.3" fill="${INK}"/></g>` +
      `<circle cx="28" cy="62" r="2" fill="none" stroke="${INK}" stroke-width=".7"/><circle cx="74" cy="64" r="1.4" fill="none" stroke="${INK}" stroke-width=".7"/><circle cx="45" cy="68" r="1.2" fill="none" stroke="${INK}" stroke-width=".7"/>` +
      ln('M36 32 Q42 27 48 28', 1.6).replace(INK, '#fffbe9') +
      eye(42, 42, 6, '#d9f07a') + eye(59, 44, 4.2, '#d9f07a') +
      p('M38 52 Q50 62 62 52 Q50 57 38 52Z', 'D', 0.8);
  },
  bat() {
    const wing = p('M47 40 Q30 20 6 25 Q13 31 11 38 Q19 36 21 45 Q27 40 31 49 Q38 42 45 50Z', 'M') +
      ln('M47 41 L10 27 M46 44 L19 37 M46 47 L29 46', 0.7) + sh('M44 44 L21 39 Q24 41 23 44 Q28 41 31 48 Q37 43 44 49Z');
    return moon(82, 16) + stars() + both(wing) +
      both(p('M44 32 L41 19 L48 29Z', 'D', 1)) +
      p('M42 40 Q42 29 50 29 Q58 29 58 40 Q58 56 50 61 Q42 56 42 40Z', 'S') + xs('M50 29 Q58 29 58 40 Q58 56 50 61Z') +
      glowEye(46, 37.5, 2.2) + glowEye(54, 37.5, 2.2) + teeth(46.5, 53.5, 44, 2, 3) + ln('M46 44 Q50 46 54 44', 0.8) +
      ln('M47 60 L45 66 M53 60 L55 66', 1);
  },
  rat() {
    return ground(22) + ln('M58 72 Q80 78 88 62 Q92 50 84 46 Q80 45 81 49', 2) +
      p('M34 76 Q32 54 47 48 Q62 52 63 76Z', 'S') + sh('M47 48 Q62 52 63 76 L54 76 Q56 58 47 50Z') +
      ln('M38 66 L44 60 M58 62 L54 68', 0.7) +
      p('M39 44 Q38 30 49 28 Q57 29 60 35 L77 41 Q79 46 74 47 L58 50 Q45 54 39 44Z', 'M') +
      sh('M58 46 L74 47 L58 50 Q50 52 45 50 Q52 48 58 46Z') + fur(40, 32, 44, 46, 5) +
      p('M43 31 Q37 17 49 20 Q53 27 48 33Z', 'M') + p('M44.5 29 Q41 21 48 22.5 Q50 27 47 31Z', '#d99a8c', 0.6) +
      eye(54, 37, 2.8, '#e5402a') + `<circle cx="77" cy="43.5" r="1.8" fill="${INK}"/>` +
      ln('M72 45 L84 42 M72 46 L84 47 M71 47 L82 51', 0.5) + p('M66 48 L67.5 52 L69 48Z', 'L', 0.7) +
      p('M62 62 Q68 56 70 61 Q69 66 63 66Z', 'M', 1) + p('M68 60 L86 54 L87 56 L69 63Z', 'L', 0.9);
  },
  beetle() {
    let legs = '';
    for (const [y, dx] of [[38, -14], [50, -18], [62, -14]]) legs += both(ln(`M34 ${y} l${dx} ${-4} l${dx / 3} ${8}`, 1.6));
    let spikes = '';
    for (let i = 0; i < 6; i++) spikes += both(p(`M${30 - i * 0.4} ${34 + i * 7} l-5 2 l5 3Z`, 'D', 0.6));
    return ground(30, 76) + legs + spikes +
      p('M50 22 Q72 25 74 50 Q72 73 50 75 Q28 73 26 50 Q28 25 50 22Z', 'M') +
      xs('M50 22 Q72 25 74 50 Q72 73 50 75Z') + ln('M50 28 V75', 1.2) +
      p('M34 40 Q38 34 44 36 Q40 42 34 40Z', 'L', 0.6) +
      p('M41 25 Q50 12 59 25 Q50 22 41 25Z', 'D') +
      both(p('M43 16 Q34 8 40 2 Q40 9 46 14Z', 'S', 1)) + glowEye(45.5, 19.5, 1.6, '#9be15a') + glowEye(54.5, 19.5, 1.6, '#9be15a');
  },
  skeleton(v = {}) {
    let ribs = '';
    for (let i = 0; i < 4; i++) ribs += both(ln(`M50 ${50 + i * 4.5} Q41 ${47 + i * 4.5} 39 ${53 + i * 4.5}`, 1.4));
    return ground(20) +
      (v.shield ? '' : ln('M66 72 L84 22', 2) + p('M84 22 L82 30 L87 28Z', 'L', 0.8) + ln('M62 62 L70 66', 2.5)) +
      ln('M50 45 V70', 2.2) + ribs +
      p('M42 70 Q50 65 58 70 L56 75 L44 75Z', 'L', 1) + ln('M45 75 L43 78 M55 75 L57 78', 2) +
      ln('M41 48 L31 60 L35 70', 2.2) + ln('M59 48 L66 60 L64 68', 2.2) +
      (v.shield ? p('M18 50 Q30 46 40 50 Q40 66 29 74 Q18 66 18 50Z', 'M', 1.3) + sh('M29 48 Q40 50 40 50 Q40 66 29 74Z') + p('M29 55 L32 60 L29 65 L26 60Z', 'D', 0.6) +
        ln('M72 74 L72 30', 1.6) + p('M66 30 Q72 18 78 30 Q72 27 66 30Z', 'L', 1) : '') +
      p('M38 30 Q38 14 50 14 Q62 14 62 30 Q62 36 58 38 L58 44 L42 44 L42 38 Q38 36 38 30Z', 'L') +
      sh('M55 15 Q62 18 62 30 Q62 36 58 38 L58 44 L55 44 Q58 34 55 15Z') +
      (v.helm ? p('M35.5 27 Q35 9 50 9 Q65 9 64.5 27 L61 27 Q61 15 50 15 Q39 15 39 27Z', 'M', 1.1) + ln('M50 9 V15', 1) + p('M47 9 Q50 0 56 2 Q52 4 53 9Z', '#b8432f', 0.8) : '') +
      p('M42 26 Q45 22 48.5 26 Q48.5 31 45 31 Q42 31 42 26Z', 'D', 0.8) + p('M51.5 26 Q55 22 58 26 Q58 31 55 31 Q51.5 31 51.5 26Z', 'D', 0.8) +
      glowEye(45.3, 27.3, 1.4, '#64d6ff') + glowEye(54.7, 27.3, 1.4, '#64d6ff') +
      p('M50 32 L48 36 L52 36Z', 'D', 0.6) + ln('M43 40 H57 M45 38 V44 M48 38 V44 M51 38 V44 M54 38 V44', 0.7);
  },
  bird(v = {}) {
    const wing = p('M44 40 Q28 18 6 16 Q12 22 10 26 Q16 26 16 31 Q22 30 21 36 Q28 36 28 42 Q36 42 38 50Z', v.fire ? '#f3b245' : 'M') +
      ln('M43 40 L10 19 M42 43 L16 29 M40 46 L22 37', 0.6) + sh('M40 46 L22 37 Q28 38 28 42 Q36 42 38 50Z');
    return (v.fire ? flame(30, 22, 0.8) + flame(72, 22, 0.8) : moon(84, 14)) + both(wing) +
      p('M42 76 L46 64 M58 76 L54 64', 'N', 1.4) + ln('M42 76 l-3 2 M42 76 l1 3 M58 76 l3 2 M58 76 l-1 3', 1) +
      p('M40 44 Q40 34 50 33 Q60 34 60 44 Q60 62 50 66 Q40 62 40 44Z', v.fire ? '#f0c060' : 'L') +
      sh('M50 33 Q60 34 60 44 Q60 62 50 66 Q56 52 50 33Z') + ln('M44 48 q2 2 4 0 q2 2 4 0 q2 2 4 0 M45 54 q2 2 4 0 q2 2 4 0', 0.6) +
      (v.woman
        ? p('M40 30 Q38 14 50 14 Q62 14 60 30 Q58 40 50 40 Q42 40 40 30Z', 'L') + p('M38 30 Q36 12 50 11 Q66 12 62 32 Q66 40 60 46 Q60 34 56 26 Q50 22 44 26 Q40 34 40 46 Q34 40 38 30Z', 'S', 1) +
          eye(45.5, 28, 2.4, '#e5402a') + eye(54.5, 28, 2.4, '#e5402a') + ln('M47 35 Q50 37 53 35')
        : p('M41 30 Q40 16 50 15 Q60 16 59 30 Q58 38 50 39 Q42 38 41 30Z', v.fire ? '#f0c060' : 'L') + (v.fire ? flame(50, 16, 0.6) : both(p('M43 17 Q38 10 42 6 Q44 12 47 15Z', 'M', 0.8))) +
          eye(45, 26, 2.6, v.fire ? '#fff3a0' : '#f0b81c') + eye(55, 26, 2.6, v.fire ? '#fff3a0' : '#f0b81c') +
          p('M46 30 L54 30 L50 41Z', '#e0a33a', 1) + ln('M50 30 V36', 0.6));
  },
  troll(v = {}) {
    return ground(34) +
      (v.club ? p('M79 72 L87 30 Q91 22 95 30 L86 73Z', 'M', 1.2) + sh('M88 30 Q91 24 95 30 L86 73 L84 72Z') + ln('M86 34 l4 -2 M85 42 l5 -1 M84 50 l4 0', 1) : '') +
      p('M14 77 Q11 52 30 44 Q50 38 70 44 Q89 52 86 77Z', 'M') + sh('M70 44 Q89 52 86 77 L74 77 Q77 58 66 48Z') +
      ln('M30 56 Q36 62 34 70 M66 56 Q62 64 66 72', 0.8) +
      p('M16 58 Q4 68 10 77 L22 77 Q19 68 26 61Z', 'M') + p('M78 58 Q90 64 84 72 Q80 70 76 66Z', 'M') +
      (v.horns ? both(p('M38 27 Q28 15 33 7 Q37 17 43 22Z', 'L', 1.1)) : '') +
      p('M35 40 Q33 21 50 19 Q67 21 65 40 Q61 51 50 51 Q39 51 35 40Z', 'L') + sh('M58 21 Q67 25 65 40 Q61 50 55 51 Q62 40 58 21Z') +
      p('M36 30 Q50 24 64 30 L63 34 Q50 29 37 34Z', 'D', 0.6) +
      (v.oneEye ? eye(50, 34, 5.2, '#f0b81c') : eye(44, 35.5, 2.6, '#e5402a') + eye(56, 35.5, 2.6, '#e5402a')) +
      p('M47 37 Q43 43 47 44 L53 44 Q57 43 53 37', 'L', 1) +
      p('M40 46 Q50 50 60 46 Q50 48 40 46Z', 'D', 0.8) + p('M42.5 46 L41.5 40.5 L45 45.5Z', 'L', 0.8) + p('M57.5 46 L58.5 40.5 L55 45.5Z', 'L', 0.8) +
      `<circle cx="38" cy="42" r=".8" fill="${INK}"/><circle cx="61" cy="27" r=".7" fill="${INK}"/>`;
  },
  wolf() {
    return moon(18, 16) + stars() +
      p('M20 77 Q22 56 34 50 L66 50 Q78 56 80 77Z', 'S') + fur(24, 60, 36, 52, 6) + fur(64, 52, 76, 60, 6) + sh('M66 50 Q78 56 80 77 L70 77 Q70 60 62 52Z') +
      p('M32 40 Q30 22 39 16 L43 5 L48 16 L52 16 L57 5 L61 16 Q70 22 68 40 Q66 50 60 54 L50 67 L40 54 Q34 50 32 40Z', 'M') +
      xs('M61 16 Q70 22 68 40 Q66 50 60 54 L56 58 Q62 44 61 16Z') + p('M44.5 9 L47 16 L45 16Z', 'D', 0.5) + p('M55.5 9 L53 16 L55 16Z', 'D', 0.5) +
      p('M41.5 45 L50 67 L58.5 45 Q50 41 41.5 45Z', 'L', 1.1) + p('M46.5 58 L53.5 58 L50 62.5Z', 'D', 0.6) +
      eye(42, 34, 2.8, '#f0d21c') + eye(58, 34, 2.8, '#f0d21c') + ln('M37 30 L46 32.5 M63 30 L54 32.5', 1.3) +
      teeth(45, 55, 63, 1, 0) + p('M45.5 61 L46.5 66 L48 62Z M54.5 61 L53.5 66 L52 62Z', 'L', 0.7);
  },
  imp() {
    const wing = p('M45 46 Q30 30 14 34 Q18 38 17 42 Q23 41 24 47 Q30 45 32 51 Q38 48 44 54Z', 'S') + ln('M45 46 L16 36 M44 50 L24 45', 0.6);
    return flame(36, 78, 0.9) + flame(52, 79, 1.1) + flame(66, 78, 0.8) + both(wing) +
      ln('M58 66 Q72 72 76 60 Q78 54 74 52', 1.6) + p('M74 52 L71 48 L78 49Z', 'D', 0.6) +
      p('M42 70 Q40 52 50 50 Q60 52 58 70Z', '#d3694a') + sh('M50 50 Q60 52 58 70 L54 70 Q55 58 50 51Z') +
      both(p('M40 29 Q31 19 34 10 Q39 21 44 26Z', 'L', 1)) +
      p('M38 38 Q38 24 50 24 Q62 24 62 38 Q62 50 50 52 Q38 50 38 38Z', '#df7d57') + sh('M56 25 Q62 28 62 38 Q62 48 55 51 Q60 42 56 25Z') +
      both(p('M38 34 L30 30 L37 39Z', '#df7d57', 1)) +
      eye(44.5, 36, 2.8, '#ffe14d') + eye(55.5, 36, 2.8, '#ffe14d') + ln('M40.5 31.5 L47 33.5 M59.5 31.5 L53 33.5', 1.3) +
      p('M42 43 Q50 50 58 43 Q50 46 42 43Z', 'D', 0.8) + teeth(44, 56, 43.6, 4, 2);
  },
  serpent(v = {}) {
    const body = 'M12 72 Q30 80 46 71 Q62 62 70 50 Q76 37 66 30 Q58 25 53 31';
    return (v.waves ? ln('M4 70 q6 -5 12 0 t12 0 M70 74 q6 -5 12 0 t12 0 M60 66 q5 -4 10 0', 1) : ground(30)) +
      tubeH(body, 11) + ln('M20 74 l2 -4 M30 74 l1 -5 M40 71 l0 -5 M52 66 l-1 -5 M62 58 l-3 -3', 0.6) +
      p('M44 22 Q55 15 64 21 Q67 30 58 33 L47 33 Q40 29 44 22Z', 'M') + sh('M58 18 Q66 22 64 30 L58 33 Q62 26 58 18Z') +
      (v.crown ? p('M47 18 L48 10 L52 15 L55 8 L58 15 L62 10 L61 19Z', '#e8b923', 0.9) : both(p('M44 23 L38 17 L45 20Z', 'D', 0.6).replace(/M44/, 'M44'))) +
      eye(52, 24, 2.6, v.crown ? '#ff4b2b' : '#f0b81c') + eye(59, 23.5, 2.2, v.crown ? '#ff4b2b' : '#f0b81c') +
      ln('M44 29 L35 31 M35 31 L32 29 M35 31 L32 33.5', 0.9).replace(INK, '#b8432f') + ln('M45 30 Q52 32 60 30', 0.7);
  },
  hydra() {
    const heads = [[22, 18, 'M48 62 Q34 50 30 36 Q28 28 24 24'], [50, 12, 'M50 60 Q50 40 52 26 Q52 20 50 18'], [78, 18, 'M52 62 Q66 50 70 36 Q72 28 76 24']];
    let s = ground(30) + p('M28 77 Q26 58 50 54 Q74 58 72 77Z', 'M') + sh('M50 54 Q74 58 72 77 L62 77 Q64 62 50 56Z');
    for (const [x, y, d] of heads) {
      s += tubeH(d, 7) +
        p(`M${x - 7} ${y + 3} Q${x} ${y - 6} ${x + 7} ${y + 3} Q${x + 6} ${y + 9} ${x} ${y + 10} Q${x - 6} ${y + 9} ${x - 7} ${y + 3}Z`, 'M') +
        both('') + p(`M${x - 5} ${y} L${x - 8} ${y - 6} L${x - 2} ${y - 2}Z M${x + 5} ${y} L${x + 8} ${y - 6} L${x + 2} ${y - 2}Z`, 'D', 0.6) +
        eye(x - 2.5, y + 2.5, 1.7, '#9be15a') + eye(x + 2.5, y + 2.5, 1.7, '#9be15a') + teeth(x - 3, x + 3, y + 7, 2, 1.8);
    }
    return s;
  },
  worm() {
    let segs = '';
    for (let i = 0; i < 4; i++) segs += ln(`M${26 + i * 2} ${70 - i * 9} Q50 ${76 - i * 9} ${74 - i * 2} ${70 - i * 9}`, 0.8);
    let ring = '';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      ring += `M${50 + 15 * c} ${30 + 12 * s} L${50 + 8 * Math.cos(a + 0.26)} ${30 + 6.4 * Math.sin(a + 0.26)} L${50 + 15 * Math.cos(a + 0.52)} ${30 + 12 * Math.sin(a + 0.52)}Z `;
    }
    return ln('M4 76 q8 -6 16 -2 t18 0 M62 76 q8 -5 16 -1 t18 -1', 0.9) +
      p('M24 78 Q22 40 30 24 Q50 8 70 24 Q78 40 76 78Z', 'M') + segs + sh('M64 20 Q78 34 76 78 L66 78 Q70 40 60 18Z') +
      `<ellipse cx="50" cy="30" rx="19" ry="15" fill="${INK}"/>` + p(ring, '#f8efd9', 0.6) +
      `<ellipse cx="50" cy="30" rx="6" ry="4.6" fill="#7a2418"/>`;
  },
  kraken() {
    const t = (d, w = 6) => tubeH(d, w);
    return ln('M2 72 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0', 1) +
      t('M38 58 Q24 70 12 60 Q6 52 14 48 Q18 50 16 54') + t('M62 58 Q76 70 88 60 Q94 52 86 48 Q82 50 84 54') +
      t('M44 62 Q38 76 26 74', 5) + t('M56 62 Q62 76 74 74', 5) +
      p('M30 40 Q30 12 50 10 Q70 12 70 40 Q70 58 50 62 Q30 58 30 40Z', 'M') + xs('M60 12 Q70 18 70 40 Q70 56 58 61 Q66 44 60 12Z') +
      `<circle cx="40" cy="22" r="1.4" fill="none" stroke="${INK}" stroke-width=".6"/><circle cx="45" cy="16" r="1" fill="none" stroke="${INK}" stroke-width=".6"/>` +
      eye(42, 42, 4, '#f0b81c') + eye(58, 42, 4, '#f0b81c') + ln('M37 36 L46 38 M63 36 L54 38', 1.2) +
      ln('M24 52 l2 1 M20 58 l2 0 M80 52 l-2 1 M84 58 l-2 0', 2).replace(/stroke="#2a1e14"/, 'stroke="#f8efd9"');
  },
  wisp() {
    return `<circle cx="50" cy="40" r="30" fill="url(#pq-glow)"/>` +
      p('M50 70 Q30 64 32 44 Q34 30 44 22 Q42 30 48 32 Q46 18 56 8 Q56 20 64 26 Q72 36 68 52 Q64 66 50 70Z', '#f7c948') +
      p('M50 64 Q38 60 40 48 Q42 40 48 36 Q48 42 52 42 Q54 34 58 30 Q64 40 62 50 Q60 60 50 64Z', '#fff2b0', 0.8) +
      `<ellipse cx="45" cy="49" rx="2.4" ry="3.4" fill="${INK}"/><ellipse cx="55" cy="49" rx="2.4" ry="3.4" fill="${INK}"/>` +
      ln('M46 57 Q50 60 54 57', 1) + stars() +
      `<circle cx="22" cy="58" r="1.6" fill="#f7c948"/><circle cx="80" cy="50" r="1.2" fill="#f7c948"/><circle cx="76" cy="66" r="1.8" fill="#f7c948"/>`;
  },
  golem() {
    return ground(32) +
      p('M18 50 L26 44 L34 48 L32 62 L22 66 L16 60Z', 'S') + p('M66 48 L74 44 L82 50 L84 60 L78 66 L68 62Z', 'S') +
      p('M30 77 L28 52 L38 44 L62 44 L72 52 L70 77Z', 'M') + xs('M62 44 L72 52 L70 77 L62 77Z') +
      ln('M40 56 L46 60 L44 68 M58 52 L54 58 L58 64', 0.8) +
      p('M36 42 L38 22 L50 16 L62 22 L64 42 L50 46Z', 'S') + sh('M50 16 L62 22 L64 42 L50 46Z') +
      ln('M44 20 L42 28 M60 32 L56 36', 0.7) +
      `<path d="M47 56 L50 52 L53 56 L50 60Z M30 54 l2 4 M74 54 l-2 4" fill="none" stroke="#5fd3ff" stroke-width="1.6"/>` +
      glowEye(44, 31, 2.2, '#5fd3ff') + glowEye(56, 31, 2.2, '#5fd3ff') + ln('M44 39 L56 39', 1.4);
  },
  ghost(v = {}) {
    return stars() + moon(18, 16) +
      p('M30 76 Q26 40 32 28 Q40 12 50 12 Q60 12 68 28 Q74 40 70 76 L64 70 L58 77 L52 70 L46 77 L40 70 L35 76Z', 'L') +
      sh('M60 15 Q70 24 72 40 Q73 56 70 76 L64 70 L62 72 Q66 50 60 15Z') +
      p('M32 44 Q20 46 16 38 Q22 40 30 38Z M68 44 Q80 46 84 38 Q78 40 70 38Z', 'L', 1) +
      (v.scream
        ? ln('M32 26 Q26 40 28 58 M68 26 Q74 40 72 58 M36 20 Q30 34 32 48', 0.7) +
          p('M40 30 Q44 26 47 31 Q44 36 40 30Z M53 31 Q56 26 60 30 Q56 36 53 31Z', 'D', 0.8) + p('M44 42 Q50 38 56 42 Q57 54 50 57 Q43 54 44 42Z', 'D', 0.8)
        : p('M40 30 Q44 24 48 30 Q47 36 44 36 Q40 36 40 30Z M52 30 Q56 24 60 30 Q60 36 56 36 Q53 36 52 30Z', 'D', 0.8) +
          glowEye(44, 31, 1.2, '#64d6ff') + glowEye(56, 31, 1.2, '#64d6ff') + p('M45 44 Q50 41 55 44 Q53 50 50 50 Q47 50 45 44Z', 'D', 0.8));
  },
  spider() {
    let legs = '';
    for (const [y, a, b] of [[40, -16, -12], [44, -20, -2], [48, -18, 10], [52, -12, 18]]) legs += both(ln(`M42 ${y} l${a * 0.6} ${-10 + b * 0.2} l${a * 0.5} ${12 + b * 0.6}`, 1.6));
    return ln('M0 0 L40 36 M100 0 L60 36 M50 0 V30 M0 40 L36 44 M100 40 L64 44', 0.4) +
      ln('M20 18 Q30 26 26 34 M80 18 Q70 26 74 34 M34 8 Q42 14 44 8 M66 8 Q58 14 56 8', 0.4) + ln('M50 0 V22', 0.8) +
      ground(28) + legs +
      p('M50 46 Q66 46 66 62 Q64 76 50 76 Q36 76 34 62 Q34 46 50 46Z', 'S') + xs('M50 46 Q66 46 66 62 Q64 76 50 76Z') +
      p('M46 56 L50 52 L54 56 L50 66Z', '#b8432f', 0.7) +
      p('M41 40 Q41 30 50 30 Q59 30 59 40 Q59 48 50 48 Q41 48 41 40Z', 'M') +
      glowEye(46, 37, 1.6, '#ff4b2b') + glowEye(54, 37, 1.6, '#ff4b2b') + glowEye(48.5, 34, 1, '#ff4b2b') + glowEye(51.5, 34, 1, '#ff4b2b') +
      p('M46 46 Q45 51 47 52 L48 47Z M54 46 Q55 51 53 52 L52 47Z', 'D', 0.6);
  },
  bear() {
    return ground(32) +
      p('M16 77 Q14 54 32 46 L68 46 Q86 54 84 77Z', 'S') + fur(20, 64, 32, 50, 6) + fur(68, 50, 80, 64, 6) + sh('M68 46 Q86 54 84 77 L74 77 Q74 58 64 50Z') +
      both(`<circle cx="32" cy="22" r="7" fill="${F.M}" stroke="${INK}" stroke-width="1.3"/><circle cx="32" cy="22" r="3.5" fill="url(#pq-h)"/>`) +
      p('M30 38 Q30 18 50 17 Q70 18 70 38 Q70 54 50 56 Q30 54 30 38Z', 'M') + sh('M60 19 Q70 24 70 38 Q70 52 58 55 Q66 42 60 19Z') +
      both(p('M38 52 Q30 60 34 66 Q38 58 44 55Z', 'D', 0.8)) +
      p('M41 42 Q50 36 59 42 Q60 52 50 53 Q40 52 41 42Z', 'L', 1.1) + p('M46.5 42 L53.5 42 L50 46Z', 'D', 0.6) +
      eye(42, 33, 2.4, '#e5402a') + eye(58, 33, 2.4, '#e5402a') + ln('M50 46 V49 M46 49.5 Q50 52 54 49.5', 0.9) +
      p('M34 26 L28 18 L36 24Z M66 26 L72 18 L64 24Z', 'D', 0.6);
  },
  wendigo() {
    const antler = ln('M40 24 Q32 14 30 4 M33 12 L24 10 M31 7 L26 2 M36 18 L28 20', 1.6);
    return stars() + moon(84, 16) +
      p('M24 77 Q26 54 40 50 L60 50 Q74 54 76 77Z', 'D') + ln('M30 77 L34 58 M70 77 L66 58 M50 77 V56', 0.6).replace(INK, '#6b5a44') +
      both(antler) +
      p('M38 32 Q38 20 50 20 Q62 20 62 32 L58 44 L54 56 L46 56 L42 44Z', 'L') + sh('M56 21 Q62 24 62 32 L58 44 L54 56 L52 56 Q56 40 56 21Z') +
      p('M41 32 Q44 28 48 32 Q47 37 44 37 Q41 37 41 32Z M52 32 Q56 28 59 32 Q59 37 56 37 Q53 37 52 32Z', 'D', 0.8) +
      glowEye(44.5, 33, 1.3, '#9be1ff') + glowEye(55.5, 33, 1.3, '#9be1ff') +
      p('M48 42 L50 46 L52 42Z', 'D', 0.6) + ln('M46 50 H54 M47 49 V55 M50 49 V56 M53 49 V55', 0.6);
  },
  witch() {
    return ground(24) + flame(74, 76, 0.7) + p('M64 66 Q64 76 74 76 Q84 76 84 66Z', 'D', 1) + ln('M62 66 H86', 1.3) +
      ln('M28 76 L36 30', 1.6) + p('M34 32 Q30 20 38 18 Q36 26 38 30Z', '#a07a4a', 0.8) +
      p('M34 77 Q32 50 50 44 Q68 50 66 77Z', 'S') + xs('M50 44 Q68 50 66 77 L58 77 Q60 58 50 46Z') +
      ln('M38 30 Q32 48 36 60 M62 30 Q68 48 64 58', 0.8) + p('M37 30 Q34 46 38 56 Q40 44 42 36Z M63 30 Q66 46 62 56 Q60 44 58 36Z', 'M', 0.8) +
      p('M40 32 Q40 20 50 20 Q60 20 60 32 Q58 44 50 45 Q42 44 40 32Z', '#dbe3b8') +
      p('M26 24 Q50 18 74 24 Q60 26 50 25 Q40 26 26 24Z', 'D', 1) + p('M38 23 Q42 10 52 2 Q50 12 62 22Z', 'D', 1) + ln('M40 20 Q50 17 60 20', 1.8).replace(INK, '#b8432f') +
      eye(45.5, 30, 2.2, '#9be15a') + eye(54.5, 30, 2.2, '#9be15a') +
      ln('M50 30 Q49 37 54 40 Q51 40 49 38', 1) + ln('M46 41 Q50 43 54 41', 0.8) + `<circle cx="55" cy="36" r=".8" fill="${INK}"/>`;
  },
  bull() {
    return ground(30) +
      ln('M80 76 L72 26', 1.8) + p('M72 26 Q84 22 88 34 Q80 32 74 36Z', 'L', 1) + p('M72 26 Q60 26 58 36 Q66 32 74 36Z', 'L', 1) +
      p('M20 77 Q18 54 34 48 L66 48 Q82 54 80 77Z', 'M') + sh('M66 48 Q82 54 80 77 L70 77 Q72 60 62 50Z') + fur(30, 50, 44, 47, 6) +
      both(p('M36 26 Q22 24 16 12 Q20 10 24 16 Q30 22 38 22Z', 'L', 1.1) + sh('M18 13 Q22 20 30 22 Q22 20 18 13Z')) +
      p('M34 30 Q34 18 50 18 Q66 18 66 30 Q64 40 60 46 Q56 54 50 54 Q44 54 40 46 Q36 40 34 30Z', 'S') + xs('M58 19 Q66 22 66 30 Q64 40 60 46 Q56 52 52 54 Q60 40 58 19Z') +
      both(p('M34 28 L25 30 L34 34Z', 'S', 1)) +
      eye(43, 30, 2.4, '#e5402a') + eye(57, 30, 2.4, '#e5402a') + ln('M39 26 L46 28 M61 26 L54 28', 1.3) +
      p('M42 44 Q50 40 58 44 Q58 52 50 53 Q42 52 42 44Z', 'M', 1) + `<circle cx="46.5" cy="46" r="1.2" fill="${INK}"/><circle cx="53.5" cy="46" r="1.2" fill="${INK}"/>` +
      `<circle cx="50" cy="51" r="3" fill="none" stroke="#c9a227" stroke-width="1.4"/>`;
  },
  lion(v = {}) {
    let mane = '';
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      mane += `${i ? 'L' : 'M'}${50 + 24 * c} ${36 + 22 * s} L${50 + 18 * Math.cos(a + 0.22)} ${36 + 16 * Math.sin(a + 0.22)} `;
    }
    return ground(32) +
      (v.scorpion ? tubeH('M70 70 Q90 64 90 40 Q90 22 76 18', 5) + p('M76 18 L68 14 L74 24Z', '#b8432f', 1) : '') +
      (v.snake ? tubeH('M72 70 Q90 66 88 46 Q86 36 80 34', 4) + p('M80 30 Q74 30 74 35 Q76 39 82 37Z', 'M', 0.9) + eye(78, 34, 1, '#9be15a') : '') +
      p('M24 77 Q22 58 36 54 L64 54 Q78 58 76 77Z', 'M') + sh('M64 54 Q78 58 76 77 L68 77 Q68 62 60 56Z') +
      p(mane + 'Z', '#c99a52') + sh('M66 22 Q76 34 72 50 Q66 58 56 58 Q68 46 66 22Z') +
      (v.horns ? both(p('M38 22 Q30 6 40 2 Q36 12 44 18Z', 'L', 1)) : '') +
      p('M36 36 Q36 22 50 22 Q64 22 64 36 Q64 50 50 52 Q36 50 36 36Z', 'M') +
      eye(44, 33, 2.4, '#f0b81c') + eye(56, 33, 2.4, '#f0b81c') +
      p('M46 40 L54 40 L50 44Z', 'D', 0.6) + ln('M50 44 V46 M44 46 Q50 50 56 46', 0.9) + p('M45 47 L46 51 L47.5 47.5Z M55 47 L54 51 L52.5 47.5Z', 'L', 0.6) +
      ln('M40 42 l-6 -1 M40 44 l-6 1 M60 42 l6 -1 M60 44 l6 1', 0.4);
  },
  treant() {
    return ground(30) +
      ln('M50 30 Q36 14 22 12 M30 14 L24 6 M38 20 L30 22 M50 30 Q64 12 80 10 M70 13 L76 4 M62 18 L70 22', 2) +
      `<g fill="#8fae5a" stroke="${INK}" stroke-width=".8"><circle cx="20" cy="12" r="5"/><circle cx="26" cy="5" r="3.5"/><circle cx="80" cy="9" r="5"/><circle cx="75" cy="3" r="3"/><circle cx="30" cy="22" r="3"/><circle cx="71" cy="22" r="3"/></g>` +
      p('M34 77 Q38 60 36 44 Q34 28 50 24 Q66 28 64 44 Q62 60 66 77 L58 72 L50 77 L42 72Z', 'S') +
      ln('M40 34 Q42 50 40 70 M60 34 Q58 50 61 70 M48 26 Q46 40 48 50', 0.6) + sh('M58 26 Q66 30 64 44 Q62 60 66 77 L60 74 Q60 50 58 26Z') +
      p('M41 40 Q45 36 48 41 Q45 44 41 40Z M52 41 Q55 36 59 40 Q55 44 52 41Z', 'D', 0.8) + glowEye(45, 40.5, 1.2, '#c8f05a') + glowEye(55, 40.5, 1.2, '#c8f05a') +
      p('M43 52 Q50 48 57 52 Q54 58 50 58 Q46 58 43 52Z', 'D', 0.8) + ln('M30 77 Q26 72 20 74 M70 77 Q74 72 80 74', 1.4);
  },
  ghoul() {
    return moon(82, 16) + ground(22) +
      p('M30 77 Q28 54 42 48 L58 48 Q72 54 70 77Z', 'D') + ln('M36 77 L40 56 M64 77 L60 56', 0.6).replace(INK, '#6b5a44') +
      both(p('M30 60 Q22 66 22 72 L20 76 M22 72 L24 77 M22 72 L27 76', 'N', 1.2) + p('M30 58 Q22 64 21 72 Q26 68 32 64Z', '#cfd6c0', 1)) +
      both(p('M36 32 L20 20 L34 40Z', '#cfd6c0', 1.1)) +
      p('M36 34 Q36 16 50 16 Q64 16 64 34 Q64 46 56 52 L50 54 L44 52 Q36 46 36 34Z', '#cfd6c0') + sh('M58 18 Q64 24 64 34 Q64 46 56 52 Q62 40 58 18Z') +
      p('M39 30 Q50 26 61 30 L60 32 Q50 29 40 32Z', 'D', 0.5) +
      eye(44, 34, 2.8, '#e5402a') + eye(56, 34, 2.8, '#e5402a') + p('M48 38 L50 42 L52 38Z', 'D', 0.6) +
      p('M42 45 Q50 49 58 45 Q50 47 42 45Z', 'D', 0.8) + p('M45 45.4 L46 50 L47.5 45.8Z M55 45.4 L54 50 L52.5 45.8Z', 'L', 0.6);
  },
  gryphon() {
    const wing = p('M44 44 Q30 20 6 12 Q10 20 8 24 Q14 25 13 30 Q19 30 18 36 Q25 36 25 42 Q33 42 36 52Z', 'M') + ln('M43 44 L10 16 M42 47 L14 28 M40 50 L20 38', 0.6) + sh('M40 50 L20 38 Q25 38 25 42 Q33 42 36 52Z');
    return ground(26) + both(wing) +
      p('M34 77 Q32 54 50 48 Q68 54 66 77Z', '#c99a52') + sh('M50 48 Q68 54 66 77 L58 77 Q60 60 50 50Z') +
      ln('M40 77 l-4 -2 M40 77 l-2 -4 M60 77 l4 -2 M60 77 l2 -4', 1) +
      p('M38 36 Q38 20 50 18 Q62 20 62 36 Q62 46 50 50 Q38 46 38 36Z', 'L') + fur(40, 40, 46, 48, 4) + fur(54, 48, 60, 40, 4) +
      both(p('M41 22 L36 12 L45 19Z', 'L', 0.9)) +
      eye(44, 30, 2.4, '#f0b81c') + eye(56, 30, 2.4, '#f0b81c') + ln('M40 26 L47 28 M60 26 L53 28', 1.3) +
      p('M45 34 Q50 32 55 34 Q56 40 50 46 Q50 41 45 38Z', '#e0a33a', 1);
  },
  dragon() {
    const wing = p('M42 44 Q34 20 12 10 Q14 18 10 22 Q16 24 14 30 Q20 30 19 36 Q26 36 26 42 Q34 42 36 50Z', '#8fae5a') + ln('M41 44 L14 13 M40 47 L14 26 M38 50 L20 38', 0.7) + sh('M38 50 L20 38 Q26 38 26 42 Q34 42 36 50Z');
    return ground(28) + both(wing) +
      tubeH('M60 72 Q80 76 86 64 Q90 56 84 52', 4) + p('M84 52 L80 46 L88 48Z', 'D', 0.6) +
      p('M34 77 Q32 54 50 50 Q68 54 66 77Z', '#a8c470') + ln('M44 58 H56 M43 63 H57 M43 68 H57 M43 73 H57', 0.6) + sh('M50 50 Q68 54 66 77 L60 77 Q62 60 50 52Z') +
      both(p('M42 24 Q36 12 42 4 Q42 14 46 20Z', 'L', 1)) +
      p('M38 34 Q38 20 50 20 Q62 20 62 34 L60 44 Q56 50 50 50 Q44 50 40 44Z', '#a8c470') + sh('M56 21 Q62 24 62 34 L60 44 Q57 49 53 50 Q60 38 56 21Z') +
      eye(44, 31, 2.6, '#ffcf3a') + eye(56, 31, 2.6, '#ffcf3a') + ln('M40 27 L47 29 M60 27 L53 29', 1.3) +
      `<circle cx="47" cy="42" r=".9" fill="${INK}"/><circle cx="53" cy="42" r=".9" fill="${INK}"/>` + ln('M44 46 Q50 48 56 46', 0.9) +
      flame(40, 50, 0.45);
  },
  lich() {
    return stars() + `<circle cx="78" cy="22" r="10" fill="url(#pq-glow-g)"/>` +
      ln('M78 76 L78 24', 1.8) + p('M78 24 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0', '#9be15a', 1) +
      p('M28 77 Q30 46 36 34 Q42 16 50 16 Q58 16 64 34 Q70 46 72 77Z', 'D') +
      ln('M36 77 L40 50 M64 77 L60 50 M50 77 V56', 0.6).replace(INK, '#6b5a44') +
      p('M38 42 Q38 26 50 26 Q62 26 62 42 Q62 48 58 50 L58 55 L42 55 L42 50 Q38 48 38 42Z', 'L') +
      p('M40 26 L42 16 L46 22 L50 12 L54 22 L58 16 L60 26Z', '#e8b923', 0.9) +
      p('M42 38 Q45 34 48 38 Q48 43 45 43 Q42 43 42 38Z M52 38 Q55 34 58 38 Q58 43 55 43 Q52 43 52 38Z', 'D', 0.8) +
      glowEye(45, 39, 1.4, '#9be15a') + glowEye(55, 39, 1.4, '#9be15a') +
      p('M50 44 L48 47 L52 47Z', 'D', 0.5) + ln('M44 51 H56 M46 49 V55 M49 49 V55 M52 49 V55 M55 49 V55', 0.6) +
      p('M74 56 Q78 52 82 56 Q80 62 76 60Z', 'L', 0.8);
  },
  knight() {
    return ground(26) + ln('M80 76 L84 20', 2) + p('M84 20 L82 28 L86 28Z', 'L', 0.8) + ln('M76 62 L88 64', 2.6) +
      p('M22 77 Q20 54 34 48 L66 48 Q80 54 78 77Z', '#4a4440') + ln('M36 56 Q50 62 64 56 M38 66 Q50 72 62 66', 0.8).replace(INK, '#8a8070') +
      both(p('M22 52 Q24 42 36 44 Q36 52 28 58Z', '#5a544e', 1)) +
      p('M36 46 Q34 18 50 16 Q66 18 64 46 Q50 50 36 46Z', '#5a544e') + xs('M58 18 Q66 24 64 46 L58 47 Q62 30 58 18Z') +
      p('M50 16 Q54 4 66 6 Q58 10 58 18Z', '#b8432f', 0.9) +
      p('M38 30 H62 V34 H38Z', '#1a1410', 0.9) + glowEye(45, 32, 1.3, '#ff4b2b') + glowEye(55, 32, 1.3, '#ff4b2b') +
      ln('M50 16 V30 M42 38 h2 M47 38 h2 M52 38 h2 M57 38 h2 M42 41 h2 M47 41 h2 M52 41 h2 M57 41 h2', 0.9).replace(INK, '#1a1410');
  },
  mimic() {
    return ground(32) + `<circle cx="22" cy="64" r="3" fill="#e8b923" stroke="${INK}" stroke-width=".8"/><circle cx="78" cy="70" r="2.6" fill="#e8b923" stroke="${INK}" stroke-width=".8"/>` +
      p('M20 50 H80 V76 H20Z', '#b88a50') + ln('M20 58 H80 M20 68 H80', 0.6) + sh('M70 50 H80 V76 H70Z') +
      p('M18 48 H82 V52 H18Z', '#c9a227', 0.9) + p('M46 52 H54 V60 H46Z', '#c9a227', 0.9) +
      `<path d="M22 50 L78 50 L74 40 L26 40Z" fill="#5a1a14" stroke="${INK}" stroke-width="1"/>` +
      p('M34 50 Q42 36 54 44 Q62 50 58 52 Q50 46 40 52Z', '#d9606a', 0.9) +
      p('M20 40 Q20 18 50 16 Q80 18 80 40Z', '#b88a50') + ln('M24 30 Q50 22 76 30', 0.6) + p('M18 38 H82 V42 H18Z', '#c9a227', 0.9) +
      teeth(24, 76, 42, 9, 4) + teeth(24, 76, 50, 9, 4, false) +
      eye(40, 28, 3, '#f0d21c') + eye(60, 28, 3, '#f0d21c');
  },
  shadow() {
    return `<rect width="100" height="80" fill="${INK}" opacity=".18"/>` +
      `<path d="M26 77 Q20 50 30 32 Q38 14 50 12 Q62 14 70 32 Q80 50 74 77 Q66 70 60 77 Q54 70 50 77 Q46 70 40 77 Q34 70 26 77Z" fill="${INK}" filter="url(#pq-soft)"/>` +
      ln('M28 44 Q14 40 10 28 M72 44 Q86 40 90 28 M30 56 Q16 60 8 54 M70 56 Q84 60 92 54', 2.4) +
      glowEye(43, 34, 2.4, '#b28cff') + glowEye(57, 34, 2.4, '#b28cff') + `<path d="M42 46 Q50 52 58 46" fill="none" stroke="#b28cff" stroke-width="1.2"/>`;
  },
  boss() {
    return `<rect width="100" height="80" fill="#2a1030" opacity=".35"/>` + flame(14, 78, 1) + flame(86, 78, 1) + flame(26, 80, 0.7) + flame(74, 80, 0.7) +
      p('M10 77 Q14 44 30 40 L70 40 Q86 44 90 77 Q70 70 50 77 Q30 70 10 77Z', '#3a1838') + xs('M70 40 Q86 44 90 77 L76 74 Q76 54 64 44Z') +
      both(p('M30 42 Q20 38 16 28 Q24 32 34 36Z', '#5a2a50', 1)) +
      both(p('M38 24 Q22 18 18 4 Q26 12 34 12 Q38 16 42 20Z', '#e7d9b6', 1.2) + sh('M20 6 Q26 14 36 14 Q26 14 20 6Z')) +
      p('M34 34 Q34 16 50 14 Q66 16 66 34 Q66 48 56 54 L50 58 L44 54 Q34 48 34 34Z', '#6a3a62') + xs('M58 16 Q66 22 66 34 Q66 46 56 54 Q62 40 58 16Z') +
      p('M36 18 L38 6 L43 12 L50 2 L57 12 L62 6 L64 18 Q50 14 36 18Z', '#e8b923', 1) + `<circle cx="50" cy="10" r="1.8" fill="#ff3b30"/>` +
      glowEye(43, 32, 2.6, '#ff3b30') + glowEye(57, 32, 2.6, '#ff3b30') + ln('M37 27 L46 30 M63 27 L54 30', 1.6) +
      p('M42 44 Q50 50 58 44 Q50 46 42 44Z', INK, 0.8) + teeth(43, 57, 44.5, 4, 2.4);
  },
};

// Какой рисунок у какой карты (номера из cards.js).
const PLAN = {
  0: ['boss'],
  1: ['goblin'], 2: ['slime'], 3: ['bat'], 4: ['goblin', { horns: true, spear: true, skin: '#d9c79a', eye: '#e5402a' }],
  5: ['rat'], 6: ['beetle'], 7: ['skeleton'], 8: ['bird', { woman: true }], 9: ['troll'], 10: ['wolf'],
  11: ['imp'], 12: ['serpent'], 13: ['wisp'], 14: ['golem'], 15: ['ghost'], 16: ['spider'], 17: ['bear'],
  18: ['wendigo'], 19: ['troll', { club: true }], 20: ['witch'], 21: ['skeleton', { shield: true, helm: true }],
  22: ['bull'], 23: ['lion', { scorpion: true }], 24: ['serpent', { waves: true }], 25: ['treant'], 26: ['hydra'],
  27: ['ghoul'], 28: ['ghost', { scream: true }], 29: ['serpent', { crown: true }], 30: ['lion', { horns: true, snake: true }],
  31: ['gryphon'], 32: ['dragon'], 33: ['lich'], 34: ['kraken'], 35: ['knight'], 36: ['troll', { oneEye: true, horns: true }],
  37: ['mimic'], 38: ['bird', { fire: true }], 39: ['worm'], 40: ['shadow'],
};

// Общие узоры (штриховка, пергамент, свечение) — один раз на страницу.
export const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<pattern id="pq-h" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="2.6" stroke="${INK}" stroke-width=".55"/></pattern>
<pattern id="pq-x" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0 0V2.6M0 0H2.6" stroke="${INK}" stroke-width=".5"/></pattern>
<radialGradient id="pq-paper" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#f6ead0"/><stop offset=".7" stop-color="#ead9b4"/><stop offset="1" stop-color="#cdb07c"/></radialGradient>
<radialGradient id="pq-glow"><stop offset="0" stop-color="#ffd84a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient>
<radialGradient id="pq-glow-g"><stop offset="0" stop-color="#9be15a" stop-opacity=".7"/><stop offset="1" stop-color="#9be15a" stop-opacity="0"/></radialGradient>
<filter id="pq-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .12  0 0 0 .22 0"/></filter>
<filter id="pq-ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="2"/><feDisplacementMap in="SourceGraphic" scale="1.1"/></filter>
<filter id="pq-soft"><feGaussianBlur stdDeviation="1.2"/></filter>
</defs></svg>`;

// Готовые картинки: номер карты -> файл в img/monsters/. Нет файла — рисуем гравюру сами.
export const IMAGES = new Set([]);
const IMG_V = 1;

export function monsterArt(id, name = '') {
  if (IMAGES.has(id)) return `<img class="monster" src="img/monsters/${id}.webp?v=${IMG_V}" alt="${name}" loading="lazy" draggable="false">`;
  return monsterSVG(id);
}

export function monsterSVG(id) {
  const [kind, v] = PLAN[id] || ['goblin'];
  const art = A[kind](v || {});
  return `<svg class="monster" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice">` +
    `<rect width="100" height="80" fill="url(#pq-paper)"/><rect width="100" height="80" filter="url(#pq-grain)"/>` +
    `<g filter="url(#pq-ink)">${art}</g></svg>`;
}


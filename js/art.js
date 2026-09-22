// Procedural hwatu artwork.
//
// Drawn to the conventional hwatu look rather than to a naturalistic one:
//
//   - cream ground, never a sky or a horizon
//   - a thick red-brown border frame on every card
//   - thin RED-BROWN keylines, not black
//   - flat, bright, unshaded fills
//   - the motif fills the whole card, edge to edge
//   - scattered dots as texture on several months
//
// Flat and id-free on purpose: no <defs>, no gradients, no clipPath. Ids would
// collide the moment the same markup is inlined twice.

const LINE = '#7d2f22';      // every outline
const FRAME = '#8c3a2a';     // the border band
const PAPER = '#f4efe3';

const RED = '#ce2b1e';
const RED_D = '#a41f16';
const GREEN = '#43944c';
const GREEN_D = '#2c6b35';
const GREEN_L = '#6cb36a';
const GOLD = '#e8a33d';
const GOLD_L = '#f2c464';
const PURPLE = '#4a4fa8';
const PURPLE_L = '#7d76c8';
const PINK = '#e97fa6';
const TAN = '#efba6e';
const BROWN = '#8a5a3c';
const WHITE = '#fbf8f0';

const SW = 1.2;
const f = (v) => Math.round(v * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;

/* ------------------------------------------------------------ primitives */

function p(d, fill, sw = SW) {
  return `<path d="${d}" fill="${fill}" stroke="${LINE}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
}
function stroke(d, sw = SW, col = LINE) {
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function circ(cx, cy, r, fill, sw = SW) {
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="${LINE}" stroke-width="${sw}"/>`;
}
function ell(cx, cy, rx, ry, rot, fill, sw = SW) {
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" stroke="${LINE}" stroke-width="${sw}" transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})"/>`;
}
function poly(pts, fill, sw = SW) {
  return `<polygon points="${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' ')}" fill="${fill}" stroke="${LINE}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

/** Deterministic scatter of the small dark specks several months carry. */
function specks(seed, n = 26) {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = 9 + rnd() * 82;
    const y = 9 + rnd() * 132;
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.9 + rnd() * 0.7)}" fill="${LINE}"/>`;
  }
  return out;
}

/* ----------------------------------------------------------------- flora */

/** One pine bough: a wide serrated chevron of needles, opening upward. */
function bough(cx, y, halfW, rise, fill) {
  const pts = [];
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([cx - halfW * (1 - t), y - rise * t - (i % 2 ? 3.4 : 0)]);
  }
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    pts.push([cx + halfW * t, y - rise * (1 - t) - (i % 2 ? 3.4 : 0)]);
  }
  pts.push([cx + halfW * 0.16, y + 3.4], [cx - halfW * 0.16, y + 3.4]);
  return poly(pts, fill, 1);
}

/** Stylised pine: a trunk carrying overlapping boughs, gold buds at the tips. */
function pineTree(cx, baseY, h, w) {
  let s = stroke(`M${f(cx)} ${f(baseY)} L${f(cx)} ${f(baseY - h * 0.95)}`, 2.4, BROWN);
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const y = baseY - h * (0.1 + 0.8 * t);
    s += bough(cx, y, w * (1 - t * 0.6), w * 0.62 * (1 - t * 0.3), i % 2 ? GREEN : GREEN_D);
  }
  s += circ(cx - w * 0.42, baseY - h * 0.42, 1.9, GOLD_L, 0.8);
  s += circ(cx + w * 0.34, baseY - h * 0.7, 1.7, GOLD_L, 0.8);
  return s;
}

/** Five round petals with a gold centre and stamens (plum, cherry). */
function flower5(x, y, r, petal, core = GOLD_L, rot = -90) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = rad(rot + 72 * i);
    s += circ(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5, petal, 1);
  }
  s += circ(x, y, r * 0.24, core, 0.9);
  for (let i = 0; i < 6; i++) {
    const a = rad(rot + 30 + 60 * i);
    s += stroke(`M${f(x + Math.cos(a) * r * 0.2)} ${f(y + Math.sin(a) * r * 0.2)} L${f(x + Math.cos(a) * r * 0.48)} ${f(y + Math.sin(a) * r * 0.48)}`, 0.6);
  }
  return s;
}

/** Many-petalled bloom in two rings (chrysanthemum, peony). */
function rosette(x, y, r, outer, inner, core, nOut = 10) {
  let s = '';
  for (let i = 0; i < nOut; i++) {
    const a = rad(-90 + (360 / nOut) * i);
    s += ell(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.44, r * 0.28, (a * 180) / Math.PI, outer, 0.9);
  }
  for (let i = 0; i < nOut - 3; i++) {
    const a = rad(-64 + (360 / (nOut - 3)) * i);
    s += ell(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, r * 0.3, r * 0.2, (a * 180) / Math.PI, inner, 0.9);
  }
  s += circ(x, y, r * 0.16, core, 0.9);
  return s;
}

/** Rounded leaf on a short stalk. */
function leaf(x, y, len, wid, rot, fill) {
  const d = `M0 0 C ${f(-wid)} ${f(-len * 0.3)} ${f(-wid * 0.8)} ${f(-len * 0.88)} 0 ${f(-len)} C ${f(wid * 0.8)} ${f(-len * 0.88)} ${f(wid)} ${f(-len * 0.3)} 0 0 Z`;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${p(d, fill, 1)}${stroke(`M0 ${f(-len * 0.06)} L0 ${f(-len * 0.88)}`, 0.7)}</g>`;
}

/** Wisteria: a strand hanging from the top, leaflets then purple bells. */
function wisteria(x, topY, len, sway) {
  let s = stroke(`M${f(x)} ${f(topY)} Q${f(x + sway)} ${f(topY + len * 0.55)} ${f(x + sway * 0.7)} ${f(topY + len)}`, 1.1);
  const at = (t) => [
    (1 - t) * (1 - t) * x + 2 * (1 - t) * t * (x + sway) + t * t * (x + sway * 0.7),
    (1 - t) * (1 - t) * topY + 2 * (1 - t) * t * (topY + len * 0.55) + t * t * (topY + len),
  ];
  for (let i = 0; i < 7; i++) {
    const t = 0.06 + i * 0.1;
    const [lx, ly] = at(t);
    const w = 4.6 - i * 0.24;
    s += ell(lx - w * 1.15, ly, w, w * 0.56, -22, GREEN, 0.85);
    s += ell(lx + w * 1.15, ly, w, w * 0.56, 22, GREEN_L, 0.85);
  }
  for (let i = 0; i < 4; i++) {
    const t = 0.78 + i * 0.07;
    const [lx, ly] = at(t);
    s += ell(lx, ly, 3, 4.2, i % 2 ? 14 : -14, i % 2 ? PURPLE : PURPLE_L, 0.85);
  }
  return s;
}

/** Iris: sword leaves are drawn separately; this is one bloom. */
function iris(x, y, s = 1) {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    p('M0 0 Q-13 3 -16 14 Q-7 15 -2 5 Z', PURPLE, 1) +
    p('M0 0 Q13 3 16 14 Q7 15 2 5 Z', PURPLE, 1) +
    p('M0 1 Q-5 10 0 18 Q5 10 0 1 Z', PURPLE_L, 1) +
    p('M-1 0 Q-10 -10 -7 -17 Q-1 -11 -1 -1 Z', PURPLE_L, 1) +
    p('M1 0 Q10 -10 7 -17 Q1 -11 1 -1 Z', PURPLE_L, 1) +
    p('M0 -1 Q-4 -13 0 -18 Q4 -13 0 -1 Z', PURPLE, 1) +
    circ(0, 1, 2.6, GOLD_L, 0.9) +
    `</g>`
  );
}

/** Sword-shaped blade (iris leaves, pampas). */
function bladeShape(x, y, h, bend, fill) {
  return p(
    `M${f(x - 2.6)} ${f(y)} Q${f(x + bend * 0.3)} ${f(y - h * 0.55)} ${f(x + bend)} ${f(y - h)} Q${f(x + bend * 0.45)} ${f(y - h * 0.5)} ${f(x + 2.6)} ${f(y)} Z`,
    fill,
    1,
  );
}

/** Bush clover: an arcing stem with paired leaves and red berries. */
function cloverStem(x, y, len, rot) {
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">`;
  s += stroke(`M0 0 Q${f(-len * 0.18)} ${f(-len * 0.55)} ${f(-len * 0.1)} ${f(-len)}`, 1.1);
  const at = (t) => [
    2 * (1 - t) * t * (-len * 0.18) + t * t * (-len * 0.1),
    2 * (1 - t) * t * (-len * 0.55) + t * t * -len,
  ];
  for (let i = 0; i < 6; i++) {
    const t = 0.12 + i * 0.15;
    const [lx, ly] = at(t);
    s += ell(lx - 4.4, ly, 3.6, 1.9, -26, GREEN, 0.8);
    s += ell(lx + 4.4, ly - 1.5, 3.6, 1.9, 26, GREEN_L, 0.8);
    if (i % 2 === 0) s += ell(lx + 1.5, ly - 4, 2.5, 1.5, 30, RED, 0.8);
    else s += ell(lx - 1.5, ly - 4, 2.5, 1.5, -30, RED, 0.8);
  }
  return s + '</g>';
}

const MAPLE = [
  [0, -1], [0.2, -0.56], [0.46, -0.66], [0.38, -0.3], [0.82, -0.4], [0.58, -0.06],
  [0.96, 0.08], [0.46, 0.28], [0.58, 0.54], [0.18, 0.4], [0.1, 0.86], [-0.1, 0.86],
  [-0.18, 0.4], [-0.58, 0.54], [-0.46, 0.28], [-0.96, 0.08], [-0.58, -0.06],
  [-0.82, -0.4], [-0.38, -0.3], [-0.46, -0.66], [-0.2, -0.56],
];
function mapleLeaf(x, y, r, c, rot = 0) {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` +
    poly(MAPLE.map(([px, py]) => [px * r, py * r]), c, 1) +
    stroke(`M0 ${f(r * 0.8)} L0 ${f(-r * 0.3)} M0 ${f(-r * 0.05)} L${f(-r * 0.5)} ${f(-r * 0.3)} M0 ${f(-r * 0.05)} L${f(r * 0.5)} ${f(-r * 0.3)}`, 0.6) +
    `</g>`
  );
}

/** Paulownia: a broad rounded leaf with fanned veins. */
function kiriLeaf(x, y, r, rot, fill) {
  const d = `M0 ${f(r * 0.2)} C ${f(-r * 1.05)} ${f(-r * 0.05)} ${f(-r * 0.7)} ${f(-r * 1.05)} 0 ${f(-r * 0.92)} C ${f(r * 0.7)} ${f(-r * 1.05)} ${f(r * 1.05)} ${f(-r * 0.05)} 0 ${f(r * 0.2)} Z`;
  return (
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` +
    p(d, fill, 1.1) +
    stroke(
      `M0 ${f(r * 0.16)} L0 ${f(-r * 0.86)} M0 ${f(-r * 0.2)} L${f(-r * 0.6)} ${f(-r * 0.5)} M0 ${f(-r * 0.2)} L${f(r * 0.6)} ${f(-r * 0.5)} M0 ${f(r * 0.02)} L${f(-r * 0.62)} ${f(-r * 0.1)} M0 ${f(r * 0.02)} L${f(r * 0.62)} ${f(-r * 0.1)}`,
      0.7,
    ) +
    `</g>`
  );
}

/** Paulownia bloom: a spike of purple bells. */
function kiriFlower(x, y, s = 1) {
  let out = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">`;
  out += stroke('M0 14 L0 -2', 1);
  for (const [dx, dy, r] of [[-6, 0, -26], [6, -3, 24], [0, -10, 0], [-7, -9, -34], [7, -12, 30]]) {
    out += `<g transform="translate(${dx} ${dy}) rotate(${r})">${ell(0, 0, 3, 4.6, 0, PURPLE, 0.85)}${stroke('M0 4 L0 6', 0.7)}</g>`;
  }
  return out + '</g>';
}

/** Willow: a drooping branch with alternating leaves. */
function willow(x, y, len, sway) {
  let s = stroke(`M${f(x)} ${f(y)} Q${f(x + sway)} ${f(y + len * 0.5)} ${f(x + sway * 0.5)} ${f(y + len)}`, 1.3);
  const at = (t) => [
    (1 - t) * (1 - t) * x + 2 * (1 - t) * t * (x + sway) + t * t * (x + sway * 0.5),
    (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + len * 0.5) + t * t * (y + len),
  ];
  for (let i = 0; i < 7; i++) {
    const t = 0.1 + i * 0.13;
    const [lx, ly] = at(t);
    s += ell(lx + (i % 2 ? 4 : -4), ly, 4.4, 1.7, i % 2 ? 30 : -30, i % 2 ? GREEN : GREEN_L, 0.8);
  }
  return s;
}

/** The big rounded green hill that is all there is to most 공산 cards. */
function hill(topY = 92) {
  return p(`M-1 151 L-1 ${f(topY + 34)} Q30 ${f(topY - 8)} 62 ${f(topY + 6)} Q84 ${f(topY + 16)} 101 ${f(topY + 2)} L101 151 Z`, GREEN, 1.3);
}

/** Slanted paper streamer. `text` is drawn only when the deck shows one. */
function tanzaku(color, label, ink) {
  return (
    p('M35 13 L59 18 L47 131 L23 126 Z', color, 1.2) +
    stroke('M38 19 L55 23 M27 121 L44 125', 0.7) +
    // Set vertically, the way a real streamer carries its text — and the only
    // way two characters fit across a band this narrow.
    (label
      ? `<g transform="rotate(6 41 74)" font-family="'Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="14" font-weight="800" fill="${ink}" text-anchor="middle">` +
        `<text x="41" y="68">${label[0]}</text><text x="41" y="86">${label[1]}</text></g>`
      : '')
  );
}

/* ------------------------------------------------------------- creatures */

const CREATURE = {
  crane: () =>
    p('M58 130 Q46 108 52 86 Q58 64 76 60', WHITE, 0) +
    ell(60, 104, 17, 22, -6, WHITE, 1.2) +
    p('M46 96 Q34 84 38 68 Q41 56 50 50', 'none', 1.2) +
    p('M52 92 Q42 80 45 66 Q48 55 56 50 L62 56 Q52 62 51 72 Q50 84 58 94 Z', WHITE, 1.2) +
    p('M70 92 Q84 84 90 70 Q88 100 76 112 Z', LINE, 1.2) +
    circ(58, 47, 6.4, WHITE, 1.2) +
    p('M53 42 Q58 36 63 41 Q58 45 54 45 Z', RED, 1) +
    p('M52 48 L41 51 L52 54 Z', GOLD, 1) +
    circ(58, 46, 1.3, LINE, 0) +
    stroke('M54 124 L52 138 M66 124 L68 138', 1.4) +
    stroke('M46 138 L58 138 M62 138 L74 138', 1.4),

  warbler: () =>
    ell(56, 62, 15, 10, -16, GREEN, 1.1) +
    p('M48 56 Q58 52 68 58 Q58 64 50 62 Z', GREEN_L, 1) +
    circ(42, 54, 7, GOLD_L, 1.1) +
    p('M35 52 L25 55 L35 58 Z', GOLD, 1) +
    circ(41, 52, 1.4, LINE, 0) +
    p('M60 56 Q74 50 82 40 Q76 62 64 68 Z', GREEN_D, 1.1) +
    stroke('M66 68 Q76 76 84 88', 2.6) +
    stroke('M50 70 L48 78 M58 70 L60 78', 1.3),

  cuckoo: () =>
    ell(50, 58, 17, 10, -20, GOLD, 1.1) +
    circ(35, 49, 7, GOLD_L, 1.1) +
    p('M28 47 L18 50 L28 53 Z', RED, 1) +
    circ(34, 47, 1.4, LINE, 0) +
    p('M54 52 Q72 42 84 28 Q76 56 60 64 Z', GOLD_L, 1.1) +
    p('M48 66 Q62 76 72 92 L58 84 Z', GOLD, 1.1) +
    stroke('M42 56 Q54 52 64 56', 0.8),

  bridge: () =>
    p('M8 104 L92 78 L92 88 L8 114 Z', TAN, 1.2) +
    p('M8 114 L92 88 L92 94 L8 120 Z', GOLD, 1.1) +
    stroke('M20 108 L20 128 M42 101 L42 121 M64 94 L64 114 M86 87 L86 107', 2.6) +
    stroke('M12 96 L90 72', 1.1),

  butterfly: () => bfly(36, 46, 1) + bfly(70, 30, 0.72),

  boar: () =>
    p('M30 82 Q30 66 48 62 Q68 58 78 68 Q86 76 80 88 Q66 96 48 94 Q34 92 30 82 Z', TAN, 1.2) +
    p('M30 76 Q20 70 14 76 Q10 84 20 88 L30 88 Z', GOLD, 1.1) +
    p('M16 78 L8 74 M16 84 L8 86', 'none', 1.6) +
    circ(26, 75, 1.5, LINE, 0) +
    stroke('M40 92 L38 106 M54 94 L54 108 M70 90 L72 104', 3) +
    stroke('M44 68 Q56 64 68 70 M42 76 Q56 72 70 78 M46 84 Q58 82 72 86', 0.8) +
    stroke('M82 74 Q90 68 88 60', 2),

  geese: () => goose(30, 44, 1) + goose(58, 28, 0.84) + goose(64, 62, 0.78),

  sake: () =>
    p('M24 62 Q50 55 76 62 L66 90 Q50 97 34 90 Z', RED, 1.3) +
    ell(50, 62, 26, 8, 0, WHITE, 1.2) +
    p('M44 92 H56 V100 H44 Z', RED_D, 1.1) +
    ell(50, 104, 20, 5.5, 0, RED, 1.2) +
    `<text x="50" y="83" font-size="16" font-family="serif" font-weight="700" fill="${GOLD_L}" text-anchor="middle">壽</text>`,

  deer: () =>
    p('M34 84 Q34 70 52 66 Q72 62 80 74 Q86 84 78 94 Q62 102 46 98 Q34 94 34 84 Z', TAN, 1.2) +
    p('M36 74 Q28 64 31 52 Q33 44 40 48 Q45 52 44 62 L43 74 Z', GOLD_L, 1.1) +
    stroke('M34 50 Q27 40 29 30 M34 43 Q25 40 20 33 M42 48 Q48 38 46 28 M42 41 Q50 38 55 31', 1.9) +
    circ(37, 57, 1.5, LINE, 0) +
    stroke('M30 52 L22 50', 1.2) +
    stroke('M44 98 L42 116 M58 100 L58 118 M74 94 L76 112', 2.8) +
    circ(52, 78, 2, WHITE, 0.8) + circ(63, 84, 2, WHITE, 0.8) + circ(70, 76, 1.8, WHITE, 0.8),

  phoenix: () =>
    sunburst(52, 56, 42) +
    p('M44 94 Q30 84 32 64 Q34 46 54 42 Q72 38 80 52 Q86 62 74 68 L58 74 Q48 80 48 94 Z', RED, 1.3) +
    p('M46 62 Q60 52 74 58 Q60 70 48 70 Z', PURPLE, 1.1) +
    circ(78, 46, 7.5, RED_D, 1.2) +
    p('M85 44 L96 48 L85 51 Z', GOLD, 1) +
    circ(79, 44, 1.5, WHITE, 0) +
    p('M74 36 Q78 27 86 26 Q82 34 81 39 Z', GOLD_L, 1) +
    stroke('M42 82 Q22 92 12 116 M46 88 Q30 102 24 128 M52 92 Q44 110 46 134', 2.4) +
    p('M40 62 Q24 52 16 34 Q34 46 46 48 Z', PURPLE_L, 1.1),

  rainman: () =>
    p('M0 0 H100 V64 H0 Z', RED, 0) +
    willow(86, 4, 56, -14) + willow(74, 26, 58, -12) + willow(64, 52, 50, -10) +
    p('M18 50 Q46 20 74 50 Z', LINE, 1.3) +
    stroke('M46 50 L46 96', 2.2) +
    ell(50, 70, 9.5, 11, 0, WHITE, 1.2) +
    p('M40 88 Q50 74 62 86 L70 124 Q50 132 32 122 Z', PURPLE, 1.2) +
    circ(46, 68, 1.4, LINE, 0) + circ(54, 68, 1.4, LINE, 0) +
    stroke('M47 76 Q50 79 53 76', 0.9) +
    stroke('M68 108 L82 98', 2.2) +
    p('M14 122 Q20 112 26 122 Q20 128 14 122 Z', GREEN, 1) +
    circ(17, 118, 1, LINE, 0) + circ(23, 118, 1, LINE, 0),

  swallow: () =>
    ell(52, 62, 18, 10, -18, LINE, 1.1) +
    circ(36, 54, 7, '#2d3a46', 1.1) +
    p('M29 52 L19 56 L29 59 Z', GOLD, 1) +
    circ(35, 52, 1.4, WHITE, 0) +
    p('M36 61 Q44 65 51 62 Q44 67 36 65 Z', RED, 1) +
    p('M56 56 Q74 46 86 30 Q76 60 62 66 Z', '#3a4a58', 1.1) +
    p('M64 72 L90 88 L67 81 L84 102 Z', LINE, 1.1),

  /** 12월 쌍피: the red panel with the swirl. */
  swirl: () =>
    p('M0 0 H100 V150 H0 Z', RED, 0) +
    kiriLeaf(38, 104, 34, -14, GREEN) +
    kiriLeaf(70, 92, 26, 18, GREEN_D) +
    circ(40, 62, 15, RED_D, 1.4) +
    stroke('M40 62 m -9 0 a 9 9 0 1 1 9 9 a 5.5 5.5 0 1 0 -5.5 -5.5', 2.4, GOLD_L) +
    stroke('M18 24 Q32 34 26 48 M76 24 Q64 36 72 50', 1.6, GOLD),
};

function bfly(x, y, s) {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    p('M0 0 Q-20 -18 -25 -2 Q-27 12 -4 8 Z', GOLD, 1) +
    p('M0 0 Q20 -18 25 -2 Q27 12 4 8 Z', GOLD, 1) +
    p('M-3 0 Q-16 10 -12 20 Q-4 22 -2 10 Z', GOLD_L, 0.9) +
    p('M3 0 Q16 10 12 20 Q4 22 2 10 Z', GOLD_L, 0.9) +
    ell(0, 4, 2.6, 10, 0, LINE, 1) +
    stroke('M-1 -6 Q-7 -16 -13 -18 M1 -6 Q7 -16 13 -18', 1) +
    `</g>`
  );
}

function goose(x, y, s) {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    ell(0, 0, 13, 7, 0, GOLD, 1) +
    circ(-12, -4.5, 4.8, GOLD_L, 1) +
    p('M-16 -4 L-24 -3 L-16 -1 Z', RED, 0.9) +
    circ(-12.5, -5.5, 1.2, LINE, 0) +
    p('M-2 -3 Q7 -17 20 -19 Q10 -4 4 0 Z', GOLD_L, 1) +
    stroke('M10 2 L21 4', 1.5) +
    `</g>`
  );
}

function sunburst(cx, cy, r) {
  let s = circ(cx, cy, r * 0.42, GOLD_L, 1);
  for (let i = 0; i < 20; i++) {
    const a = rad((360 / 20) * i);
    s += stroke(`M${f(cx + Math.cos(a) * r * 0.44)} ${f(cy + Math.sin(a) * r * 0.44)} L${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`, 1.6, GOLD);
  }
  return s;
}

/* --------------------------------------------------------- month grounds */

const BG = {
  1: () => pineTree(24, 142, 102, 20) + pineTree(62, 148, 116, 24) + pineTree(88, 136, 82, 16),

  2: () =>
    specks(2, 22) +
    stroke('M8 142 Q30 106 52 80 Q70 58 94 34', 4.4, BROWN) +
    stroke('M52 80 Q68 84 82 70 M28 108 Q42 112 52 104', 2.6, BROWN) +
    flower5(84, 30, 10, RED) + flower5(60, 62, 10, RED) +
    flower5(30, 100, 9.5, RED) + flower5(16, 128, 8.5, RED) +
    flower5(72, 84, 7.5, RED_D) + flower5(44, 88, 7, RED),

  3: () =>
    stroke('M50 146 Q54 118 46 96', 6, BROWN) +
    stroke('M46 98 Q28 92 14 76 M48 96 Q66 92 82 78', 3.6, BROWN) +
    flower5(16, 70, 11, PINK) + flower5(82, 72, 11, RED) +
    flower5(46, 86, 10, PINK) + flower5(64, 58, 9, RED) +
    flower5(30, 50, 8.5, PINK) + flower5(70, 100, 8, RED),

  4: () =>
    specks(4, 16) +
    wisteria(30, 8, 96, -10) + wisteria(54, 8, 112, 8) + wisteria(76, 8, 88, 12) + wisteria(14, 8, 74, -6),

  5: () =>
    bladeShape(20, 144, 96, -10, GREEN) + bladeShape(34, 148, 116, 8, GREEN_D) +
    bladeShape(52, 146, 104, -8, GREEN_L) + bladeShape(70, 148, 112, 10, GREEN) +
    bladeShape(86, 142, 88, 14, GREEN_D) +
    iris(34, 48, 1) + iris(70, 66, 0.86),

  6: () =>
    leaf(20, 138, 30, 15, -36, GREEN) + leaf(82, 142, 28, 14, 34, GREEN) +
    leaf(50, 148, 26, 13, 2, GREEN_D) + leaf(34, 120, 22, 11, -14, GREEN_L) +
    stroke('M50 144 L50 92', 2.6, GREEN_D) +
    rosette(50, 68, 30, RED, RED_D, GOLD_L, 11),

  7: () =>
    cloverStem(22, 146, 110, -14) + cloverStem(48, 150, 126, -2) +
    cloverStem(74, 146, 116, 12) + cloverStem(92, 138, 92, 26),

  8: () => hill(92),

  9: () =>
    stroke('M62 146 Q54 116 44 96', 3.4, BROWN) +
    leaf(24, 122, 24, 12, -40, GREEN) + leaf(76, 124, 22, 11, 38, GREEN) +
    leaf(44, 118, 20, 10, -8, GREEN_D) + leaf(66, 100, 18, 9, 30, GREEN_L) +
    rosette(46, 74, 26, GOLD, GOLD_L, RED, 12) +
    rosette(74, 46, 15, GOLD_L, GOLD, RED, 10),

  10: () =>
    stroke('M56 148 Q48 120 38 102 M46 116 Q62 106 74 92', 3.6, BROWN) +
    mapleLeaf(24, 56, 19, RED) + mapleLeaf(70, 74, 17, GREEN) +
    mapleLeaf(44, 104, 15, GOLD) + mapleLeaf(62, 34, 14, RED) +
    mapleLeaf(86, 116, 12, GREEN_L) + mapleLeaf(16, 118, 12, RED_D),

  11: () =>
    kiriLeaf(24, 138, 34, -24, GREEN) + kiriLeaf(76, 142, 32, 26, GREEN_D) +
    kiriLeaf(50, 148, 32, 2, GREEN) + kiriLeaf(34, 112, 22, -10, GREEN_L) +
    kiriFlower(34, 70, 1.1) + kiriFlower(66, 52, 0.9),

  12: () =>
    stroke('M86 6 Q78 40 62 62 Q52 76 56 96', 4, BROWN) +
    willow(84, 12, 52, -14) + willow(74, 34, 56, -12) + willow(64, 58, 52, -10) + willow(56, 84, 44, -8),
};

/* --------------------------------------------------------- per-card plan */

const RIBBON = {
  hong: [RED, '홍단', '#7c1009'],
  cho: [RED, '초단', '#152d7a'],
  cheong: [PURPLE, '청단', '#f2f4ff'],
  plain: [RED, '', '#fff'],
};

/** 8월 광 is a solid red panel with a white moon over the hill. */
function moonPanel() {
  return p('M0 0 H100 V150 H0 Z', RED, 0) + circ(50, 54, 26, WHITE, 1.4) + hill(96);
}

/* ---------------------------------------------------------------- chrome */

const FONT = `'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif`;

function seal(c) {
  const chip = (fill, label, ink) =>
    `<rect x="69" y="9" width="24" height="24" rx="3" fill="${fill}" stroke="${LINE}" stroke-width="1.3"/>` +
    `<text x="81" y="27" font-size="15" font-family="${FONT}" font-weight="800" fill="${ink}" text-anchor="middle">${label}</text>`;
  if (c.type === 'gwang') return chip(GOLD_L, '광', '#5f4103');
  if (c.type === 'animal') return chip(c.godori ? RED : PURPLE, c.godori ? '고' : '열', WHITE);
  if (c.type === 'junk' && c.pi === 2) return chip('#2a1d10', '쌍', GOLD_L);
  return '';
}

function monthTag(c) {
  return (
    `<rect x="7" y="126" width="30" height="17" rx="3" fill="${LINE}"/>` +
    `<text x="22" y="139" font-size="11.5" font-family="${FONT}" font-weight="700" fill="${PAPER}" text-anchor="middle">${c.month}월</text>`
  );
}

/** The heavy border band every hwatu card carries. */
const FRAME_BAND =
  `<rect x="3" y="3" width="94" height="144" rx="4" fill="none" stroke="${FRAME}" stroke-width="6"/>` +
  `<rect x="6.5" y="6.5" width="87" height="137" rx="2" fill="none" stroke="${LINE}" stroke-width="1"/>`;

/* ------------------------------------------------------------------- api */

/** Full artwork for one card as an SVG string (100x150 viewBox, no ids). */
export function cardSVG(c) {
  let body = `<rect width="100" height="150" fill="${PAPER}"/>`;

  if (c.id === 'm08-gwang') body += moonPanel();
  else if (c.id === 'm12-ssang') body += CREATURE.swirl();
  else body += BG[c.month]();

  if (c.motif && CREATURE[c.motif]) body += CREATURE[c.motif]();
  if (c.type === 'ribbon') body += tanzaku(...RIBBON[c.ribbon]);

  body += seal(c) + monthTag(c) + FRAME_BAND;
  return `<svg class="card-art" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.month}월 ${c.name}">${body}</svg>`;
}

/** The uniform reverse used for hidden hands and the draw pile. */
export function cardBackSVG() {
  let mesh = '';
  for (let i = -6; i < 14; i++) {
    mesh += `<path d="M${i * 11} 0 L${i * 11 + 150} 150" stroke="#7d1811" stroke-width="3.4" opacity="0.45"/>`;
    mesh += `<path d="M${i * 11} 150 L${i * 11 + 150} 0" stroke="#7d1811" stroke-width="3.4" opacity="0.45"/>`;
  }
  return (
    `<svg class="card-art" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="뒷면">` +
    `<rect width="100" height="150" fill="#b02b24"/>${mesh}` +
    `<rect x="9" y="15" width="82" height="120" rx="7" fill="none" stroke="#f2d9a8" stroke-width="2.6"/>` +
    `<rect x="13" y="19" width="74" height="112" rx="5" fill="none" stroke="#f2d9a8" stroke-width="1" opacity="0.6"/>` +
    `<circle cx="50" cy="75" r="23" fill="#7d1811" stroke="#f2d9a8" stroke-width="2.4"/>` +
    `<text x="50" y="85" font-size="26" font-family="serif" font-weight="700" fill="#f2d9a8" text-anchor="middle">花</text>` +
    `<path d="M3 3 H97 V147 H3 Z" fill="none" stroke="#5d100b" stroke-width="2.6"/>` +
    `</svg>`
  );
}

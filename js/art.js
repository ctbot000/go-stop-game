// Procedural hwatu artwork.
//
// What makes a card read as hwatu rather than as clip art is the woodblock
// treatment: every shape carries a heavy dark keyline, the colours are flat
// and saturated, and the composition fills the frame edge to edge. So nothing
// here is drawn without an outline, and every month lays down a full-bleed
// ground before its motif goes on top.
//
// Flat and id-free on purpose: no <defs>, no gradients, no clipPath. Ids would
// collide the moment the same markup is inlined twice.

const INK = '#2a1d10';
const PAPER = '#f7edd6';
const SW = 1.7;

const f = (v) => Math.round(v * 100) / 100;
const rad = (deg) => (deg * Math.PI) / 180;

/* ------------------------------------------------------------ primitives */

/** Outlined path. Every filled shape on a card goes through here. */
function p(d, fill, sw = SW, extra = '') {
  return `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${extra ? ' ' + extra : ''}/>`;
}
/** Unstroked path, for texture and shading that must not read as an edge. */
function fillOnly(d, fill, extra = '') {
  return `<path d="${d}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
}
function circ(cx, cy, r, fill, sw = SW) {
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
}
function ell(cx, cy, rx, ry, rot, fill, sw = SW) {
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})"/>`;
}
function line(x1, y1, x2, y2, stroke = INK, sw = SW) {
  return `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" fill="none"/>`;
}
function poly(points, fill, sw = SW) {
  return `<polygon points="${points.map(([x, y]) => `${f(x)} ${f(y)}`).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

/* ----------------------------------------------------------------- flora */

/** Spiky half-disc: one cluster of pine needles. */
function pineFan(x, y, r, rot, fill) {
  const pts = [];
  const n = 15;
  for (let i = 0; i <= n; i++) {
    const a = rad(-182 + (184 / n) * i);
    const rr = i % 2 ? r : r * 0.36;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  pts.push([x + r * 0.3, y], [x - r * 0.3, y]);
  return `<g transform="rotate(${f(rot)} ${f(x)} ${f(y)})">${poly(pts, fill, 1.3)}</g>`;
}

/** Round-petalled blossom (plum, cherry) with stamens. */
function blossom(x, y, r, petal, core = '#e8b23c', n = 5, rot = -90) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = rad(rot + (360 / n) * i);
    s += circ(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, petal, 1.3);
  }
  s += circ(x, y, r * 0.26, core, 1.2);
  for (let i = 0; i < n; i++) {
    const a = rad(rot + 36 + (360 / n) * i);
    s += line(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2, x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52, INK, 0.7);
  }
  return s;
}

/** Many-petalled flower (chrysanthemum, peony) in two rings. */
function rosette(x, y, r, outer, inner, core, nOut = 10) {
  let s = '';
  for (let i = 0; i < nOut; i++) {
    const a = rad(-90 + (360 / nOut) * i);
    s += ell(x + Math.cos(a) * r * 0.58, y + Math.sin(a) * r * 0.58, r * 0.48, r * 0.3, (a * 180) / Math.PI, outer, 1.2);
  }
  const nIn = Math.max(5, nOut - 3);
  for (let i = 0; i < nIn; i++) {
    const a = rad(-70 + (360 / nIn) * i);
    s += ell(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, r * 0.32, r * 0.22, (a * 180) / Math.PI, inner, 1.1);
  }
  s += circ(x, y, r * 0.18, core, 1.2);
  return s;
}

/** Pointed leaf on a stalk. */
function leafShape(x, y, len, wid, rot, fill, vein = true) {
  const d = `M0 0 C ${f(-wid)} ${f(-len * 0.35)} ${f(-wid * 0.75)} ${f(-len * 0.85)} 0 ${f(-len)} C ${f(wid * 0.75)} ${f(-len * 0.85)} ${f(wid)} ${f(-len * 0.35)} 0 0 Z`;
  return (
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` +
    p(d, fill, 1.3) +
    (vein ? line(0, -len * 0.08, 0, -len * 0.86, 'rgba(20,14,8,0.4)', 0.9) : '') +
    `</g>`
  );
}

/** Compound frond: paired leaflets up a stem (wisteria, bush clover). */
function frondSpray(x, y, len, rot, dark, light, count = 7) {
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">`;
  s += line(0, 0, 0, -len, INK, 1.8);
  for (let i = 0; i < count; i++) {
    const yy = -len * 0.12 - (len * 0.82 * i) / count;
    const w = Math.min(len * 0.13, 8) * (1 - (i / count) * 0.45);
    s += ell(-w * 1.1, yy, w, w * 0.58, -26, i % 2 ? dark : light, 1);
    s += ell(w * 1.1, yy, w, w * 0.58, 26, i % 2 ? light : dark, 1);
  }
  s += ell(0, -len * 0.97, 5.2, 3.4, 0, dark, 1);
  return s + '</g>';
}

/** Tapered grass blade with a feathered head (pampas, iris, willow). */
function blade(x, y, h, bend, fill) {
  const tipX = x + bend;
  const tipY = y - h;
  const d = `M${f(x - 2.2)} ${f(y)} Q${f(x + bend * 0.3)} ${f(y - h * 0.55)} ${f(tipX)} ${f(tipY)} Q${f(x + bend * 0.45)} ${f(y - h * 0.5)} ${f(x + 2.2)} ${f(y)} Z`;
  return p(d, fill, 1.1);
}

/** Pampas stalk: a bent stem carrying a feathered plume at the tip. */
function plume(x, y, h, bend, stem, head) {
  const tipX = x + bend;
  const tipY = y - h;
  let s = p(`M${f(x)} ${f(y)} Q${f(x + bend * 0.25)} ${f(y - h * 0.6)} ${f(tipX)} ${f(tipY)}`, 'none', 1.6);
  const dir = Math.atan2(tipY - (y - h * 0.6), tipX - (x + bend * 0.25));
  s += ell(tipX + Math.cos(dir) * 6, tipY + Math.sin(dir) * 6, 9, 4.2, (dir * 180) / Math.PI, head, 1.2);
  for (let i = -2; i <= 2; i++) {
    const a = dir + i * 0.34;
    s += line(tipX, tipY, tipX + Math.cos(a) * 13, tipY + Math.sin(a) * 13, head, 1.5);
  }
  return s;
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
    poly(MAPLE.map(([px, py]) => [px * r, py * r]), c, 1.3) +
    `<path d="M0 ${f(r * 0.82)} L0 ${f(-r * 0.3)} M0 ${f(-r * 0.05)} L${f(-r * 0.52)} ${f(-r * 0.3)} M0 ${f(-r * 0.05)} L${f(r * 0.52)} ${f(-r * 0.3)} M0 ${f(r * 0.2)} L${f(-r * 0.5)} ${f(r * 0.22)} M0 ${f(r * 0.2)} L${f(r * 0.5)} ${f(r * 0.22)}" stroke="rgba(30,18,8,0.45)" stroke-width="${f(Math.max(0.6, r * 0.06))}" fill="none"/>` +
    `</g>`
  );
}

function paulowniaLeaf(x, y, r, rot, fill) {
  const d = `M0 ${f(r * 0.14)} C ${f(-r * 1.02)} ${f(-r * 0.08)} ${f(-r * 0.74)} ${f(-r * 1.04)} 0 ${f(-r * 0.9)} C ${f(r * 0.74)} ${f(-r * 1.04)} ${f(r * 1.02)} ${f(-r * 0.08)} 0 ${f(r * 0.14)} Z`;
  return (
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` +
    p(d, fill, 1.4) +
    `<path d="M0 ${f(r * 0.06)} L0 ${f(-r * 0.8)}" stroke="rgba(248,244,220,0.34)" stroke-width="${f(r * 0.07)}" fill="none"/>` +
    `</g>`
  );
}

/* -------------------------------------------------------------- palettes */

const PAL = {
  1:  { sky: '#f4e3bd', band: '#e8cf9a', deep: '#14512c', mid: '#25793f', light: '#57a860', hot: '#cf2418' },
  2:  { sky: '#f8ead0', band: '#efd9ab', deep: '#4a2c1c', mid: '#7c4c2c', light: '#e4698c', hot: '#c62a52' },
  3:  { sky: '#fbe4e2', band: '#f3c8c8', deep: '#7d2f3d', mid: '#d9788d', light: '#ffc6d2', hot: '#c41f32' },
  4:  { sky: '#e7dfbe', band: '#d6cba3', deep: '#122a18', mid: '#24482a', light: '#3f7145', hot: '#f0e6c4' },
  5:  { sky: '#e3ecf2', band: '#c9dbe6', deep: '#1f4024', mid: '#356b3b', light: '#6f52b8', hot: '#4a3596' },
  6:  { sky: '#f8ecd1', band: '#eed9a8', deep: '#5f1720', mid: '#b52c22', light: '#dd5a52', hot: '#2a66aa' },
  7:  { sky: '#f4e2c1', band: '#e6ce9f', deep: '#57221a', mid: '#943425', light: '#c25c42', hot: '#241b18' },
  8:  { sky: '#dbe4f0', band: '#c2cfe2', deep: '#1f2533', mid: '#3a4258', light: '#79melt', hot: '#f7e9b2' },
  9:  { sky: '#f9f0d3', band: '#f0e0ab', deep: '#7a5c0b', mid: '#cd9612', light: '#f0c93c', hot: '#ab2a24' },
  10: { sky: '#fbeed2', band: '#f2dca9', deep: '#7d2a0e', mid: '#c54e1b', light: '#ea8433', hot: '#5d3f22' },
  11: { sky: '#f2eaf7', band: '#e2d3ee', deep: '#4b2f66', mid: '#744a99', light: '#a98ccd', hot: '#e0ae2f' },
  12: { sky: '#dde8f1', band: '#c4d6e4', deep: '#16344f', mid: '#27587f', light: '#5f95bd', hot: '#bd2a22' },
};
PAL[8].light = '#79839b';

const FONT = `'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif`;

/* ------------------------------------------------------------- grounds   */

/** Full-bleed sky plus a horizon band, so no card is bare paper. */
function ground(pal, horizon = 108, curve = 14) {
  return (
    `<rect width="100" height="150" fill="${pal.sky}"/>` +
    fillOnly(`M0 0 H100 V${f(horizon - 40)} Q50 ${f(horizon - 30)} 0 ${f(horizon - 38)} Z`, pal.band, 'opacity="0.55"') +
    p(
      `M-2 152 L-2 ${f(horizon)} Q26 ${f(horizon - curve)} 52 ${f(horizon + 4)} Q78 ${f(horizon + curve)} 102 ${f(horizon - 4)} L102 152 Z`,
      pal.deep,
      1.6,
    )
  );
}

const BG = {
  1: (q) =>
    ground(q, 112, 16) +
    p('M18 128 Q22 96 34 74 Q40 63 52 58', '#54371f', 4.4) +
    p('M34 78 Q48 74 62 62', '#54371f', 3.2) +
    pineFan(52, 60, 20, 8, q.mid) +
    pineFan(30, 80, 17, -18, q.deep) +
    pineFan(66, 70, 15, 26, q.light) +
    pineFan(16, 118, 15, -34, q.mid) +
    pineFan(82, 126, 14, 28, q.deep),

  2: (q) =>
    ground(q, 126, 8) +
    p('M4 148 Q20 106 42 80 Q60 58 92 30', q.deep, 5) +
    p('M42 80 Q58 84 72 70 M28 104 Q40 110 50 104', q.mid, 3.2) +
    blossom(74, 64, 11, q.light) +
    blossom(24, 110, 10, q.light) +
    blossom(52, 60, 8.5, '#ffd8e2') +
    blossom(40, 92, 7.5, q.light) +
    blossom(88, 36, 7, '#ffd8e2'),

  3: (q) =>
    ground(q, 128, 8) +
    p('M46 150 Q48 122 42 100', '#6b4630', 5.5) +
    p('M42 102 Q26 96 14 80 M44 100 Q64 96 78 82', '#6b4630', 3.6) +
    blossom(16, 74, 13, q.light) +
    blossom(78, 76, 12, q.light) +
    blossom(46, 86, 11, '#ffdfe6') +
    blossom(62, 58, 9, q.mid) +
    blossom(30, 52, 8, q.light),

  4: (q) =>
    `<rect width="100" height="150" fill="${q.sky}"/>` +
    fillOnly('M0 96 H100 V150 H0 Z', q.band, 'opacity="0.5"') +
    // 흑싸리 hangs: the fronds are drawn downward from the top edge.
    frondSpray(50, 2, 82, 180, q.deep, q.mid, 8) +
    frondSpray(22, 2, 68, 194, q.mid, q.deep, 7) +
    frondSpray(78, 2, 66, 166, q.mid, q.deep, 7) +
    frondSpray(36, 74, 52, 187, q.deep, q.mid, 5) +
    frondSpray(66, 80, 48, 173, q.deep, q.mid, 5),

  5: (q) =>
    `<rect width="100" height="150" fill="${q.sky}"/>` +
    p('M-2 152 L-2 116 Q26 106 52 118 Q78 130 102 118 L102 152 Z', '#2f6a92', 1.6) +
    fillOnly('M6 130 H34 M50 138 H80 M14 142 H44', '#bcd8e8', 'stroke="#bcd8e8" stroke-width="2" stroke-linecap="round"') +
    blade(20, 122, 58, -8, q.mid) +
    blade(30, 126, 66, 6, q.deep) +
    blade(66, 124, 62, -6, q.deep) +
    blade(78, 120, 52, 10, q.mid) +
    iris(30, 58, 1) +
    iris(70, 70, 0.84),

  6: (q) =>
    ground(q, 124, 10) +
    leafShape(20, 134, 32, 16, -38, '#2f6330') +
    leafShape(80, 138, 30, 15, 36, '#2f6330') +
    leafShape(50, 146, 28, 14, 4, '#3c7a38') +
    leafShape(34, 122, 24, 12, -16, '#3c7a38') +
    line(50, 142, 50, 92, '#3c7a38', 3.2) +
    rosette(50, 70, 30, q.mid, q.light, '#f0c33c', 11),

  7: (q) =>
    ground(q, 130, 8) +
    frondSpray(20, 138, 72, -17, q.mid, q.light, 6) +
    frondSpray(48, 146, 84, -3, q.deep, q.mid, 7) +
    frondSpray(76, 140, 74, 14, q.mid, q.light, 6) +
    frondSpray(94, 132, 58, 28, q.deep, q.mid, 5),

  8: (q) =>
    `<rect width="100" height="150" fill="${q.sky}"/>` +
    fillOnly('M0 60 H100 V104 H0 Z', q.band, 'opacity="0.5"') +
    p('M-2 152 L-2 96 Q24 70 52 88 Q80 106 102 84 L102 152 Z', q.deep, 1.6) +
    p('M-2 152 L-2 124 Q30 110 60 126 Q84 138 102 128 L102 152 Z', q.mid, 1.4) +
    blade(16, 140, 40, -12, q.mid) + blade(38, 146, 34, 9, q.mid) +
    blade(60, 144, 36, -9, q.mid) + blade(84, 146, 32, 11, q.mid) +
    plume(10, 136, 62, -16, q.light, '#eef2f8') +
    plume(30, 130, 74, 13, q.light, '#eef2f8') +
    plume(52, 140, 66, -14, q.light, '#dfe6f0') +
    plume(72, 132, 78, 14, q.light, '#eef2f8') +
    plume(93, 138, 58, -13, q.light, '#dfe6f0'),

  9: (q) =>
    ground(q, 128, 8) +
    leafShape(22, 122, 22, 11, -36, '#3a6a2c') +
    leafShape(78, 126, 21, 10, 34, '#3a6a2c') +
    line(50, 132, 50, 92, '#3a6a2c', 3) +
    rosette(50, 72, 26, q.mid, q.light, q.hot, 12) +
    rosette(24, 44, 12, q.light, q.mid, q.hot, 9),

  10: (q) =>
    ground(q, 132, 8) +
    p('M52 150 Q46 122 36 102 M44 116 Q60 106 72 92', '#6b4522', 4.6) +
    mapleLeaf(26, 58, 19, q.mid, -16) +
    mapleLeaf(72, 76, 17, q.light, 22) +
    mapleLeaf(46, 102, 14, q.deep, -6) +
    mapleLeaf(60, 38, 13, q.light, 14) +
    mapleLeaf(86, 116, 11, q.mid, 30),

  11: (q) =>
    ground(q, 132, 8) +
    line(50, 146, 44, 96, '#4a3a20', 3.6) +
    paulowniaLeaf(20, 134, 34, -30, '#27552c') +
    paulowniaLeaf(80, 140, 32, 30, '#27552c') +
    paulowniaLeaf(50, 148, 32, 3, '#356b35') +
    paulowniaLeaf(34, 118, 22, -12, '#3f7a3c') +
    bells(30, 74, 1.05, q) +
    bells(64, 56, 0.86, q),

  12: (q) =>
    `<rect width="100" height="150" fill="${q.sky}"/>` +
    rain(q) +
    p('M-2 152 L-2 124 Q28 114 56 126 Q80 136 102 126 L102 152 Z', q.deep, 1.6) +
    p('M92 -2 Q86 34 70 56 Q60 70 64 88', '#4a6b4e', 4.4) +
    willow(90, 12, 3) +
    willow(80, 40, 3) +
    willow(70, 70, 2),
};

function iris(x, y, s) {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    p('M0 0 Q-12 4 -15 14 Q-7 15 -2 5 Z', PAL[5].hot, 1.2) +
    p('M0 0 Q12 4 15 14 Q7 15 2 5 Z', PAL[5].hot, 1.2) +
    p('M0 1 Q-5 10 0 17 Q5 10 0 1 Z', PAL[5].light, 1.2) +
    p('M-1 0 Q-9 -9 -6 -16 Q-1 -10 -1 -1 Z', PAL[5].light, 1.2) +
    p('M1 0 Q9 -9 6 -16 Q1 -10 1 -1 Z', PAL[5].light, 1.2) +
    p('M0 -1 Q-4 -12 0 -17 Q4 -12 0 -1 Z', PAL[5].hot, 1.2) +
    circ(0, 1, 2.8, '#f2cf44', 1.1) +
    `</g>`
  );
}

function bells(x, y, s, q) {
  let out = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">`;
  out += line(0, 18, -1, -8, '#4a3a20', 2);
  for (const [dx, dy, r] of [[-8, -2, -24], [7, -7, 20], [-1, -16, -4]]) {
    out +=
      `<g transform="translate(${dx} ${dy}) rotate(${r})">` +
      p('M0 -8 Q-5 -8 -5 0 Q-5 7 0 7 Q5 7 5 0 Q5 -8 0 -8 Z', q.light, 1.2) +
      ell(0, 6, 5, 2.6, 0, q.mid, 1.1) +
      `</g>`;
  }
  return out + '</g>';
}

function rain(q) {
  let out = '';
  for (let i = 0; i < 11; i++) {
    const x = 2 + i * 9.5;
    out += line(x, 2 + (i % 3) * 7, x - 9, 74 + (i % 4) * 9, q.light, 1.8);
  }
  return out;
}

function willow(x, y, n = 3) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const xx = x - i * 7;
    const sway = -9 - i * 2;
    // Sample the strand so each leaf sits on the curve instead of beside it.
    const at = (t) => [
      (1 - t) * (1 - t) * xx + 2 * (1 - t) * t * (xx + sway) + t * t * (xx + sway * 0.6),
      (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + 20) + t * t * (y + 42),
    ];
    const [mx, my] = at(0.5);
    const [ex, ey] = at(1);
    out += p(`M${f(xx)} ${f(y)} Q${f(xx + sway)} ${f(y + 20)} ${f(ex)} ${f(ey)}`, 'none', 1.5);
    for (const t of [0.28, 0.52, 0.76, 0.96]) {
      const [lx, ly] = at(t);
      out += ell(lx - 3.4, ly, 4.2, 1.7, -32, '#5f8b5f', 0.9);
      out += ell(lx + 3.4, ly + 4, 4.2, 1.7, 28, '#4e7a4e', 0.9);
    }
    void mx; void my;
  }
  return out;
}

/* ------------------------------------------------------------- creatures */

const MOTIF = {
  crane: (q) =>
    circ(27, 34, 17, q.hot, 2) +
    // Neck is a closed tapered shape; an open path with a fill blobs.
    p('M40 44 Q32 62 42 84 L54 84 Q45 62 50 45 Z', '#fffbf2', 1.7) +
    ell(64, 90, 23, 14, -4, '#fffbf2', 1.8) +
    p('M82 84 Q96 76 100 62 Q99 88 89 97 Z', '#241a12', 1.5) +
    fillOnly('M48 84 Q62 78 78 84 Q62 92 48 88 Z', '#e9e2d2') +
    circ(45, 39, 7, '#fffbf2', 1.7) +
    p('M40 33 Q45 27 51 32 Q46 36 41 36 Z', q.hot, 1.2) +
    p('M38 40 L26 42 L38 45 Z', '#e8a52c', 1.3) +
    circ(45, 38, 1.4, INK, 0) +
    line(57, 103, 55, 122) + line(70, 103, 72, 122) +
    line(50, 122, 61, 122) + line(66, 122, 78, 122),

  curtain: (q) =>
    p('M4 4 H96 V42 H4 Z', '#fdf4e6', 1.8) +
    fillOnly('M4 4 H96 V13 H4 Z', q.hot) +
    fillOnly('M4 20 H96 V29 H4 Z', q.hot) +
    fillOnly('M4 36 H96 V42 H4 Z', q.hot) +
    p('M4 4 H96 V42 H4 Z', 'none', 1.8) +
    p('M14 42 Q24 54 14 64 M38 42 Q48 54 38 64 M62 42 Q72 54 62 64 M86 42 Q96 54 86 64', 'none', 1.6),

  warbler: (q) =>
    ell(54, 48, 17, 12, -16, '#5d7a26', 1.7) +
    fillOnly('M46 42 Q56 38 66 44 Q58 50 48 48 Z', '#7d9c38') +
    circ(38, 40, 8, '#6f8f30', 1.6) +
    p('M31 38 L20 41 L31 45 Z', '#e0a92c', 1.3) +
    circ(37, 37.5, 1.6, INK, 0) +
    p('M58 42 Q76 38 86 26 Q78 48 64 54 Z', '#8fae44', 1.5) +
    p('M64 54 Q80 62 90 76', 'none', 4) +
    line(46, 58, 43, 68) + line(56, 58, 59, 68),

  cuckoo: (q) =>
    circ(24, 28, 15, q.hot, 1.8) +
    ell(48, 70, 19, 12, -18, '#1d2a34', 1.7) +
    circ(32, 60, 8, '#28394a', 1.6) +
    p('M25 58 L14 62 L25 65 Z', '#d9a63c', 1.3) +
    circ(31, 57.5, 1.6, '#f2efe4', 0) +
    p('M52 64 Q70 58 80 46 Q70 72 56 78 Z', '#30485c', 1.5) +
    p('M58 78 Q74 88 84 102', 'none', 4) +
    line(42, 80, 39, 90) + line(52, 80, 55, 90),

  bridge: (q) =>
    p('M2 96 L98 68 L98 76 L2 104 Z', '#8a5630', 1.7) +
    p('M2 104 L98 76 L98 82 L2 110 Z', '#5f3820', 1.5) +
    line(14, 98, 14, 118, INK, 3.4) + line(38, 91, 38, 111, INK, 3.4) +
    line(62, 84, 62, 104, INK, 3.4) + line(86, 77, 86, 97, INK, 3.4) +
    fillOnly('M2 96 L98 68 L98 71 L2 99 Z', 'rgba(255,240,210,0.35)'),

  butterfly: (q) => wing(34, 44, 1, q) + wing(70, 28, 0.7, q),

  boar: (q) =>
    ell(54, 66, 27, 17, 0, '#3a2a1e', 1.8) +
    fillOnly('M40 56 Q56 48 72 56 Q58 62 42 62 Z', '#57412e') +
    p('M30 58 Q16 54 11 62 Q8 72 20 74 L32 73 Z', '#4a382b', 1.6) +
    p('M15 64 L5 59 M15 69 L5 72', 'none', 2.2) +
    circ(25, 59, 1.7, '#efe7d2', 0) +
    p('M33 52 L28 42 L41 50 Z', '#4a382b', 1.4) +
    line(41, 82, 39, 96, INK, 4.4) + line(55, 84, 55, 98, INK, 4.4) + line(69, 80, 71, 94, INK, 4.4) +
    p('M79 58 Q90 51 87 42', 'none', 3),

  moon: (q) => circ(52, 46, 26, q.hot, 2.2),

  geese: (q) => goose(32, 42, 1) + goose(60, 24, 0.82) + goose(64, 62, 0.76),

  sake: (q) =>
    p('M24 58 Q50 51 76 58 L67 84 Q50 91 33 84 Z', q.hot, 1.8) +
    ell(50, 58, 26, 8, 0, '#f6ecd2', 1.6) +
    p('M44 86 H56 V94 H44 Z', '#7a1f1c', 1.4) +
    ell(50, 98, 20, 5.5, 0, q.hot, 1.5) +
    `<text x="50" y="79" font-size="16" font-family="serif" font-weight="700" fill="#f9eebd" text-anchor="middle">壽</text>`,

  deer: (q) =>
    ell(56, 72, 23, 14, 0, '#8a5a33', 1.8) +
    p('M36 62 Q27 54 29 43 Q31 36 38 39 Q43 42 42 51 L41 62 Z', '#9a6a3d', 1.6) +
    p('M32 40 Q25 30 27 20 M32 33 Q23 30 18 23 M40 38 Q46 28 44 18 M40 31 Q48 28 53 21', 'none', 2.4) +
    circ(34, 47, 1.7, INK, 0) +
    p('M28 42 L20 40', 'none', 1.6) +
    line(43, 85, 41, 100, INK, 3.8) + line(57, 86, 57, 101, INK, 3.8) + line(71, 82, 73, 97, INK, 3.8) +
    circ(50, 66, 2.4, '#ecd9b2', 0.9) + circ(61, 72, 2.4, '#ecd9b2', 0.9) + circ(67, 63, 2.2, '#ecd9b2', 0.9),

  phoenix: (q) =>
    p('M46 88 Q32 80 32 62 Q32 44 50 38 Q66 32 75 43 Q82 52 72 59 L58 66 Q50 72 50 88 Z', q.hot, 1.8) +
    fillOnly('M44 58 Q56 50 68 54 Q58 62 46 64 Z', '#f6dd90') +
    circ(73, 39, 7.5, '#f4d87c', 1.6) +
    p('M80 37 L91 41 L80 44 Z', '#c93c23', 1.3) +
    circ(74, 37.5, 1.5, INK, 0) +
    p('M70 30 Q73 21 81 20 Q77 27 76 31 Z', '#c93c23', 1.2) +
    p('M42 74 Q20 82 8 104 M45 80 Q28 94 21 118 M50 84 Q41 104 44 128', 'none', 2.8) +
    p('M40 58 Q24 50 17 34 Q33 44 45 46 Z', '#f4d87c', 1.5),

  rainman: (q) =>
    p('M16 44 Q42 16 68 44 Z', '#3a2c22', 1.8) +
    fillOnly('M30 40 Q42 26 54 40 Z', '#57422f') +
    line(42, 44, 42, 92, '#5a4433', 2.6) +
    ell(46, 66, 9.5, 10.5, 0, '#f3e6cc', 1.6) +
    p('M37 84 Q46 71 57 82 L64 118 Q46 125 30 116 Z', '#2f4f72', 1.7) +
    circ(42, 64, 1.4, INK, 0) + circ(50, 64, 1.4, INK, 0) +
    p('M43 71 Q46 74 49 71', 'none', 1.1) +
    p('M62 102 L78 93', 'none', 2.6),

  swallow: (q) =>
    ell(50, 58, 19, 11, -18, '#1b2a38', 1.7) +
    circ(33, 50, 7.5, '#22364a', 1.6) +
    p('M26 48 L15 52 L26 55 Z', '#d9a63c', 1.3) +
    circ(32, 48.5, 1.5, '#e9f0f5', 0) +
    p('M33 57 Q40 61 47 58 Q40 63 33 61 Z', '#c94e3c', 1.2) +
    p('M55 52 Q72 44 83 29 Q74 56 61 62 Z', '#2a4055', 1.5) +
    p('M62 68 L88 84 L65 77 L82 98 Z', '#1b2a38', 1.5),
};

function wing(x, y, s, q) {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    p('M0 0 Q-21 -19 -26 -2 Q-28 13 -4 9 Z', q.hot, 1.5) +
    p('M0 0 Q21 -19 26 -2 Q28 13 4 9 Z', q.hot, 1.5) +
    p('M-3 0 Q-17 11 -13 21 Q-4 23 -2 11 Z', '#f2d35a', 1.3) +
    p('M3 0 Q17 11 13 21 Q4 23 2 11 Z', '#f2d35a', 1.3) +
    fillOnly('M-18 -6 q-3 6 2 9 q6 -2 7 -8 Z', '#f6e7a8') +
    fillOnly('M18 -6 q3 6 -2 9 q-6 -2 -7 -8 Z', '#f6e7a8') +
    ell(0, 4, 3, 10.5, 0, '#26364a', 1.3) +
    p('M-1 -6 Q-7 -17 -14 -19 M1 -6 Q7 -17 14 -19', 'none', 1.3) +
    `</g>`
  );
}

function goose(x, y, s) {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    ell(0, 0, 13, 7, 0, '#f6eeda', 1.5) +
    circ(-12, -4.5, 4.8, '#f6eeda', 1.4) +
    p('M-16 -4 L-23 -3 L-16 -1 Z', '#d98c2c', 1.1) +
    circ(-12.5, -5.5, 1.2, INK, 0) +
    p('M-2 -3 Q7 -17 19 -19 Q10 -4 4 0 Z', '#7d8699', 1.4) +
    p('M10 2 L21 4', 'none', 1.8) +
    `</g>`
  );
}

/* --------------------------------------------------------------- ribbons */

function ribbonBand(kind) {
  const spec = {
    hong: { fill: '#cf2a22', text: '홍단', ink: '#6d120e' },
    cho: { fill: '#cf2a22', text: '초단', ink: '#16307a' },
    cheong: { fill: '#2f4fb5', text: '청단', ink: '#eef2ff' },
    plain: { fill: '#c02c24', text: '', ink: '#fff' },
  }[kind];
  return (
    p('M5 57 L95 42 L95 78 L5 93 Z', spec.fill, 2) +
    fillOnly('M5 61 L95 46 L95 50 L5 65 Z', 'rgba(255,255,255,0.22)') +
    fillOnly('M5 85 L95 70 L95 75 L5 90 Z', 'rgba(0,0,0,0.16)') +
    (spec.text
      ? `<text x="50" y="74" font-size="19" font-family="${FONT}" font-weight="800" fill="${spec.ink}" text-anchor="middle" transform="rotate(-9.5 50 74)">${spec.text}</text>`
      : '')
  );
}

/* ---------------------------------------------------------------- chrome */

function seal(c) {
  const box = (fill, label, ink) =>
    p('M68 4 H96 V30 H68 Z', fill, 1.8) +
    fillOnly('M70 6 H94 V28 H70 Z', 'none', `stroke="${ink}" stroke-width="0.9" opacity="0.6"`) +
    `<text x="82" y="24" font-size="17" font-family="${FONT}" font-weight="800" fill="${ink}" text-anchor="middle">${label}</text>`;

  if (c.type === 'gwang') return box('#efc132', '광', '#5f4103');
  if (c.type === 'animal') return box(c.godori ? '#cf2a22' : '#2f6fb0', c.godori ? '고' : '열', '#fff8ea');
  if (c.type === 'junk' && c.pi === 2) return box('#241a12', '쌍', '#f4cf5e');
  return '';
}

function monthTag(c) {
  return (
    p('M4 126 H40 V146 H4 Z', 'rgba(22,16,9,0.82)', 1.4) +
    `<text x="22" y="141" font-size="12.5" font-family="${FONT}" font-weight="700" fill="#f6e7c8" text-anchor="middle">${c.month}월</text>`
  );
}

/** Woodblock keyline just inside the card edge. */
const KEYLINE = p('M3 3 H97 V147 H3 Z', 'none', 2.4);

/* ------------------------------------------------------------------- api */

/** Full artwork for one card as an SVG string (100x150 viewBox, no ids). */
export function cardSVG(c) {
  const q = PAL[c.month];
  let body = `<rect width="100" height="150" fill="${PAPER}"/>` + BG[c.month](q);
  if (c.motif && MOTIF[c.motif]) body += MOTIF[c.motif](q);
  if (c.type === 'ribbon') body += ribbonBand(c.ribbon);
  body += seal(c) + monthTag(c) + KEYLINE;
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

// Procedural hwatu artwork.
//
// Each card is drawn as a flat, id-free SVG in a 100x150 viewBox: no <defs>,
// no gradients, no clipPath. Ids would collide once the same markup is inlined
// twice, and the woodblock originals are flat colour anyway. The rounded
// border and the clipping live on the .card wrapper in CSS.

const PAL = {
  1:  { sky: '#f6ead1', deep: '#1b5230', mid: '#2f8049', light: '#67b478', hot: '#cf2b25' },
  2:  { sky: '#f8eedb', deep: '#4e3226', mid: '#7d5237', light: '#e2718d', hot: '#c93a5c' },
  3:  { sky: '#fbe9e6', deep: '#8a3a49', mid: '#e08fa1', light: '#ffc9d5', hot: '#cb2b3d' },
  4:  { sky: '#e9e4cd', deep: '#16311d', mid: '#2c5533', light: '#4d8656', hot: '#1a2a3f' },
  5:  { sky: '#e7eef3', deep: '#25482a', mid: '#3d7643', light: '#7a5fbf', hot: '#57429f' },
  6:  { sky: '#f7ead3', deep: '#711d26', mid: '#bd3529', light: '#e2615a', hot: '#2f6fb0' },
  7:  { sky: '#f3e4c7', deep: '#65281f', mid: '#9e3c2c', light: '#c9664a', hot: '#2b2220' },
  8:  { sky: '#dde5ef', deep: '#272d3c', mid: '#434c62', light: '#8a92a5', hot: '#f6e8b4' },
  9:  { sky: '#f8f1d9', deep: '#84650f', mid: '#d29c18', light: '#f2cc45', hot: '#b32f29' },
  10: { sky: '#faeed7', deep: '#883114', mid: '#cc5722', light: '#ee8d3c', hot: '#67472a' },
  11: { sky: '#f4edf8', deep: '#553771', mid: '#7d53a2', light: '#b096d3', hot: '#e4b53b' },
  12: { sky: '#e0eaf2', deep: '#1c3c5f', mid: '#2c6290', light: '#6b9fc6', hot: '#c33029' },
};

const FONT = `'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif`;

/* ------------------------------------------------------------------ atoms */

function petalFlower(cx, cy, r, petal, core, n = 5, rot = -90) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    const px = cx + Math.cos(a) * r * 0.72;
    const py = cy + Math.sin(a) * r * 0.72;
    s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(r * 0.56)}" ry="${f(r * 0.46)}" fill="${petal}" transform="rotate(${f(
      (a * 180) / Math.PI,
    )} ${f(px)} ${f(py)})"/>`;
  }
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.3)}" fill="${core}"/>`;
  return s;
}

function leaf(cx, cy, rx, ry, rot, fill, stroke) {
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${
    stroke ? ` stroke="${stroke}" stroke-width="0.8"` : ''
  } transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})"/>`;
}

function needleSpray(cx, cy, len, rot, fill) {
  let s = `<g transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})">`;
  for (let i = -3; i <= 3; i++) {
    s += `<path d="M${f(cx)} ${f(cy)} L${f(cx + i * len * 0.3)} ${f(cy - len)}" stroke="${fill}" stroke-width="1.5" stroke-linecap="round" fill="none"/>`;
  }
  s += '</g>';
  return s;
}

const f = (v) => Math.round(v * 100) / 100;

/* ------------------------------------------------- per-month backgrounds  */

const BG = {
  1: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    `<path d="M0 150 L0 108 Q28 96 52 112 Q76 128 100 116 L100 150 Z" fill="${p.deep}"/>` +
    `<path d="M12 122 Q16 96 26 82" stroke="#4a3320" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    needleSpray(26, 86, 18, -10, p.mid) +
    needleSpray(50, 104, 15, 22, p.mid) +
    needleSpray(80, 120, 14, -26, p.light) +
    needleSpray(14, 124, 13, -36, p.light),
  2: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    `<path d="M6 150 Q22 104 40 78 Q56 56 84 34" stroke="${p.deep}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<path d="M40 78 Q56 82 70 68" stroke="${p.mid}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    petalFlower(72, 64, 9, p.light, '#f5d34a') +
    petalFlower(24, 112, 8, p.light, '#f5d34a') +
    petalFlower(52, 62, 7, '#ffd6e2', '#f5d34a'),
  3: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    `<path d="M44 150 Q46 118 40 96" stroke="#6b4632" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    `<path d="M40 100 Q24 92 16 78 M42 98 Q62 92 74 80" stroke="#6b4632" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
    petalFlower(18, 72, 12, p.light, '#e8b23c') +
    petalFlower(76, 74, 11, p.light, '#e8b23c') +
    petalFlower(46, 82, 10, '#ffdde5', '#e8b23c') +
    petalFlower(62, 58, 8, p.mid, '#e8b23c'),
  4: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    `<path d="M50 0 L50 26" stroke="${p.deep}" stroke-width="3.5"/>` +
    frond(50, 24, 1) +
    frond(28, 42, 0.86) +
    frond(72, 46, 0.86),
  5: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    `<path d="M0 150 L0 116 Q28 106 50 116 Q76 128 100 118 L100 150 Z" fill="${p.deep}" opacity="0.9"/>` +
    `<path d="M18 130 Q14 92 26 62 M30 132 Q34 96 44 74 M64 130 Q68 98 60 70 M78 132 Q84 100 76 76" stroke="${p.mid}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    irisFlower(30, 56, p) +
    irisFlower(70, 66, p, 0.8),
  6: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    leaf(24, 116, 18, 9, -24, p.deep) +
    leaf(74, 122, 17, 9, 20, p.deep) +
    leaf(50, 132, 16, 8, 4, '#3d6b34') +
    petalFlower(50, 74, 22, p.mid, '#f2c744', 7, -90) +
    petalFlower(50, 74, 13, p.light, '#f2c744', 6, -60),
  7: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    cloverSpray(24, 120, -14, p) +
    cloverSpray(56, 126, 10, p) +
    cloverSpray(80, 116, 26, p),
  8: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    `<path d="M0 150 L0 100 Q26 78 54 92 Q80 104 100 88 L100 150 Z" fill="${p.deep}"/>` +
    `<path d="M0 150 L0 124 Q34 112 62 126 Q84 136 100 128 L100 150 Z" fill="${p.mid}"/>` +
    grass(10, 126, p.light) +
    grass(28, 118, p.light) +
    grass(46, 132, p.light) +
    grass(64, 122, p.light) +
    grass(82, 130, p.light) +
    grass(96, 120, p.light),
  9: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    leaf(22, 118, 15, 8, -30, '#3f6b30') +
    leaf(78, 122, 14, 8, 28, '#3f6b30') +
    `<path d="M50 140 Q48 112 50 94" stroke="#3f6b30" stroke-width="3" fill="none"/>` +
    petalFlower(50, 72, 24, p.mid, p.hot, 9, -90) +
    petalFlower(50, 72, 15, p.light, p.hot, 8, -70) +
    petalFlower(24, 44, 10, p.light, p.mid, 7, -90),
  10: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    `<path d="M52 150 Q48 122 40 104 M46 118 Q60 108 70 96" stroke="#6a4a2c" stroke-width="4.5" fill="none" stroke-linecap="round"/>` +
    mapleLeaf(26, 60, 18, p.mid, -16) +
    mapleLeaf(72, 76, 16, p.light, 20) +
    mapleLeaf(46, 104, 13, p.deep, -6) +
    mapleLeaf(58, 40, 12, p.light, 12),
  11: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    `<path d="M50 150 Q48 122 44 100" stroke="#4a3a24" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
    paulowniaLeaf(24, 116, 26, -24, '#2f5c34') +
    paulowniaLeaf(76, 122, 24, 26, '#2f5c34') +
    paulowniaLeaf(50, 132, 22, 2, '#3d7340') +
    bellCluster(34, 76, 1, p) +
    bellCluster(62, 62, 0.82, p),
  12: (p) =>
    `<rect width="100" height="150" fill="${p.sky}"/>` +
    `<path d="M0 150 L0 126 Q30 118 56 128 Q80 136 100 128 L100 150 Z" fill="${p.deep}"/>` +
    rainStreaks(p) +
    `<path d="M84 0 Q80 30 66 52 Q58 66 62 84" stroke="#4d6b52" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    willow(80, 16) +
    willow(70, 40),
};

function paulowniaLeaf(x, y, r, rot, fill) {
  // Broad heart-shaped leaf, tip up, stem at the bottom.
  return (
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` +
    `<path d="M0 ${f(r * 0.12)} C ${f(-r * 0.95)} ${f(-r * 0.1)} ${f(-r * 0.7)} ${f(-r)} 0 ${f(-r * 0.86)} C ${f(r * 0.7)} ${f(-r)} ${f(r * 0.95)} ${f(-r * 0.1)} 0 ${f(r * 0.12)} Z" fill="${fill}"/>` +
    `<path d="M0 ${f(r * 0.1)} L0 ${f(-r * 0.8)}" stroke="rgba(240,240,210,0.3)" stroke-width="${f(r * 0.07)}"/>` +
    `</g>`
  );
}

function bellCluster(x, y, s, p) {
  let out = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">`;
  out += `<path d="M0 16 Q-2 4 -1 -6" stroke="#4a3a24" stroke-width="1.8" fill="none"/>`;
  for (const [dx, dy, rot] of [[-7, -2, -22], [6, -6, 18], [-1, -14, -4]]) {
    out +=
      `<g transform="translate(${dx} ${dy}) rotate(${rot})">` +
      `<path d="M0 -7 Q-4.5 -7 -4.5 0 Q-4.5 6 0 6 Q4.5 6 4.5 0 Q4.5 -7 0 -7 Z" fill="${p.light}"/>` +
      `<ellipse cx="0" cy="5" rx="4.5" ry="2.2" fill="${p.mid}"/>` +
      `</g>`;
  }
  return out + '</g>';
}

function frond(x, y, s) {
  let out = `<path d="M${f(x)} ${f(y)} L${f(x)} ${f(y + 52 * s)}" stroke="#16311d" stroke-width="2.5"/>`;
  for (let i = 0; i < 6; i++) {
    const yy = y + 8 * s + i * 8 * s;
    const w = (12 - i * 1.2) * s;
    out += leaf(x - w * 0.8, yy, w, w * 0.5, -22, i % 2 ? '#2c5533' : '#3c6b40');
    out += leaf(x + w * 0.8, yy, w, w * 0.5, 22, i % 2 ? '#3c6b40' : '#2c5533');
  }
  return out;
}

function irisFlower(x, y, p, s = 1) {
  // Three drooping falls under three upright standards, which is what makes
  // an iris read as an iris rather than as a purple smudge.
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    `<path d="M0 0 Q-11 3 -13 12 Q-6 13 -2 4 Z" fill="${p.hot}"/>` +
    `<path d="M0 0 Q11 3 13 12 Q6 13 2 4 Z" fill="${p.hot}"/>` +
    `<path d="M0 1 Q-4 9 0 15 Q4 9 0 1 Z" fill="${p.light}"/>` +
    `<path d="M-1 0 Q-8 -8 -5 -14 Q-1 -9 -1 -1 Z" fill="${p.light}"/>` +
    `<path d="M1 0 Q8 -8 5 -14 Q1 -9 1 -1 Z" fill="${p.light}"/>` +
    `<path d="M0 -1 Q-3 -11 0 -15 Q3 -11 0 -1 Z" fill="${p.hot}"/>` +
    `<circle cx="0" cy="1" r="2.4" fill="#f3d34c"/>` +
    `</g>`
  );
}

function cloverSpray(x, y, rot, p) {
  let out = `<g transform="rotate(${f(rot)} ${f(x)} ${f(y)})">`;
  out += `<path d="M${f(x)} ${f(y)} L${f(x)} ${f(y - 56)}" stroke="${p.deep}" stroke-width="2.5" stroke-linecap="round"/>`;
  for (let i = 0; i < 6; i++) {
    const yy = y - 8 - i * 8;
    const w = 9 - i * 0.9;
    out += leaf(x - w * 0.9, yy, w, w * 0.62, -20, i % 2 ? p.mid : p.light);
    out += leaf(x + w * 0.9, yy, w, w * 0.62, 20, i % 2 ? p.light : p.mid);
  }
  out += '</g>';
  return out;
}

function grass(x, y, c) {
  let out = '';
  for (let i = -2; i <= 2; i++) {
    out += `<path d="M${f(x)} ${f(y)} Q${f(x + i * 5)} ${f(y - 22)} ${f(x + i * 11)} ${f(y - 34)}" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  }
  return out;
}

// Unit maple outline (point up, stem at +y), scaled per call.
const MAPLE = [
  [0, -1], [0.2, -0.56], [0.46, -0.66], [0.38, -0.3], [0.82, -0.4], [0.58, -0.06],
  [0.96, 0.08], [0.46, 0.28], [0.58, 0.54], [0.18, 0.4], [0.1, 0.86], [-0.1, 0.86],
  [-0.18, 0.4], [-0.58, 0.54], [-0.46, 0.28], [-0.96, 0.08], [-0.58, -0.06],
  [-0.82, -0.4], [-0.38, -0.3], [-0.46, -0.66], [-0.2, -0.56],
];

function mapleLeaf(x, y, r, c, rot = 0) {
  const pts = MAPLE.map(([px, py]) => `${f(px * r)} ${f(py * r)}`).join(' ');
  return (
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` +
    `<polygon points="${pts}" fill="${c}"/>` +
    `<path d="M0 ${f(r * 0.8)} L0 ${f(-r * 0.25)} M0 0 L${f(-r * 0.5)} ${f(-r * 0.3)} M0 0 L${f(r * 0.5)} ${f(-r * 0.3)}" stroke="rgba(90,50,20,0.45)" stroke-width="${f(r * 0.07)}" fill="none"/>` +
    `</g>`
  );
}

function rainStreaks(p) {
  let out = '';
  for (let i = 0; i < 9; i++) {
    const x = 6 + i * 11;
    out += `<path d="M${f(x)} ${f(4 + (i % 3) * 6)} L${f(x - 7)} ${f(60 + (i % 4) * 8)}" stroke="${p.light}" stroke-width="1.5" opacity="0.7" stroke-linecap="round"/>`;
  }
  return out;
}

function willow(x, y) {
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += `<path d="M${f(x - i * 5)} ${f(y)} Q${f(x - i * 5 - 6)} ${f(y + 18)} ${f(x - i * 5 - 3)} ${f(y + 34)}" stroke="#5f8b63" stroke-width="1.6" fill="none"/>`;
  }
  return out;
}

/* ------------------------------------------------------- motif overlays  */

const MOTIF = {
  crane: (p) =>
    // Sun sits low-left so the 광 badge in the top-right never lands on it.
    `<circle cx="26" cy="40" r="16" fill="${p.hot}"/>` +
    `<ellipse cx="62" cy="86" rx="21" ry="13" fill="#fffaf0" stroke="#3a2c20" stroke-width="1.3"/>` +
    `<path d="M80 80 Q92 74 96 62 Q94 82 86 90 Z" fill="#2b2118"/>` +
    `<path d="M48 82 Q40 74 40 62 Q40 52 44 46" stroke="#fffaf0" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    `<path d="M48 82 Q40 74 40 62 Q40 52 44 46" stroke="#3a2c20" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.5"/>` +
    `<circle cx="45" cy="42" r="5.4" fill="#fffaf0" stroke="#3a2c20" stroke-width="1.2"/>` +
    `<path d="M41 38 q3 -5 8 -2" stroke="${p.hot}" stroke-width="3.4" fill="none" stroke-linecap="round"/>` +
    `<path d="M40 43 L30 45" stroke="#3a2c20" stroke-width="1.8" stroke-linecap="round"/>` +
    `<circle cx="44" cy="41.5" r="1" fill="#1a1410"/>` +
    `<path d="M52 88 Q62 94 74 88" stroke="#3a2c20" stroke-width="1.1" fill="none"/>` +
    `<path d="M56 98 L54 118 M68 98 L70 118" stroke="#3a2c20" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M50 118 L58 118 M66 118 L74 118" stroke="#3a2c20" stroke-width="2" stroke-linecap="round"/>`,
  curtain: (p) =>
    `<rect x="6" y="6" width="88" height="34" rx="3" fill="#fbf1e2" stroke="#8a3a49" stroke-width="1.4"/>` +
    `<rect x="6" y="6" width="88" height="8" fill="${p.hot}"/>` +
    `<rect x="6" y="20" width="88" height="8" fill="${p.hot}"/>` +
    `<rect x="6" y="34" width="88" height="6" fill="${p.hot}"/>` +
    `<path d="M12 40 q10 12 0 20 M32 40 q10 12 0 20 M52 40 q10 12 0 20 M72 40 q10 12 0 20" stroke="#8a3a49" stroke-width="1.4" fill="none"/>`,
  warbler: (p) =>
    `<ellipse cx="52" cy="46" rx="16" ry="11" fill="#5f7a2e" transform="rotate(-16 52 46)"/>` +
    `<circle cx="38" cy="39" r="7.5" fill="#6f8c38"/>` +
    `<path d="M31 38 L22 41 L31 43 Z" fill="#e0a92c"/>` +
    `<circle cx="37" cy="37.5" r="1.4" fill="#1a1410"/>` +
    `<path d="M56 42 Q72 40 80 30 Q72 46 60 52 Z" fill="#8aa848"/>` +
    `<path d="M62 52 Q76 58 84 70" stroke="#5f7a2e" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `<path d="M44 56 L42 64 M52 56 L54 64" stroke="#3a2c20" stroke-width="1.6" stroke-linecap="round"/>`,
  cuckoo: (p) =>
    `<circle cx="24" cy="30" r="14" fill="#efe7c8"/>` +
    `<ellipse cx="46" cy="70" rx="17" ry="11" fill="#22303c" transform="rotate(-20 46 70)"/>` +
    `<circle cx="32" cy="62" r="7" fill="#2c3d4c"/>` +
    `<path d="M25 61 L16 64 L25 66 Z" fill="#d9a63c"/>` +
    `<circle cx="31" cy="60.5" r="1.4" fill="#f2efe4"/>` +
    `<path d="M50 66 Q66 62 74 52 Q66 72 54 76 Z" fill="#33485a"/>` +
    `<path d="M56 76 Q70 84 78 96" stroke="#22303c" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  bridge: (p) =>
    `<path d="M4 92 L96 68" stroke="#7a4a2c" stroke-width="7" stroke-linecap="round" fill="none"/>` +
    `<path d="M4 100 L96 76" stroke="#5c3520" stroke-width="3" stroke-linecap="round" fill="none"/>` +
    `<path d="M16 90 L16 106 M40 84 L40 100 M64 78 L64 94 M88 72 L88 88" stroke="#5c3520" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M6 86 L94 62" stroke="#8f5a36" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  butterfly: (p) =>
    butterflyAt(34, 44, 1, p) + butterflyAt(68, 30, 0.72, p),
  boar: (p) =>
    `<ellipse cx="52" cy="66" rx="26" ry="16" fill="#3a2c22"/>` +
    `<path d="M28 60 Q18 56 14 62 Q10 70 20 72 L30 72 Z" fill="#4a382b"/>` +
    `<path d="M16 64 L8 60 M16 68 L8 70" stroke="#efe7d2" stroke-width="2" stroke-linecap="round"/>` +
    `<circle cx="25" cy="60" r="1.5" fill="#efe7d2"/>` +
    `<path d="M32 54 L28 46 L38 52 Z" fill="#4a382b"/>` +
    `<path d="M40 80 L38 92 M54 82 L54 94 M68 78 L70 90" stroke="#2b2018" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M76 58 Q86 52 84 44" stroke="#3a2c22" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    `<path d="M38 52 Q52 44 66 52" stroke="#5e4938" stroke-width="2" fill="none"/>`,
  moon: (p) => `<circle cx="52" cy="46" r="25" fill="${p.hot}" stroke="#d6c07c" stroke-width="1.5"/>`,
  geese: (p) =>
    goose(32, 44, 1) + goose(58, 26, 0.84) + goose(64, 62, 0.78),
  sake: (p) =>
    `<path d="M26 60 Q50 54 74 60 L66 84 Q50 90 34 84 Z" fill="${p.hot}" stroke="#7a1f1c" stroke-width="1.4"/>` +
    `<ellipse cx="50" cy="60" rx="24" ry="7" fill="#f3e6c6" stroke="#7a1f1c" stroke-width="1.2"/>` +
    `<rect x="44" y="86" width="12" height="7" fill="#7a1f1c"/>` +
    `<ellipse cx="50" cy="96" rx="19" ry="5" fill="${p.hot}" stroke="#7a1f1c" stroke-width="1.2"/>` +
    `<text x="50" y="79" font-size="15" font-family="serif" fill="#f7e9b8" text-anchor="middle">壽</text>`,
  deer: (p) =>
    `<ellipse cx="54" cy="70" rx="22" ry="13" fill="#8a5a33"/>` +
    `<path d="M36 62 Q28 54 30 44 Q31 38 37 40 Q41 42 41 50 L40 60 Z" fill="#9a6a3d"/>` +
    `<path d="M34 42 Q28 32 30 24 M34 36 Q26 32 22 26 M39 40 Q44 30 42 22 M39 34 Q46 30 50 24" stroke="#6b4522" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
    `<circle cx="34" cy="48" r="1.5" fill="#241a10"/>` +
    `<path d="M42 82 L40 96 M56 84 L56 98 M70 80 L72 94" stroke="#6b4522" stroke-width="3.5" stroke-linecap="round"/>` +
    `<circle cx="50" cy="64" r="2" fill="#e8d3ab"/><circle cx="60" cy="70" r="2" fill="#e8d3ab"/><circle cx="66" cy="62" r="2" fill="#e8d3ab"/>`,
  phoenix: (p) =>
    `<path d="M46 86 Q34 78 34 62 Q34 46 50 40 Q64 35 72 44 Q78 52 70 58 L58 64 Q50 70 50 86 Z" fill="${p.hot}" stroke="#7a5510" stroke-width="1.2"/>` +
    `<circle cx="70" cy="40" r="7" fill="#f2d375" stroke="#7a5510" stroke-width="1.2"/>` +
    `<path d="M77 39 L86 42 L77 44 Z" fill="#c93c23"/>` +
    `<circle cx="71" cy="38.5" r="1.4" fill="#2b2010"/>` +
    `<path d="M68 32 q3 -8 9 -9 q-3 7 -4 10" fill="#c93c23"/>` +
    `<path d="M44 74 Q24 82 12 102 M46 80 Q30 94 24 116 M50 84 Q42 102 44 124" stroke="${p.hot}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    `<path d="M40 60 Q26 52 20 38 Q34 46 44 48 Z" fill="#f2d375"/>`,
  rainman: (p) =>
    `<path d="M20 44 Q40 20 62 44 Z" fill="#3a2c22" stroke="#20160f" stroke-width="1.4"/>` +
    `<path d="M41 44 L41 88" stroke="#5a4433" stroke-width="2.4"/>` +
    `<ellipse cx="46" cy="66" rx="9" ry="10" fill="#f0e3c8" stroke="#3a2c22" stroke-width="1.2"/>` +
    `<path d="M38 84 Q46 72 56 82 L62 116 Q46 122 32 114 Z" fill="#2f4f72" stroke="#1b3350" stroke-width="1.2"/>` +
    `<path d="M46 60 q2 4 0 7" stroke="#3a2c22" stroke-width="1.2" fill="none"/>` +
    `<circle cx="42" cy="64" r="1.2" fill="#2b2018"/><circle cx="50" cy="64" r="1.2" fill="#2b2018"/>` +
    `<path d="M62 100 L76 92" stroke="#5a4433" stroke-width="2.4" stroke-linecap="round"/>`,
  swallow: (p) =>
    `<ellipse cx="50" cy="60" rx="18" ry="10" fill="#1f2e3c" transform="rotate(-18 50 60)"/>` +
    `<circle cx="34" cy="52" r="7" fill="#26374a"/>` +
    `<path d="M27 51 L18 54 L27 56 Z" fill="#d9a63c"/>` +
    `<circle cx="33" cy="50.5" r="1.3" fill="#e9f0f5"/>` +
    `<path d="M34 58 q6 4 12 2" stroke="#c94e3c" stroke-width="2.4" fill="none"/>` +
    `<path d="M54 54 Q70 46 80 32 Q72 56 60 62 Z" fill="#2c4256"/>` +
    `<path d="M62 68 L86 82 L64 76 L80 94 Z" fill="#1f2e3c"/>`,
};

function butterflyAt(x, y, s, p) {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    `<path d="M0 0 Q-20 -18 -24 -2 Q-26 12 -4 8 Z" fill="${p.hot}" stroke="#1f3f66" stroke-width="1"/>` +
    `<path d="M0 0 Q20 -18 24 -2 Q26 12 4 8 Z" fill="${p.hot}" stroke="#1f3f66" stroke-width="1"/>` +
    `<path d="M-3 0 Q-16 10 -12 20 Q-4 22 -2 10 Z" fill="#f2d35a" stroke="#1f3f66" stroke-width="0.8"/>` +
    `<path d="M3 0 Q16 10 12 20 Q4 22 2 10 Z" fill="#f2d35a" stroke="#1f3f66" stroke-width="0.8"/>` +
    `<ellipse cx="0" cy="4" rx="2.6" ry="10" fill="#26364a"/>` +
    `<path d="M-1 -6 Q-6 -16 -12 -18 M1 -6 Q6 -16 12 -18" stroke="#26364a" stroke-width="1.2" fill="none"/>` +
    `</g>`
  );
}

function goose(x, y, s) {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    `<ellipse cx="0" cy="0" rx="12" ry="6.5" fill="#f3ead2" stroke="#2a3040" stroke-width="1"/>` +
    `<circle cx="-11" cy="-4" r="4.4" fill="#f3ead2" stroke="#2a3040" stroke-width="1"/>` +
    `<path d="M-15 -4 L-21 -3 L-15 -1 Z" fill="#d98c2c"/>` +
    `<circle cx="-11.5" cy="-5" r="1" fill="#2a3040"/>` +
    `<path d="M-2 -3 Q6 -16 18 -18 Q10 -4 4 0 Z" fill="#8a92a5" stroke="#2a3040" stroke-width="0.9"/>` +
    `<path d="M10 2 L20 4" stroke="#2a3040" stroke-width="1.6" stroke-linecap="round"/>` +
    `</g>`
  );
}

/* ------------------------------------------------------------- overlays  */

function ribbonBand(kind) {
  const spec = {
    hong: { fill: '#d8352c', edge: '#8a1f19', text: '홍단', ink: '#7a1611' },
    cho: { fill: '#d8352c', edge: '#8a1f19', text: '초단', ink: '#1d3f85' },
    cheong: { fill: '#3f5ec0', edge: '#22357a', text: '청단', ink: '#e9eeff' },
    plain: { fill: '#c9302a', edge: '#83201b', text: '', ink: '#fff' },
  }[kind];
  return (
    `<path d="M8 58 L92 44 L92 76 L8 90 Z" fill="${spec.fill}" stroke="${spec.edge}" stroke-width="1.6"/>` +
    `<path d="M8 62 L92 48 M8 86 L92 72" stroke="${spec.edge}" stroke-width="0.9" opacity="0.7"/>` +
    (spec.text
      ? `<text x="50" y="73" font-size="17" font-family="${FONT}" font-weight="700" fill="${spec.ink}" text-anchor="middle" transform="rotate(-9.5 50 73)">${spec.text}</text>`
      : '')
  );
}

function badge(c) {
  if (c.type === 'gwang') {
    return (
      `<circle cx="82" cy="18" r="12" fill="#f3c430" stroke="#8a6410" stroke-width="1.6"/>` +
      `<text x="82" y="24" font-size="14" font-family="${FONT}" font-weight="800" fill="#6b4a05" text-anchor="middle">광</text>`
    );
  }
  if (c.type === 'animal') {
    const label = c.godori ? '고' : '열';
    return (
      `<circle cx="82" cy="18" r="11" fill="${c.godori ? '#d8352c' : '#2f6fb0'}" stroke="#123" stroke-width="1.4"/>` +
      `<text x="82" y="23.5" font-size="12" font-family="${FONT}" font-weight="800" fill="#fff" text-anchor="middle">${label}</text>`
    );
  }
  if (c.type === 'junk' && c.pi === 2) {
    return (
      `<circle cx="82" cy="18" r="11" fill="#2f2f2f" stroke="#111" stroke-width="1.4"/>` +
      `<text x="82" y="23.5" font-size="12" font-family="${FONT}" font-weight="800" fill="#ffd964" text-anchor="middle">쌍</text>`
    );
  }
  return '';
}

function monthTag(c) {
  return (
    `<rect x="4" y="128" width="38" height="18" rx="5" fill="rgba(24,18,12,0.72)"/>` +
    `<text x="23" y="141.5" font-size="11.5" font-family="${FONT}" font-weight="700" fill="#f6e7c8" text-anchor="middle">${c.month}월</text>`
  );
}

/* ------------------------------------------------------------------ api  */

/** Full artwork for one card as an SVG string (100x150 viewBox, no ids). */
export function cardSVG(c) {
  const p = PAL[c.month];
  let body = BG[c.month](p);
  if (c.motif && MOTIF[c.motif]) body += MOTIF[c.motif](p);
  if (c.type === 'ribbon') body += ribbonBand(c.ribbon);
  body += badge(c) + monthTag(c);
  return `<svg class="card-art" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.month}월 ${c.name}">${body}</svg>`;
}

/** The uniform reverse used for hidden hands and the draw pile. */
export function cardBackSVG() {
  let mesh = '';
  for (let i = -6; i < 14; i++) {
    mesh += `<path d="M${i * 12} 0 L${i * 12 + 150} 150" stroke="#8a1f19" stroke-width="3" opacity="0.5"/>`;
    mesh += `<path d="M${i * 12} 150 L${i * 12 + 150} 0" stroke="#8a1f19" stroke-width="3" opacity="0.5"/>`;
  }
  return (
    `<svg class="card-art" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="뒷면">` +
    `<rect width="100" height="150" fill="#b8302a"/>${mesh}` +
    `<rect x="10" y="16" width="80" height="118" rx="8" fill="none" stroke="#f2d9a8" stroke-width="2.4"/>` +
    `<circle cx="50" cy="75" r="22" fill="#8a1f19" stroke="#f2d9a8" stroke-width="2"/>` +
    `<text x="50" y="84" font-size="24" font-family="${FONT}" font-weight="800" fill="#f2d9a8" text-anchor="middle">花</text>` +
    `</svg>`
  );
}

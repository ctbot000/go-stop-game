// Card faces.
//
// The 48 faces are real hwatu artwork, not drawings of my own: Louie Mantia's
// SVG set from Wikimedia Commons, CC BY-SA 4.0, used unmodified and shipped in
// assets/cards/ under the card ids from cards.js. See ATTRIBUTION.md.
//
// Only two things are added on top, because the artwork cannot carry them and
// the game needs them: the month number (matching is by month, so it is the
// one fact a player must read off every card) and a mark for 고도리 / 열끗 /
// 쌍피, which the real cards do not distinguish. 광 cards already carry 光.
//
// The back is drawn here — the source set has no back.

const BASE = 'assets/cards';

/** Aspect ratio of the artwork, for the CSS that boxes it. */
export const CARD_RATIO = '103.2 / 168.2';

function badge(c) {
  if (c.type === 'animal') {
    return `<span class="card-badge ${c.godori ? 'is-godori' : 'is-animal'}">${c.godori ? '고' : '열'}</span>`;
  }
  if (c.type === 'junk' && c.pi === 2) return `<span class="card-badge is-double">쌍</span>`;
  if (c.type === 'ribbon') {
    const label = { hong: '홍', cho: '초', cheong: '청', plain: '띠' }[c.ribbon];
    return `<span class="card-badge is-ribbon ribbon-${c.ribbon}">${label}</span>`;
  }
  return '';
}

/** Inner HTML of one card face: the artwork plus the two play aids. */
export function cardFace(c) {
  return (
    `<img class="card-img" src="${BASE}/${c.id}.svg" alt="" draggable="false" decoding="async">` +
    `<span class="card-month">${c.month}</span>` +
    badge(c)
  );
}

/** The uniform reverse used for hidden hands and the draw pile. */
export function cardBackSVG() {
  let mesh = '';
  for (let i = -6; i < 14; i++) {
    mesh += `<path d="M${i * 11} 0 L${i * 11 + 150} 150" stroke="#7d1811" stroke-width="3.4" opacity="0.45"/>`;
    mesh += `<path d="M${i * 11} 150 L${i * 11 + 150} 0" stroke="#7d1811" stroke-width="3.4" opacity="0.45"/>`;
  }
  return (
    `<svg class="card-art" viewBox="0 0 100 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="뒷면">` +
    `<rect width="100" height="150" fill="#b02b24"/>${mesh}` +
    `<rect x="9" y="15" width="82" height="120" rx="7" fill="none" stroke="#f2d9a8" stroke-width="2.6"/>` +
    `<rect x="13" y="19" width="74" height="112" rx="5" fill="none" stroke="#f2d9a8" stroke-width="1" opacity="0.6"/>` +
    `<circle cx="50" cy="75" r="23" fill="#7d1811" stroke="#f2d9a8" stroke-width="2.4"/>` +
    `<text x="50" y="85" font-size="26" font-family="serif" font-weight="700" fill="#f2d9a8" text-anchor="middle">花</text>` +
    `<path d="M2.5 2.5 H97.5 V147.5 H2.5 Z" fill="none" stroke="#5d100b" stroke-width="3"/>` +
    `</svg>`
  );
}

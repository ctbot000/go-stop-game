// Hwatu (화투) deck definition for Go-Stop.
//
// 48 cards: 12 months x 4 cards.
//   gwang  (광)   5 cards  — months 1, 3, 8, 11, 12
//   animal (열끗) 9 cards  — months 2, 4, 5, 6, 7, 8, 9, 10, 12
//   ribbon (띠)  10 cards  — hong 1/2/3, cho 4/5/7, cheong 6/9/10, plain 12
//   junk   (피)  24 cards  — two per month, plus the extras in 11 and 12
//
// `pi` is how many junk points the card is worth when scoring the junk pile.
// The 9월 국진 (sake cup) is the one card that may be counted either as an
// animal or as a double junk; `flexible: true` marks it and the scorer tries
// both ways.

export const MONTHS = [
  { n: 1,  name: '송학',   plant: '소나무',   season: 'winter' },
  { n: 2,  name: '매조',   plant: '매화',     season: 'winter' },
  { n: 3,  name: '벚꽃',   plant: '벚나무',   season: 'spring' },
  { n: 4,  name: '흑싸리', plant: '등나무',   season: 'spring' },
  { n: 5,  name: '난초',   plant: '창포',     season: 'spring' },
  { n: 6,  name: '모란',   plant: '모란',     season: 'summer' },
  { n: 7,  name: '홍싸리', plant: '싸리',     season: 'summer' },
  { n: 8,  name: '공산',   plant: '억새',     season: 'summer' },
  { n: 9,  name: '국화',   plant: '국화',     season: 'autumn' },
  { n: 10, name: '단풍',   plant: '단풍',     season: 'autumn' },
  { n: 11, name: '오동',   plant: '오동',     season: 'autumn' },
  { n: 12, name: '비',     plant: '버드나무', season: 'winter' },
];

export const TYPE_LABEL = {
  gwang: '광',
  animal: '열끗',
  ribbon: '띠',
  junk: '피',
};

export const RIBBON_LABEL = {
  hong: '홍단',
  cho: '초단',
  cheong: '청단',
  plain: '비띠',
};

/** Definition rows: [month, type, key, name, extra] */
const DEF = [
  // 1월 송학
  [1, 'gwang',  'gwang', '송학 광',   { motif: 'crane' }],
  [1, 'ribbon', 'tti',   '홍단',      { ribbon: 'hong' }],
  [1, 'junk',   'pi1',   '솔 피',     {}],
  [1, 'junk',   'pi2',   '솔 피',     {}],
  // 2월 매조
  [2, 'animal', 'yeol',  '매조 꾀꼬리', { motif: 'warbler', godori: true }],
  [2, 'ribbon', 'tti',   '홍단',      { ribbon: 'hong' }],
  [2, 'junk',   'pi1',   '매화 피',   {}],
  [2, 'junk',   'pi2',   '매화 피',   {}],
  // 3월 벚꽃
  [3, 'gwang',  'gwang', '벚꽃 광',   { motif: 'curtain' }],
  [3, 'ribbon', 'tti',   '홍단',      { ribbon: 'hong' }],
  [3, 'junk',   'pi1',   '벚꽃 피',   {}],
  [3, 'junk',   'pi2',   '벚꽃 피',   {}],
  // 4월 흑싸리
  [4, 'animal', 'yeol',  '흑싸리 두견', { motif: 'cuckoo', godori: true }],
  [4, 'ribbon', 'tti',   '초단',      { ribbon: 'cho' }],
  [4, 'junk',   'pi1',   '등나무 피', {}],
  [4, 'junk',   'pi2',   '등나무 피', {}],
  // 5월 난초
  [5, 'animal', 'yeol',  '난초 다리', { motif: 'bridge' }],
  [5, 'ribbon', 'tti',   '초단',      { ribbon: 'cho' }],
  [5, 'junk',   'pi1',   '창포 피',   {}],
  [5, 'junk',   'pi2',   '창포 피',   {}],
  // 6월 모란
  [6, 'animal', 'yeol',  '모란 나비', { motif: 'butterfly' }],
  [6, 'ribbon', 'tti',   '청단',      { ribbon: 'cheong' }],
  [6, 'junk',   'pi1',   '모란 피',   {}],
  [6, 'junk',   'pi2',   '모란 피',   {}],
  // 7월 홍싸리
  [7, 'animal', 'yeol',  '홍싸리 멧돼지', { motif: 'boar' }],
  [7, 'ribbon', 'tti',   '초단',      { ribbon: 'cho' }],
  [7, 'junk',   'pi1',   '싸리 피',   {}],
  [7, 'junk',   'pi2',   '싸리 피',   {}],
  // 8월 공산
  [8, 'gwang',  'gwang', '공산 명월', { motif: 'moon' }],
  [8, 'animal', 'yeol',  '공산 기러기', { motif: 'geese', godori: true }],
  [8, 'junk',   'pi1',   '억새 피',   {}],
  [8, 'junk',   'pi2',   '억새 피',   {}],
  // 9월 국화
  [9, 'animal', 'yeol',  '국진',      { motif: 'sake', flexible: true }],
  [9, 'ribbon', 'tti',   '청단',      { ribbon: 'cheong' }],
  [9, 'junk',   'pi1',   '국화 피',   {}],
  [9, 'junk',   'pi2',   '국화 피',   {}],
  // 10월 단풍
  [10, 'animal', 'yeol', '단풍 사슴', { motif: 'deer' }],
  [10, 'ribbon', 'tti',  '청단',      { ribbon: 'cheong' }],
  [10, 'junk',   'pi1',  '단풍 피',   {}],
  [10, 'junk',   'pi2',  '단풍 피',   {}],
  // 11월 오동
  [11, 'gwang',  'gwang', '오동 봉황', { motif: 'phoenix' }],
  [11, 'junk',   'ssang', '오동 쌍피', { pi: 2 }],
  [11, 'junk',   'pi1',   '오동 피',   {}],
  [11, 'junk',   'pi2',   '오동 피',   {}],
  // 12월 비
  [12, 'gwang',  'gwang', '비광',     { motif: 'rainman', rain: true }],
  [12, 'animal', 'yeol',  '비 제비',  { motif: 'swallow' }],
  [12, 'ribbon', 'tti',   '비띠',     { ribbon: 'plain' }],
  [12, 'junk',   'ssang', '비 쌍피',  { pi: 2 }],
];

function build() {
  return DEF.map(([month, type, key, name, extra]) => ({
    id: `m${String(month).padStart(2, '0')}-${key}`,
    month,
    type,
    name,
    monthName: MONTHS[month - 1].name,
    ribbon: extra.ribbon || null,
    motif: extra.motif || null,
    godori: !!extra.godori,
    rain: !!extra.rain,
    flexible: !!extra.flexible,
    pi: type === 'junk' ? (extra.pi || 1) : 0,
  }));
}

export const DECK = build();

const BY_ID = new Map(DECK.map((c) => [c.id, c]));

/** Look up a card object from its id. Throws on an unknown id. */
export function card(id) {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`unknown card id: ${id}`);
  return c;
}

export const ALL_IDS = DECK.map((c) => c.id);

/** Sort key that groups a captured pile the way a player lays it out. */
const TYPE_ORDER = { gwang: 0, animal: 1, ribbon: 2, junk: 3 };
export function pileSort(a, b) {
  const ca = card(a);
  const cb = card(b);
  if (TYPE_ORDER[ca.type] !== TYPE_ORDER[cb.type]) return TYPE_ORDER[ca.type] - TYPE_ORDER[cb.type];
  if (ca.month !== cb.month) return ca.month - cb.month;
  return ca.id < cb.id ? -1 : 1;
}

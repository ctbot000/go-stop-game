// Go-Stop (고스톱) rules engine — two player 맞고.
//
// Pure and deterministic: the only randomness is a seeded PRNG stored on the
// state, so a seed replays a whole game. The engine mutates the state object
// it is given and returns the list of events produced, which is what the UI
// animates. Nothing in here touches the DOM.

import { DECK, ALL_IDS, card } from './cards.js';

export const WIN_SCORE = 7;
export const HAND_SIZE = 10;
export const TABLE_SIZE = 8;

/* ------------------------------------------------------------------ rng  */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(ids, rng) {
  const a = ids.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* -------------------------------------------------------------- scoring  */

const GODORI = ['m02-yeol', 'm04-yeol', 'm08-yeol'];
const HONGDAN = ['m01-tti', 'm02-tti', 'm03-tti'];
const CHODAN = ['m04-tti', 'm05-tti', 'm07-tti'];
const CHEONGDAN = ['m06-tti', 'm09-tti', 'm10-tti'];
const KUKJIN = 'm09-yeol';

const has = (set, ids) => ids.every((id) => set.has(id));

function scoreOnce(ids, kukjinAsJunk) {
  const set = new Set(ids);
  const cards = ids.map(card);

  const gwang = cards.filter((c) => c.type === 'gwang');
  const animals = cards.filter((c) => c.type === 'animal' && !(kukjinAsJunk && c.id === KUKJIN));
  const ribbons = cards.filter((c) => c.type === 'ribbon');
  let junkValue = cards.filter((c) => c.type === 'junk').reduce((n, c) => n + c.pi, 0);
  if (kukjinAsJunk && set.has(KUKJIN)) junkValue += 2;

  const parts = [];
  let total = 0;

  // 광: 5광 15, 4광 4, 3광 3 (2 when the rain bright is one of them).
  let gwangPts = 0;
  if (gwang.length === 5) gwangPts = 15;
  else if (gwang.length === 4) gwangPts = 4;
  else if (gwang.length === 3) gwangPts = gwang.some((c) => c.rain) ? 2 : 3;
  if (gwangPts) {
    parts.push({ key: 'gwang', label: `${gwang.length}광`, points: gwangPts });
    total += gwangPts;
  }

  // 열끗: 5장부터 한 장당 1점, 고도리 5점.
  if (animals.length >= 5) {
    const p = animals.length - 4;
    parts.push({ key: 'animal', label: `열끗 ${animals.length}장`, points: p });
    total += p;
  }
  if (has(set, GODORI)) {
    parts.push({ key: 'godori', label: '고도리', points: 5 });
    total += 5;
  }

  // 띠: 5장부터 한 장당 1점, 단 세 종류 각 3점.
  if (ribbons.length >= 5) {
    const p = ribbons.length - 4;
    parts.push({ key: 'ribbon', label: `띠 ${ribbons.length}장`, points: p });
    total += p;
  }
  if (has(set, HONGDAN)) { parts.push({ key: 'hongdan', label: '홍단', points: 3 }); total += 3; }
  if (has(set, CHODAN)) { parts.push({ key: 'chodan', label: '초단', points: 3 }); total += 3; }
  if (has(set, CHEONGDAN)) { parts.push({ key: 'cheongdan', label: '청단', points: 3 }); total += 3; }

  // 피: 10점부터 1점씩.
  if (junkValue >= 10) {
    const p = junkValue - 9;
    parts.push({ key: 'junk', label: `피 ${junkValue}장`, points: p });
    total += p;
  }

  return {
    total,
    parts,
    gwangCount: gwang.length,
    gwangPts,
    animalCount: animals.length,
    ribbonCount: ribbons.length,
    junkValue,
    kukjinAsJunk,
  };
}

/**
 * Score a captured pile. 국진 (9월 열끗) may count either as an animal or as a
 * double junk, so both readings are tried and the better one is returned.
 */
export function scorePile(ids) {
  const asAnimal = scoreOnce(ids, false);
  if (!ids.includes(KUKJIN)) return asAnimal;
  const asJunk = scoreOnce(ids, true);
  return asJunk.total > asAnimal.total ? asJunk : asAnimal;
}

/** Junk value of a pile as the 피박 check reads it (국진 counted as junk). */
export function junkValueOf(ids) {
  let v = ids.map(card).filter((c) => c.type === 'junk').reduce((n, c) => n + c.pi, 0);
  if (ids.includes(KUKJIN)) v += 2;
  return v;
}

/**
 * Apply the go bonus and every doubling to a winner's raw score.
 * Returns { final, base, goBonus, multipliers:[{label,factor}] }.
 */
export function settleScore({ winnerPile, loserPile, goCount, loserGoCount, shakes }) {
  const w = scorePile(winnerPile);
  const l = scorePile(loserPile);

  let value = w.total + Math.min(goCount, 2);
  const goBonus = Math.min(goCount, 2);
  const multipliers = [];

  if (goCount >= 3) {
    const factor = 2 ** (goCount - 2);
    multipliers.push({ label: `${goCount}고`, factor });
  }
  if (shakes > 0) multipliers.push({ label: shakes > 1 ? `흔들기 x${shakes}` : '흔들기', factor: 2 ** shakes });

  const loserJunk = junkValueOf(loserPile);
  const loserAnimals = l.animalCount;
  const loserGwang = l.gwangCount;

  if (w.junkValue >= 10 && loserJunk < 7) multipliers.push({ label: '피박', factor: 2 });
  if (w.gwangPts > 0 && loserGwang === 0) multipliers.push({ label: '광박', factor: 2 });
  if (w.animalCount >= 7 && loserAnimals === 0) multipliers.push({ label: '멍박', factor: 2 });
  if (loserGoCount > 0) multipliers.push({ label: '고박', factor: 2 });

  const final = multipliers.reduce((n, m) => n * m.factor, value);
  return { final, base: w.total, goBonus, multipliers, winnerScore: w, loserScore: l };
}

/* ----------------------------------------------------------- game setup  */

function emptyTurnCtx(player) {
  return {
    player,
    handCards: [],
    handCaptured: [],
    handLeftOnTable: [],
    flipCard: null,
    flipCaptured: [],
    flipLeftOnTable: null,
    bonusPi: 0,
    bonusReasons: [],
    ppeokMonth: null,
    bomb: false,
    extraTurn: false,
  };
}

/**
 * Deal a fresh game. `seed` makes it reproducible; omit it for a random one.
 * Redeals while the floor shows four of a kind, and reports 총통 (four of a
 * kind dealt to one hand) as an immediate win.
 */
export function createGame({ seed, names = ['나', 'AI'], startPlayer } = {}) {
  const s0 = seed === undefined ? (Math.random() * 2 ** 32) >>> 0 : seed >>> 0;
  const rng = mulberry32(s0);

  let deck, hands, table;
  for (let attempt = 0; ; attempt++) {
    const all = shuffle(ALL_IDS, rng);
    hands = [all.slice(0, HAND_SIZE), all.slice(HAND_SIZE, HAND_SIZE * 2)];
    table = all.slice(HAND_SIZE * 2, HAND_SIZE * 2 + TABLE_SIZE);
    deck = all.slice(HAND_SIZE * 2 + TABLE_SIZE);
    if (!fourOfAKind(table) || attempt > 40) break;
  }

  const state = {
    seed: s0,
    rng,
    names,
    deck,
    table,
    hands,
    captured: [[], []],
    turn: startPlayer === undefined ? Math.floor(rng() * 2) : startPlayer,
    phase: 'play',
    pending: null,
    go: [0, 0],
    shakes: [0, 0],
    shakenMonths: [[], []],
    ppeokMonths: {},
    goScoreAt: [0, 0],
    ctx: null,
    lastTurn: null,
    log: [],
    result: null,
    turnCount: 0,
  };

  for (const p of [0, 1]) {
    const m = fourOfAKind(state.hands[p]);
    if (m) {
      state.phase = 'over';
      state.result = {
        kind: 'chongtong',
        winner: p,
        month: m,
        points: 10,
        text: `${names[p]} 총통 (${m}월) — 즉시 승리 10점`,
      };
      pushLog(state, `${names[p]}: ${m}월 총통! 즉시 승리.`);
      return state;
    }
  }

  pushLog(state, `게임 시작 — ${names[state.turn]} 선.`);
  return state;
}

function fourOfAKind(ids) {
  const count = {};
  for (const id of ids) {
    const m = card(id).month;
    count[m] = (count[m] || 0) + 1;
    if (count[m] === 4) return m;
  }
  return null;
}

function pushLog(state, text, tone = 'info') {
  state.log.push({ text, tone, turn: state.turnCount });
  if (state.log.length > 200) state.log.shift();
}

/* ---------------------------------------------------------- action apis  */

const monthMatches = (state, month) => state.table.filter((id) => card(id).month === month);

/** Months the current player may declare a 폭탄 on (3 in hand + 1 on floor). */
export function bombMonths(state) {
  const p = state.turn;
  const counts = {};
  for (const id of state.hands[p]) {
    const m = card(id).month;
    counts[m] = (counts[m] || 0) + 1;
  }
  return Object.keys(counts)
    .map(Number)
    .filter((m) => counts[m] >= 3 && monthMatches(state, m).length === 1);
}

/** Months the current player may declare a 흔들기 on (3 in hand, floor clear). */
export function shakeMonths(state) {
  const p = state.turn;
  const counts = {};
  for (const id of state.hands[p]) {
    const m = card(id).month;
    counts[m] = (counts[m] || 0) + 1;
  }
  return Object.keys(counts)
    .map(Number)
    .filter(
      (m) =>
        counts[m] >= 3 && monthMatches(state, m).length === 0 && !state.shakenMonths[p].includes(m),
    );
}

/**
 * Options offered before a card is actually played. Returns null when the card
 * is an ordinary play; otherwise { month, cardId, options }.
 */
export function specialOffer(state, cardId) {
  const m = card(cardId).month;
  const opts = [];
  if (bombMonths(state).includes(m)) opts.push('bomb');
  if (shakeMonths(state).includes(m)) opts.push('shake');
  return opts.length ? { month: m, cardId, options: [...opts, 'plain'] } : null;
}

/**
 * Play a card from the current player's hand.
 * `mode` is 'plain' | 'shake' | 'bomb'.
 */
export function playCard(state, cardId, mode = 'plain') {
  requirePhase(state, 'play');
  const p = state.turn;
  if (!state.hands[p].includes(cardId)) throw new Error(`${cardId} not in hand`);

  const ctx = emptyTurnCtx(p);
  state.ctx = ctx;
  state.turnCount++;
  const month = card(cardId).month;

  if (mode === 'shake') {
    if (!shakeMonths(state).includes(month)) throw new Error('shake not available');
    state.shakes[p]++;
    state.shakenMonths[p].push(month);
    pushLog(state, `${state.names[p]}: ${month}월 흔들기! 최종 점수 2배.`, 'big');
  }

  if (mode === 'bomb') {
    if (!bombMonths(state).includes(month)) throw new Error('bomb not available');
    const bombCards = state.hands[p].filter((id) => card(id).month === month).slice(0, 3);
    for (const id of bombCards) removeFrom(state.hands[p], id);
    const floor = monthMatches(state, month);
    for (const id of floor) removeFrom(state.table, id);
    ctx.handCards = bombCards;
    ctx.handCaptured = [...bombCards, ...floor];
    ctx.bomb = true;
    ctx.extraTurn = true;
    ctx.bonusPi += 1;
    ctx.bonusReasons.push('폭탄');
    pushLog(state, `${state.names[p]}: ${month}월 폭탄! ${ctx.handCaptured.length}장 획득, 한 번 더.`, 'big');
    return flipStage(state);
  }

  removeFrom(state.hands[p], cardId);
  ctx.handCards = [cardId];
  const matches = monthMatches(state, month);

  if (matches.length === 0) {
    state.table.push(cardId);
    ctx.handLeftOnTable = [cardId];
    pushLog(state, `${state.names[p]}: ${label(cardId)} 냄.`);
    return flipStage(state);
  }
  if (matches.length === 1) {
    removeFrom(state.table, matches[0]);
    ctx.handCaptured = [cardId, matches[0]];
    pushLog(state, `${state.names[p]}: ${label(cardId)}(으)로 ${label(matches[0])} 먹음.`);
    return flipStage(state);
  }
  if (matches.length === 3) {
    for (const id of matches) removeFrom(state.table, id);
    ctx.handCaptured = [cardId, ...matches];
    sweepBonus(state, ctx, month);
    return flipStage(state);
  }

  // Two candidates on the floor — the player picks which one to take.
  state.phase = 'awaitMatch';
  state.pending = { kind: 'match', source: 'hand', cardId, options: matches };
  return { events: [{ type: 'awaitMatch', cardId, options: matches }] };
}

/** Resolve an `awaitMatch` / `awaitFlipMatch` prompt. */
export function chooseMatch(state, tableCardId) {
  if (state.phase !== 'awaitMatch' && state.phase !== 'awaitFlipMatch') {
    throw new Error(`no match pending (phase=${state.phase})`);
  }
  const { source, cardId, options } = state.pending;
  if (!options.includes(tableCardId)) throw new Error('illegal match choice');
  const ctx = state.ctx;
  removeFrom(state.table, tableCardId);
  state.pending = null;

  if (source === 'hand') {
    ctx.handCaptured = [cardId, tableCardId];
    pushLog(state, `${state.names[ctx.player]}: ${label(cardId)}(으)로 ${label(tableCardId)} 먹음.`);
    state.phase = 'play';
    return flipStage(state);
  }
  ctx.flipCaptured = [cardId, tableCardId];
  pushLog(state, `${state.names[ctx.player]}: 뒤집은 ${label(cardId)}(으)로 ${label(tableCardId)} 먹음.`);
  state.phase = 'play';
  return settleTurn(state);
}

/* ------------------------------------------------------------ the flip  */

function flipStage(state) {
  const ctx = state.ctx;
  if (state.deck.length === 0) return settleTurn(state);

  const flip = state.deck.shift();
  ctx.flipCard = flip;
  const month = card(flip).month;
  const matches = monthMatches(state, month);

  // 뻑: the hand card took a pair and the flip is the same month. Everything
  // of that month goes back on the floor and nobody scores it this turn.
  const handMonth = ctx.handCards.length === 1 ? card(ctx.handCards[0]).month : null;
  if (!ctx.bomb && handMonth === month && ctx.handCaptured.length === 2) {
    state.table.push(...ctx.handCaptured, flip);
    ctx.handCaptured = [];
    ctx.ppeokMonth = month;
    state.ppeokMonths[month] = ctx.player;
    pushLog(state, `${state.names[ctx.player]}: 뻑! ${month}월 석 장이 바닥에 남음.`, 'bad');
    return settleTurn(state);
  }

  if (matches.length === 0) {
    state.table.push(flip);
    ctx.flipLeftOnTable = flip;
    pushLog(state, `뒤집기: ${label(flip)} — 바닥에 놓임.`);
    return settleTurn(state);
  }
  if (matches.length === 1) {
    removeFrom(state.table, matches[0]);
    ctx.flipCaptured = [flip, matches[0]];
    // 쪽: the flip pairs with the very card just laid down unmatched.
    if (ctx.handLeftOnTable.includes(matches[0])) {
      ctx.bonusPi += 1;
      ctx.bonusReasons.push('쪽');
      pushLog(state, `${state.names[ctx.player]}: 쪽! 상대 피 1장.`, 'good');
    } else {
      pushLog(state, `뒤집기: ${label(flip)}(으)로 ${label(matches[0])} 먹음.`);
    }
    return settleTurn(state);
  }
  if (matches.length === 3) {
    for (const id of matches) removeFrom(state.table, id);
    ctx.flipCaptured = [flip, ...matches];
    sweepBonus(state, ctx, month);
    return settleTurn(state);
  }

  state.phase = 'awaitFlipMatch';
  state.pending = { kind: 'match', source: 'flip', cardId: flip, options: matches };
  return { events: [{ type: 'awaitFlipMatch', cardId: flip, options: matches }] };
}

function sweepBonus(state, ctx, month) {
  ctx.bonusPi += 1;
  const wasPpeok = state.ppeokMonths[month] !== undefined;
  ctx.bonusReasons.push(wasPpeok ? '뻑 회수' : '쓸');
  delete state.ppeokMonths[month];
  pushLog(
    state,
    `${state.names[ctx.player]}: ${month}월 넉 장 쓸어담음${wasPpeok ? ' (뻑 회수)' : ''}! 상대 피 1장.`,
    'good',
  );
}

/* ---------------------------------------------------------- turn settle  */

function settleTurn(state) {
  const ctx = state.ctx;
  const p = ctx.player;
  const opp = 1 - p;
  const events = [];

  // 따닥: a pair taken with the hand card and another pair with the flip.
  if (ctx.handCaptured.length === 2 && ctx.flipCaptured.length === 2) {
    ctx.bonusPi += 1;
    ctx.bonusReasons.push('따닥');
    pushLog(state, `${state.names[p]}: 따닥! 상대 피 1장.`, 'good');
  }

  const won = [...ctx.handCaptured, ...ctx.flipCaptured];
  state.captured[p].push(...won);

  // 싹쓸이: the floor is bare and this player is the one who cleared it.
  if (state.table.length === 0 && won.length > 0) {
    ctx.bonusPi += 1;
    ctx.bonusReasons.push('싹쓸이');
    pushLog(state, `${state.names[p]}: 싹쓸이! 상대 피 1장.`, 'good');
  }

  const stolen = [];
  for (let i = 0; i < ctx.bonusPi; i++) {
    const id = takeJunkFrom(state, opp);
    if (!id) break;
    state.captured[p].push(id);
    stolen.push(id);
  }
  if (stolen.length) events.push({ type: 'steal', from: opp, to: p, cards: stolen });
  if (ctx.bonusPi > 0 && stolen.length === 0) {
    pushLog(state, `${state.names[opp]}에게 가져올 피가 없음.`);
  }

  state.lastTurn = ctx; // the UI replays this to animate the turn
  state.ctx = null;

  const score = scorePile(state.captured[p]);
  const canDeclare = score.total >= WIN_SCORE && score.total > state.goScoreAt[p];

  if (canDeclare) {
    state.phase = 'awaitGoStop';
    state.pending = { kind: 'gostop', player: p, score: score.total, extraTurn: ctx.extraTurn };
    events.push({ type: 'awaitGoStop', player: p, score: score.total });
    return { events };
  }

  return { events: [...events, ...endTurn(state, ctx.extraTurn)] };
}

function takeJunkFrom(state, player) {
  const pile = state.captured[player];
  const single = pile.find((id) => card(id).type === 'junk' && card(id).pi === 1);
  const pick = single || pile.find((id) => card(id).type === 'junk');
  if (!pick) return null;
  removeFrom(pile, pick);
  return pick;
}

/** Answer a go/stop prompt. `choice` is 'go' or 'stop'. */
export function chooseGoStop(state, choice) {
  requirePhase(state, 'awaitGoStop');
  const { player, score, extraTurn } = state.pending;
  state.pending = null;
  state.phase = 'play';

  if (choice === 'stop') {
    return { events: finishGame(state, player, 'stop') };
  }

  state.go[player]++;
  state.goScoreAt[player] = score;
  pushLog(state, `${state.names[player]}: ${state.go[player]}고! (${score}점에서)`, 'big');
  return { events: [{ type: 'go', player, count: state.go[player] }, ...endTurn(state, extraTurn)] };
}

function endTurn(state, extraTurn) {
  if (state.hands[0].length === 0 && state.hands[1].length === 0) {
    return finishGame(state, null, 'nagari');
  }
  if (!extraTurn) state.turn = 1 - state.turn;
  // A bomb spends three cards at once, so one hand can empty first. The other
  // side simply plays on alone until it is out too.
  if (state.hands[state.turn].length === 0) state.turn = 1 - state.turn;
  state.phase = 'play';
  return [{ type: 'turn', player: state.turn, extra: !!extraTurn }];
}

function finishGame(state, winner, kind) {
  state.phase = 'over';
  if (winner === null) {
    state.result = { kind: 'nagari', winner: null, points: 0, text: '나가리 — 무승부' };
    pushLog(state, '양쪽 패가 모두 떨어졌습니다. 나가리!', 'big');
    return [{ type: 'over', result: state.result }];
  }
  const loser = 1 - winner;
  const settled = settleScore({
    winnerPile: state.captured[winner],
    loserPile: state.captured[loser],
    goCount: state.go[winner],
    loserGoCount: state.go[loser],
    shakes: state.shakes[winner],
  });
  state.result = {
    kind,
    winner,
    points: settled.final,
    detail: settled,
    text: `${state.names[winner]} 승 — ${settled.final}점`,
  };
  pushLog(state, `${state.names[winner]}: 스톱! ${settled.final}점으로 승리.`, 'big');
  return [{ type: 'over', result: state.result }];
}

/* ----------------------------------------------------------- utilities  */

function removeFrom(arr, id) {
  const i = arr.indexOf(id);
  if (i < 0) throw new Error(`${id} not found`);
  arr.splice(i, 1);
  return arr;
}

function requirePhase(state, phase) {
  if (state.phase !== phase) throw new Error(`expected phase ${phase}, got ${state.phase}`);
}

const label = (id) => {
  const c = card(id);
  return `${c.month}월 ${c.name}`;
};

/**
 * Every card id the state is currently holding, including the ones in flight
 * while a choice is pending. Used by the tests to prove nothing is dropped.
 */
export function auditCards(state) {
  const ids = [
    ...state.deck,
    ...state.table,
    ...state.hands[0],
    ...state.hands[1],
    ...state.captured[0],
    ...state.captured[1],
  ];
  if (state.ctx) ids.push(...state.ctx.handCaptured, ...state.ctx.flipCaptured);
  if (state.pending && state.pending.kind === 'match') ids.push(state.pending.cardId);
  return ids;
}

/** Read-only snapshot of what each side is worth right now. */
export function liveScores(state) {
  return [scorePile(state.captured[0]), scorePile(state.captured[1])];
}

export { card, DECK };

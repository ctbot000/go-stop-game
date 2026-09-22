// Opponent for the Go-Stop engine.
//
// Every decision is scored the same way: what the move is worth to me minus
// what it hands the opponent. "Worth" is the real marginal score from
// scorePile, so the AI understands 고도리, 단 sets and the junk threshold
// without any of them being spelled out as special cases.
//
// Nothing here reads the opponent's hand or the deck order.

import { card } from './cards.js';
import { scorePile, bombMonths, shakeMonths } from './engine.js';

// Risk tolerance at a go/stop prompt. Swept head to head over 5000 seeded
// games: anything above ~1.6 calls 고 too often and gives points back.
// The levels differ mainly in how much noise is added to the card choice.
const AGGRESSION = { easy: 1.0, normal: 1.6, hard: 1.6 };

const MATERIAL = { gwang: 9, animal: 4, ribbon: 3.6, junk: 1.5 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function material(ids) {
  return ids.reduce((n, id) => {
    const c = card(id);
    return n + (c.type === 'junk' ? MATERIAL.junk * c.pi : MATERIAL[c.type]);
  }, 0);
}

/** Marginal score of adding `adding` to `pile`. */
function gain(pile, adding) {
  if (!adding.length) return 0;
  return scorePile([...pile, ...adding]).total - scorePile(pile).total;
}

/**
 * Cards of `month` not yet visible to `player`, and the chance the opponent is
 * holding at least one of them.
 */
function exposure(state, player, month) {
  const seen = [...state.hands[player], ...state.table, ...state.captured[0], ...state.captured[1]];
  const known = seen.filter((id) => card(id).month === month).length;
  const outstanding = Math.max(0, 4 - known);
  const hidden = state.deck.length + state.hands[1 - player].length;
  if (hidden <= 0 || outstanding === 0) return 0;
  const perCard = state.hands[1 - player].length / hidden;
  return clamp(1 - (1 - perCard) ** outstanding, 0, 1);
}

/** What one card left face-up on the floor is likely to cost. */
function exposureCost(state, player, ids) {
  if (!ids.length) return 0;
  const opp = 1 - player;
  let cost = 0;
  for (const id of ids) {
    const p = exposure(state, player, card(id).month);
    const oppGain = gain(state.captured[opp], [id]);
    cost += p * (material([id]) * 0.9 + oppGain * 3.2);
  }
  return cost;
}

/** Chance the flip turns a clean pair into a 뻑. */
function ppeokRisk(state, player, month) {
  const seen = [...state.hands[player], ...state.table, ...state.captured[0], ...state.captured[1]];
  const known = seen.filter((id) => card(id).month === month).length;
  const outstanding = Math.max(0, 4 - known);
  return state.deck.length > 0 ? outstanding / Math.max(1, state.deck.length + state.hands[1 - player].length) : 0;
}

/** Score one candidate ordinary play. Higher is better. */
function evaluatePlay(state, player, cardId) {
  const month = card(cardId).month;
  const matches = state.table.filter((id) => card(id).month === month);
  const mine = state.captured[player];

  let captured = [];
  let exposed = [];
  let note = '';

  if (matches.length === 0) {
    exposed = [cardId];
    note = 'discard';
  } else if (matches.length === 1) {
    captured = [cardId, matches[0]];
    note = 'pair';
  } else if (matches.length === 2) {
    const best = bestOf(matches, (id) => gain(mine, [id]) * 3 + material([id]));
    captured = [cardId, best];
    note = 'pick';
  } else {
    captured = [cardId, ...matches];
    note = 'sweep';
  }

  let v = gain(mine, captured) * 3.4 + material(captured) * 0.85;

  if (note === 'sweep') v += 4; // the stolen junk plus denying three cards
  if (matches.length > 0 && state.table.length - matches.length === 0) v += 2.5; // 싹쓸이 chance
  if (note === 'pair') v -= ppeokRisk(state, player, month) * (material(captured) * 0.8 + 2);
  v -= exposureCost(state, player, exposed);

  // Holding a bright or a set card back is usually worse than playing it into
  // a capture, but throwing one away unmatched is the classic blunder.
  if (note === 'discard') {
    const c = card(cardId);
    if (c.type === 'gwang') v -= 9;
    else if (c.godori) v -= 5;
    else if (c.type === 'ribbon') v -= 2.4;
    else if (c.pi === 2) v -= 2.2;
    // A month already fully accounted for cannot be paired by anyone.
    if (exposure(state, player, month) === 0) v += 2.2;
  }

  return v;
}

function bestOf(items, score) {
  let best = items[0];
  let bestV = -Infinity;
  for (const it of items) {
    const v = score(it);
    if (v > bestV) {
      bestV = v;
      best = it;
    }
  }
  return best;
}

/** Pick the card (and mode) the AI plays this turn. */
export function chooseAIPlay(state) {
  const player = state.turn;
  const hand = state.hands[player];
  if (!hand.length) throw new Error('AI has no cards');

  const level = state.aiLevel || 'normal';
  const scored = hand.map((cardId) => ({ cardId, mode: 'plain', v: evaluatePlay(state, player, cardId) }));

  // 폭탄 is four cards plus a stolen junk plus another turn: take it.
  for (const m of bombMonths(state)) {
    const cardId = hand.find((id) => card(id).month === m);
    const floor = state.table.filter((id) => card(id).month === m);
    const v =
      gain(state.captured[player], [...hand.filter((id) => card(id).month === m).slice(0, 3), ...floor]) * 3.4 +
      material(floor) * 0.85 +
      9;
    scored.push({ cardId, mode: 'bomb', v });
  }

  // 흔들기 doubles the payout but announces the hand; worth it when ahead.
  const myScore = scorePile(state.captured[player]).total;
  const oppScore = scorePile(state.captured[1 - player]).total;
  for (const m of shakeMonths(state)) {
    const cardId = hand.find((id) => card(id).month === m);
    const base = evaluatePlay(state, player, cardId);
    const worth = myScore + 2 >= oppScore && state.hands[player].length >= 4 ? 3.5 : -1.5;
    scored.push({ cardId, mode: 'shake', v: base + worth });
  }

  if (level === 'easy') {
    for (const s of scored) s.v += (state.rng() - 0.5) * 9;
  } else if (level === 'normal') {
    for (const s of scored) s.v += (state.rng() - 0.5) * 2;
  }

  return bestOf(scored, (s) => s.v);
}

/** Pick which of two floor cards to take. */
export function chooseAIMatch(state) {
  const player = state.ctx ? state.ctx.player : state.turn;
  const { options } = state.pending;
  const mine = state.captured[player];
  const opp = state.captured[1 - player];
  return bestOf(options, (id) => gain(mine, [id]) * 3.4 + material([id]) + gain(opp, [id]) * 1.2);
}

/** Decide 고 or 스톱 at a go/stop prompt. */
export function chooseAIGoStop(state) {
  const { player, score } = state.pending;
  const cardsLeft = state.hands[player].length;
  const oppCardsLeft = state.hands[1 - player].length;
  const oppScore = scorePile(state.captured[1 - player]).total;
  const goCount = state.go[player];
  const aggression = AGGRESSION[state.aiLevel] ?? AGGRESSION.normal;

  // Nothing left to play for, and nothing left to draw from.
  if (cardsLeft === 0 || (oppCardsLeft === 0 && cardsLeft <= 1)) return 'stop';

  // How likely the opponent is to reach seven before the hand runs out. Both
  // the gap they have to close and the cards left to close it in matter.
  const gap = Math.max(0, 7 - oppScore);
  const room = Math.min(cardsLeft, oppCardsLeft) / 9;
  const pOppWins = clamp(0.08 + 0.62 * room * (1 - gap / 11) - 0.03 * goCount, 0.02, 0.72);

  // Stopping now pays this.
  const stopValue = score + Math.min(goCount, 2);

  // Going pays more than one extra point: the extra captures are what turn
  // 피박 / 광박 on, and those double.
  const upside = 1.3 + cardsLeft * 0.42;
  const nextGo = goCount + 1;
  let goValue = score + upside + Math.min(nextGo, 2);
  if (nextGo >= 3) goValue *= 2 ** (nextGo - 2);
  goValue *= 1 + Math.min(cardsLeft, 6) * 0.05; // chance of picking up a 박

  // Losing after a go costs double (고박).
  const lossValue = Math.max(7, oppScore + 3) * 2;

  // `aggression` is risk tolerance: it discounts the downside, it does not
  // inflate the upside, so a genuinely losing go stays a stop at every level.
  const expected = (1 - pOppWins) * goValue - (pOppWins * lossValue) / aggression;
  const noise = state.aiLevel === 'easy' ? (state.rng() - 0.5) * 8 : 0;
  return expected + noise > stopValue ? 'go' : 'stop';
}


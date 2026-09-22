import test from 'node:test';
import assert from 'node:assert/strict';

import { DECK, ALL_IDS, card } from '../js/cards.js';
import {
  createGame,
  playCard,
  chooseMatch,
  chooseGoStop,
  scorePile,
  settleScore,
  junkValueOf,
  auditCards,
  bombMonths,
  shakeMonths,
  specialOffer,
  mulberry32,
} from '../js/engine.js';
import { chooseAIPlay, chooseAIMatch, chooseAIGoStop } from '../js/ai.js';
import { cardSVG, cardBackSVG } from '../js/art.js';

/* ------------------------------------------------------------------ deck */

test('deck is the standard 48 hwatu cards', () => {
  assert.equal(DECK.length, 48);
  assert.equal(new Set(ALL_IDS).size, 48);
  for (let m = 1; m <= 12; m++) {
    assert.equal(DECK.filter((c) => c.month === m).length, 4, `month ${m}`);
  }
  assert.equal(DECK.filter((c) => c.type === 'gwang').length, 5);
  assert.equal(DECK.filter((c) => c.type === 'animal').length, 9);
  assert.equal(DECK.filter((c) => c.type === 'ribbon').length, 10);
  assert.equal(DECK.filter((c) => c.type === 'junk').length, 24);
  assert.equal(DECK.filter((c) => c.type === 'junk').reduce((n, c) => n + c.pi, 0), 26);
  assert.deepEqual(
    DECK.filter((c) => c.godori).map((c) => c.month),
    [2, 4, 8],
  );
  assert.deepEqual(
    DECK.filter((c) => c.ribbon === 'hong').map((c) => c.month),
    [1, 2, 3],
  );
  assert.deepEqual(
    DECK.filter((c) => c.ribbon === 'cho').map((c) => c.month),
    [4, 5, 7],
  );
  assert.deepEqual(
    DECK.filter((c) => c.ribbon === 'cheong').map((c) => c.month),
    [6, 9, 10],
  );
});

test('every card renders to svg markup', () => {
  for (const c of DECK) {
    const svg = cardSVG(c);
    assert.match(svg, /^<svg /);
    assert.match(svg, /<\/svg>$/);
    assert.ok(!svg.includes('NaN'), `${c.id} produced NaN`);
    assert.ok(!svg.includes('undefined'), `${c.id} produced undefined`);
  }
  assert.match(cardBackSVG(), /^<svg /);
});

/* --------------------------------------------------------------- scoring */

const G = (m) => `m${String(m).padStart(2, '0')}-gwang`;
const Y = (m) => `m${String(m).padStart(2, '0')}-yeol`;
const T = (m) => `m${String(m).padStart(2, '0')}-tti`;
const P1 = (m) => `m${String(m).padStart(2, '0')}-pi1`;
const P2 = (m) => `m${String(m).padStart(2, '0')}-pi2`;

test('bright scoring including the rain-bright penalty', () => {
  assert.equal(scorePile([G(1), G(3), G(8)]).total, 3, '3광');
  assert.equal(scorePile([G(1), G(3), G(12)]).total, 2, '비광 낀 3광');
  assert.equal(scorePile([G(1), G(3), G(8), G(12)]).total, 4, '4광');
  assert.equal(scorePile([G(1), G(3), G(8), G(11), G(12)]).total, 15, '5광');
  assert.equal(scorePile([G(1), G(3)]).total, 0, '2광은 0점');
});

test('animal scoring and godori', () => {
  assert.equal(scorePile([Y(5), Y(6), Y(7), Y(10)]).total, 0);
  assert.equal(scorePile([Y(5), Y(6), Y(7), Y(10), Y(12)]).total, 1);
  assert.equal(scorePile([Y(5), Y(6), Y(7), Y(10), Y(12), Y(2)]).total, 2);
  // 고도리 alone is 5 even though three animals score nothing by count.
  assert.equal(scorePile([Y(2), Y(4), Y(8)]).total, 5);
});

test('ribbon scoring and the three dan sets', () => {
  assert.equal(scorePile([T(1), T(2), T(3)]).total, 3, '홍단');
  assert.equal(scorePile([T(4), T(5), T(7)]).total, 3, '초단');
  assert.equal(scorePile([T(6), T(9), T(10)]).total, 3, '청단');
  // Five ribbons = 1 point, and 홍단 stacks on top of it.
  assert.equal(scorePile([T(1), T(2), T(3), T(4), T(5)]).total, 4);
});

const NINE_JUNK = [P1(1), P2(1), P1(2), P2(2), P1(3), P2(3), P1(4), P2(4), P1(5)];

test('junk scoring counts double junk as two', () => {
  assert.equal(junkValueOf(NINE_JUNK), 9);
  assert.equal(scorePile(NINE_JUNK).total, 0, '9장은 아직 0점');
  assert.equal(scorePile([...NINE_JUNK, P2(5)]).total, 1, '10장부터 1점');
  assert.equal(scorePile([...NINE_JUNK, 'm11-ssang']).total, 2, '쌍피는 2장');
});

test('국진 is scored whichever way pays better', () => {
  // As the 5th animal it is worth 1; as double junk it does nothing here.
  const animals = [Y(5), Y(6), Y(7), Y(10), 'm09-yeol'];
  assert.equal(scorePile(animals).total, 1);
  assert.equal(scorePile(animals).kukjinAsJunk, false);

  // With nine junk already, counting it as 쌍피 is worth 2 instead of 0.
  const flex = scorePile([...NINE_JUNK, 'm09-yeol']);
  assert.equal(flex.total, 2);
  assert.equal(flex.kukjinAsJunk, true);
});

test('go bonus and the doubling multipliers', () => {
  const winner = [G(1), G(3), G(8)]; // 3광 = 3점
  const loser = [G(11)]; // 광 한 장은 줘야 광박이 끼어들지 않는다
  const base = settleScore({ winnerPile: winner, loserPile: loser, goCount: 0, loserGoCount: 0, shakes: 0 });
  assert.equal(base.final, 3);

  assert.equal(
    settleScore({ winnerPile: winner, loserPile: loser, goCount: 1, loserGoCount: 0, shakes: 0 }).final,
    4,
    '1고는 +1',
  );
  assert.equal(
    settleScore({ winnerPile: winner, loserPile: loser, goCount: 2, loserGoCount: 0, shakes: 0 }).final,
    5,
    '2고는 +2',
  );
  assert.equal(
    settleScore({ winnerPile: winner, loserPile: loser, goCount: 3, loserGoCount: 0, shakes: 0 }).final,
    10,
    '3고는 (3+2)x2',
  );
  assert.equal(
    settleScore({ winnerPile: winner, loserPile: loser, goCount: 4, loserGoCount: 0, shakes: 0 }).final,
    20,
    '4고는 (3+2)x4',
  );
  assert.equal(
    settleScore({ winnerPile: winner, loserPile: loser, goCount: 0, loserGoCount: 0, shakes: 1 }).final,
    6,
    '흔들기 x2',
  );
  assert.equal(
    settleScore({ winnerPile: winner, loserPile: loser, goCount: 0, loserGoCount: 1, shakes: 0 }).final,
    6,
    '고박 x2',
  );
});

test('광박 only fires when the loser has no brights at all', () => {
  const w = [G(1), G(3), G(8)]; // 3광 = 3점
  const withGwang = settleScore({ winnerPile: w, loserPile: [G(11)], goCount: 0, loserGoCount: 0, shakes: 0 });
  assert.ok(!withGwang.multipliers.some((m) => m.label === '광박'));
  assert.equal(withGwang.final, 3);

  const noGwang = settleScore({ winnerPile: w, loserPile: [Y(5)], goCount: 0, loserGoCount: 0, shakes: 0 });
  assert.deepEqual(noGwang.multipliers.map((m) => m.label), ['광박']);
  assert.equal(noGwang.final, 6);

  // The winner must actually be scoring brights, not merely holding two.
  const twoGwang = settleScore({
    winnerPile: [G(1), G(3), ...NINE_JUNK, P2(5)],
    loserPile: [Y(5)],
    goCount: 0,
    loserGoCount: 0,
    shakes: 0,
  });
  assert.ok(!twoGwang.multipliers.some((m) => m.label === '광박'));
});

test('피박 doubles when the loser is under seven junk', () => {
  const winnerJunk = Array.from({ length: 6 }, (_, i) => [P1(i + 1), P2(i + 1)]).flat(); // 12 junk = 3점
  const rich = settleScore({
    winnerPile: winnerJunk,
    loserPile: [P1(7), P2(7), P1(8), P2(8), P1(9), P2(9), P1(10)], // 7 junk
    goCount: 0,
    loserGoCount: 0,
    shakes: 0,
  });
  assert.ok(!rich.multipliers.some((m) => m.label === '피박'));
  const poor = settleScore({
    winnerPile: winnerJunk,
    loserPile: [P1(7), P2(7)],
    goCount: 0,
    loserGoCount: 0,
    shakes: 0,
  });
  assert.ok(poor.multipliers.some((m) => m.label === '피박'));
});

/* ----------------------------------------------------------------- deal */

test('a seeded deal is reproducible and conserves the deck', () => {
  const a = createGame({ seed: 12345 });
  const b = createGame({ seed: 12345 });
  assert.deepEqual(a.hands, b.hands);
  assert.deepEqual(a.table, b.table);
  assert.deepEqual(a.deck, b.deck);
  assert.equal(a.turn, b.turn);

  const all = [...a.hands[0], ...a.hands[1], ...a.table, ...a.deck];
  assert.equal(all.length, 48);
  assert.equal(new Set(all).size, 48);
  assert.equal(a.hands[0].length, 10);
  assert.equal(a.hands[1].length, 10);
  assert.equal(a.table.length, 8);
  assert.equal(a.deck.length, 20);
});

test('different seeds deal different hands', () => {
  const a = createGame({ seed: 1 });
  const b = createGame({ seed: 2 });
  assert.notDeepEqual(a.hands, b.hands);
});

/* ------------------------------------------------------- turn mechanics */

/** Build a state by hand so a rule can be exercised in isolation. */
function rig({ hand0 = [], hand1 = [], table = [], deck = [], turn = 0 }) {
  const s = createGame({ seed: 1, startPlayer: turn });
  s.hands = [hand0.slice(), hand1.slice()];
  s.table = table.slice();
  s.deck = deck.slice();
  s.captured = [[], []];
  s.turn = turn;
  s.phase = 'play';
  s.log = [];
  s.go = [0, 0];
  s.shakes = [0, 0];
  s.shakenMonths = [[], []];
  s.ppeokMonths = {};
  s.goScoreAt = [0, 0];
  s.result = null;
  return s;
}

test('an unmatched card is left on the floor', () => {
  const s = rig({ hand0: [P1(1)], hand1: [P1(2)], table: [P1(5)], deck: [P1(7)] });
  playCard(s, P1(1));
  assert.ok(s.table.includes(P1(1)));
  assert.ok(s.table.includes(P1(7)));
  assert.deepEqual(s.captured[0], []);
  assert.equal(s.turn, 1);
});

test('a single floor match is captured with the played card', () => {
  const s = rig({ hand0: [P1(1)], hand1: [P1(2)], table: [P2(1)], deck: [P1(7)] });
  playCard(s, P1(1));
  assert.deepEqual(s.captured[0].sort(), [P1(1), P2(1)].sort());
  assert.ok(s.table.includes(P1(7)));
});

test('two floor matches raise a choice, and only the chosen card is taken', () => {
  const s = rig({ hand0: [G(1)], hand1: [P1(2)], table: [P1(1), P2(1)], deck: [P1(7)] });
  playCard(s, G(1));
  assert.equal(s.phase, 'awaitMatch');
  assert.deepEqual(s.pending.options.sort(), [P1(1), P2(1)].sort());
  chooseMatch(s, P2(1));
  assert.ok(s.captured[0].includes(P2(1)));
  assert.ok(s.table.includes(P1(1)), '고르지 않은 카드는 바닥에 남는다');
});

test('playing the fourth of a month sweeps all four and steals a junk', () => {
  const s = rig({
    hand0: [G(1)],
    hand1: [P1(2)],
    table: [T(1), P1(1), P2(1)],
    deck: [P1(7)],
  });
  s.captured[1] = [P1(9), P2(9)];
  playCard(s, G(1));
  assert.equal(s.captured[0].filter((id) => card(id).month === 1).length, 4);
  assert.equal(s.captured[1].length, 1, '상대 피 한 장을 가져온다');
});

test('뻑: hand card pairs up, the flip is the same month, nobody scores', () => {
  const s = rig({ hand0: [P1(3)], hand1: [P1(2)], table: [P2(3), P1(9)], deck: [T(3)] });
  playCard(s, P1(3));
  assert.deepEqual(s.captured[0], []);
  assert.equal(s.table.filter((id) => card(id).month === 3).length, 3);
  assert.equal(s.ppeokMonths[3], 0);
});

test('뻑 recovery sweeps four and is reported as such', () => {
  const s = rig({ hand0: [P1(3)], hand1: [G(3)], table: [P2(3), P1(9)], deck: [T(3), P1(7), P2(7)] });
  playCard(s, P1(3)); // 뻑
  assert.equal(s.turn, 1);
  s.captured[0] = [P1(8), P2(8)];
  playCard(s, G(3)); // takes all four
  assert.equal(s.captured[1].filter((id) => card(id).month === 3).length, 4);
  assert.ok(s.log.some((l) => l.text.includes('뻑 회수')));
});

test('쪽: the flip pairs with the card just laid down', () => {
  const s = rig({ hand0: [P1(4)], hand1: [P1(2)], table: [P1(9)], deck: [P2(4)] });
  s.captured[1] = [P1(8), P2(8)];
  playCard(s, P1(4));
  assert.deepEqual(s.captured[0].filter((id) => card(id).month === 4).sort(), [P1(4), P2(4)].sort());
  assert.equal(s.captured[1].length, 1, '쪽으로 피 한 장');
  assert.ok(s.log.some((l) => l.text.includes('쪽')));
});

test('따닥: a pair from hand and another pair from the flip', () => {
  const s = rig({ hand0: [P1(4)], hand1: [P1(2)], table: [P2(4), P1(6), P2(6)], deck: [T(6)] });
  s.captured[1] = [P1(8), P2(8)];
  playCard(s, P1(4));
  assert.equal(s.phase, 'awaitFlipMatch');
  chooseMatch(s, P1(6));
  assert.ok(s.log.some((l) => l.text.includes('따닥')));
  assert.equal(s.captured[1].length, 1);
});

test('싹쓸이 fires when the floor ends the turn bare', () => {
  const s = rig({ hand0: [P1(4)], hand1: [P1(2)], table: [P2(4)], deck: [P1(7)] });
  s.captured[1] = [P1(8), P2(8)];
  // The flip lands on an empty floor, so this is NOT a sweep.
  playCard(s, P1(4));
  assert.equal(s.captured[1].length, 2, '뒤집은 패가 바닥에 남으면 싹쓸이가 아니다');

  // Empty draw pile: nothing is flipped, so the floor really is left bare.
  const t = rig({ hand0: [P1(4)], hand1: [P1(2)], table: [P2(4)], deck: [] });
  t.captured[1] = [P1(8), P2(8)];
  playCard(t, P1(4));
  assert.equal(t.table.length, 0);
  assert.equal(t.captured[1].length, 1, '싹쓸이로 피 한 장');
  assert.ok(t.log.some((l) => l.text.includes('싹쓸이')));
});

test('폭탄 takes four, steals a junk and grants another turn', () => {
  const s = rig({
    hand0: [P1(4), P2(4), T(4), P1(9)],
    hand1: [P1(2)],
    table: [Y(4), P1(6)],
    deck: [P1(7), P2(7)],
  });
  s.captured[1] = [P1(8), P2(8)];
  assert.deepEqual(bombMonths(s), [4]);
  assert.deepEqual(specialOffer(s, P1(4)).options, ['bomb', 'plain']);
  playCard(s, P1(4), 'bomb');
  assert.equal(s.captured[0].filter((id) => card(id).month === 4).length, 4);
  assert.equal(s.hands[0].length, 1);
  assert.equal(s.turn, 0, '폭탄 뒤에는 한 번 더');
  assert.equal(s.captured[1].length, 1);
});

test('흔들기 needs three in hand and a clear floor, and doubles the result', () => {
  const s = rig({
    hand0: [P1(4), P2(4), T(4)],
    hand1: [P1(2)],
    table: [P1(6)],
    deck: [P1(7)],
  });
  assert.deepEqual(shakeMonths(s), [4]);
  playCard(s, P1(4), 'shake');
  assert.equal(s.shakes[0], 1);
  // The same month cannot be shaken twice.
  s.phase = 'play';
  s.turn = 0;
  assert.deepEqual(shakeMonths(s), []);
});

test('총통 in a dealt hand ends the game immediately', () => {
  let found = null;
  for (let seed = 0; seed < 4000 && !found; seed++) {
    const g = createGame({ seed });
    if (g.result && g.result.kind === 'chongtong') found = g;
  }
  assert.ok(found, '총통 시드를 찾지 못했다');
  assert.equal(found.phase, 'over');
  assert.equal(found.result.points, 10);
});

/* ------------------------------------------------------------- go/stop  */

test('reaching seven raises a go/stop prompt, and stop ends the game', () => {
  // Cards pair by month, never by type: month 8 is what gets the fifth bright.
  const s = rig({ hand0: [P2(8)], hand1: [P1(2)], table: [G(8), P1(8)], deck: [P1(7)] });
  s.captured[0] = [G(1), G(3), G(11), G(12)]; // 4광
  playCard(s, P2(8));
  assert.equal(s.phase, 'awaitMatch');
  chooseMatch(s, G(8));
  assert.equal(s.phase, 'awaitGoStop');
  assert.equal(s.pending.score, 15);
  chooseGoStop(s, 'stop');
  assert.equal(s.phase, 'over');
  assert.equal(s.result.winner, 0);
  assert.ok(s.result.points >= 15);
});

test('go raises the bar: the same score does not prompt twice', () => {
  const s = rig({ hand0: [P2(8), P1(9)], hand1: [P1(2), P2(2)], table: [G(8), P1(8)], deck: [P1(7), P2(7), P1(6)] });
  s.captured[0] = [G(1), G(3), G(11), G(12)];
  playCard(s, P2(8));
  chooseMatch(s, G(8));
  chooseGoStop(s, 'go');
  assert.equal(s.go[0], 1);
  assert.equal(s.goScoreAt[0], 15);
  assert.equal(s.turn, 1);
});

test('나가리 when both hands run out with nobody stopping', () => {
  const s = rig({ hand0: [P1(4)], hand1: [P1(2)], table: [P1(9)], deck: [P1(7), P2(7)] });
  playCard(s, P1(4));
  assert.equal(s.turn, 1);
  playCard(s, P1(2));
  assert.equal(s.phase, 'over');
  assert.equal(s.result.kind, 'nagari');
});

/* ------------------------------------------------------------ playouts  */

test('a thousand seeded AI-vs-AI games finish without losing a card', () => {
  let wins = 0;
  let nagari = 0;
  let chongtong = 0;
  for (let seed = 1; seed <= 1000; seed++) {
    const s = createGame({ seed, names: ['A', 'B'] });
    if (s.result) { chongtong++; continue; }
    let guard = 0;
    while (s.phase !== 'over') {
      if (guard++ > 400) throw new Error(`seed ${seed} did not terminate`);
      if (s.phase === 'play') {
        const move = chooseAIPlay(s);
        playCard(s, move.cardId, move.mode);
      } else if (s.phase === 'awaitMatch' || s.phase === 'awaitFlipMatch') {
        chooseMatch(s, chooseAIMatch(s));
      } else if (s.phase === 'awaitGoStop') {
        chooseGoStop(s, chooseAIGoStop(s));
      } else {
        throw new Error(`unknown phase ${s.phase}`);
      }
      const all = auditCards(s);
      if (all.length !== 48 || new Set(all).size !== 48) {
        throw new Error(`seed ${seed}: deck broke (${all.length} cards, ${new Set(all).size} unique)`);
      }
    }
    if (s.result.kind === 'nagari') nagari++;
    else wins++;
  }
  assert.equal(wins + nagari + chongtong, 1000);
  assert.ok(wins > 500, `결판난 판이 너무 적다: ${wins}`);
});

test('the AI is deterministic for a given seed', () => {
  const run = () => {
    const s = createGame({ seed: 777, names: ['A', 'B'] });
    while (s.phase !== 'over') {
      if (s.phase === 'play') { const m = chooseAIPlay(s); playCard(s, m.cardId, m.mode); }
      else if (s.phase === 'awaitGoStop') chooseGoStop(s, chooseAIGoStop(s));
      else chooseMatch(s, chooseAIMatch(s));
    }
    return s.result;
  };
  assert.deepEqual(run(), run());
});

test('mulberry32 is stable and in range', () => {
  const r = mulberry32(42);
  const xs = Array.from({ length: 200 }, r);
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.deepEqual(Array.from({ length: 5 }, mulberry32(42)), xs.slice(0, 5));
});

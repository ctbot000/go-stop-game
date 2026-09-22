// Board rendering and the play loop.
//
// The engine resolves a whole turn in one call, so the UI replays what it
// reports (state.lastTurn) rather than trying to drive the rules step by step:
// the played card and the flip go into their own slots for a beat, the special
// calls flash as a toast, and then the board re-renders into its new shape.

import { card, pileSort, MONTHS, DECK } from './cards.js';
import { cardFace, cardBackSVG } from './art.js';
import {
  createGame,
  playCard,
  chooseMatch,
  chooseGoStop,
  scorePile,
  settleScore,
  junkValueOf,
  specialOffer,
  WIN_SCORE,
} from './engine.js';
import { chooseAIPlay, chooseAIMatch, chooseAIGoStop } from './ai.js';

const ME = 0;
const AI = 1;
const NAMES = ['나', '컴퓨터'];

const el = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PACE = { play: 380, flip: 470, settle: 300, toast: 900, think: 520 };

/* ------------------------------------------------------------------ state */

let state = null;
let busy = true;
let reduceMotion = false;

// Transient display-only state. Kept out of the engine on purpose.
const view = { slotPlay: [], slotFlip: [], choices: [], fresh: new Set() };

// In-memory tally is the source of truth; localStorage is best effort, since
// it can throw or come back empty in a private window.
const stats = { played: 0, won: 0, lost: 0, drawn: 0, points: 0 };

function loadStats() {
  try {
    const raw = localStorage.getItem('gostop.stats');
    if (raw) Object.assign(stats, JSON.parse(raw));
  } catch {
    /* storage unavailable — the in-memory tally still works */
  }
}
function saveStats() {
  try {
    localStorage.setItem('gostop.stats', JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------- rendering */

function cardEl(id, { faceDown = false, cls = '' } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `card ${cls}`.trim();
  b.dataset.id = id;
  b.disabled = true;
  if (faceDown) {
    b.innerHTML = cardBackSVG();
    b.setAttribute('aria-label', '뒷면');
  } else {
    const c = card(id);
    b.innerHTML = cardFace(c);
    b.setAttribute('aria-label', `${c.month}월 ${c.name}`);
    b.title = `${c.month}월 ${MONTHS[c.month - 1].name} · ${c.name}`;
  }
  if (view.fresh.has(id)) b.classList.add('is-fresh');
  return b;
}

function renderHand() {
  const mine = el('my-hand');
  mine.replaceChildren();
  const canPlay = !busy && state.phase === 'play' && state.turn === ME;
  for (const id of [...state.hands[ME]].sort(pileSort)) {
    const b = cardEl(id);
    if (canPlay) {
      b.disabled = false;
      b.classList.add('is-playable');
      b.addEventListener('click', () => onHandClick(id));
    }
    mine.append(b);
  }

  const theirs = el('ai-hand');
  theirs.replaceChildren();
  for (let i = 0; i < state.hands[AI].length; i++) {
    const b = document.createElement('div');
    b.className = 'card';
    b.innerHTML = cardBackSVG();
    theirs.append(b);
  }
}

function renderFloor() {
  const floor = el('floor');
  floor.replaceChildren();

  const byMonth = new Map();
  for (const id of state.table) {
    const m = card(id).month;
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m).push(id);
  }

  for (const [month, ids] of [...byMonth].sort((a, b) => a[0] - b[0])) {
    const group = document.createElement('div');
    group.className = 'floor-group';
    if (ids.length >= 3) group.classList.add('is-pile');
    group.title = `${month}월 ${ids.length}장`;
    for (const id of ids.sort(pileSort)) {
      const b = cardEl(id);
      if (view.choices.includes(id)) {
        b.classList.add('is-choice');
        b.disabled = false;
        b.addEventListener('click', () => onFloorChoice(id));
      } else if (view.choices.length) {
        b.classList.add('is-dim');
      }
      group.append(b);
    }
    floor.append(group);
  }

  const deck = el('deck');
  deck.innerHTML = state.deck.length ? cardBackSVG() : '';
  deck.classList.toggle('is-empty', state.deck.length === 0);
  el('deck-count').textContent = state.deck.length;

  setSlot('slot-play', view.slotPlay);
  setSlot('slot-flip', view.slotFlip);
}

function setSlot(slotId, ids) {
  const box = el(slotId).querySelector('.slot-card');
  box.replaceChildren();
  for (const id of ids) box.append(cardEl(id));
}

const GROUPS = [
  { key: 'gwang', label: '광', match: (c) => c.type === 'gwang' },
  { key: 'animal', label: '열끗', match: (c) => c.type === 'animal' },
  { key: 'ribbon', label: '띠', match: (c) => c.type === 'ribbon' },
  { key: 'junk', label: '피', match: (c) => c.type === 'junk' },
];

function renderPiles(container, player) {
  const box = el(container);
  box.replaceChildren();
  const ids = [...state.captured[player]].sort(pileSort);
  const sc = scorePile(ids);
  const scoringKeys = new Set(sc.parts.map((p) => p.key));

  for (const g of GROUPS) {
    const mine = ids.filter((id) => g.match(card(id)));
    const pile = document.createElement('div');
    pile.className = 'pile';

    const scoring =
      (g.key === 'gwang' && scoringKeys.has('gwang')) ||
      (g.key === 'animal' && (scoringKeys.has('animal') || scoringKeys.has('godori'))) ||
      (g.key === 'ribbon' &&
        ['ribbon', 'hongdan', 'chodan', 'cheongdan'].some((k) => scoringKeys.has(k))) ||
      (g.key === 'junk' && scoringKeys.has('junk'));
    if (scoring) pile.classList.add('is-scoring');

    const head = document.createElement('div');
    head.className = 'pile-head';
    const count = g.key === 'junk' ? junkValueOf(ids) : mine.length;
    head.innerHTML = `<span>${g.label}</span><b>${count}</b>`;
    pile.append(head);

    const cards = document.createElement('div');
    cards.className = 'pile-cards';
    if (mine.length) {
      for (const id of mine) cards.append(cardEl(id));
    } else {
      const p = document.createElement('div');
      p.className = 'pile-empty';
      p.textContent = '—';
      cards.append(p);
    }
    pile.append(cards);
    box.append(pile);
  }
}

function renderScores() {
  for (const [player, scoreId, goId] of [
    [ME, 'my-score', 'my-go'],
    [AI, 'ai-score', 'ai-go'],
  ]) {
    const sc = scorePile(state.captured[player]);
    const holder = el(scoreId);
    holder.textContent = sc.total;
    holder.parentElement.classList.toggle('is-win', sc.total >= WIN_SCORE);
    holder.parentElement.title = sc.parts.length
      ? sc.parts.map((p) => `${p.label} ${p.points}점`).join(' · ')
      : '아직 점수 없음';

    const chip = el(goId);
    const n = state.go[player];
    const shake = state.shakes[player];
    const bits = [];
    if (n) bits.push(`${n}고`);
    if (shake) bits.push(shake > 1 ? `흔들기 x${shake}` : '흔들기');
    chip.hidden = bits.length === 0;
    chip.textContent = bits.join(' · ');
  }
}

function renderLog() {
  const list = el('loglist');
  list.replaceChildren();
  for (const entry of [...state.log].reverse()) {
    const li = document.createElement('li');
    li.className = `tone-${entry.tone}`;
    li.textContent = entry.text;
    list.append(li);
  }
}

function setStatus(text, alert = false) {
  const s = el('status');
  s.textContent = text;
  s.classList.toggle('is-alert', alert);
}

function render() {
  renderHand();
  renderFloor();
  renderPiles('my-piles', ME);
  renderPiles('ai-piles', AI);
  renderScores();
  renderLog();
}

/* --------------------------------------------------------------- effects */

async function toast(text, tone = 'info') {
  const t = el('toast');
  t.className = `toast tone-${tone}`;
  t.textContent = text;
  // Restart the animation even when the same message fires twice in a row.
  void t.offsetWidth;
  t.classList.add('is-on');
  await sleep(reduceMotion ? 260 : PACE.toast);
  t.classList.remove('is-on');
}

async function replayTurn() {
  const t = state.lastTurn;
  state.lastTurn = null;
  if (!t) {
    render();
    return;
  }

  view.slotPlay = t.handCards;
  view.slotFlip = [];
  view.fresh = new Set([...t.handCaptured, ...t.flipCaptured]);
  renderFloor();
  await sleep(reduceMotion ? 60 : PACE.play);

  if (t.flipCard) {
    el('deck').classList.add('is-drawing');
    view.slotFlip = [t.flipCard];
    renderFloor();
    await sleep(reduceMotion ? 60 : PACE.flip);
    el('deck').classList.remove('is-drawing');
  }

  render();

  if (t.ppeokMonth) await toast('뻑!', 'bad');
  for (const reason of t.bonusReasons) await toast(`${reason}!`, 'good');

  await sleep(reduceMotion ? 40 : PACE.settle);
  view.slotPlay = [];
  view.slotFlip = [];
  view.fresh = new Set();
  renderFloor();
}

/* ---------------------------------------------------------------- dialog */

let dialogResolve = null;

function openDialog({ title, bodyHTML, actions, dismissible = false }) {
  el('dialog-title').textContent = title;
  el('dialog-body').innerHTML = bodyHTML;
  const box = el('dialog-actions');
  box.replaceChildren();
  return new Promise((resolve) => {
    dialogResolve = resolve;
    for (const a of actions) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn ${a.cls || ''}`.trim();
      b.textContent = a.label;
      b.addEventListener('click', () => closeDialog(a.value));
      box.append(b);
    }
    el('backdrop').hidden = false;
    el('backdrop').dataset.dismissible = dismissible ? '1' : '0';
    el('dialog').scrollTop = 0;
    // `preventScroll` keeps a long dialog (the rules) at its top instead of
    // jumping to the button at the bottom.
    const first = box.querySelector('button');
    if (first) first.focus({ preventScroll: true });
  });
}

function closeDialog(value) {
  el('backdrop').hidden = true;
  const r = dialogResolve;
  dialogResolve = null;
  if (r) r(value);
}

/* ----------------------------------------------------------- interaction */

async function onHandClick(id) {
  if (busy || state.phase !== 'play' || state.turn !== ME) return;
  const offer = specialOffer(state, id);
  let mode = 'plain';

  if (offer) {
    const c = card(id);
    const actions = [];
    if (offer.options.includes('bomb')) {
      actions.push({ label: '폭탄!', value: 'bomb', cls: 'btn-go' });
    }
    if (offer.options.includes('shake')) {
      actions.push({ label: '흔들기!', value: 'shake', cls: 'btn-go' });
    }
    actions.push({ label: '그냥 내기', value: 'plain' });
    const body =
      offer.options.includes('bomb')
        ? `<p><b>${c.month}월</b>을 손에 석 장 들고 있고 바닥에도 한 장 있습니다.</p>
           <p>폭탄을 쓰면 넉 장을 한 번에 먹고, 상대 피 한 장을 가져오고, <b>한 번 더</b> 냅니다.</p>`
        : `<p><b>${c.month}월</b>을 손에 석 장 들고 있습니다.</p>
           <p>흔들면 이번 판에서 이겼을 때 <b>점수가 2배</b>가 됩니다. 대신 상대가 그 월을 압니다.</p>`;
    setBusy(true);
    mode = await openDialog({ title: '특수 선언', bodyHTML: body, actions });
  }

  setBusy(true);
  playCard(state, id, mode);
  await afterAction();
}

async function onFloorChoice(id) {
  if (busy || !view.choices.includes(id)) return;
  setBusy(true);
  view.choices = [];
  chooseMatch(state, id);
  await afterAction();
}

async function afterAction() {
  if (state.phase === 'awaitMatch' || state.phase === 'awaitFlipMatch') {
    await presentMatch();
    return;
  }
  await replayTurn();
  await runLoop();
}

/** Pause on a two-way match: highlight the floor cards and wait. */
async function presentMatch() {
  const p = state.ctx.player;
  view.choices = state.pending.options;
  view.slotPlay = state.ctx.handCards;
  view.slotFlip = state.pending.source === 'flip' ? [state.pending.cardId] : [];

  if (p === ME) {
    setBusy(false);
    render();
    setStatus('바닥에서 가져올 패를 고르세요.', true);
    return;
  }
  render();
  setStatus(`${NAMES[AI]}이(가) 고르는 중…`);
  await sleep(reduceMotion ? 80 : PACE.think);
  const pick = chooseAIMatch(state);
  view.choices = [];
  chooseMatch(state, pick);
  await afterAction();
}

/* ------------------------------------------------------------- game loop */

function actorOf() {
  if (state.phase === 'awaitGoStop') return state.pending.player;
  if (state.phase === 'awaitMatch' || state.phase === 'awaitFlipMatch') return state.ctx.player;
  return state.turn;
}

function setBusy(v) {
  busy = v;
}

async function runLoop() {
  while (state.phase !== 'over') {
    const actor = actorOf();

    if (state.phase === 'awaitGoStop') {
      if (actor === ME) {
        await askGoStop();
        continue;
      }
      setBusy(true);
      render();
      setStatus(`${NAMES[AI]}이(가) 고민 중…`);
      await sleep(reduceMotion ? 120 : PACE.think * 1.4);
      const choice = chooseAIGoStop(state);
      chooseGoStop(state, choice);
      render();
      if (choice === 'go') await toast(`${state.go[AI]}고!`, 'bad');
      continue;
    }

    if (state.phase === 'awaitMatch' || state.phase === 'awaitFlipMatch') {
      await presentMatch();
      return;
    }

    if (actor === ME) {
      setBusy(false);
      render();
      setStatus('낼 패를 고르세요.');
      return;
    }

    setBusy(true);
    render();
    setStatus(`${NAMES[AI]} 차례…`);
    await sleep(reduceMotion ? 120 : PACE.think);
    const move = chooseAIPlay(state);
    playCard(state, move.cardId, move.mode);
    if (move.mode === 'bomb') await toast('폭탄!', 'bad');
    if (move.mode === 'shake') await toast('흔들기!', 'bad');
    if (state.phase === 'awaitMatch' || state.phase === 'awaitFlipMatch') {
      await presentMatch();
      return;
    }
    await replayTurn();
  }

  setBusy(true);
  render();
  await showResult();
}

async function askGoStop() {
  const sc = scorePile(state.captured[ME]);
  const opp = scorePile(state.captured[AI]);
  const goCount = state.go[ME];
  const stopNow = settleScore({
    winnerPile: state.captured[ME],
    loserPile: state.captured[AI],
    goCount,
    loserGoCount: state.go[AI],
    shakes: state.shakes[ME],
  });

  const body = `
    <p>지금 <b>${sc.total}점</b>입니다. (상대 ${opp.total}점, 내 손패 ${state.hands[ME].length}장)</p>
    <div>${sc.parts.map((p) => `<div class="scoreline"><span>${p.label}</span><span class="v">${p.points}점</span></div>`).join('')}</div>
    <div class="scoreline total"><span>스톱하면</span><span class="v">${stopNow.final}점</span></div>
    <p style="color:var(--ink-dim);margin-top:12px">
      고를 부르면 ${goCount === 0 ? '1점' : goCount === 1 ? '1점 더' : '점수가 2배'} 붙지만,
      상대가 7점을 넘겨 스톱하면 <b>고박</b>으로 내가 두 배를 물어줍니다.
    </p>`;

  setBusy(true);
  setStatus('고? 스톱?', true);
  const choice = await openDialog({
    title: `${sc.total}점 — 고 or 스톱`,
    bodyHTML: body,
    actions: [
      { label: `고! (${goCount + 1}고)`, value: 'go', cls: 'btn-go' },
      { label: `스톱 — ${stopNow.final}점`, value: 'stop', cls: 'btn-stop' },
    ],
  });
  chooseGoStop(state, choice);
  render();
  if (choice === 'go') await toast(`${state.go[ME]}고!`, 'good');
}

async function showResult() {
  const r = state.result;
  stats.played++;

  let cls = 'draw';
  let big = '나가리';
  let sub = '양쪽 다 못 냈습니다. 무승부.';
  let detail = '';

  if (r.kind === 'chongtong') {
    cls = r.winner === ME ? 'win' : 'lose';
    big = '총통!';
    sub = `${NAMES[r.winner]}의 ${r.month}월 넉 장 — 즉시 ${r.points}점`;
  } else if (r.winner !== null) {
    cls = r.winner === ME ? 'win' : 'lose';
    big = r.winner === ME ? '승리!' : '패배';
    const d = r.detail;
    sub = `${NAMES[r.winner]} ${r.points}점`;
    const rows = d.winnerScore.parts
      .map((p) => `<div class="scoreline"><span>${p.label}</span><span class="v">${p.points}점</span></div>`)
      .join('');
    const goRow = d.goBonus
      ? `<div class="scoreline"><span>고 보너스</span><span class="v">+${d.goBonus}점</span></div>`
      : '';
    const multRows = d.multipliers
      .map((m) => `<div class="scoreline"><span>${m.label}</span><span class="v">x${m.factor}</span></div>`)
      .join('');
    detail = `<h3>${NAMES[r.winner]} 점수</h3>${rows}${goRow}${multRows}
      <div class="scoreline total"><span>합계</span><span class="v">${r.points}점</span></div>`;
  }

  if (r.winner === ME) {
    stats.won++;
    stats.points += r.points;
  } else if (r.winner === AI) {
    stats.lost++;
    stats.points -= r.points;
  } else {
    stats.drawn++;
  }
  saveStats();

  const tally = `<p style="color:var(--ink-dim);margin-top:14px">
      전적 ${stats.won}승 ${stats.lost}패 ${stats.drawn}무 · 누적 ${stats.points >= 0 ? '+' : ''}${stats.points}점
    </p>`;

  setStatus(`${big} ${sub}`, true);
  const again = await openDialog({
    title: '판 종료',
    bodyHTML: `<div class="result-banner ${cls}"><span class="big">${big}</span><span class="sub">${sub}</span></div>${detail}${tally}`,
    actions: [
      { label: '한 판 더', value: 'again', cls: 'btn-primary' },
      { label: '판 보기', value: 'close' },
    ],
  });
  if (again === 'again') startGame();
}

/* ------------------------------------------------------------------ menu */

function rulesHTML() {
  return `
    <p>화투 48장으로 겨루는 2인 맞고입니다. 손패에서 한 장을 내고, 더미에서 한 장을 뒤집습니다.
       같은 <b>월</b>끼리만 짝이 맞습니다.</p>
    <h3>점수</h3>
    <table class="rule-table">
      <tr><th>광</th><td>3광 3점 (비광이 끼면 2점) · 4광 4점 · 5광 15점</td></tr>
      <tr><th>열끗</th><td>5장부터 1점, 한 장마다 +1 · 고도리(2·4·8월 새) 5점</td></tr>
      <tr><th>띠</th><td>5장부터 1점, 한 장마다 +1 · 홍단/초단/청단 각 3점</td></tr>
      <tr><th>피</th><td>10장부터 1점, 한 장마다 +1 · 쌍피는 2장</td></tr>
      <tr><th>국진</th><td>9월 열끗은 열끗과 쌍피 중 <b>유리한 쪽</b>으로 자동 계산</td></tr>
    </table>
    <h3>특수 규칙</h3>
    <table class="rule-table">
      <tr><th>뻑</th><td>낸 패로 짝을 맞췄는데 뒤집은 패도 같은 월 → 석 장 모두 바닥에</td></tr>
      <tr><th>쪽</th><td>짝 없이 낸 패에 뒤집은 패가 붙음 → 상대 피 1장</td></tr>
      <tr><th>따닥</th><td>낸 패와 뒤집은 패로 각각 한 쌍씩 → 상대 피 1장</td></tr>
      <tr><th>싹쓸이</th><td>바닥을 비움 → 상대 피 1장</td></tr>
      <tr><th>쓸/뻑 회수</th><td>같은 월 넉 장을 한 번에 → 상대 피 1장</td></tr>
      <tr><th>폭탄</th><td>손에 석 장 + 바닥 한 장 → 넉 장 먹고 상대 피 1장, 한 번 더</td></tr>
      <tr><th>흔들기</th><td>손에 석 장 + 바닥에 없음 → 선언하면 최종 점수 2배</td></tr>
      <tr><th>총통</th><td>처음 받은 패에 같은 월 넉 장 → 즉시 10점 승</td></tr>
    </table>
    <h3>고 / 스톱</h3>
    <p>7점을 넘기면 고와 스톱 중 고릅니다. 1고 +1점, 2고 +2점, 3고부터는 고를 부를 때마다 2배입니다.
       고를 불렀는데 상대가 먼저 스톱하면 <b>고박</b>으로 두 배를 물어줍니다.</p>
    <h3>박</h3>
    <p><b>피박</b> 진 쪽 피가 7장 미만이고 이긴 쪽이 피로 점수를 냈을 때 · <b>광박</b> 진 쪽 광이 0장이고
       이긴 쪽이 광으로 점수를 냈을 때 · <b>멍박</b> 진 쪽 열끗이 0장이고 이긴 쪽이 7장 이상일 때 — 각각 2배.</p>
    <h3>나가리</h3>
    <p>둘 다 패가 떨어지도록 아무도 7점을 못 내면 무승부입니다.</p>`;
}

/* ------------------------------------------------------------------ boot */

export function startGame() {
  const level = el('difficulty').value;
  state = createGame({ names: NAMES });
  state.aiLevel = level;
  view.slotPlay = [];
  view.slotFlip = [];
  view.choices = [];
  view.fresh = new Set();
  setBusy(true);
  render();
  setStatus('새 판을 시작합니다.');
  runLoop();
}

/**
 * Warm the browser cache for all 48 faces before the first deal. Without this
 * the opening hand paints as empty boxes while the artwork trickles in, and a
 * card drawn later flashes blank the first time it is seen.
 */
function preloadCards() {
  const urls = DECK.map((c) => `assets/cards/${c.id}.svg`);
  let done = 0;
  return new Promise((resolve) => {
    // Never block the game on the network: show the board either way.
    const timer = setTimeout(resolve, 6000);
    const tick = () => {
      if (++done === urls.length) {
        clearTimeout(timer);
        resolve();
      }
    };
    for (const url of urls) {
      const img = new Image();
      img.onload = tick;
      img.onerror = tick;
      img.src = url;
    }
  });
}

export async function init() {
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  loadStats();

  // Debug hook. Handy for watching a game back, and it is what the UI
  // soak test drives: set every PACE value to 0 and click through fast.
  window.gostop = {
    pace: PACE,
    state: () => state,
    isBusy: () => busy,
    stats,
  };

  el('btn-new').addEventListener('click', () => {
    if (!busy || state?.phase === 'over' || confirmRestart()) startGame();
  });
  el('difficulty').addEventListener('change', () => {
    if (state) state.aiLevel = el('difficulty').value;
  });
  el('btn-rules').addEventListener('click', () =>
    openDialog({
      title: '고스톱 규칙',
      bodyHTML: rulesHTML(),
      actions: [{ label: '닫기', value: 'close', cls: 'btn-primary' }],
      dismissible: true,
    }),
  );

  const logBtn = el('btn-log');
  const toggleLog = () => {
    const panel = el('logpanel');
    panel.hidden = !panel.hidden;
    logBtn.setAttribute('aria-expanded', String(!panel.hidden));
  };
  logBtn.addEventListener('click', toggleLog);
  el('btn-log-close').addEventListener('click', toggleLog);

  el('backdrop').addEventListener('click', (e) => {
    if (e.target === el('backdrop') && el('backdrop').dataset.dismissible === '1') closeDialog('close');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!el('backdrop').hidden && el('backdrop').dataset.dismissible === '1') closeDialog('close');
      else if (!el('logpanel').hidden) toggleLog();
    }
  });

  setStatus('화투를 준비하는 중…');
  await preloadCards();
  startGame();
}

function confirmRestart() {
  return window.confirm('진행 중인 판을 버리고 새로 시작할까요?');
}

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 10000);
const NAMES = ['Daryl', 'Cristi', 'Cindy'];
const COLORS = ['red', 'yellow', 'green', 'blue'];
const ASCENDING = new Set(['red', 'yellow']);
const seats = new Map();
let botTimer;
let gameNumber = 1;
const wins = [0, 0, 0];

const rowValues = color => ASCENDING.has(color)
  ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  : [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const blankSheet = () => ({ marks: Object.fromEntries(COLORS.map(c => [c, []])), locks: Object.fromEntries(COLORS.map(c => [c, false])), penalties: 0 });
const newGame = () => ({
  phase: 'waiting', turn: 0, stage: 'shared', round: 0, dice: null, diceLayout: { white: [], colors: [] },
  settings: { communityDice: 3, allThree: true }, locked: Object.fromEntries(COLORS.map(c => [c, false])),
  sheets: [blankSheet(), blankSheet(), blankSheet()], highlights: [[], [], []], sharedUsed: [false, false, false], sharedDone: [false, false, false], colorUsed: false, rerolled: false, cyclingDie: null, actions: [[], [], []],
  prompt: 'Choose a player to join the table. The game can start when one player is seated.'
});
let game = newGame();

function rollDie() { return crypto.randomInt(1, 7); }
function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = crypto.randomInt(index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}
function rollLayout() {
  const decorate = entries => shuffled(entries).map((entry, index) => ({
    ...entry, x: crypto.randomInt(-4, 5), y: crypto.randomInt(-5, 6), rotate: crypto.randomInt(-8, 9), delay: index * .07
  }));
  return {
    white: decorate(game.dice.white.map((_, index) => ({ index }))),
    colors: decorate(COLORS.filter(color => game.dice[color] !== undefined).map(color => ({ color })))
  };
}
function requiredToClose() { return game.settings.communityDice === 2 ? 5 : 7; }
function seatForToken(token) { for (const [seat, data] of seats) if (data.token === token) return seat; return undefined; }
function isLive(seat) { return seats.has(seat); }
function score(sheet) {
  const points = COLORS.reduce((sum, color) => {
    const n = sheet.marks[color].length + (sheet.locks[color] ? 1 : 0);
    return sum + n * (n + 1) / 2;
  }, 0);
  return points - sheet.penalties * 5;
}
function snapshot(you) {
  return {
    phase: game.phase, turn: game.turn, stage: game.stage, round: game.round, dice: game.dice, diceLayout: game.diceLayout,
    settings: game.settings, locked: game.locked, sheets: game.sheets, highlights: game.highlights, sharedUsed: game.sharedUsed, sharedDone: game.sharedDone, colorUsed: game.colorUsed, rerolled: game.rerolled, cyclingDie: game.cyclingDie, gameNumber, prompt: game.prompt, you,
    closeRequirement: requiredToClose(),
    seats: NAMES.map((name, seat) => ({ name, seat, live: isLive(seat), bot: !isLive(seat), score: score(game.sheets[seat]), wins: wins[seat] }))
  };
}
function send(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
function fail(res, message, status = 400) { send(res, { error: message }, status); }
function readJson(req, done) {
  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > 20000) req.destroy(); });
  req.on('end', () => { try { done(JSON.parse(body || '{}')); } catch { done({}); } });
}
function validMark(seat, color, value) {
  if (!COLORS.includes(color) || game.locked[color]) return false;
  const index = rowValues(color).indexOf(value);
  const marks = game.sheets[seat].marks[color];
  if (index < 0 || marks.includes(index) || (marks.length && index <= Math.max(...marks))) return false;
  if (index === 10 && marks.length < requiredToClose()) return false;
  return true;
}
function addMark(seat, color, value) {
  if (!validMark(seat, color, value)) return false;
  const index = rowValues(color).indexOf(value);
  game.sheets[seat].marks[color].push(index);
  game.highlights[seat].push({ color, index });
  if (index === 10) {
    game.sheets[seat].locks[color] = true;
    game.prompt = `${NAMES[seat]} is eligible to lock the ${color} row.`;
  }
  return true;
}
function undoMark(seat, color, index) {
  const actions = game.actions[seat];
  const actionPosition = actions.findIndex(action => action.color === color && action.index === index);
  if (actionPosition < 0) return false;
  const action = actions[actionPosition];
  const marks = game.sheets[seat].marks[action.color];
  const position = marks.lastIndexOf(action.index);
  if (position < 0) return false;
  marks.splice(position, 1);
  actions.splice(actionPosition, 1);
  const highlightPosition = game.highlights[seat].findIndex(mark => mark.color === action.color && mark.index === action.index);
  if (highlightPosition >= 0) game.highlights[seat].splice(highlightPosition, 1);
  if (action.index === 10) {
    game.sheets[seat].locks[action.color] = false;
    if (!game.sheets.some(sheet => sheet.marks[action.color].includes(10))) game.locked[action.color] = false;
  }
  game.sharedUsed[seat] = actions.some(item => item.kind === 'shared' || item.kind === 'all-three');
  if (seat === game.turn) game.colorUsed = actions.some(item => item.kind === 'color' || item.kind === 'all-three');
  game.prompt = `${NAMES[seat]} took back a mark.`;
  return true;
}
function communityOptions() {
  const white = game.dice.white;
  const options = [];
  for (let i = 0; i < white.length; i++) for (let j = i + 1; j < white.length; j++) {
    options.push({ key: `${i}-${j}`, dice: [i, j], total: white[i] + white[j] });
  }
  if (game.settings.allThree) options.push({ key: 'all-three', dice: [0, 1, 2], total: white[0] + white[1] + white[2] });
  return options;
}
function botMoveValue(seat, move) {
  const marksInRow = game.sheets[seat].marks[move.color].length;
  const startingBonus = marksInRow === 0 ? (ASCENDING.has(move.color) ? 1.2 : 0.35) : 0;
  const closingBonus = move.index === 10 ? 20 : marksInRow >= requiredToClose() - 1 ? 1 : 0;
  return closingBonus + startingBonus + move.index * 0.06 - move.skipped * 0.85;
}
function bestMark(seat, total, onlyColor, maxSkipped = Infinity, twoPlayPlan = false) {
  const candidates = [];
  for (const color of onlyColor ? [onlyColor] : COLORS) {
    if (!game.locked[color]) {
      const index = rowValues(color).indexOf(total);
      const marks = game.sheets[seat].marks[color];
      const lastIndex = marks.length ? Math.max(...marks) : -1;
      const skipped = index - lastIndex - 1;
      if (validMark(seat, color, total) && (skipped <= maxSkipped || index === 10)) {
        candidates.push({ color, value: total, index, skipped });
      }
    }
  }
  const locking = candidates.filter(move => move.index === 10 && !shouldAvoidGameEndingLock(seat, move));
  const preferred = locking.length ? locking : candidates.filter(move => botShouldPlayMove(seat, move, twoPlayPlan));
  return preferred.sort((a, b) => botMoveValue(seat, b) - botMoveValue(seat, a) || a.skipped - b.skipped || b.index - a.index)[0];
}
function shouldAvoidGameEndingLock(seat, move) {
  if (move.index !== 10 || COLORS.filter(color => game.locked[color]).length < 1) return false;
  const projected = score(game.sheets[seat]) + game.sheets[seat].marks[move.color].length + 1;
  const leader = Math.max(...game.sheets.map(score).filter((_, index) => index !== seat));
  return projected < leader - 10;
}
function botShouldPlayMove(seat, move, twoPlayPlan = false) {
  if (move.index === 10) return !shouldAvoidGameEndingLock(seat, move);
  if (move.skipped === 0) return true;
  const closedColors = COLORS.filter(color => game.locked[color]).length;
  const marksInRow = game.sheets[seat].marks[move.color].length;
  const nearLock = marksInRow >= requiredToClose() - 1;
  if (move.skipped === 1) return game.round >= 7 || closedColors >= 1 || nearLock || (marksInRow === 0 && ASCENDING.has(move.color)) || twoPlayPlan;
  if (move.skipped === 2) return (closedColors >= 1 && nearLock) || (twoPlayPlan && (nearLock || (marksInRow === 0 && ASCENDING.has(move.color))));
  return false;
}
function botCanFollowWithColor(seat) {
  return COLORS.filter(color => !game.locked[color]).some(color => game.dice.white.some(white => {
    const value = white + game.dice[color];
    const index = rowValues(color).indexOf(value);
    if (!validMark(seat, color, value)) return false;
    const marks = game.sheets[seat].marks[color];
    return botShouldPlayMove(seat, { color, value, index, skipped: index - (marks.length ? Math.max(...marks) : -1) - 1 }, true);
  }));
}
function botShared(seat) {
  const twoPlayPlan = seat === game.turn && botCanFollowWithColor(seat);
  const choice = communityOptions().map(option => ({ option, move: bestMark(seat, option.total, null, 2, twoPlayPlan) }))
    .filter(item => item.move).sort((a, b) => botMoveValue(seat, b.move) - botMoveValue(seat, a.move) || a.move.skipped - b.move.skipped)[0];
  if (choice) {
    addMark(seat, choice.move.color, choice.move.value);
    if (choice.option.key === 'all-three' && seat === game.turn) game.colorUsed = true;
  }
  game.sharedUsed[seat] = true;
  game.sharedDone[seat] = true;
  return Boolean(choice);
}
function botColor(seat) {
  let best;
  for (const color of COLORS.filter(color => !game.locked[color])) for (const white of game.dice.white) {
    const move = bestMark(seat, white + game.dice[color], color, 2);
    if (move && (!best || move.skipped < best.skipped || (move.skipped === best.skipped && move.index > best.index))) best = move;
  }
  if (best) addMark(seat, best.color, best.value);
  return Boolean(best);
}
function forcedBotMove(seat) {
  const candidates = [];
  for (const option of communityOptions()) {
    for (const color of COLORS) {
      const index = rowValues(color).indexOf(option.total);
      if (validMark(seat, color, option.total)) candidates.push({ color, value: option.total, index, skipped: index - (game.sheets[seat].marks[color].length ? Math.max(...game.sheets[seat].marks[color]) : -1) - 1 });
    }
  }
  for (const color of COLORS.filter(color => !game.locked[color])) for (const white of game.dice.white) {
    const value = white + game.dice[color], index = rowValues(color).indexOf(value);
    if (validMark(seat, color, value)) candidates.push({ color, value, index, skipped: index - (game.sheets[seat].marks[color].length ? Math.max(...game.sheets[seat].marks[color]) : -1) - 1 });
  }
  const move = candidates.sort((a, b) => a.skipped - b.skipped || b.index - a.index)[0];
  if (move) addMark(seat, move.color, move.value);
  return Boolean(move);
}
function checkForEnd() {
  const locks = COLORS.filter(color => game.locked[color]).length;
  const penalties = game.sheets.some(sheet => sheet.penalties >= 4);
  if (locks >= 2 || penalties) {
    game.phase = 'gameover';
    const scores = game.sheets.map(score);
    wins[scores.indexOf(Math.max(...scores))]++;
    game.prompt = 'Game complete — the highest score wins.';
    clearTimeout(botTimer);
    return true;
  }
  return false;
}
function finalizeSharedLocks() {
  for (const color of COLORS) {
    if (game.sheets.some(sheet => sheet.locks[color])) game.locked[color] = true;
  }
}
function advanceSharedIfReady(lastDoneSeat) {
  if (!game.sharedDone.every(Boolean) || game.phase !== 'playing' || game.stage !== 'shared') return;
  game.highlights = [[], [], []];
  finalizeSharedLocks();
  if (checkForEnd()) return;
  const nextSeat = (game.turn + 1) % NAMES.length;
  game.turn = nextSeat;
  game.stage = 'awaitingRoll';
  game.prompt = `${NAMES[game.turn]} may roll next.`;
  if (lastDoneSeat === nextSeat && isLive(nextSeat)) return roll();
  if (!isLive(game.turn)) {
    clearTimeout(botTimer);
    botTimer = setTimeout(() => {
      if (game.phase === 'playing' && game.stage === 'awaitingRoll' && !isLive(game.turn)) roll();
    }, 850);
  }
}
function roll() {
  game.round++;
  game.dice = {
    white: Array.from({ length: game.settings.communityDice }, rollDie),
    ...Object.fromEntries(COLORS.filter(color => !game.locked[color]).map(color => [color, rollDie()]))
  };
  game.diceLayout = rollLayout();
  game.stage = 'shared';
  game.sharedUsed = [false, false, false];
  game.sharedDone = [false, false, false];
  game.highlights = [[], [], []];
  game.colorUsed = false;
  game.rerolled = false;
  game.cyclingDie = null;
  game.prompt = `${NAMES[game.turn]} rolled the community dice.`;
  let activeBotMoved = false;
  NAMES.forEach((_, seat) => {
    if (!isLive(seat)) {
      const moved = botShared(seat);
      if (seat === game.turn) activeBotMoved = moved;
    }
  });
  if (!isLive(game.turn) && !game.colorUsed) activeBotMoved = botColor(game.turn) || activeBotMoved;
  if (!isLive(game.turn) && !activeBotMoved && !forcedBotMove(game.turn)) game.sheets[game.turn].penalties++;
  advanceSharedIfReady();
}
function nextTurn() {
  if (checkForEnd()) return;
  game.turn = (game.turn + 1) % NAMES.length;
  roll();
}
function scheduleBot() {
  clearTimeout(botTimer);
  if (game.phase !== 'playing' || isLive(game.turn)) return;
  botTimer = setTimeout(() => {
    if (game.phase !== 'playing' || isLive(game.turn)) return;
    if (game.stage === 'shared') {
      game.stage = 'color';
      game.prompt = `${NAMES[game.turn]} is using a colored die.`;
      return scheduleBot();
    }
    botColor(game.turn);
    nextTurn();
  }, 1000);
}
function start() {
  const oldSettings = game.settings;
  const oldScores = game.sheets.map(score);
  const firstGame = game.phase === 'waiting' && gameNumber === 1;
  let firstSeat;
  if (firstGame) {
    firstSeat = crypto.randomInt(NAMES.length);
  } else {
    const lowestScore = Math.min(...oldScores);
    const eligible = oldScores.map((value, seat) => ({ value, seat })).filter(item => item.value === lowestScore);
    firstSeat = eligible[crypto.randomInt(eligible.length)].seat;
  }
  if (game.phase === 'gameover') gameNumber++;
  game = newGame();
  game.settings = oldSettings;
  game.turn = firstSeat;
  game.phase = 'playing';
  roll();
}
function finishColorAction() {
  const active = game.turn;
  const sheet = game.sheets[active];
  const hasMark = COLORS.some(color => sheet.marks[color].length > 0) || sheet.penalties > 0;
  // A player who does not make a colored mark takes a penalty. Shared marks are not tracked as an obligation.
  if (!hasMark) sheet.penalties++;
  nextTurn();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/join' && req.method === 'POST') return readJson(req, body => {
    const seat = NAMES.indexOf(String(body.name || ''));
    if (seat < 0) return fail(res, 'Choose one of the listed players.');
    const prior = seats.get(seat);
    if (prior && prior.token !== body.token) return fail(res, `${NAMES[seat]} is already playing on another device.`);
    const token = prior?.token || crypto.randomBytes(18).toString('hex');
    seats.set(seat, { token });
    send(res, { token, state: snapshot(seat) });
  });
  if (url.pathname === '/api/leave' && req.method === 'POST') return readJson(req, body => {
    const seat = seatForToken(body.token);
    if (seat !== undefined) seats.delete(seat);
    send(res, { ok: true });
  });
  if (url.pathname === '/api/state') {
    const seat = seatForToken(url.searchParams.get('token'));
    if (seat === undefined) return fail(res, 'Choose a player first.', 401);
    if (game.phase === 'playing' && game.stage === 'awaitingRoll' && !isLive(game.turn)) roll();
    return send(res, { state: snapshot(seat) });
  }
  if (url.pathname === '/api/action' && req.method === 'POST') return readJson(req, body => {
    const seat = seatForToken(body.token);
    if (seat === undefined) return fail(res, 'Choose a player first.', 401);
    const action = body.action;
    if (action === 'settings') {
      const mode = String(body.mode || body.communityDice || '3');
      if (!['2', '3', 'all3'].includes(mode)) return fail(res, 'Choose a white-dice setting.');
      game.settings.communityDice = mode === '2' ? 2 : 3;
      game.settings.allThree = mode === 'all3';
      game.prompt = `${NAMES[seat]} changed the white-dice setting.`;
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'start') {
      if (game.phase !== 'waiting') return fail(res, 'A game is already underway.');
      if (![...seats.keys()].length) return fail(res, 'At least one live player must join first.');
      start();
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'newGame') { start(); return send(res, { state: snapshot(seat) }); }
    if (game.phase !== 'playing') return fail(res, 'Start the game first.');
    if (action === 'shared') {
      if (game.stage !== 'shared') return fail(res, 'The shared step has ended.');
      if (game.sharedUsed[seat]) return fail(res, 'You already used your shared action this round.');
      if (game.sharedDone[seat]) return fail(res, 'You already finished this turn.');
      const option = communityOptions().find(item => item.key === body.option);
      if (!option || !addMark(seat, body.color, option.total)) return fail(res, 'That box is not available.');
      game.sharedUsed[seat] = true;
      game.actions[seat].push({ kind: option.key === 'all-three' ? 'all-three' : 'shared', color: body.color, index: rowValues(body.color).indexOf(option.total) });
      if (option.key === 'all-three' && seat === game.turn) game.colorUsed = true;
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'continue') {
      if (game.stage !== 'shared') return fail(res, 'The shared step has ended.');
      game.sharedDone[seat] = true;
      advanceSharedIfReady(seat);
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'done') {
      if (game.stage === 'shared') {
        if (seat === game.turn && !game.sharedUsed[seat] && !game.colorUsed) {
          return fail(res, 'The roller must mark a number or take white before finishing.');
        }
        game.sharedDone[seat] = true;
        advanceSharedIfReady(seat);
        return send(res, { state: snapshot(seat) });
      }
      return fail(res, 'Wait for every player to finish.');
    }
    if (action === 'color') {
      if (seat !== game.turn || game.stage !== 'shared') return fail(res, 'It is not your colored-die step.');
      if (game.colorUsed) return fail(res, 'You already used the colored action this round.');
      const white = Number(body.white), color = String(body.color || '');
      if (!game.dice.white.includes(white) || !addMark(seat, color, white + game.dice[color])) return fail(res, 'That box is not available.');
      game.colorUsed = true;
      game.actions[seat].push({ kind: 'color', color, index: rowValues(color).indexOf(white + game.dice[color]) });
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'reroll') {
      const index = Number(body.index);
      const equalWhiteDice = game.dice.white.length === 3 && new Set(game.dice.white).size === 1;
      const beginningCycle = game.cyclingDie === null && equalWhiteDice;
      const continuingCycle = game.cyclingDie === index;
      if (seat !== game.turn || game.stage !== 'shared' || game.sharedUsed[seat] || game.sharedDone[seat] || ![0, 1, 2].includes(index) || (!beginningCycle && !continuingCycle)) {
        return fail(res, 'Choose a matching white die before playing a number.');
      }
      game.dice.white[index] = game.dice.white[index] === 6 ? 1 : game.dice.white[index] + 1;
      game.rerolled = true;
      game.cyclingDie = index;
      game.prompt = `${NAMES[seat]} is choosing a value for one white die.`;
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'undo') {
      if (game.stage === 'shared' && game.sharedDone[seat]) return fail(res, 'You already finished this turn.');
      if (game.stage === 'color' && seat !== game.turn) return fail(res, 'It is not your roll.');
      if (!undoMark(seat, String(body.color || ''), Number(body.index))) return fail(res, 'That mark can no longer be undone.');
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'end') {
      if (seat !== game.turn || game.stage !== 'color') return fail(res, 'Only the active player can end this turn.');
      nextTurn();
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'penalty') {
      if (seat !== game.turn || game.stage !== 'shared') return fail(res, 'Only the active player can take a penalty.');
      game.sheets[seat].penalties++;
      game.colorUsed = true;
      game.sharedDone[seat] = true;
      game.prompt = `${NAMES[seat]} took a −5 penalty.`;
      advanceSharedIfReady(seat);
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'nextRoll') {
      if (seat !== game.turn || game.stage !== 'awaitingRoll') return fail(res, 'Wait for every player to finish first.');
      roll();
      return send(res, { state: snapshot(seat) });
    }
    return fail(res, 'Unknown action.');
  });

  const requested = url.pathname === '/' ? '/qwixx.html' : url.pathname;
  const file = path.resolve(__dirname, `.${requested}`);
  if (!file.startsWith(__dirname) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  const contentType = path.extname(file) === '.html' ? 'text/html; charset=utf-8' : path.extname(file) === '.js' ? 'application/javascript; charset=utf-8' : path.extname(file) === '.png' ? 'image/png' : 'application/octet-stream';
  if (requested === '/qwixx.html') {
    const page = fs.readFileSync(file, 'utf8');
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    return res.end(page);
  }
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': requested === '/ui-v4.js' ? 'no-store' : 'public, max-age=3600' });
  fs.createReadStream(file).pipe(res);
});
server.listen(PORT, '0.0.0.0', () => console.log(`Qwixx listening on 0.0.0.0:${PORT}`));

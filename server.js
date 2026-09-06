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
const blankSheet = () => ({ marks: Object.fromEntries(COLORS.map(c => [c, []])), penalties: 0 });
const newGame = () => ({
  phase: 'waiting', turn: 0, stage: 'shared', round: 0, dice: null,
  settings: { communityDice: 3 }, locked: Object.fromEntries(COLORS.map(c => [c, false])),
  sheets: [blankSheet(), blankSheet(), blankSheet()], sharedUsed: [false, false, false], sharedDone: [false, false, false], colorUsed: false, lastActions: [null, null, null],
  prompt: 'Choose a player to join the table. The game can start when one player is seated.'
});
let game = newGame();

function rollDie() { return crypto.randomInt(1, 7); }
function requiredToClose() { return game.settings.communityDice === 2 ? 5 : 7; }
function seatForToken(token) { for (const [seat, data] of seats) if (data.token === token) return seat; return undefined; }
function isLive(seat) { return seats.has(seat); }
function score(sheet) {
  const points = COLORS.reduce((sum, color) => {
    const n = sheet.marks[color].length;
    return sum + n * (n + 1) / 2;
  }, 0);
  return points - sheet.penalties * 5;
}
function snapshot(you) {
  return {
    phase: game.phase, turn: game.turn, stage: game.stage, round: game.round, dice: game.dice,
    settings: game.settings, locked: game.locked, sheets: game.sheets, sharedDone: game.sharedDone, colorUsed: game.colorUsed, gameNumber, prompt: game.prompt, you,
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
  if (index === 10) {
    game.locked[color] = true;
    game.prompt = `${NAMES[seat]} locked the ${color} row.`;
  }
  return true;
}
function undoLastMark(seat) {
  const last = game.lastActions[seat];
  if (!last) return false;
  const marks = game.sheets[seat].marks[last.color];
  const position = marks.lastIndexOf(last.index);
  if (position < 0) return false;
  marks.splice(position, 1);
  if (last.index === 10 && !game.sheets.some(sheet => sheet.marks[last.color].includes(10))) game.locked[last.color] = false;
  if (last.kind === 'shared') game.sharedUsed[seat] = false;
  if (last.kind === 'color') game.colorUsed = false;
  game.lastActions[seat] = null;
  game.prompt = `${NAMES[seat]} took back the last mark.`;
  return true;
}
function communityOptions() {
  const white = game.dice.white;
  const options = [];
  for (let i = 0; i < white.length; i++) for (let j = i + 1; j < white.length; j++) {
    options.push({ key: `${i}-${j}`, dice: [i, j], total: white[i] + white[j] });
  }
  return options;
}
function bestMark(seat, total, onlyColor, maxSkipped = Infinity) {
  const candidates = [];
  for (const color of onlyColor ? [onlyColor] : COLORS) {
    if (!game.locked[color]) {
      const index = rowValues(color).indexOf(total);
      const marks = game.sheets[seat].marks[color];
      const lastIndex = marks.length ? Math.max(...marks) : -1;
      const skipped = index - lastIndex - 1;
      if (validMark(seat, color, total) && skipped <= maxSkipped) {
        candidates.push({ color, value: total, index, skipped });
      }
    }
  }
  return candidates.sort((a, b) => b.index - a.index)[0];
}
function botShared(seat) {
  const choice = communityOptions().map(option => ({ option, move: bestMark(seat, option.total, null, 2) }))
    .filter(item => item.move).sort((a, b) => b.move.index - a.move.index)[0];
  if (choice) addMark(seat, choice.move.color, choice.move.value);
  game.sharedUsed[seat] = true;
  game.sharedDone[seat] = true;
}
function botColor(seat) {
  let best;
  for (const color of COLORS) for (const white of game.dice.white) {
    const move = bestMark(seat, white + game.dice[color], color, 2);
    if (move && (!best || move.index > best.index)) best = move;
  }
  if (best) addMark(seat, best.color, best.value);
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
function advanceSharedIfReady() {
  if (!game.sharedDone.every(Boolean) || game.phase !== 'playing' || game.stage !== 'shared') return;
  if (game.colorUsed) return nextTurn();
  game.stage = 'color';
  game.prompt = `${NAMES[game.turn]} may use one white die with one colored die, or take a penalty.`;
  scheduleBot();
}
function roll() {
  game.round++;
  game.dice = { white: Array.from({ length: game.settings.communityDice }, rollDie), red: rollDie(), yellow: rollDie(), green: rollDie(), blue: rollDie() };
  game.stage = 'shared';
  game.sharedUsed = [false, false, false];
  game.sharedDone = [false, false, false];
  game.colorUsed = false;
  game.prompt = `${NAMES[game.turn]} rolled the community dice.`;
  NAMES.forEach((_, seat) => { if (!isLive(seat)) botShared(seat); });
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
  if (game.phase === 'gameover') gameNumber++;
  game = newGame();
  game.settings = oldSettings;
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
    return send(res, { state: snapshot(seat) });
  }
  if (url.pathname === '/api/action' && req.method === 'POST') return readJson(req, body => {
    const seat = seatForToken(body.token);
    if (seat === undefined) return fail(res, 'Choose a player first.', 401);
    const action = body.action;
    if (action === 'settings') {
      if (game.phase !== 'waiting') return fail(res, 'Settings can only change before the game starts.');
      const count = Number(body.communityDice);
      if (![2, 3].includes(count)) return fail(res, 'Choose two or three community dice.');
      game.settings.communityDice = count;
      game.prompt = `${NAMES[seat]} set ${count} white community dice. ${count === 2 ? 'Five' : 'Seven'} marks are required to close a color.`;
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
      game.lastActions[seat] = { kind: 'shared', color: body.color, index: rowValues(body.color).indexOf(option.total) };
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'continue') {
      if (game.stage !== 'shared') return fail(res, 'The shared step has ended.');
      game.sharedDone[seat] = true;
      advanceSharedIfReady();
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'done') {
      if (game.stage === 'shared') {
        game.sharedDone[seat] = true;
        advanceSharedIfReady();
        return send(res, { state: snapshot(seat) });
      }
      if (seat !== game.turn || game.stage !== 'color') return fail(res, 'Only the active player can finish the roll.');
      nextTurn();
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'color') {
      if (seat !== game.turn || !['shared', 'color'].includes(game.stage)) return fail(res, 'It is not your colored-die step.');
      if (game.colorUsed) return fail(res, 'You already used the colored action this round.');
      const white = Number(body.white), color = String(body.color || '');
      if (!game.dice.white.includes(white) || !addMark(seat, color, white + game.dice[color])) return fail(res, 'That box is not available.');
      game.colorUsed = true;
      game.lastActions[seat] = { kind: 'color', color, index: rowValues(color).indexOf(white + game.dice[color]) };
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'undo') {
      if (game.stage === 'shared' && game.sharedDone[seat]) return fail(res, 'You already finished this turn.');
      if (game.stage === 'color' && seat !== game.turn) return fail(res, 'It is not your roll.');
      if (!undoLastMark(seat)) return fail(res, 'There is no mark to undo.');
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'end') {
      if (seat !== game.turn || game.stage !== 'color') return fail(res, 'Only the active player can end this turn.');
      nextTurn();
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'penalty') {
      if (seat !== game.turn || game.stage !== 'color') return fail(res, 'Only the active player can take a penalty.');
      game.sheets[seat].penalties++;
      game.prompt = `${NAMES[seat]} took a −5 penalty.`;
      nextTurn();
      return send(res, { state: snapshot(seat) });
    }
    return fail(res, 'Unknown action.');
  });

  const requested = url.pathname === '/' ? '/qwixx.html' : url.pathname;
  const file = path.resolve(__dirname, `.${requested}`);
  if (!file.startsWith(__dirname) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  const contentType = path.extname(file) === '.html' ? 'text/html; charset=utf-8' : path.extname(file) === '.js' ? 'application/javascript; charset=utf-8' : 'application/octet-stream';
  if (requested === '/qwixx.html') {
    // Keep the Qwixx page's visual language aligned with the other Game Night tables.
    const originalPage = fs.readFileSync(file, 'utf8')
      .replace('FIVE CROWNS', 'QWIXX')
      .replace('Three players · eleven rounds · lowest score wins', 'Three players · shared-dice table')
      .replace('<div class="qwixx">Qwixx</div>', '')
      .replace('Everyone may choose one community total.', 'Community dice are ready.')
      .replace('Five marks are required to close a color.', '')
      .replace('Default. Choose one of the three pair totals; seven marks are required to close a color.', '')
      .replace('>♛<', '>⚄<');
    const inlineStart = originalPage.indexOf('<script>');
    const inlineEnd = originalPage.lastIndexOf('</script>');
    const page = inlineStart >= 0 && inlineEnd >= inlineStart
      ? `${originalPage.slice(0, inlineStart)}<script src="/ui-v4.js"></script>${originalPage.slice(inlineEnd + 9)}`
      : originalPage;
    res.writeHead(200, { 'Content-Type': contentType });
    return res.end(page);
  }
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(file).pipe(res);
});
server.listen(PORT, '0.0.0.0', () => console.log(`Qwixx listening on 0.0.0.0:${PORT}`));

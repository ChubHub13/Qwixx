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

const rowValues = color => ASCENDING.has(color)
  ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  : [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const blankSheet = () => ({ marks: Object.fromEntries(COLORS.map(c => [c, []])), penalties: 0 });
const newGame = () => ({
  phase: 'waiting', turn: 0, stage: 'shared', round: 0, dice: null,
  settings: { communityDice: 3 }, locked: Object.fromEntries(COLORS.map(c => [c, false])),
  sheets: [blankSheet(), blankSheet(), blankSheet()], sharedUsed: [false, false, false], colorUsed: false,
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
    settings: game.settings, locked: game.locked, sheets: game.sheets, prompt: game.prompt, you,
    closeRequirement: requiredToClose(),
    seats: NAMES.map((name, seat) => ({ name, seat, live: isLive(seat), bot: !isLive(seat), score: score(game.sheets[seat]) }))
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
function communityOptions() {
  const white = game.dice.white;
  const options = [];
  for (let i = 0; i < white.length; i++) for (let j = i + 1; j < white.length; j++) {
    options.push({ key: `${i}-${j}`, dice: [i, j], total: white[i] + white[j] });
  }
  return options;
}
function bestMark(seat, total, onlyColor) {
  const candidates = [];
  for (const color of onlyColor ? [onlyColor] : COLORS) {
    if (!game.locked[color]) {
      const index = rowValues(color).indexOf(total);
      if (validMark(seat, color, total)) candidates.push({ color, value: total, index });
    }
  }
  return candidates.sort((a, b) => b.index - a.index)[0];
}
function botShared(seat) {
  const choice = communityOptions().map(option => ({ option, move: bestMark(seat, option.total) }))
    .filter(item => item.move).sort((a, b) => b.move.index - a.move.index)[0];
  if (choice) addMark(seat, choice.move.color, choice.move.value);
  game.sharedUsed[seat] = true;
}
function botColor(seat) {
  let best;
  for (const color of COLORS) for (const white of game.dice.white) {
    const move = bestMark(seat, white + game.dice[color], color);
    if (move && (!best || move.index > best.index)) best = move;
  }
  if (best) addMark(seat, best.color, best.value);
}
function checkForEnd() {
  const locks = COLORS.filter(color => game.locked[color]).length;
  const penalties = game.sheets.some(sheet => sheet.penalties >= 4);
  if (locks >= 2 || penalties) {
    game.phase = 'gameover';
    game.prompt = 'Game complete — the highest score wins.';
    clearTimeout(botTimer);
    return true;
  }
  return false;
}
function roll() {
  game.round++;
  game.dice = { white: Array.from({ length: game.settings.communityDice }, rollDie), red: rollDie(), yellow: rollDie(), green: rollDie(), blue: rollDie() };
  game.stage = 'shared';
  game.sharedUsed = [false, false, false];
  game.colorUsed = false;
  game.prompt = `${NAMES[game.turn]} rolled. Everyone may mark one community total.`;
  NAMES.forEach((_, seat) => { if (!isLive(seat)) botShared(seat); });
  scheduleBot();
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
      const option = communityOptions().find(item => item.key === body.option);
      if (!option || !addMark(seat, body.color, option.total)) return fail(res, 'That box is not available.');
      game.sharedUsed[seat] = true;
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'continue') {
      if (seat !== game.turn || game.stage !== 'shared') return fail(res, 'Only the active player can continue.');
      game.stage = 'color';
      game.prompt = `${NAMES[seat]} may combine one white die with one colored die.`;
      scheduleBot();
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'color') {
      if (seat !== game.turn || game.stage !== 'color') return fail(res, 'It is not your colored-die step.');
      if (game.colorUsed) return fail(res, 'You already used the colored action this round.');
      const white = Number(body.white), color = String(body.color || '');
      if (!game.dice.white.includes(white) || !addMark(seat, color, white + game.dice[color])) return fail(res, 'That box is not available.');
      game.colorUsed = true;
      return send(res, { state: snapshot(seat) });
    }
    if (action === 'end') {
      if (seat !== game.turn || game.stage !== 'color') return fail(res, 'Only the active player can end this turn.');
      nextTurn();
      return send(res, { state: snapshot(seat) });
    }
    return fail(res, 'Unknown action.');
  });

  const requested = url.pathname === '/' ? '/qwixx.html' : url.pathname;
  const file = path.resolve(__dirname, `.${requested}`);
  if (!file.startsWith(__dirname) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  const contentType = path.extname(file) === '.html' ? 'text/html; charset=utf-8' : 'application/octet-stream';
  if (requested === '/qwixx.html') {
    // Keep the Qwixx page's visual language aligned with the other Game Night tables.
    const page = fs.readFileSync(file, 'utf8')
      .replace('FIVE CROWNS', 'QWIXX')
      .replace('Three players · eleven rounds · lowest score wins', 'Three players · shared-dice table')
      .replace('<div class="qwixx">Qwixx</div>', '')
      .replace('>♛<', '>⚄<');
    res.writeHead(200, { 'Content-Type': contentType });
    return res.end(page);
  }
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(file).pipe(res);
});
server.listen(PORT, '0.0.0.0', () => console.log(`Qwixx listening on 0.0.0.0:${PORT}`));

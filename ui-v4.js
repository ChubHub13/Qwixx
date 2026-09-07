(() => {
  const names = ['Daryl', 'Cristi', 'Cindy'];
  const colors = ['red', 'yellow', 'green', 'blue'];
  const avatars = { Daryl: '/daryl-avatar.png', Cristi: '/cristi-avatar.png', Cindy: '/cindy-avatar.png' };
  const up = new Set(['red', 'yellow']);
  const vals = color => up.has(color) ? [2,3,4,5,6,7,8,9,10,11,12] : [12,11,10,9,8,7,6,5,4,3,2];
  let token = localStorage.getItem('juddQwixxToken') || '';
  let state;
  let lastRollSignature = '';
  let diceLayout = { white: [], colors: [] };

  document.body.innerHTML = `<style>
    :root{--gold:#f6d66d;--purple:#260d31;--line:#59305f;--red:#a41e2a;--yellow:#a8880e;--green:#16734f;--blue:#245ea5}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 58% 42%,#176051 0,#071615 54%,#06030a 100%);color:#faebd2;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}button{font:inherit;cursor:pointer}button:disabled{cursor:not-allowed;opacity:.45}.top{height:61px;background:#08040c;border-bottom:1px solid #503053;display:flex;align-items:center;padding:8px 15px;gap:11px}.mark{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#351443;border:1px solid #72447b;color:var(--gold);font-size:24px}.title{font:900 30px Georgia,serif;color:#fff0b9;text-shadow:1px 2px #956039}.title small{font:italic 11px system-ui;color:#cbb8a1;display:block;text-shadow:none}.spacer{flex:1}.settings,.return{border:1px solid #77517e;border-radius:11px;background:#26112d;color:#fff0cf;padding:8px 12px;font-weight:800}.shell{display:grid;grid-template-columns:217px 1fr;min-height:calc(100vh - 61px)}.side{padding:7px 5px;background:linear-gradient(180deg,#110714,#210b29);border-right:2px solid #34133c}.panel{padding:13px;border:1px solid #513052;border-radius:17px;background:#100914;margin-bottom:9px}.round{text-align:center}.eyebrow{font-size:10px;letter-spacing:1px;font-weight:900;color:#c7b19e}.round b{display:block;font:900 27px Georgia,serif;color:#ffe89a}.round span{font-size:11px;color:#c9b7bd}.score-title{margin:0 0 9px;font-size:10px;letter-spacing:1px;color:#c7b19e}.person{display:flex;justify-content:space-between;padding:8px 1px;font-size:13px;font-weight:900}.person small{display:block;font-size:10px;color:#b99fb2}.side-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.side-actions button{padding:11px 5px;border-radius:11px;border:1px solid #714277;background:#3a1949;color:#fff2d4;font-weight:900}.side-actions #start{background:#933447;border-color:#ba5d6b}.table{position:relative;margin:5px;border:4px solid #2b102f;border-radius:32px;min-height:765px;overflow:hidden;background:repeating-linear-gradient(115deg,#075044 0,#075044 2px,#06433a 2px,#06433a 5px)}.roll{position:absolute;left:50%;top:50%;z-index:3;transform:translate(-50%,-50%);width:310px;min-height:150px;padding:16px;border-radius:18px;background:#073a34e8;border:1px solid #227061;text-align:center;box-shadow:0 9px 28px #001a16cc}.roll h2{margin:0 0 13px;font:900 20px Georgia,serif;color:#ffea9d}.dice{display:flex;justify-content:center;gap:11px;flex-wrap:wrap}.die{width:53px;height:53px;padding:8px;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);border-radius:14px;background:#faf7ec;box-shadow:inset -4px -5px #c9c1ad,2px 4px #001a16;transform:rotate(-7deg)}.die:nth-child(2){transform:translateY(-5px) rotate(8deg)}.die:nth-child(3){transform:translateY(3px) rotate(-9deg)}.die.red{background:var(--red)}.die.yellow{background:var(--yellow)}.die.green{background:var(--green)}.die.blue{background:var(--blue)}.pip{width:8px;height:8px;margin:auto;border-radius:50%;background:#20242a}.die:not(.white) .pip{background:#fff}.seats{position:absolute;inset:0;z-index:2;pointer-events:none}.seat{position:absolute;display:flex;gap:8px;align-items:center;padding:7px 10px;border-radius:11px;background:#09070d;border:1px solid #1d1322}.seat i{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#deb44e;color:#1d1607;font-style:normal;font-weight:900}.seat b{font-size:12px;display:block}.seat.s0{top:16px;left:50%;transform:translateX(-50%)}.seat.s1{top:260px;left:16px}.seat.s2{bottom:68px;left:16px}.boards{position:absolute;inset:75px 14px 18px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:225px 1fr 235px;gap:10px;pointer-events:none}.board{pointer-events:auto;width:92%;align-self:start;background:#f7f4e7;border:4px solid #e4e0d0;padding:7px;box-shadow:0 6px 17px #001913b0;color:#fff}.board.top-left{justify-self:start}.board.top-right{justify-self:end}.board.bottom{grid-column:1/3;grid-row:3;width:46%;justify-self:center;align-self:end}.board.you{outline:3px solid var(--gold)}.board-head{display:flex;justify-content:space-between;color:#26251f;font-size:11px;font-weight:900;margin:0 2px 5px}.row{display:grid;grid-template-columns:17px repeat(11,minmax(10px,1fr));gap:2px;margin:3px 0}.row i{height:28px;background:#111;clip-path:polygon(0 0,100% 50%,0 100%)}.cell{height:28px;padding:0;border:1px solid #ffffff44;border-radius:3px;font-size:11px;font-weight:900;color:white}.row.red .cell{background:var(--red)}.row.yellow .cell{background:var(--yellow)}.row.green .cell{background:var(--green)}.row.blue .cell{background:var(--blue)}.cell.mark{background:#191d21!important;color:#fff}.cell.live:hover:not(:disabled){filter:brightness(1.35);outline:2px solid #fff}.board-foot{display:flex;justify-content:space-between;align-items:center;color:#292923;font-size:11px;font-weight:900;padding:5px 2px 0}.pass{border:0;border-radius:6px;background:#35203b;color:#fff;padding:5px 8px;font-size:11px;font-weight:900}.modal{position:fixed;inset:0;z-index:10;display:grid;place-items:center;padding:18px;background:#020305df}.modal.hide{display:none}.modal-card{width:min(780px,100%);padding:20px 18px 17px;border:1px solid #8d6638;border-radius:18px;background:linear-gradient(#280c32,#160717);box-shadow:0 22px 80px #000;text-align:center}.modal h1{margin:0 0 37px;font:900 30px Georgia,serif;color:#ffeda4}.players{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.players button{padding:22px 8px;border:1px solid #955978;border-radius:13px;background:#41194c;color:#fff0a4;font:900 22px Georgia,serif}.pop{position:fixed;z-index:8;right:17px;top:58px;width:280px;padding:14px;border:1px solid #816047;border-radius:14px;background:#170a1b;box-shadow:0 15px 45px #000}.pop.hide{display:none}.pop h2{margin:0 0 9px;color:#ffeca4;font:900 20px Georgia,serif}.option{display:block;padding:9px;margin:7px 0;border-radius:8px;font-size:13px;font-weight:800}.option:has(input:checked){background:#371743}.return{position:fixed;right:17px;bottom:14px;z-index:7;border-radius:999px}.toast{position:fixed;z-index:20;bottom:64px;left:50%;transform:translateX(-50%);background:#9d3948;color:#fff;padding:10px 14px;border-radius:9px;display:none}.toast.show{display:block}@media(max-width:850px){.shell{grid-template-columns:1fr}.side{display:none}.board{width:100%}.board.bottom{width:68%}.table{min-height:850px}.seat.s1{top:280px}}@media(max-width:580px){.title{font-size:24px}.mark{display:none}.table{min-height:770px}.boards{inset:80px 4px 10px;grid-template-rows:180px 1fr 185px}.board{padding:4px;border-width:2px}.board.bottom{width:77%}.row{grid-template-columns:11px repeat(11,minmax(8px,1fr));gap:1px}.row i,.cell{height:22px}.cell{font-size:8px}.roll{width:280px;padding:11px}.die{width:43px;height:43px;padding:6px}.players{grid-template-columns:1fr}.modal h1{margin-bottom:15px}.seat{display:none}}
  </style><header class="top"><div class="mark">⚄</div><div class="title">QWIXX<small>Three players · shared-dice table</small></div><i class="spacer"></i><button class="settings" id="settingsButton">Settings</button></header><div class="shell"><aside class="side"><section class="panel round"><b id="round">Waiting</b><span id="roundHint">Choose a player to begin</span></section><section class="panel"><h2 class="score-title">SCORE · HIGH WINS</h2><div id="people"></div></section><div class="side-actions"><button id="start">Start<br>Game</button></div></aside><main class="table"><div class="seats" id="seats"></div><div class="boards" id="boards"></div><section class="roll" id="roll"></section></main></div><section class="pop hide" id="settings"><h2>Table settings</h2><label class="option"><input name="count" type="radio" value="2"> 2 white dice</label><label class="option"><input name="count" type="radio" value="3"> 3 white dice</label><label class="option"><input name="count" type="radio" value="all3" checked> 3 white dice · can use all 3</label></section><section class="modal" id="modal"><div class="modal-card"><h1>Choose Your Player</h1><div class="players" id="players"></div></div></section><button class="return" id="return">← Game Night</button><div class="toast" id="toast"></div>`;
  document.body.insertAdjacentHTML('beforeend', `<style>
    .roll{width:430px!important;min-height:270px!important;padding:22px!important}.roll .dice{display:flex!important;flex-direction:column!important;align-items:center!important;gap:13px!important}.roll .dice-row{display:flex!important;width:100%;justify-content:center;gap:14px;flex-wrap:nowrap}.roll .die{transform:translate(var(--x,0px),var(--y,0px)) rotate(var(--r,0deg))}.roll .die[data-reroll]{cursor:pointer;outline:3px solid #f8dd7a;outline-offset:3px}.roll .dice.new-roll .die{animation:roll-in .72s cubic-bezier(.2,.8,.2,1) var(--delay,0s) both}@keyframes roll-in{0%{opacity:0;transform:translate(0,-70px) rotate(-110deg)}65%{opacity:1;transform:translate(0,7px) rotate(13deg)}100%{opacity:1;transform:translate(var(--x,0px),var(--y,0px)) rotate(var(--r,0deg))}}
    .seats{pointer-events:none}.seat{pointer-events:auto;height:auto!important;min-height:0!important}.seat .avatar{width:39px;height:39px;border-radius:50%;object-fit:cover;border:2px solid #deb44e;background:#deb44e}.seat.under-left{top:310px!important;bottom:auto!important;left:18px!important;right:auto!important;transform:none!important}.seat.under-right{top:310px!important;bottom:auto!important;right:18px!important;left:auto!important;transform:none!important}.seat.beside-bottom{top:auto!important;bottom:55px!important;right:calc(50% - 32vw)!important;left:auto!important;transform:none!important}.row{grid-template-columns:repeat(11,minmax(9px,1fr)) 25px 36px!important;gap:2px!important}.row>i{display:none}.row-score,.row-lock{display:grid;place-items:center;border-radius:7px;background:#151619;color:#fff;font-size:14px;font-weight:900}.row-lock{background:#f7f4e7;border:1px solid #999;color:#111;font-size:14px}.row-lock img{width:15px;height:15px;object-fit:contain}.cell{font-size:18px!important;font-weight:900!important;opacity:1!important;border-radius:7px!important;color:#fff!important;text-shadow:none!important}.cell.mark{width:100%!important;height:28px!important;min-width:0!important;box-sizing:border-box!important;background:#aeaeae!important;text-shadow:none!important;font-size:18px!important}.row.red .cell.mark,.row.yellow .cell.mark,.row.green .cell.mark,.row.blue .cell.mark{background:#aeaeae!important}.row.red .cell.mark{color:var(--red)!important}.row.yellow .cell.mark{color:var(--yellow)!important}.row.green .cell.mark{color:var(--green)!important}.row.blue .cell.mark{color:var(--blue)!important}
    .cell,.cell.mark{text-shadow:none!important}.cell.mark{height:28px!important;min-width:0!important}.board-foot{min-height:38px}.side-actions{grid-template-columns:1fr}.seat-done{margin-left:3px;border:1px solid #a17b43;border-radius:6px;background:#391943;color:#fff1b9;padding:4px 7px;font-size:10px;font-weight:900}.done{display:block;margin:18px auto 0;border:1px solid #9c7b42;border-radius:8px;background:#311a37;color:#fff4c7;padding:9px 28px;font-weight:900}
  </style>`);
  const $ = s => document.querySelector(s);
  document.body.insertAdjacentHTML('beforeend', `<style>
    .cell.recent{outline:3px solid #000!important;outline-offset:-3px}.row-lock{opacity:.2}.row.closable .row-lock,.row.locked .row-lock{opacity:1}.row.locked.red .cell:not(.mark){background:#fff!important;color:var(--red)!important}.row.locked.yellow .cell:not(.mark){background:#fff!important;color:var(--yellow)!important}.row.locked.green .cell:not(.mark){background:#fff!important;color:var(--green)!important}.row.locked.blue .cell:not(.mark){background:#fff!important;color:var(--blue)!important}.row.locked.red .row-lock{background:var(--red)!important}.row.locked.yellow .row-lock{background:var(--yellow)!important}.row.locked.green .row-lock{background:var(--green)!important}.row.locked.blue .row-lock{background:var(--blue)!important}.row.locked .row-lock img{filter:invert(1)}
    .winner{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#020305d9}.winner-card{position:relative;width:min(500px,92vw);overflow:hidden;padding:30px;border:2px solid #e9ca68;border-radius:20px;background:linear-gradient(145deg,#361142,#150819);text-align:center;box-shadow:0 25px 80px #000}.winner-card h1{margin:0 0 15px;color:#ffeb9a;font:900 34px Georgia,serif}.winner-score{display:flex;justify-content:space-between;padding:9px;border-bottom:1px solid #724779;font-weight:800}.winner-card button{margin-top:20px;border:1px solid #ba8e3e;border-radius:9px;background:#9a394c;color:#fff6d2;padding:10px 20px;font-weight:900}.confetti{position:absolute;width:9px;height:15px;top:-20px;animation:fall 2.5s linear 1 forwards}@keyframes fall{to{transform:translateY(460px) rotate(740deg);opacity:0}}
    @media (min-width:581px){.shell{min-height:calc(100svh - 61px)}.table{height:calc(100svh - 69px);min-height:0!important;margin:4px;border-radius:24px}.boards{inset:12px 10px 8px;grid-template-rows:165px 1fr 170px;gap:7px}.board{width:83%;padding:4px;border-width:3px}.board.bottom{width:70%}.row{margin:2px 0}.cell,.cell.mark{height:24px!important;font-size:16px!important}.row-score,.row-lock{height:24px;font-size:12px}.row-lock img{width:13px;height:13px}.board-foot{min-height:28px;padding-top:2px}.seat.under-left{top:178px!important}.seat.under-right{top:178px!important}.seat.beside-bottom{bottom:22px!important;left:max(12px,calc(15% - 130px))!important;right:auto!important}.roll{width:370px!important;min-height:195px!important;padding:14px!important}.roll h2{margin-bottom:8px}.roll .die{width:46px;height:46px;padding:7px}.roll .dice{gap:12px}}
    @media (max-width:700px) and (orientation:portrait){html,body{overflow:hidden}body>*{visibility:hidden}body::after{content:'Turn your phone sideways to play Qwixx';visibility:visible;position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:36px;background:#07050a;color:#ffeca4;text-align:center;font:900 26px Georgia,serif}}
    @media (max-height:560px) and (orientation:landscape){body{overflow:hidden}.top{height:47px;padding:4px 10px}.mark{width:35px;height:35px;font-size:19px}.title{font-size:24px}.title small{font-size:9px}.shell{min-height:calc(100svh - 47px)}.table{height:calc(100svh - 51px);min-height:0!important;margin:2px;border-width:2px;border-radius:18px}.boards{inset:23px 6px 5px;grid-template-rows:110px 1fr 115px;gap:4px}.board{width:97%;padding:2px;border-width:2px}.board.bottom{width:55%}.row{margin:1px 0;grid-template-columns:repeat(11,minmax(7px,1fr)) 19px 27px!important;gap:1px!important}.cell,.cell.mark{height:18px!important;font-size:12px!important;border-radius:4px!important}.row-score,.row-lock{height:18px;border-radius:4px;font-size:10px}.row-lock img{width:11px;height:11px}.board-foot{min-height:21px;padding:1px 0 0;font-size:9px}.pass{padding:3px 5px;font-size:9px}.seat{padding:4px 6px;gap:5px}.seat i{width:25px;height:25px;font-size:11px}.seat .avatar{width:29px;height:29px}.seat b{font-size:10px}.seat.under-left{top:137px!important;left:8px!important}.seat.under-right{top:137px!important;right:8px!important}.seat.beside-bottom{bottom:14px!important;left:auto!important;right:calc(50% - 35vw)!important}.seat-done{padding:3px 5px;font-size:8px}.roll{width:330px!important;min-height:145px!important;padding:9px!important}.roll h2{margin:0 0 6px;font-size:16px}.roll .die{width:37px;height:37px;padding:5px;border-radius:10px}.roll .pip{width:6px;height:6px}.roll .dice{gap:10px}.done{margin:8px auto 0;padding:5px 18px}.settings{padding:6px 9px}.return{right:7px;bottom:6px;padding:6px 9px;font-size:10px}}
  </style>`);
  const say = text => { $('#toast').textContent = text; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 3200); };
  async function api(path, body) {
    const res = await fetch(path, { method: body ? 'POST' : 'GET', headers: body ? {'Content-Type':'application/json'} : {}, body: body ? JSON.stringify({...body, token}) : undefined });
    const json = await res.json().catch(() => ({error:'The table did not respond.'}));
    if (!res.ok) throw Error(json.error || 'The table did not respond.');
    return json;
  }
  const pips = n => ({1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[1,3],[3,1],[3,3]],5:[[1,1],[1,3],[2,2],[3,1],[3,3]],6:[[1,1],[2,1],[3,1],[1,3],[2,3],[3,3]]}[n]).map(([r,c])=>`<i class="pip" style="grid-row:${r};grid-column:${c}"></i>`).join('');
  const die = ({value,color='white',rerollIndex=null,x=0,y=0,rotate=0,delay=0}) => `<i class="die ${color}" style="--x:${x}px;--y:${y}px;--r:${rotate}deg;--delay:${delay}s" ${rerollIndex === null ? '' : `data-reroll="${rerollIndex}"`}>${pips(value)}</i>`;
  function boardOrder(){ const others=state.seats.filter(s=>s.seat!==state.you); return [...others, state.seats[state.you]]; }
  function render() {
    if (!state) return;
    $('#round').textContent=`Game ${state.gameNumber}`;
    $('#roundHint').textContent=state.phase==='waiting'?'One player can start the game.':`${names[state.turn]}'s roll`;
    $('.score-title').textContent='GAMES WON';
    $('#people').innerHTML=state.seats.map(s=>`<div class="person"><span>${s.name}<small>${s.live?'Live':'Bot'}</small></span><b>${s.wins}</b></div>`).join('');
    $('#start').disabled=state.phase==='waiting'&&!state.seats.some(s=>s.live);
    $('#start').innerHTML=state.phase==='waiting'?'Start<br>Game':'New<br>Game';
    $('#seats').innerHTML=state.seats.map(s=>`<div class="seat s${s.seat}"><img class="avatar" src="${avatars[s.name]}" alt="${s.name}"><b>${s.name}</b></div>`).join('');
    boardOrder().forEach((seat, index) => {
      const chip = $('.seat.s' + seat.seat);
      chip?.classList.add(seat.seat === state.you ? 'beside-bottom' : index === 0 ? 'under-left' : 'under-right');
    });
    if (state.phase==='playing'&&state.stage==='shared'&&!state.sharedDone[state.you]) $('.seat.s'+state.you)?.insertAdjacentHTML('beforeend','<button class="seat-done" id="seatDone">Done</button>');
    const title=state.phase==='waiting'?'Dice will roll here':`${names[state.turn]}'s roll`;
    const nextRoll=state.phase==='playing'&&state.stage==='awaitingRoll'&&state.turn===state.you;
    const rollSignature = state.dice ? String(state.rollId ?? JSON.stringify(state.dice)) : '';
    const newRoll = rollSignature !== lastRollSignature;
    lastRollSignature = rollSignature;
    const canReroll = state.phase==='playing' && state.stage==='shared' && state.turn===state.you && !state.sharedUsed[state.you] && !state.sharedDone[state.you] && state.dice?.white?.length===3 && (state.cyclingDie !== null || new Set(state.dice.white).size===1);
    if (state.dice && newRoll) {
      const arrangeDice = (entries, fallback) => (entries || fallback).map((entry, index) => ({
        ...entry, x: entry.x ?? 0, y: entry.y ?? 0, rotate: entry.rotate ?? 0, delay: entry.delay ?? index * .07
      }));
      diceLayout = {
        white: arrangeDice(state.diceLayout?.white, state.dice.white.map((_, index) => ({ index }))).map(entry => ({ ...entry, value: state.dice.white[entry.index], color: 'white', rerollIndex: canReroll && (state.cyclingDie === null || state.cyclingDie === entry.index) ? entry.index : null })),
        colors: arrangeDice(state.diceLayout?.colors, colors.filter(color => !state.locked[color] && state.dice[color] !== undefined).map(color => ({ color }))).map(entry => ({ ...entry, value: state.dice[entry.color] }))
      };
    }
    $('#roll').innerHTML=`<h2>${title}</h2>${state.dice?`<div class="dice ${newRoll?'new-roll':''}"><div class="dice-row white-dice">${diceLayout.white.map(die).join('')}</div><div class="dice-row color-dice">${diceLayout.colors.map(die).join('')}</div></div>`:''}${nextRoll?'<button class="done" id="nextRoll">Next roll</button>':''}`;
    $('#boards').innerHTML=boardOrder().map((s,index)=>{
      const sheet=state.sheets[s.seat], mine=s.seat===state.you, pos=mine?'bottom':index===0?'top-left':'top-right';
      return `<section class="board ${pos} ${mine?'you':''}"><div class="board-head"><span>${s.name}</span><span>${state.phase==='gameover'?`${s.score} points`:''}</span></div>${colors.map(color=>`<div class="row ${color}"><i></i>${vals(color).map((value,i)=>`<button class="cell ${sheet.marks[color].includes(i)?'mark':''} ${mine?'live':''}" data-color="${color}" data-index="${i}" data-value="${value}" ${mine&&!sheet.marks[color].includes(i)&&!state.locked[color]?'':'disabled'}>${sheet.marks[color].includes(i)?'✕':value}</button>`).join('')}</div>`).join('')}<div class="board-foot"><span>${state.phase==='gameover'?`Score: ${s.score}`:'Penalties: '+sheet.penalties+'/4'}</span>${mine&&s.seat===state.turn&&state.phase==='playing'?`<button class="pass" data-pass="${state.stage}">${state.stage==='shared'?'Use color':'−5 penalty'}</button>`:''}</div></section>`;
    }).join('');
    document.querySelectorAll('.board').forEach((board, index) => {
      const seat = boardOrder()[index], sheet = state.sheets[seat.seat];
      board.querySelectorAll('.row').forEach((row, colorIndex) => {
        const count = sheet.marks[colors[colorIndex]].length + (sheet.locks?.[colors[colorIndex]] ? 1 : 0);
        const color = colors[colorIndex];
        if (state.locked[color]) row.classList.add('locked');
        if (!state.locked[color] && sheet.marks[color].length >= state.closeRequirement) row.classList.add('closable');
        (state.highlights?.[seat.seat] || []).filter(mark => mark.color === color).forEach(mark => {
          row.querySelector(`.cell[data-index="${mark.index}"]`)?.classList.add('recent');
        });
        row.insertAdjacentHTML('beforeend', `<span class="row-lock"><img src="/lock-symbol.png" alt="Lock"></span><span class="row-score">${count * (count + 1) / 2}</span>`);
      });
    });
    document.querySelectorAll('.board-head').forEach(header => header.remove());
    document.querySelectorAll('.board-foot span').forEach((element, index) => {
      const seat = boardOrder()[index];
      const whites = state.sheets[seat.seat].penalties;
      element.textContent = `Whites: ${whites}/4 (${whites ? `−${whites * 5}` : '0'} points)`;
    });
    document.querySelectorAll('.cell.live').forEach(button=>button.onclick=()=>choose(button.dataset.color,Number(button.dataset.value)));
    document.querySelectorAll('.board.you .cell.mark.recent').forEach(button => { button.disabled = false; button.onclick = () => act({action:'undo',color:button.dataset.color,index:Number(button.dataset.index)}); });
    document.querySelectorAll('[data-pass]').forEach(button => {
      if (state.stage !== 'shared' || state.sharedUsed?.[state.you] || state.colorUsed) button.remove();
      else button.textContent = 'TAKE WHITE';
    });
    $('#seatDone')?.addEventListener('click',()=>act({action:'done'}));
    $('#nextRoll')?.addEventListener('click',()=>act({action:'nextRoll'}));
    document.querySelectorAll('[data-reroll]').forEach(die => die.addEventListener('click',()=>act({action:'reroll',index:Number(die.dataset.reroll)})));
    document.querySelectorAll('[data-pass]').forEach(button=>button.onclick=()=>act({action:'penalty'}));
    document.querySelectorAll('[name="count"]').forEach(x=>{x.checked=state.settings.allThree?x.value==='all3':Number(x.value)===state.settings.communityDice;x.disabled=false});
    renderWinner();
  }
  function renderWinner() {
    if (state.phase !== 'gameover') { document.querySelector('#winner')?.remove(); return; }
    if (document.querySelector('#winner')) return;
    const ranked = [...state.seats].sort((a, b) => b.score - a.score);
    const winner = ranked[0];
    const colorsForConfetti = ['#f7d86d', '#d94a55', '#42ad80', '#418fd0'];
    const confetti = Array.from({ length: 44 }, (_, i) => `<i class="confetti" style="left:${(i * 23) % 100}%;background:${colorsForConfetti[i % colorsForConfetti.length]};animation-delay:${(i % 11) * .08}s"></i>`).join('');
    document.body.insertAdjacentHTML('beforeend', `<section class="winner" id="winner"><div class="winner-card">${confetti}<h1>${winner.name} wins!</h1>${ranked.map(player => `<div class="winner-score"><span>${player.name}</span><strong>${player.score} points</strong></div>`).join('')}<button id="playAgain">Play again</button></div></section>`);
    $('#playAgain').onclick = () => act({ action: 'newGame' });
  }
  async function choose(color,value) {
    if (state.phase!=='playing') return;
    try {
      if (state.stage==='shared') {
        const options=[];
        state.dice.white.forEach((a,i)=>state.dice.white.forEach((b,j)=>j>i&&options.push({key:`${i}-${j}`,sum:a+b})));
        if (state.settings.allThree) options.push({key:'all-three',sum:state.dice.white.reduce((sum, die)=>sum+die,0)});
        const pick=options.find(x=>x.sum===value);
        const colorWhite = state.turn===state.you && (state.sharedUsed[state.you] || !pick) && !state.colorUsed && state.dice.white.find(white => white + state.dice[color] === value);
        if (colorWhite) {
          state = (await api('/api/action',{action:'color',white:colorWhite,color})).state;
          render();
          return;
        }
        if(!pick) return say('That number does not match the white dice.');
        state=(await api('/api/action',{action:'shared',option:pick.key,color})).state;
      } else {
        if(state.turn!==state.you) return say('It is not your roll.');
        const white=state.dice.white.find(n=>n+state.dice[color]===value); if(!white) return say('That number does not match this colored die.');
        state=(await api('/api/action',{action:'color',white,color})).state;
      }
      render();
    } catch(e) { say(e.message); load(); }
  }
  async function act(body){try{state=(await api('/api/action',body)).state;render()}catch(e){say(e.message);load()}}
  async function load(){try{state=(await api(`/api/state?token=${encodeURIComponent(token)}`)).state;$('#modal').classList.add('hide');render()}catch{token='';localStorage.removeItem('juddQwixxToken');$('#modal').classList.remove('hide')}}
  async function join(name){try{const x=await api('/api/join',{name});token=x.token;localStorage.setItem('juddQwixxToken',token);state=x.state;$('#modal').classList.add('hide');render()}catch(e){say(e.message)}}
  $('#players').innerHTML=names.map(n=>`<button>${n}</button>`).join(''); document.querySelectorAll('#players button').forEach((b,i)=>b.onclick=()=>join(names[i]));
  $('#start').onclick=()=>act({action:state?.phase==='waiting'?'start':'newGame'});
  $('#settingsButton').onclick=()=>$('#settings').classList.toggle('hide'); document.querySelectorAll('[name="count"]').forEach(x=>x.onchange=async()=>{await act({action:'settings',mode:x.value});$('#settings').classList.add('hide')});
  const gameNight=new URLSearchParams(location.hash.slice(1)).get('gameNight')||'https://judd-game-night.onrender.com/'; $('#return').onclick=()=>location.assign(gameNight);
  load(); setInterval(()=>token&&load(),1500);
})();

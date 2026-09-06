(() => {
  const names = ['Daryl', 'Cristi', 'Cindy'];
  const colors = ['red', 'yellow', 'green', 'blue'];
  const up = new Set(['red', 'yellow']);
  const vals = color => up.has(color) ? [2,3,4,5,6,7,8,9,10,11,12] : [12,11,10,9,8,7,6,5,4,3,2];
  let token = localStorage.getItem('juddQwixxToken') || '';
  let state;
  let lastRollSignature = '';

  document.body.innerHTML = `<style>
    :root{--gold:#f6d66d;--purple:#260d31;--line:#59305f;--red:#a41e2a;--yellow:#a8880e;--green:#16734f;--blue:#245ea5}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 58% 42%,#176051 0,#071615 54%,#06030a 100%);color:#faebd2;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}button{font:inherit;cursor:pointer}button:disabled{cursor:not-allowed;opacity:.45}.top{height:61px;background:#08040c;border-bottom:1px solid #503053;display:flex;align-items:center;padding:8px 15px;gap:11px}.mark{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#351443;border:1px solid #72447b;color:var(--gold);font-size:24px}.title{font:900 30px Georgia,serif;color:#fff0b9;text-shadow:1px 2px #956039}.title small{font:italic 11px system-ui;color:#cbb8a1;display:block;text-shadow:none}.spacer{flex:1}.settings,.return{border:1px solid #77517e;border-radius:11px;background:#26112d;color:#fff0cf;padding:8px 12px;font-weight:800}.shell{display:grid;grid-template-columns:217px 1fr;min-height:calc(100vh - 61px)}.side{padding:7px 5px;background:linear-gradient(180deg,#110714,#210b29);border-right:2px solid #34133c}.panel{padding:13px;border:1px solid #513052;border-radius:17px;background:#100914;margin-bottom:9px}.round{text-align:center}.eyebrow{font-size:10px;letter-spacing:1px;font-weight:900;color:#c7b19e}.round b{display:block;font:900 27px Georgia,serif;color:#ffe89a}.round span{font-size:11px;color:#c9b7bd}.score-title{margin:0 0 9px;font-size:10px;letter-spacing:1px;color:#c7b19e}.person{display:flex;justify-content:space-between;padding:8px 1px;font-size:13px;font-weight:900}.person small{display:block;font-size:10px;color:#b99fb2}.side-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.side-actions button{padding:11px 5px;border-radius:11px;border:1px solid #714277;background:#3a1949;color:#fff2d4;font-weight:900}.side-actions #start{background:#933447;border-color:#ba5d6b}.table{position:relative;margin:5px;border:4px solid #2b102f;border-radius:32px;min-height:765px;overflow:hidden;background:repeating-linear-gradient(115deg,#075044 0,#075044 2px,#06433a 2px,#06433a 5px)}.roll{position:absolute;left:50%;top:50%;z-index:3;transform:translate(-50%,-50%);width:310px;min-height:150px;padding:16px;border-radius:18px;background:#073a34e8;border:1px solid #227061;text-align:center;box-shadow:0 9px 28px #001a16cc}.roll h2{margin:0 0 13px;font:900 20px Georgia,serif;color:#ffea9d}.dice{display:flex;justify-content:center;gap:11px;flex-wrap:wrap}.die{width:53px;height:53px;padding:8px;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);border-radius:14px;background:#faf7ec;box-shadow:inset -4px -5px #c9c1ad,2px 4px #001a16;transform:rotate(-7deg)}.die:nth-child(2){transform:translateY(-5px) rotate(8deg)}.die:nth-child(3){transform:translateY(3px) rotate(-9deg)}.die.red{background:var(--red)}.die.yellow{background:var(--yellow)}.die.green{background:var(--green)}.die.blue{background:var(--blue)}.pip{width:8px;height:8px;margin:auto;border-radius:50%;background:#20242a}.die:not(.white) .pip{background:#fff}.seats{position:absolute;inset:0;z-index:2;pointer-events:none}.seat{position:absolute;display:flex;gap:8px;align-items:center;padding:7px 10px;border-radius:11px;background:#09070d;border:1px solid #1d1322}.seat i{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#deb44e;color:#1d1607;font-style:normal;font-weight:900}.seat b{font-size:12px;display:block}.seat.s0{top:16px;left:50%;transform:translateX(-50%)}.seat.s1{top:260px;left:16px}.seat.s2{bottom:68px;left:16px}.boards{position:absolute;inset:75px 14px 18px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:225px 1fr 235px;gap:10px;pointer-events:none}.board{pointer-events:auto;width:92%;align-self:start;background:#f7f4e7;border:4px solid #e4e0d0;padding:7px;box-shadow:0 6px 17px #001913b0;color:#fff}.board.top-left{justify-self:start}.board.top-right{justify-self:end}.board.bottom{grid-column:1/3;grid-row:3;width:46%;justify-self:center;align-self:end}.board.you{outline:3px solid var(--gold)}.board-head{display:flex;justify-content:space-between;color:#26251f;font-size:11px;font-weight:900;margin:0 2px 5px}.row{display:grid;grid-template-columns:17px repeat(11,minmax(10px,1fr));gap:2px;margin:3px 0}.row i{height:28px;background:#111;clip-path:polygon(0 0,100% 50%,0 100%)}.cell{height:28px;padding:0;border:1px solid #ffffff44;border-radius:3px;font-size:11px;font-weight:900;color:white}.row.red .cell{background:var(--red)}.row.yellow .cell{background:var(--yellow)}.row.green .cell{background:var(--green)}.row.blue .cell{background:var(--blue)}.cell.mark{background:#191d21!important;color:#fff}.cell.live:hover:not(:disabled){filter:brightness(1.35);outline:2px solid #fff}.board-foot{display:flex;justify-content:space-between;align-items:center;color:#292923;font-size:11px;font-weight:900;padding:5px 2px 0}.pass{border:0;border-radius:6px;background:#35203b;color:#fff;padding:5px 8px;font-size:11px;font-weight:900}.modal{position:fixed;inset:0;z-index:10;display:grid;place-items:center;padding:18px;background:#020305df}.modal.hide{display:none}.modal-card{width:min(780px,100%);padding:20px 18px 17px;border:1px solid #8d6638;border-radius:18px;background:linear-gradient(#280c32,#160717);box-shadow:0 22px 80px #000;text-align:center}.modal h1{margin:0 0 37px;font:900 30px Georgia,serif;color:#ffeda4}.players{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.players button{padding:22px 8px;border:1px solid #955978;border-radius:13px;background:#41194c;color:#fff0a4;font:900 22px Georgia,serif}.pop{position:fixed;z-index:8;right:17px;top:58px;width:280px;padding:14px;border:1px solid #816047;border-radius:14px;background:#170a1b;box-shadow:0 15px 45px #000}.pop.hide{display:none}.pop h2{margin:0 0 9px;color:#ffeca4;font:900 20px Georgia,serif}.option{display:block;padding:9px;margin:7px 0;border-radius:8px;font-size:13px;font-weight:800}.option:has(input:checked){background:#371743}.return{position:fixed;right:17px;bottom:14px;z-index:7;border-radius:999px}.toast{position:fixed;z-index:20;bottom:64px;left:50%;transform:translateX(-50%);background:#9d3948;color:#fff;padding:10px 14px;border-radius:9px;display:none}.toast.show{display:block}@media(max-width:850px){.shell{grid-template-columns:1fr}.side{display:none}.board{width:100%}.board.bottom{width:68%}.table{min-height:850px}.seat.s1{top:280px}}@media(max-width:580px){.title{font-size:24px}.mark{display:none}.table{min-height:770px}.boards{inset:80px 4px 10px;grid-template-rows:180px 1fr 185px}.board{padding:4px;border-width:2px}.board.bottom{width:77%}.row{grid-template-columns:11px repeat(11,minmax(8px,1fr));gap:1px}.row i,.cell{height:22px}.cell{font-size:8px}.roll{width:280px;padding:11px}.die{width:43px;height:43px;padding:6px}.players{grid-template-columns:1fr}.modal h1{margin-bottom:15px}.seat{display:none}}
  </style><header class="top"><div class="mark">⚄</div><div class="title">QWIXX<small>Three players · shared-dice table</small></div><i class="spacer"></i><button class="settings" id="settingsButton">Settings</button></header><div class="shell"><aside class="side"><section class="panel round"><div class="eyebrow">ROUND</div><b id="round">Waiting</b><span id="roundHint">Choose a player to begin</span></section><section class="panel"><h2 class="score-title">SCORE · HIGH WINS</h2><div id="people"></div></section><div class="side-actions"><button id="player">Player</button><button id="start">Start<br>Game</button></div></aside><main class="table"><div class="seats" id="seats"></div><div class="boards" id="boards"></div><section class="roll" id="roll"></section></main></div><section class="pop hide" id="settings"><h2>Table settings</h2><label class="option"><input name="count" type="radio" value="2"> 2 white dice</label><label class="option"><input name="count" type="radio" value="3" checked> 3 white dice</label></section><section class="modal" id="modal"><div class="modal-card"><h1>Choose Your Player</h1><div class="players" id="players"></div></div></section><button class="return" id="return">← Game Night</button><div class="toast" id="toast"></div>`;
  document.head.insertAdjacentHTML('beforeend', `<style>
    .roll{width:430px!important;min-height:270px!important;padding:22px!important}.roll .dice.new-roll .die{animation:roll-in .58s cubic-bezier(.2,.8,.2,1) both}.roll .die:nth-child(2){animation-delay:.07s}.roll .die:nth-child(3){animation-delay:.14s}.roll .die:nth-child(4){animation-delay:.21s}.roll .die:nth-child(5){animation-delay:.28s}.roll .die:nth-child(6){animation-delay:.35s}.roll .die:nth-child(7){animation-delay:.42s}@keyframes roll-in{0%{opacity:0;transform:translateY(-48px) rotate(-80deg)}65%{transform:translateY(7px) rotate(13deg)}100%{opacity:1}}
    .seats{pointer-events:none}.seat{pointer-events:auto;height:auto!important;min-height:0!important}.seat.under-left{top:310px!important;bottom:auto!important;left:18px!important;right:auto!important;transform:none!important}.seat.under-right{top:310px!important;bottom:auto!important;right:18px!important;left:auto!important;transform:none!important}.seat.beside-bottom{top:auto!important;bottom:55px!important;right:calc(50% - 32vw)!important;left:auto!important;transform:none!important}.row{grid-template-columns:repeat(11,minmax(9px,1fr)) 25px 36px!important;gap:2px!important}.row>i{display:none}.row-score,.row-lock{display:grid;place-items:center;border-radius:7px;background:#151619;color:#fff;font-size:14px;font-weight:900}.row-lock{background:#f7f4e7;border:1px solid #999;color:#111;font-size:14px}.row-lock img{width:15px;height:15px;object-fit:contain}.cell{font-size:18px!important;font-weight:900!important;opacity:1!important;border-radius:7px!important;color:#fff!important;text-shadow:none!important}.cell.mark{width:100%!important;height:28px!important;min-width:0!important;box-sizing:border-box!important;background:#aeaeae!important;text-shadow:none!important;font-size:18px!important}.row.red .cell.mark,.row.yellow .cell.mark,.row.green .cell.mark,.row.blue .cell.mark{background:#aeaeae!important}.row.red .cell.mark{color:var(--red)!important}.row.yellow .cell.mark{color:var(--yellow)!important}.row.green .cell.mark{color:var(--green)!important}.row.blue .cell.mark{color:var(--blue)!important}
    .cell,.cell.mark{text-shadow:none!important}.cell.mark{height:28px!important;min-width:0!important}.seat-done{margin-left:3px;border:1px solid #a17b43;border-radius:6px;background:#391943;color:#fff1b9;padding:4px 7px;font-size:10px;font-weight:900}.done{display:block;margin:18px auto 0;border:1px solid #9c7b42;border-radius:8px;background:#311a37;color:#fff4c7;padding:9px 28px;font-weight:900}
  </style>`);
  const $ = s => document.querySelector(s);
  document.querySelector('.eyebrow').textContent = 'GAMES';
  $('#settings').insertAdjacentHTML('beforeend', '<label class="option"><input name="count" type="radio" value="all3"> 3 white dice - can use all 3</label>');
  const say = text => { $('#toast').textContent = text; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 3200); };
  async function api(path, body) {
    const res = await fetch(path, { method: body ? 'POST' : 'GET', headers: body ? {'Content-Type':'application/json'} : {}, body: body ? JSON.stringify({...body, token}) : undefined });
    const json = await res.json().catch(() => ({error:'The table did not respond.'}));
    if (!res.ok) throw Error(json.error || 'The table did not respond.');
    return json;
  }
  const pips = n => ({1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[1,3],[3,1],[3,3]],5:[[1,1],[1,3],[2,2],[3,1],[3,3]],6:[[1,1],[2,1],[3,1],[1,3],[2,3],[3,3]]}[n]).map(([r,c])=>`<i class="pip" style="grid-row:${r};grid-column:${c}"></i>`).join('');
  const die = (n,color='white') => `<i class="die ${color}">${pips(n)}</i>`;
  function boardOrder(){ const others=state.seats.filter(s=>s.seat!==state.you); return [...others, state.seats[state.you]]; }
  function render() {
    if (!state) return;
    $('#round').textContent=`Game ${state.gameNumber}`;
    $('#roundHint').textContent=state.phase==='waiting'?'One player can start the game.':`${names[state.turn]}'s roll`;
    $('.score-title').textContent='GAMES WON';
    $('#people').innerHTML=state.seats.map(s=>`<div class="person"><span>${s.name}<small>${s.live?'Live':'Bot'}</small></span><b>${s.wins}</b></div>`).join('');
    $('#start').disabled=state.phase==='waiting'&&!state.seats.some(s=>s.live);
    $('#start').innerHTML=state.phase==='waiting'?'Start<br>Game':'New<br>Game';
    $('#seats').innerHTML=state.seats.map(s=>`<div class="seat s${s.seat}"><i>${s.name[0]}</i><b>${s.name}</b></div>`).join('');
    boardOrder().forEach((seat, index) => {
      const chip = $('.seat.s' + seat.seat);
      chip?.classList.add(seat.seat === state.you ? 'beside-bottom' : index === 0 ? 'under-left' : 'under-right');
    });
    if (state.phase==='playing'&&state.stage==='shared'&&!state.sharedDone[state.you]) $('.seat.s'+state.you)?.insertAdjacentHTML('beforeend','<button class="seat-done" id="seatDone">Done</button>');
    const title=state.phase==='waiting'?'Dice will roll here':`${names[state.turn]}'s roll`;
    const nextRoll=state.phase==='playing'&&state.stage==='awaitingRoll'&&state.turn===state.you;
    const rollSignature = state.dice ? JSON.stringify(state.dice) : '';
    const newRoll = rollSignature !== lastRollSignature;
    lastRollSignature = rollSignature;
    $('#roll').innerHTML=`<h2>${title}</h2>${state.dice?`<div class="dice ${newRoll?'new-roll':''}">${state.dice.white.map(n=>die(n)).join('')+colors.map(c=>die(state.dice[c],c)).join('')}</div>`:''}${nextRoll?'<button class="done" id="nextRoll">Next roll</button>':''}`;
    $('#boards').innerHTML=boardOrder().map((s,index)=>{
      const sheet=state.sheets[s.seat], mine=s.seat===state.you, pos=mine?'bottom':index===0?'top-left':'top-right';
      return `<section class="board ${pos} ${mine?'you':''}"><div class="board-head"><span>${s.name}</span><span>${state.phase==='gameover'?`${s.score} points`:''}</span></div>${colors.map(color=>`<div class="row ${color}"><i></i>${vals(color).map((value,i)=>`<button class="cell ${sheet.marks[color].includes(i)?'mark':''} ${mine?'live':''}" data-color="${color}" data-value="${value}" ${mine&&!sheet.marks[color].includes(i)?'':'disabled'}>${sheet.marks[color].includes(i)?'✕':value}</button>`).join('')}</div>`).join('')}<div class="board-foot"><span>${state.phase==='gameover'?`Score: ${s.score}`:'Penalties: '+sheet.penalties+'/4'}</span>${mine&&s.seat===state.turn&&state.phase==='playing'?`<button class="pass" data-pass="${state.stage}">${state.stage==='shared'?'Use color':'−5 penalty'}</button>`:''}</div></section>`;
    }).join('');
    document.querySelectorAll('.board').forEach((board, index) => {
      const seat = boardOrder()[index], sheet = state.sheets[seat.seat];
      board.querySelectorAll('.row').forEach((row, colorIndex) => {
        const count = sheet.marks[colors[colorIndex]].length;
        const color = colors[colorIndex];
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
    document.querySelectorAll('.board.you .cell.mark').forEach(button => { button.disabled = false; button.onclick = () => act({action:'undo'}); });
    document.querySelectorAll('[data-pass]').forEach(button => {
      if (state.stage !== 'shared') button.remove();
      else button.textContent = 'TAKE WHITE';
    });
    $('#seatDone')?.addEventListener('click',()=>act({action:'done'}));
    $('#nextRoll')?.addEventListener('click',()=>act({action:'nextRoll'}));
    document.querySelectorAll('[data-pass]').forEach(button=>button.onclick=()=>act({action:'penalty'}));
    document.querySelectorAll('[name="count"]').forEach(x=>{x.checked=state.settings.allThree?x.value==='all3':Number(x.value)===state.settings.communityDice;x.disabled=state.phase!=='waiting'});
  }
  async function choose(color,value) {
    if (state.phase!=='playing') return;
    try {
      if (state.stage==='shared') {
        const options=[];
        if (state.settings.allThree) options.push({key:'all-three',sum:state.dice.white.reduce((sum, die)=>sum+die,0)});
        else state.dice.white.forEach((a,i)=>state.dice.white.forEach((b,j)=>j>i&&options.push({key:`${i}-${j}`,sum:a+b})));
        const colorWhite = !state.settings.allThree && state.turn===state.you && !state.colorUsed && state.dice.white.find(white => white + state.dice[color] === value);
        if (colorWhite) {
          state = (await api('/api/action',{action:'color',white:colorWhite,color})).state;
          render();
          return;
        }
        const pick=options.find(x=>x.sum===value); if(!pick) return say('That number does not match the white dice.');
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
  $('#start').onclick=()=>act({action:state?.phase==='waiting'?'start':'newGame'}); $('#player').onclick=()=>{if(!token)$('#modal').classList.remove('hide');else say(`You are ${names[state.you]}.`)};
  $('#settingsButton').onclick=()=>$('#settings').classList.toggle('hide'); document.querySelectorAll('[name="count"]').forEach(x=>x.onchange=()=>act({action:'settings',mode:x.value}));
  const gameNight=new URLSearchParams(location.hash.slice(1)).get('gameNight')||'https://judd-game-night.onrender.com/'; $('#return').onclick=()=>location.assign(gameNight);
  load(); setInterval(()=>token&&load(),1500);
})();

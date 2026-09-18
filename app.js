import { tabataAt } from './engine.mjs';
const $ = id => document.getElementById(id);
const options = ['スクワット','プッシュアップ','マウンテンクライマー','ジャンピングジャック','バーピー','ハイニー','ランジ','プランク','クランチ','スケーター'];
let exercises = options.slice(0,4), mode='strength', set=1, state='idle', start=0, accumulated=0, restDuration=60000, lastPhase=-1, audio, wake;
const elapsed=()=>accumulated+(state==='running'?Date.now()-start:0);
function valid(id){const el=$(id), n=Number(el.value);if(!Number.isInteger(n)||n<Number(el.min)||n>Number(el.max)){ $('error').textContent=`${id==='rounds'?'セット数は1〜20':'休憩時間は1〜3600'}の整数で入力してください。`;el.focus();return false;} $('error').textContent='';return true;}
function initAudio(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch{}}
function beep(){
  if(!$('sound').checked||!audio||audio.state!=='running')return;
  try{
    const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;
    o.connect(g);g.connect(audio.destination);o.frequency.value=880;
    // Full-volume tone; brief fades prevent clicks at the edges.
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(1,now+.01);
    g.gain.setValueAtTime(1,now+.95);
    g.gain.linearRampToValueAtTime(0,now+1);
    o.onended=()=>{o.disconnect();g.disconnect();};
    o.start(now);o.stop(now+1);
  }catch{}
}
async function keepAwake(){try{if('wakeLock'in navigator&&state==='running'){const lock=await navigator.wakeLock.request('screen');if(state==='running')wake=lock;else await lock.release();}}catch{}}
function release(){if(wake){wake.release().catch(()=>{});wake=null;}}
function list(){ $('exercise-list').replaceChildren();exercises.forEach((name,i)=>{const row=document.createElement('div');row.className='exercise-row';const num=document.createElement('span');num.textContent=String(i+1).padStart(2,'0');const select=document.createElement('select');select.setAttribute('aria-label',`種目 ${i+1}`);options.forEach(x=>select.add(new Option(x,x,false,x===name)));select.onchange=()=>{exercises[i]=select.value;};const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label',`種目 ${i+1} を削除`);remove.onclick=()=>{exercises.splice(i,1);list();render();};row.append(num,select,remove);$('exercise-list').append(row);});}
function reset(){state='idle';accumulated=0;lastPhase=-1;set=1;release();render();}
function switchMode(next){if(state==='running'||state==='paused')return;mode=next;reset();}
$('strength-tab').onclick=()=>switchMode('strength');$('tabata-tab').onclick=()=>switchMode('tabata');
$('primary').onclick=()=>{initAudio();if(state==='running'){accumulated=elapsed();state='paused';release();}else if(state==='paused'){start=Date.now();state='running';keepAwake();}else{if(!valid(mode==='strength'?'rest-seconds':'rounds'))return;restDuration=Number($('rest-seconds').value)*1000;accumulated=0;start=Date.now();lastPhase=-1;state='running';keepAwake();if(mode==='tabata')beep();}render();};
$('reset').onclick=reset;$('stop').onclick=reset;
$('rest-seconds').oninput=()=>{document.querySelectorAll('[data-rest]').forEach(b=>b.classList.toggle('selected',b.dataset.rest===$('rest-seconds').value));};
document.querySelectorAll('[data-rest]').forEach(b=>b.onclick=()=>{$('rest-seconds').value=b.dataset.rest;$('rest-seconds').oninput();$('error').textContent='';});
$('rounds').oninput=()=>render();$('add-exercise').onclick=()=>{if(exercises.length<12){exercises.push(options[exercises.length%options.length]);list();render();}};
function render(){const busy=state==='running'||state==='paused',tabata=mode==='tabata';$('strength-tab').classList.toggle('active',!tabata);$('tabata-tab').classList.toggle('active',tabata);$('strength-tab').setAttribute('aria-pressed',String(!tabata));$('tabata-tab').setAttribute('aria-pressed',String(tabata));$('strength-tab').disabled=busy;$('tabata-tab').disabled=busy;$('strength-settings').hidden=tabata;$('tabata-settings').hidden=!tabata;$('mode-label').textContent=tabata?'TABATA':'STRENGTH';$('rest-seconds').disabled=busy;$('rounds').disabled=busy;document.querySelectorAll('[data-rest]').forEach(b=>b.disabled=busy);$('add-exercise').disabled=busy||exercises.length>=12;document.querySelectorAll('.exercise-row select').forEach(e=>e.disabled=busy);document.querySelectorAll('.exercise-row button').forEach(e=>e.disabled=busy||exercises.length===1);$('exercise-count').textContent=`${exercises.length}種目 / セット`;const seconds=exercises.length*Number($('rounds').value)*30;$('total-time').textContent=Number.isFinite(seconds)&&seconds>0?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'—';$('stop').hidden=!busy;$('reset').hidden=busy;$('reset').textContent=tabata?'最初からやり直す':'次の種目へ · セットをリセット';$('primary').textContent=state==='running'?'一時停止':state==='paused'?'再開する':tabata?(state==='done'?'もう一度スタート':'タバタをスタート'):'休憩をスタート';paint();}
function paint(){const tabata=mode==='tabata',busy=state==='running'||state==='paused';let rest=false,progress=0,status='トレーニング',title=`${set}セット目`,digits=String(set).padStart(2,'0'),unit='SET',next='セットが終わったら、休憩をスタート',session='自分のペースで';if(tabata){const t=tabataAt(elapsed(),exercises.length,Number($('rounds').value)||2);status=state==='done'?'トレーニング完了':busy?(t.rest?'休憩':'負荷'):'準備完了';title=state==='done'?'おつかれさまでした':exercises[t.index??0];digits=state==='done'?'00':String(busy?t.remaining:20).padStart(2,'0');unit='SECONDS';rest=busy&&t.rest;progress=state==='done'?1:busy?t.fraction:0;session=`セット ${state==='done'?$('rounds').value:t.round??1} / ${$('rounds').value}`;next=state==='done'?'すべてのセットが終了しました':busy?(t.rest?((t.index===exercises.length-1&&t.round===Number($('rounds').value))?'この休憩で終了':`次は ${exercises[(t.index+1)%exercises.length]}`):'20秒動いたら、10秒休憩'):'20秒の負荷からスタートします';document.querySelectorAll('.exercise-row').forEach((r,i)=>r.classList.toggle('current',busy&&i===t.index));}else if(busy){rest=true;status='休憩';digits=String(Math.max(0,Math.ceil((restDuration-elapsed())/1000))).padStart(2,'0');unit='SECONDS';progress=Math.min(1,elapsed()/restDuration);next=`休憩が終わると ${set+1}セット目へ`;}if(state==='paused')status+=' · 一時停止';document.body.classList.toggle('rest',rest);$('status').textContent=status;$('exercise-title').textContent=title;$('digits').textContent=digits;$('unit').textContent=unit;$('next-label').textContent=next;$('session-label').textContent=session;$('dial').style.setProperty('--progress',`${progress*360}deg`);}
function tick(){if(state!=='running')return;if(mode==='strength'){if(elapsed()>=restDuration){set++;state='idle';accumulated=0;release();beep();render();return;}}else{const t=tabataAt(elapsed(),exercises.length,Number($('rounds').value));if(t.done){state='done';accumulated=t.total;release();beep();render();return;}if(t.phase!==lastPhase){if(lastPhase!==-1)beep();lastPhase=t.phase;}}paint();}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){tick();keepAwake();}});list();render();setInterval(tick,100);

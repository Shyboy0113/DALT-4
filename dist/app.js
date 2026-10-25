'use strict';
const $=id=>document.getElementById(id);
const spriteMarkup='<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#000" d="M16 1 31 16 16 31 1 16Z"/><path fill="#fff" d="M14.5 9h3v14h-3Z"/></svg>';
const board=$('puzzleBoard'),demo=document.querySelector('.demo-column');
let state=Puzzle.create(),flashTimer=null;
function gridPosition(el,p){el.style.gridColumn=String(p[0]+1);el.style.gridRow=String(p[1]+1);}
for(const p of Puzzle.path){const t=document.createElement('div');t.className='tile'+(p[0]===Puzzle.goal[0]&&p[1]===Puzzle.goal[1]?' goal':'');gridPosition(t,p);board.append(t);}
const actor=document.createElement('div');actor.className='actor';actor.innerHTML='<span class="sprite">'+spriteMarkup+'</span><span class="direction-arrow" aria-hidden="true"><svg viewBox="0 0 70 26"><path d="M12 13H49M42 6l7 7-7 7"/></svg></span>';board.append(actor);
const threesPath=[];for(let x=0;x<=5;x++)threesPath.push([x,3]);for(let y=2;y>=0;y--)threesPath.push([5,y]);for(let x=6;x<=8;x++)threesPath.push([x,0]);threesPath.push([8,1],[9,1],[10,1]);
for(const[p,index]of threesPath.map((p,i)=>[p,i])){const t=document.createElement('i');t.className='mini-tile'+(index===0?' player-cell':'')+(index===threesPath.length-1?' mini-goal':'');gridPosition(t,p);if(index===0)t.innerHTML='<span class="mini-sprite"></span><span class="mini-direction right">→</span>';$('threesGrid').append(t);}
function render(){
 gridPosition(actor,state.position);
 actor.querySelector('.direction-arrow').style.transform='rotate('+(((state.facing+3)%4)*90)+'deg)';
 const arrows=['↑','→','↓','←'];$('positionLabel').textContent='DIRECTION '+arrows[state.facing];$('turnCount').textContent=String(state.turns).padStart(2,'0');
 const slots=[...document.querySelectorAll('.input-slot')];
 slots.forEach((slot,i)=>{slot.classList.toggle('filled',i<state.sequence.length);slot.classList.toggle('next',i===state.sequence.length);slot.classList.toggle('complete',state.sequence.length===3);$('slot'+i).textContent=state.sequence[i]||['ALT','ALT','F4'][i];});
 $('inputCount').textContent='INPUT '+state.sequence.length+' / 3';
 document.querySelectorAll('.progress-squares i').forEach((el,i)=>el.classList.toggle('filled',i<state.sequence.length));
 const status=state.won?'ACCESS GRANTED':state.blocked?'PATH BLOCKED — TRY ROTATING':state.sequence.length===3?'TURN COMPLETE':'YOUR MOVE';
 $('boardStatus').textContent=status;
 $('boardStatus').style.color=state.blocked||state.won?'#ff252c':'';
 $('puzzleBoard').classList.toggle('blocked',state.blocked);
 $('puzzleBoard').querySelector('.goal').classList.toggle('goal-reached',state.won);
 $('winOverlay').hidden=!state.won;
 $('rotateButton').disabled=state.won;$('moveButton').disabled=state.won;$('undoButton').disabled=state.history.length===0;
 board.setAttribute('aria-label','Example 2D puzzle. Player at column '+(state.position[0]+1)+', row '+(state.position[1]+1)+', facing '+['up','right','down','left'][state.facing]+'. '+state.sequence.length+' of 3 inputs. '+state.turns+' completed turns.');
}
function announce(text){$('announcer').textContent=text;}
function act(command){
 const prior=state;state=Puzzle.act(state,command);if(state===prior)return;render();
 announce(state.won?'Access granted. You reached the goal.':state.blocked?'Path blocked. That action counted. Rotate to change direction.':(command==='ALT'?'Direction changed.':'Moved forward one tile.')+' '+state.sequence.length+' of three inputs. Turn '+state.turns+'.');
 if(state.sequence.length===3){document.querySelector('.demo-window').classList.add('input-flash');clearTimeout(flashTimer);flashTimer=setTimeout(()=>document.querySelector('.demo-window').classList.remove('input-flash'),550);}
}
function undo(){state=Puzzle.undo(state);render();announce('Previous preview action restored.');}
function restart(){state=Puzzle.create();render();document.querySelector('.demo-window').classList.remove('input-flash');announce('Puzzle restarted. Facing right. Zero of three inputs.');}
$('rotateButton').addEventListener('click',()=>act('ALT'));$('moveButton').addEventListener('click',()=>act('F4'));$('undoButton').addEventListener('click',undo);$('restartButton').addEventListener('click',restart);$('winRestart').addEventListener('click',()=>{restart();$('demoFocus').focus({preventScroll:true});});
$('demoFocus').addEventListener('pointerdown',()=>{$('demoFocus').focus({preventScroll:true});});
demo.addEventListener('keydown',e=>{
 if(e.repeat||e.altKey||e.target.matches('input,textarea,select'))return;
 const k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&k!=='z')return;
 if(k==='a'){e.preventDefault();act('ALT');}
 else if(k==='f'){e.preventDefault();act('F4');}
 else if(k==='z'){e.preventDefault();undo();}
 else if(k==='r'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();restart();}
});
const media=[
 {src:'assets/gameplay-01.jpg',title:'01 / SHIFTING PATHS',alt:'Actual gameplay showing a white puzzle path, red enemies and rotation tiles inside a computer-window interface.'},
 {src:'assets/gameplay-02.jpg',title:'02 / ANOTHER WINDOW',alt:'Actual gameplay showing two flat tile maps with teleportation tiles and a shared computer interface.'},
 {src:'assets/gameplay-03.jpg',title:'03 / EVERY STEP COUNTS',alt:'Actual gameplay showing a straight white path, cracked tiles, the player and an enemy.'}
];
let mediaIndex=0,lastMediaTrigger=null;
function renderMedia(){const m=media[mediaIndex];$('lightboxImage').src=m.src;$('lightboxImage').alt=m.alt;$('lightboxTitle').textContent=m.title;$('lightboxCount').textContent=String(mediaIndex+1).padStart(2,'0')+' / '+String(media.length).padStart(2,'0');}
function openMedia(index,trigger){mediaIndex=index;lastMediaTrigger=trigger;renderMedia();$('mediaDialog').showModal();}
document.querySelectorAll('[data-media]').forEach(b=>b.addEventListener('click',()=>openMedia(Number(b.dataset.media),b)));
function closeMedia(){$('mediaDialog').close();lastMediaTrigger?.focus({preventScroll:true});}
$('closeMedia').addEventListener('click',closeMedia);
$('mediaDialog').addEventListener('click',e=>{if(e.target===$('mediaDialog')){const r=$('mediaDialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeMedia();}});
$('mediaDialog').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();mediaIndex=(mediaIndex+media.length-1)%media.length;renderMedia();}if(e.key==='ArrowRight'){e.preventDefault();mediaIndex=(mediaIndex+1)%media.length;renderMedia();}});
$('prevMedia').addEventListener('click',()=>{mediaIndex=(mediaIndex+media.length-1)%media.length;renderMedia();});
$('nextMedia').addEventListener('click',()=>{mediaIndex=(mediaIndex+1)%media.length;renderMedia();});
const links=[...document.querySelectorAll('.nav-link')];
links.forEach(a=>a.addEventListener('click',()=>{links.forEach(l=>l.classList.toggle('active',l===a));}));
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){const link=links.find(l=>l.getAttribute('href')==='#'+e.target.id);if(link)links.forEach(l=>l.classList.toggle('active',l===link));}},{rootMargin:'-10% 0px -55% 0px',threshold:0});for(const id of ['game','controls','media','community'])observer.observe($(id));}
render();

(function(root){
'use strict';
const path=[];
for(let x=0;x<=6;x++)path.push([x,4]);
for(let y=3;y>=1;y--)path.push([6,y]);
for(let x=7;x<=9;x++)path.push([x,1]);
for(let y=2;y<=3;y++)path.push([9,y]);
for(let x=10;x<=12;x++)path.push([x,3]);
const goal=[12,3],valid=new Set(path.map(p=>p.join(','))),deltas=[[0,-1],[1,0],[0,1],[-1,0]];
function create(){return {position:[0,4],facing:1,sprite:'upright',sequence:[],turns:0,actions:0,won:false,blocked:false,history:[]};}
function snapshot(s){return {...s,position:[...s.position],sequence:[...s.sequence],history:undefined};}
function act(s,command){
 if(s.won||!['ALT','F4'].includes(command))return s;
 const n={...s,position:[...s.position],sequence:s.sequence.length===3?[]:[...s.sequence],history:[...s.history,snapshot(s)].slice(-256),blocked:false};
 if(command==='ALT')n.facing=(n.facing+1)%4;
 else{const d=deltas[n.facing],next=[n.position[0]+d[0],n.position[1]+d[1]];if(valid.has(next.join(',')))n.position=next;else n.blocked=true;}
 n.sequence.push(command);n.actions++;if(n.sequence.length===3)n.turns++;
 n.won=n.position[0]===goal[0]&&n.position[1]===goal[1];return n;
}
function undo(s){if(!s.history.length)return s;const previous=s.history[s.history.length-1];return {...previous,position:[...previous.position],sequence:[...previous.sequence],history:s.history.slice(0,-1)};}
const reset=()=>create();
const solution=[...Array(6).fill('F4'),...Array(3).fill('ALT'),...Array(3).fill('F4'),'ALT',...Array(3).fill('F4'),'ALT',...Array(2).fill('F4'),...Array(3).fill('ALT'),...Array(3).fill('F4')];
const api={create,act,undo,reset,path,goal,solution,columns:13,rows:5};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Puzzle=api;
})(typeof globalThis!=='undefined'?globalThis:this);

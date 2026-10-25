const {test}=require('node:test'),assert=require('node:assert/strict');
let E;try{E=require('../dist/puzzle.js')}catch{}
test('데모 엔진 제공',()=>assert.equal(typeof E?.create,'function'));
test('3회 입력이 한 턴을 구성한다',()=>{let s=E.create();s=E.act(s,'F4');s=E.act(s,'F4');assert.equal(s.turns,0);assert.deepEqual(s.sequence,['F4','F4']);s=E.act(s,'ALT');assert.equal(s.turns,1);assert.equal(s.sequence.length,3);s=E.act(s,'ALT');assert.equal(s.sequence.length,1);assert.equal(s.turns,1);});
test('ALT는 위치나 플레이어 모양이 아니라 방향만 바꾼다',()=>{const s=E.create(),n=E.act(s,'ALT');assert.deepEqual(n.position,s.position);assert.equal(n.facing,2);assert.equal(n.sprite,'upright');});
test('경로 밖으로 나가도 위치와 입력 기록은 안전하다',()=>{let s=E.create();s=E.act(s,'ALT');const n=E.act(s,'F4');assert.deepEqual(n.position,s.position);assert.equal(n.sequence.length,2);assert.equal(n.blocked,true);});
test('Undo는 방향·위치·시퀀스·턴을 복원한다',()=>{let s=E.create();const prior=E.act(s,'F4');s=E.act(prior,'ALT');s=E.undo(s);assert.deepEqual(s.position,prior.position);assert.equal(s.facing,prior.facing);assert.deepEqual(s.sequence,prior.sequence);assert.equal(s.turns,prior.turns);});
test('초기화 및 빈 undo',()=>{let s=E.create();assert.deepEqual(E.undo(s),s);s=E.act(s,'F4');assert.deepEqual(E.create(),E.reset(s));});
test('예제 경로는 해결 가능하고 도착 후 입력은 고정된다',()=>{let s=E.create();for(const cmd of E.solution)s=E.act(s,cmd);assert.equal(s.won,true);assert.deepEqual(s.position,E.goal);assert.deepEqual(E.act(s,'ALT'),s);assert.equal(E.undo(s).won,false);});
test('알 수 없는 커맨드는 상태를 바꾸지 않는다',()=>{const s=E.create();assert.deepEqual(E.act(s,'DELETE'),s);});

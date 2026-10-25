const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');const code=fs.readFileSync(path.join(__dirname,'../dist/community.js'),'utf8');
function setup(data){const dom=new JSDOM(html,{url:'https://example.com/',runScripts:'outside-only',pretendToBeVisual:true});let calls=0;dom.window.AbortSignal=AbortSignal;dom.window.fetch=async()=>{calls++;if(data instanceof Error)throw data;return {ok:true,json:async()=>data};};let interval;dom.window.setTimeout=(fn,ms)=>{interval=ms;return 1;};dom.window.clearTimeout=()=>{};dom.window.eval(code);return {dom,getCalls:()=>calls,getInterval:()=>interval};}
const settle=()=>new Promise(r=>setImmediate(r));
test('renders real content safely, both review sentiments and developer reply',async()=>{
 const {dom,getInterval}=setup({news:{status:'ok',updatedAt:new Date().toISOString(),items:[{title:'<img src=x onerror=alert(1)>',text:'Update text',date:1,url:'javascript:alert(1)'}]},reviews:{status:'ok',updatedAt:new Date().toISOString(),items:[{text:'Needs work',recommended:false,date:1,playtime:60,reply:'Thank you',url:'https://steamcommunity.com/app/4624670/reviews/'}]}});await settle();const d=dom.window.document;
 assert.equal(d.querySelectorAll('#newsFeed img').length,0);assert.ok(d.querySelector('#newsFeed h4').textContent.includes('<img'));assert.ok(d.querySelector('#newsFeed a').href.startsWith('https://steamcommunity.com/'));assert.ok(d.querySelector('#reviewsFeed').textContent.includes('NOT RECOMMENDED'));assert.ok(d.querySelector('#reviewsFeed').textContent.includes('Thank you'));assert.equal(getInterval(),60000);dom.window.close();
});
test('shows honest empty and connection failure states',async()=>{
 const empty=setup({news:{status:'ok',items:[]},reviews:{status:'unavailable',items:[]}});await settle();assert.match(empty.dom.window.document.getElementById('newsStatus').textContent,/No developer/);assert.match(empty.dom.window.document.getElementById('reviewsStatus').textContent,/unavailable/);empty.dom.window.close();
 const offline=setup(Error('offline'));await settle();assert.match(offline.dom.window.document.getElementById('newsStatus').textContent,/unavailable/);assert.equal(offline.dom.window.document.getElementById('newsFeed').children.length,0);offline.dom.window.close();
});

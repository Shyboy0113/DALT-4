'use strict';
(()=>{
 const root=document.getElementById('community');if(!root)return;
 const endpoint=window.COMMUNITY_API_URL||'/api/community';let timer,busy=false;
 const $=id=>document.getElementById(id);
 const date=value=>new Date(value*1000).toLocaleDateString(document.documentElement.lang||'en',{year:'numeric',month:'short',day:'numeric'});
 function element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
 function link(url,text){const a=element('a','text-link',text);try{const u=new URL(url);a.href=u.protocol==='https:'&&['steamcommunity.com','store.steampowered.com'].includes(u.hostname)?u.href:'https://steamcommunity.com/app/4624670/';}catch{a.href='https://steamcommunity.com/app/4624670/';}a.target='_blank';a.rel='noopener noreferrer';return a;}
 function renderFeed(kind,data){
  const container=$(kind+'Feed'),status=$(kind+'Status');
  if(!data||!Array.isArray(data.items))throw Error('Invalid feed');
  const cards=data.items.map(item=>{
   const card=element('article','feed-card');
   if(kind==='news'){card.append(element('time','feed-date',date(item.date)),element('h4','',item.title),element('p','feed-excerpt',item.text),link(item.url,'READ ON STEAM ↗'));}
   else{card.append(element('span','review-vote',item.recommended?'↑ RECOMMENDED':'↓ NOT RECOMMENDED'),element('time','feed-date',date(item.date)+' · '+(item.playtime/60).toFixed(1)+' HRS AT REVIEW'),element('p','feed-excerpt',item.text));if(item.reply){const reply=element('div','developer-reply');reply.append(element('strong','','DEVELOPER RESPONSE'),element('p','',item.reply));card.append(reply);}card.append(link(item.url,'VIEW REVIEW ↗'));}
   return card;
  });
  container.replaceChildren(...cards);
  if(data.status==='unavailable')status.textContent='Steam is temporarily unavailable. Please use the Steam link below.';
  else if(data.status==='stale')status.textContent='Showing saved content. Steam connection will be retried.';
  else if(!data.items.length)status.textContent=kind==='news'?'No developer announcements published yet.':'No player reviews published yet.';
  else status.textContent='Last checked '+new Date(data.updatedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
 }
 async function refresh(){
  clearTimeout(timer);if(document.hidden||busy)return;busy=true;
  try{const r=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Connection failed');const data=await r.json();renderFeed('news',data.news);renderFeed('reviews',data.reviews);}
  catch{for(const kind of ['news','reviews'])$(kind+'Status').textContent=$(kind+'Feed').children.length?'Connection lost. Showing the last loaded content.':'Steam connection is unavailable. Please use the Steam link below.';}
  finally{busy=false;if(!document.hidden)timer=setTimeout(refresh,60000);}
 }
 document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden)refresh();});refresh();
})();

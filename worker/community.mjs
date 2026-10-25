export const APP_ID=4624670;
export const REFRESH_MS=60000;
const NEWS='https://steamcommunity.com/app/'+APP_ID+'/allnews/';
const REVIEWS='https://steamcommunity.com/app/'+APP_ID+'/reviews/';
export function plain(value){return String(value||'').replace(/<[^>]*>/g,' ').replace(/\[(?:[^\]]*)\]/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();}
function safeSteam(value,fallback){try{const u=new URL(value);return u.protocol==='https:'&&['steamcommunity.com','store.steampowered.com'].includes(u.hostname)?u.href:fallback;}catch{return fallback;}}
export function normalizeNews(data){
 if(!Array.isArray(data?.appnews?.newsitems))throw Error('Invalid news response');
 return data.appnews.newsitems.filter(n=>n.feedname==='steam_community_announcements').sort((a,b)=>b.date-a.date).slice(0,3).map(n=>({id:String(n.gid),title:plain(n.title),text:plain(n.contents).slice(0,600),date:Number(n.date)||0,url:safeSteam(n.url,NEWS)}));
}
async function json(url,fetcher){const response=await fetcher(url,{signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});if(!response.ok)throw Error('Steam HTTP '+response.status);return response.json();}
export async function fetchNews(fetcher=fetch){const u=new URL('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/');u.search=new URLSearchParams({appid:String(APP_ID),count:'3',maxlength:'1200',feeds:'steam_community_announcements'});return {items:normalizeNews(await json(u.href,fetcher))};}
export async function fetchReviews(fetcher=fetch,key=''){
 const u=new URL('https://api.steampowered.com/IUserReviewsService/GetAppReviews/v1/');
 u.searchParams.set('input_json',JSON.stringify({appid:APP_ID,filter:1,languages:['all'],review_type:0,purchase_type:1,num_per_page:6,cursor:'*'}));if(key)u.searchParams.set('key',key);
 const raw=await json(u.href,fetcher),data=raw.response||raw;if(!Array.isArray(data.reviews))throw Error('Invalid reviews response');
 return {items:data.reviews.map(r=>({id:String(r.recommendationid),text:plain(r.review).slice(0,1200),date:Number(r.timestamp_created)||0,recommended:r.voted_up===true,playtime:Number(r.author?.playtime_at_review??r.author?.playtime_forever)||0,reply:plain(r.developer_response).slice(0,1000),url:/^\d+$/.test(r.author?.steamid||'')?'https://steamcommunity.com/profiles/'+r.author.steamid+'/recommended/'+APP_ID+'/':REVIEWS}))};
}
// Cache API is shared within a Cloudflare location; memory also coalesces concurrent requests per isolate.
export function createFeed(loader,now=Date.now,storage){
 let record=null,pending=null;
 return async function get(){
  if(pending)return pending;
  pending=(async()=>{
   if(!record&&storage)record=await storage.read().catch(()=>null);
   const time=now();if(record&&time<record.nextCheck)return record.result;
   try{const data=await loader();record={nextCheck:time+REFRESH_MS,result:{...data,status:'ok',updatedAt:new Date(time).toISOString()}};}
   catch{record={nextCheck:time+300000,result:{items:record?.result?.items||[],updatedAt:record?.result?.updatedAt||null,status:record?.result?.updatedAt?'stale':'unavailable'}};}
   if(storage)await storage.write(record).catch(()=>{});return record.result;
  })();try{return await pending;}finally{pending=null;}
 };
}
function storage(name){return {async read(){const r=await caches.default.match('https://dont-altf4-cache.invalid/v1/'+name);return r?r.json():null;},async write(data){await caches.default.put('https://dont-altf4-cache.invalid/v1/'+name,Response.json(data,{headers:{'Cache-Control':'public, max-age=86400'}}));}};}
let newsFeed,reviewFeed;
export async function communityResponse(request,env={}){
 const url=new URL(request.url);if(url.pathname!=='/api/community')return null;
 const origin=request.headers.get('Origin');const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','Vary':'Origin'};
 if(origin&&origin!==url.origin){if(!allowed.includes(origin))return new Response('Origin not allowed',{status:403});headers['Access-Control-Allow-Origin']=origin;}
 if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET'}});
 newsFeed??=createFeed(()=>fetchNews(),Date.now,typeof caches!=='undefined'?storage('news'):null);
 reviewFeed??=createFeed(()=>fetchReviews(fetch,env.STEAM_API_KEY||''),Date.now,typeof caches!=='undefined'?storage('reviews'):null);
 const [news,reviews]=await Promise.all([newsFeed(),reviewFeed()]);
 return Response.json({appid:APP_ID,refreshSeconds:60,news,reviews,discussionsUrl:'https://steamcommunity.com/app/'+APP_ID+'/discussions/'},{headers});
}
export default {async fetch(request,env){return await communityResponse(request,env)||new Response('Not found',{status:404});}};

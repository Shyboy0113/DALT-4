const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=()=>import('../worker/community.mjs');
test('shares concurrent requests and refreshes after 60 seconds',async()=>{
 const {createFeed}=await load();let now=1000,calls=0;
 const feed=createFeed(async()=>{calls++;return {items:['news']};},()=>now);
 await Promise.all(Array.from({length:20},()=>feed()));assert.equal(calls,1);
 now+=59999;await feed();assert.equal(calls,1);
 now++;await feed();assert.equal(calls,2);
});
test('keeps last good result on failure and backs off',async()=>{
 const {createFeed}=await load();let now=1000,calls=0,fail=false;
 const feed=createFeed(async()=>{calls++;if(fail)throw Error('offline');return {items:['last good']};},()=>now);
 await feed();now+=60000;fail=true;
 const stale=await feed();assert.equal(stale.status,'stale');assert.deepEqual(stale.items,['last good']);
 now+=60000;await feed();assert.equal(calls,2);
 now+=240000;await feed();assert.equal(calls,3);
});
test('failure differs from an empty successful feed',async()=>{
 const {createFeed}=await load();
 assert.equal((await createFeed(async()=>{throw Error('offline');})()).status,'unavailable');
 assert.equal((await createFeed(async()=>({items:[]}))()).status,'ok');
});
test('news filters official announcements and removes markup and unsafe links',async()=>{
 const {normalizeNews}=await load();
 const items=normalizeNews({appnews:{newsitems:[
 {gid:'1',feedname:'steam_community_announcements',title:'Newest',date:200,contents:'[b]Hello[/b] <script>bad()</script>',url:'javascript:alert(1)'},
 {gid:'2',feedname:'other',title:'Press',date:300},
 {gid:'3',feedname:'steam_community_announcements',title:'Older',date:100}]}});
 assert.equal(items.length,2);assert.equal(items[0].title,'Newest');assert.ok(items[0].url.startsWith('https://steamcommunity.com/'));assert.ok(!items[0].text.includes('<'));assert.ok(!items[0].text.includes('[b]'));
});
test('current reviews endpoint preserves negative feedback and developer replies',async()=>{
 const {fetchReviews}=await load();let requested;
 const result=await fetchReviews(async(url)=>{requested=new URL(url);return Response.json({response:{reviews:[{recommendationid:'99',author:{steamid:'76561198000000000',playtime_at_review:90},review:'Needs work',voted_up:false,developer_response:'Thanks!',timestamp_created:10}],query_summary:{total_reviews:1}}});});
 assert.equal(requested.pathname,'/IUserReviewsService/GetAppReviews/v1/');assert.equal(JSON.parse(requested.searchParams.get('input_json')).filter,1);assert.equal(result.items[0].recommended,false);assert.equal(result.items[0].reply,'Thanks!');
});
test('API rejects arbitrary cross-origin access and exposes no secret',async()=>{const {communityResponse}=await load();const response=await communityResponse(new Request('https://worker.example/api/community',{headers:{Origin:'https://attacker.example'}}),{ALLOWED_ORIGINS:'https://hongkitaeportfolio.com',STEAM_API_KEY:'secret'});assert.equal(response.status,403);assert.ok(!(await response.text()).includes('secret'));});

test('independent feeds keep news available when reviews fail',async()=>{const {communityResponse}=await load();const original=global.fetch;global.fetch=async url=>String(url).includes('ISteamNews')?Response.json({appnews:{newsitems:[]}}):new Response('offline',{status:503});try{const response=await communityResponse(new Request('https://worker.example/api/community'));const body=await response.json();assert.equal(body.news.status,'ok');assert.equal(body.reviews.status,'unavailable');assert.equal(body.refreshSeconds,60);}finally{global.fetch=original;}});

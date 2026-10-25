import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const assets={};const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory()){if(!['server','.openai'].includes(entry.name))await walk(p);}else{const key='/'+path.relative(path.join(root,'dist'),p).split(path.sep).join('/');assets[key]=[types[path.extname(p)]||'application/octet-stream',(await fs.readFile(p)).toString('base64')];}}}
await walk(path.join(root,'dist'));
const community=await fs.readFile(path.join(root,'worker/community.mjs'),'utf8');
const source=community.slice(0,community.lastIndexOf("export default"));
const server=source+'\nconst assets='+JSON.stringify(assets)+';\nexport default {async fetch(request,env){const api=await communityResponse(request,env);if(api)return api;const url=new URL(request.url);const asset=assets[url.pathname==="/"?"/index.html":url.pathname];if(!asset)return new Response("Not found",{status:404});if(!["GET","HEAD"].includes(request.method))return new Response("Method not allowed",{status:405});const bytes=Uint8Array.from(atob(asset[1]),c=>c.charCodeAt(0));return new Response(request.method==="HEAD"?null:bytes,{headers:{"Content-Type":asset[0],"Cache-Control":"public, max-age=0, must-revalidate","X-Content-Type-Options":"nosniff"}});}};';
await fs.mkdir(path.join(root,'dist/server'),{recursive:true});await fs.mkdir(path.join(root,'dist/.openai'),{recursive:true});
await fs.writeFile(path.join(root,'dist/server/index.js'),server);await fs.copyFile(path.join(root,'.openai/hosting.json'),path.join(root,'dist/.openai/hosting.json'));console.log('Built dist/server/index.js');

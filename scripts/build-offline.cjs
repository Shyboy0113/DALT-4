const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../dist');
const mime=p=>({'.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf'}[path.extname(p)]||'application/octet-stream');
const data=p=>'data:'+mime(p)+';base64,'+fs.readFileSync(path.join(base,p)).toString('base64');
let html=fs.readFileSync(path.join(base,'index.html'),'utf8');
html=html.replace('<script src="community-config.js"></script><script src="community.js" defer></script>','').replaceAll('Connecting to Steam…','Open the hosted website for live Steam content.');
let css=fs.readFileSync(path.join(base,'style.css'),'utf8');
css=css.replace(/url\(["']?(assets\/[^"')]+)["']?\)/g,(_,p)=>'url("'+data(p)+'")');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+css+'</style>');
html=html.replace(/(src|href)="(assets\/[^"]+)"/g,(_,attr,p)=>attr+'="'+data(p)+'"');
for(const p of ['puzzle.js','app.js']){
 const code=fs.readFileSync(path.join(base,p),'utf8');
 const safe=JSON.stringify(code).replace(/</g,'\\u003c');
 html=html.replace('<script src="'+p+'"></script>',()=>'<script>{const el=document.createElement("script");el.text='+safe+';document.head.appendChild(el);}</script>');
}
for(const p of ['assets/gameplay-01.jpg','assets/gameplay-02.jpg','assets/gameplay-03.jpg'])html=html.split(p).join(data(p));
const output=process.argv[2]||path.join(base,'offline.html');
fs.writeFileSync(output,html);console.log(output);

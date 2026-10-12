import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile,access} from 'node:fs/promises';
test('manifest and every offline-shell asset work under a GitHub repository subpath',async()=>{
 const manifest=JSON.parse(await readFile('public/manifest.webmanifest','utf8'));assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.display,'standalone');for(const icon of manifest.icons)await access('public/'+icon.src.replace('./',''));
 const handlers={};let urls;let removed=[];let claimed=false;
 const cache={addAll:async assets=>{urls=assets;},match:async url=>String(url).endsWith('index.html')?new Response('cached shell'):undefined};
 const sandbox={URL,self:{location:new URL('https://example.github.io/steadily-health/sw.js'),clients:{claim:async()=>{claimed=true;}},addEventListener:(name,fn)=>{handlers[name]=fn;}},caches:{open:async()=>cache,keys:async()=>['steadily-/steadily-health/:old','steadily-/other-app/:old'],delete:async key=>{removed.push(key);}},fetch:async()=>{throw Error('offline');}};
 vm.runInNewContext(await readFile('public/sw.js','utf8'),sandbox);let ready;handlers.install({waitUntil:p=>ready=p});await ready;
 assert.ok(urls.length>=10);for(const url of urls){assert.ok(url.startsWith('https://example.github.io/steadily-health/'));const relative=url.replace('https://example.github.io/steadily-health/','');await access(relative===''?'index.html':relative.startsWith('src/')||relative==='index.html'?relative:'public/'+relative);}
 handlers.activate({waitUntil:p=>ready=p});await ready;assert.deepEqual(removed,['steadily-/steadily-health/:old']);assert.equal(claimed,true);
 let response;handlers.fetch({request:{method:'GET',url:'https://example.github.io/steadily-health/',mode:'navigate'},respondWith:p=>response=p});assert.equal(await (await response).text(),'cached shell');
});

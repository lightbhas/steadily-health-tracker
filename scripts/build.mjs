import {mkdir,rm,copyFile,cp,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
await writeFile('dist/index.html',(await readFile('index.html','utf8')).replace('content="development"','content="production"'));await cp('src','dist/src',{recursive:true});await cp('public','dist',{recursive:true});
const sw=await readFile('public/sw.js','utf8');await writeFile('dist/sw.js',sw.replace('__BUILD__',Date.now().toString()));await writeFile('dist/.nojekyll','');console.log('Built dist/ — ready for GitHub Pages.');

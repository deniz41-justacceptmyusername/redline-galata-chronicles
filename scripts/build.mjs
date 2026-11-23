import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import vm from 'node:vm';
const modules=['i18n.js','math.js','catalog.js','istanbul-data.js','city-roads.js','real-world.js','world.js','physics.js','equipment.js','combat.js','human.js','story.js','progression.js','pursuit.js','traffic.js','simulation.js','render.js','render-v3.js','audio.js','main.js'];
let code='';
for(const name of modules){const source=await readFile(new URL('../dist/'+name,import.meta.url),'utf8');code+='\n// '+name+'\n'+source.replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'');}
const bundle='(()=>{\n"use strict";\n'+code+'\n})();';
new vm.Script(bundle,{filename:'REDLINE-Offline.js'});
let css=await readFile(new URL('../dist/style.css',import.meta.url),'utf8');
// The offline game intentionally uses system fonts and has no network dependency.
css=css.replace(/^@import url\([^\n]*\);\s*/,'');
css+='\n/* Keep the condensed title readable with system-font fallbacks. */\n.menu-panel h1{transform:scaleX(.72);transform-origin:left center;width:138.89%}.primary{font-size:16px}.modal h2{font-size:42px}.hud-brand b{font-size:19px}.car-card h3{font-size:20px}@media(max-width:520px){.modal h2{font-size:35px}.car-card h3{font-size:18px}}';
const icon=await readFile(new URL('../dist/icon.svg',import.meta.url),'base64');
let html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
html=html.replace('href="icon.svg"','href="data:image/svg+xml;base64,'+icon+'"').replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>').replace('<script type="module" src="main.js"></script>','<script>'+bundle.replace(/<\/script/gi,'<\\/script')+'</script>');
if(/(?:src|href)="(?:https?:|\.\/)/.test(html))throw new Error('Offline artifact contains an external dependency');
const licenseText=await readFile(new URL('../LICENSE',import.meta.url),'utf8');html=html.replace('<html lang="tr">','<!--\n'+licenseText+'-->\n<html lang="tr">');
html=html.replace('<body>','<!-- Map geometry: © OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright | https://opendatacommons.org/licenses/odbl/1-0/ . The derived database is embedded below as ISTANBUL_DATA and distributed in dist/istanbul-data.js. Venues and story are fictional. -->\n<body>');
const output=new URL('../dist/REDLINE-Offline.html',import.meta.url);await writeFile(output,html,'utf8');await writeFile(new URL('../REDLINE.html',import.meta.url),html,'utf8');
console.log('Offline game built: '+(await stat(output)).size+' bytes; JavaScript syntax validated.');

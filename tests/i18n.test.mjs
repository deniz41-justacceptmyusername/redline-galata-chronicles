import {test} from 'node:test';
import assert from 'node:assert/strict';
import {translate,setLanguage,localizeDOM,drawLocalizedText} from '../dist/i18n.js';
import {normalizeProfile} from '../dist/progression.js';
import {CARS,MISSIONS} from '../dist/catalog.js';
import {EQUIPMENT} from '../dist/equipment.js';
import {UPGRADE_CATALOG} from '../dist/progression.js';
import {DIFFICULTIES} from '../dist/pursuit.js';
test('language preference survives profile migration without changing progress',()=>{const p=normalizeProfile({settings:{language:'en'},wallet:4200,unlocked:['comet','ronin'],best:{chase:12500}});assert.equal(p.settings.language,'en');assert.equal(p.wallet,4200);assert.equal(p.best.chase,12500);assert.ok(p.unlocked.includes('ronin'));assert.equal(normalizeProfile({settings:{language:'xx'}}).settings.language,'tr');});
test('Turkish text remains exact and English preserves surrounding whitespace',()=>{assert.equal(translate('  ŞEHRE ÇIK  ','tr'),'  ŞEHRE ÇIK  ');assert.equal(translate('  ŞEHRE ÇIK  ','en'),'  HIT THE STREETS  ');assert.equal(translate('COMET RS','en'),'COMET RS');});
test('all mission descriptions and car traits have English translations',()=>{for(const m of MISSIONS){assert.notEqual(translate(m.title,'en'),m.title);assert.notEqual(translate(m.desc,'en'),m.desc);}for(const c of CARS)assert.notEqual(translate(c.tag,'en'),c.tag);});
test('equipment, upgrades and difficulty descriptions are localized',()=>{for(const e of EQUIPMENT){assert.notEqual(translate(e.name,'en'),e.name);assert.notEqual(translate(e.detail,'en'),e.detail);}for(const u of UPGRADE_CATALOG){assert.notEqual(translate(u.name,'en'),u.name);assert.notEqual(translate(u.detail,'en'),u.detail);}for(const d of DIFFICULTIES.slice(1))assert.notEqual(translate(d.label,'en'),d.label);});
test('dynamic costs, chaos notices, challenge rewards and cooldowns translate',()=>{for(const [tr,en] of [['KADEME 2 · ₺950','LEVEL 2 · ₺950'],['KAOS 5★ · TAKİP KESİLMEZ','CHAOS 5★ · NO ESCAPE'],['GÖREV TAMAM · +600','CHALLENGE COMPLETE · +600'],['₺900 daha gerekiyor.','You need ₺900 more.'],['4 ARAÇ · ZİNCİRLEME PATLAMA','4 CARS · CHAIN REACTION'],['3.2 sn','3.2 s']])assert.equal(translate(tr,'en'),en);});
test('canvas labels follow the selected language without changing the value',()=>{const calls=[],context={fillText(...args){calls.push(args);}};setLanguage('en');drawLocalizedText(context,'HAVA GÖRÜŞÜ KAPALI',10,20);assert.deepEqual(calls[0],['OVERHEAD COVER',10,20]);setLanguage('tr');drawLocalizedText(context,'HAVA GÖRÜŞÜ KAPALI',10,20);assert.equal(calls[1][0],'HAVA GÖRÜŞÜ KAPALI');});

test('DOM language switches restore Turkish and translate fresh HUD updates',()=>{
 const oldDocument=globalThis.document,oldFilter=globalThis.NodeFilter;
 const parent={tagName:'SPAN',closest(){return null;}},node={data:'KOVALAMACA',parentElement:parent},attrs={'aria-label':'Duraklat'};
 const label={hasAttribute:k=>Object.hasOwn(attrs,k),getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v};
 const root={nodeType:1,querySelectorAll(){return [label];},hasAttribute(){return false;}},buttons=[{dataset:{language:'tr'},setAttribute(){}},{dataset:{language:'en'},setAttribute(){}}];
 globalThis.NodeFilter={SHOW_TEXT:4};globalThis.document={body:root,documentElement:{lang:'tr'},querySelectorAll(){return buttons;},createTreeWalker(){let used=false;return {nextNode(){if(used)return null;used=true;return node;}};}};
 try{setLanguage('en');assert.equal(node.data,'CHASE');assert.equal(attrs['aria-label'],'Pause');setLanguage('tr');assert.equal(node.data,'KOVALAMACA');assert.equal(attrs['aria-label'],'Duraklat');node.data='KAOS 3★ · TAKİP KESİLMEZ';setLanguage('en');assert.equal(node.data,'CHAOS 3★ · NO ESCAPE');setLanguage('tr');assert.equal(node.data,'KAOS 3★ · TAKİP KESİLMEZ');}finally{if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;if(oldFilter===undefined)delete globalThis.NodeFilter;else globalThis.NodeFilter=oldFilter;}
});

import {defaultArmory,normalizeArmory} from './combat.js';
import {newStoryState} from './story.js';
import {clamp} from './math.js';
import {CARS,PAINTS} from './catalog.js';
import {REGIONS} from './world.js';
import {cleanArsenal} from './equipment.js';

export const UPGRADE_CATALOG=[
 {id:'engine',name:'MOTOR',detail:'Kademe başına +%5 son hız, +%10 ivmelenme.',prices:[650,1300,2400]},
 {id:'handling',name:'DRIFT KİTİ',detail:'Daha hızlı direksiyon tepkisi ve daha güçlü fren.',prices:[450,950,1800]},
 {id:'armor',name:'ŞASİ TAKVİYESİ',detail:'Kademe başına +%25 kaporta dayanıklılığı.',prices:[600,1200,2200]},
 {id:'nitro',name:'NİTRO SİSTEMİ',detail:'Daha uzun püskürtme, daha hızlı dolum.',prices:[500,1100,2000]}
];
export const SAFEHOUSE_PRICES={galata:0,uskudar:1200,surici:1600,kadikoy:2200};
export function newProfile(){return {version:3,mapId:'real',story:newStoryState(),armory:defaultArmory(),best:{story:0,chase:0,chaos:0,timed:0,free:0},chaosBest:{1:0,2:0,3:0,4:0,5:0},wallet:0,unlocked:['comet','marmara'],selected:'comet',color:PAINTS[0],regions:['galata'],safehouses:['galata'],spawnRegion:'galata',chaosStars:2,upgrades:{},arsenal:{},settings:{language:'tr',sound:true,music:false,volume:.65,shake:true,night:false,quality:'high',touch:'auto'},runs:[],totals:{wrecks:0,escapes:0,distance:0,runs:0}};}
export function normalizeProfile(value){
 const p=newProfile(),v=value&&typeof value==='object'?value:{};
 const finite=(v,max=1e9)=>clamp(Number.isFinite(Number(v))?Number(v):0,0,max);
 p.wallet=Math.floor(finite(v.wallet));p.mapId=v.mapId==='classic'?'classic':'real';p.story=newStoryState(v.story);p.armory=normalizeArmory(v.armory);
 p.unlocked=[...new Set(['comet','marmara',...(Array.isArray(v.unlocked)?v.unlocked:[]).filter(id=>CARS.some(c=>c.id===id))])];
 p.selected=p.unlocked.includes(v.selected)?v.selected:'comet';p.color=PAINTS.includes(v.color)?v.color:PAINTS[0];
 p.regions=[...new Set(['galata',...(Array.isArray(v.regions)?v.regions:[]).filter(id=>REGIONS.some(r=>r.id===id))])];
 p.safehouses=[...new Set(['galata',...(Array.isArray(v.safehouses)?v.safehouses:[]).filter(id=>p.regions.includes(id))])];
 p.spawnRegion=p.safehouses.includes(v.spawnRegion)?v.spawnRegion:'galata';p.chaosStars=clamp(Math.round(Number(v.chaosStars)||2),1,5);
 for(const mode of Object.keys(p.best))p.best[mode]=Math.floor(finite(v.best?.[mode]));
 for(let i=1;i<=5;i++)p.chaosBest[i]=Math.floor(finite(v.chaosBest?.[i]));
 for(const car of CARS){p.arsenal[car.id]=cleanArsenal(v.arsenal?.[car.id]);p.upgrades[car.id]={};for(const type of UPGRADE_CATALOG)p.upgrades[car.id][type.id]=Math.floor(finite(v.upgrades?.[car.id]?.[type.id],3));}
 if(['tr','en'].includes(v.settings?.language))p.settings.language=v.settings.language;
 for(const key of ['sound','music','shake','night'])if(typeof v.settings?.[key]==='boolean')p.settings[key]=v.settings[key];
 if(v.settings?.volume!==undefined)p.settings.volume=finite(v.settings.volume,1);
 if(['high','low'].includes(v.settings?.quality))p.settings.quality=v.settings.quality;
 if(['auto','on','off'].includes(v.settings?.touch))p.settings.touch=v.settings.touch;
 for(const key of Object.keys(p.totals))p.totals[key]=finite(v.totals?.[key]);
 p.runs=(Array.isArray(v.runs)?v.runs:[]).slice(0,10).map(r=>({mode:['story','chase','free','chaos','timed'].includes(r.mode)?r.mode:'chase',score:finite(r.score),time:finite(r.time,1e7),wrecks:finite(r.wrecks),win:!!r.win,stars:clamp(Math.round(Number(r.stars)||1),1,5),date:typeof r.date==='string'?r.date.slice(0,32):''}));
 return p;
}
export function tunedCar(profile,id=profile.selected){
 const base=CARS.find(c=>c.id===id)||CARS[0],u=profile.upgrades?.[base.id]||{};
 return {...base,speed:base.speed*(1+.05*(u.engine||0)),accel:base.accel*(1+.10*(u.engine||0)),steer:base.steer*(1+.06*(u.handling||0)),grip:base.grip*(1+.04*(u.handling||0)),brakeStrength:1+.14*(u.handling||0),health:Math.round(base.health*(1+.25*(u.armor||0))),nitro:base.nitro*(1+.25*(u.nitro||0)),nitroRegen:4.5+1.5*(u.nitro||0)};
}
function spend(profile,price){if(profile.wallet<price)return false;profile.wallet-=price;return true;}
export function buyRegion(profile,id){
 const region=REGIONS.find(r=>r.id===id);if(!region)return {ok:false,message:'Bölge bulunamadı.'};
 if(profile.regions.includes(id))return {ok:false,message:'Bu bölge zaten açık.'};
 if(!region.neighbors.some(n=>profile.regions.includes(n)))return {ok:false,message:'Önce komşu bölgelerden birini aç.'};
 if(!spend(profile,region.price))return {ok:false,message:`₺${region.price-profile.wallet} daha biriktirmen gerekiyor.`};
 profile.regions.push(id);return {ok:true,message:region.name+' açıldı. Köprü ve sınır geçişleri serbest.'};
}
export function buySafehouse(profile,id){
 if(!profile.regions.includes(id))return {ok:false,message:'Önce bölge ruhsatını al.'};
 if(profile.safehouses.includes(id))return {ok:false,message:'Bu sığınak zaten senin.'};
 const price=SAFEHOUSE_PRICES[id];if(price===undefined||!spend(profile,price))return {ok:false,message:'Sığınak için bakiyen yetmiyor.'};
 profile.safehouses.push(id);return {ok:true,message:'Sığınak satın alındı. Burada bankalayabilir ve yeni tura başlayabilirsin.'};
}
export function buyUpgrade(profile,carId,type){
 const item=UPGRADE_CATALOG.find(u=>u.id===type);if(!item||!profile.unlocked.includes(carId))return {ok:false,message:'Önce aracı satın al.'};
 const upgrades=profile.upgrades[carId]??(profile.upgrades[carId]={}),level=upgrades[type]||0;
 if(level>=3)return {ok:false,message:'Bu parça en üst kademede.'};
 if(!spend(profile,item.prices[level]))return {ok:false,message:`Bu kademe için ₺${item.prices[level]-profile.wallet} daha gerekiyor.`};
 upgrades[type]=level+1;return {ok:true,message:`${item.name} kademe ${level+1} takıldı.`};
}
export function buyCar(profile,id){
 const car=CARS.find(c=>c.id===id);if(!car)return {ok:false,message:'Araç bulunamadı.'};
 if(!profile.unlocked.includes(id)){if(!spend(profile,car.price))return {ok:false,message:`${car.name} için ₺${car.price-profile.wallet} daha gerekiyor.`};profile.unlocked.push(id);}
 profile.selected=id;profile.color=car.color;return {ok:true,message:car.name+' seçildi.'};
}
export function performService(profile,player,type){
 if(!player.alive)return {ok:false,message:'Araç kullanılamıyor.'};
 const price=type==='repair'?180:type==='nitro'?100:null;
 if(price===null)return {ok:false,message:'Servis bulunamadı.'};
 if(type==='repair'&&player.hp>=player.maxHp-1||type==='nitro'&&player.nitro>=99)return {ok:false,message:'Zaten dolu; ücret alınmadı.'};
 if(!spend(profile,price))return {ok:false,message:'Servis için cüzdanın yetersiz.'};
 if(type==='repair')player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.65);else player.nitro=100;
 return {ok:true,message:type==='repair'?'TAMİR +%65 · ₺180':'NİTRO DOLU · ₺100'};
}
export function runEarnings(sim){const difficulty=sim.mode==='chaos'?1+(sim.chaosStars-1)*.2:1;return Math.floor((sim.score/5+sim.cash)*(sim.win?1.35:.75)*difficulty);}

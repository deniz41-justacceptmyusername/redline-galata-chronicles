import {clamp} from './math.js';
export const WEAPONS=[
 {id:'pistol',name:'Tabanca',en:'Pistol',price:0,mag:14,reserve:112,damage:21,rate:.28,reload:1.05,speed:1100,range:720,spread:.025,pellets:1},
 {id:'smg',name:'Hafif Makineli',en:'Submachine Gun',price:1600,mag:30,reserve:210,damage:12,rate:.085,reload:1.35,speed:1150,range:690,spread:.075,pellets:1},
 {id:'shotgun',name:'Pompalı',en:'Pump Shotgun',price:1250,mag:7,reserve:56,damage:11,rate:.8,reload:1.55,speed:950,range:460,spread:.27,pellets:7},
 {id:'revolver',name:'Altıpatlar',en:'Revolver',price:950,mag:6,reserve:72,damage:48,rate:.52,reload:1.65,speed:1250,range:820,spread:.012,pellets:1},
 {id:'carbine',name:'Karabina',en:'Carbine',price:3200,mag:30,reserve:210,damage:26,rate:.15,reload:1.6,speed:1450,range:1100,spread:.032,pellets:1},
 {id:'marksman',name:'Nişancı Tüfeği',en:'Marksman Rifle',price:4900,mag:10,reserve:70,damage:68,rate:.72,reload:1.9,speed:1650,range:1400,spread:.006,pellets:1}
];
export function defaultArmory(){return Object.fromEntries(WEAPONS.map(w=>[w.id,{owned:w.id==='pistol',ammo:w.id==='pistol'?w.reserve:0}]));}
export function normalizeArmory(v){const a=defaultArmory();for(const w of WEAPONS){a[w.id].owned=w.id==='pistol'||v?.[w.id]?.owned===true;a[w.id].ammo=a[w.id].owned?clamp(Math.floor(Number(v?.[w.id]?.ammo)??a[w.id].ammo)||0,0,w.reserve+w.mag):0;if(!v?.[w.id]&&w.id==='pistol')a[w.id].ammo=w.reserve;}return a;}
export function buyWeapon(p,id,refill=false){const w=WEAPONS.find(w=>w.id===id);if(!w)return {ok:false,message:'Silah bulunamadı.'};p.armory??=defaultArmory();const a=p.armory[id];if(!refill&&a.owned)return {ok:false,message:'Bu silah zaten sende.'};if(refill&&!a.owned)return {ok:false,message:'Önce silahı satın al.'};const missing=Math.max(0,w.reserve-a.ammo),price=refill?Math.ceil(missing*(w.id==='marksman'?3:w.id==='shotgun'?2:1.2)):w.price;if(refill&&!missing)return {ok:false,message:'Mühimmat zaten dolu; ücret alınmadı.'};if(p.wallet<price)return {ok:false,message:'Yeterli paran yok.'};p.wallet-=price;a.owned=true;a.ammo=w.reserve;return {ok:true,message:w.name+(refill?' mühimmatı tamamlandı.':' çantana eklendi.')};}

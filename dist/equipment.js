import {distance,angleDiff} from './math.js';
import {lineClear,pointDrivable} from './world.js';

export const EQUIPMENT=[
 {id:'turret',name:'ARKA CAM ATIŞI',icon:'↙',key:'Q',price:2200,refill:160,capacity:120,detail:'Q basılı tutularak arka camdan kontrollü atış yapılır. 450 m menzil. Otomatik ateş etmez.'},
 {id:'mine',name:'LASTİK MAYINI',icon:'✹',key:'Z',price:950,refill:180,capacity:8,detail:'Arkaya bırakılır. Polisin lastiğini patlatır; hızını ve yol tutuşunu kalıcı düşürür. 2 sn bekleme.'},
 {id:'oil',name:'YAĞ TANKI',icon:'≈',key:'C',price:650,refill:120,capacity:10,detail:'Arkanda 14 saniye kalan yağ birikintisi. Polisler tutuşunu kaybedip savrulur. 4 sn bekleme.'}
];
export function emptyArsenal(){return {owned:[],equipped:[],ammo:{turret:0,mine:0,oil:0}};}
export function cleanArsenal(value){const a=emptyArsenal(),v=value||{};a.owned=EQUIPMENT.map(e=>e.id).filter(id=>Array.isArray(v.owned)&&v.owned.includes(id));a.equipped=a.owned.filter(id=>Array.isArray(v.equipped)&&v.equipped.includes(id));for(const e of EQUIPMENT)a.ammo[e.id]=a.owned.includes(e.id)?Math.max(0,Math.min(e.capacity,Math.floor(Number(v.ammo?.[e.id])||0))):0;return a;}
export function equipmentTransaction(profile,carId,id,action='buy'){
 const e=EQUIPMENT.find(e=>e.id===id);if(!e||!profile.unlocked.includes(carId))return {ok:false,message:'Önce aracı satın al.'};
 const a=profile.arsenal[carId]??(profile.arsenal[carId]=emptyArsenal()),owned=a.owned.includes(id);
 if(action==='toggle'){if(!owned)return {ok:false,message:'Önce ekipmanı satın al.'};a.equipped=a.equipped.includes(id)?a.equipped.filter(x=>x!==id):[...a.equipped,id];return {ok:true,message:e.name+(a.equipped.includes(id)?' takıldı.':' söküldü.')};}
 if(action==='buy'&&owned)return {ok:false,message:'Bu ekipman zaten sende.'};
 if(action==='refill'&&!owned)return {ok:false,message:'Önce ekipmanı satın al.'};
 if(!['buy','refill'].includes(action))return {ok:false,message:'İşlem bulunamadı.'};
 if(action==='refill'&&a.ammo[id]>=e.capacity)return {ok:false,message:'Mühimmat zaten dolu; ücret alınmadı.'};
 const price=action==='buy'?e.price:Math.ceil(e.refill*(e.capacity-a.ammo[id])/e.capacity);
 if(profile.wallet<price)return {ok:false,message:`₺${price-profile.wallet} daha gerekiyor.`};
 profile.wallet-=price;if(!owned){a.owned.push(id);a.equipped.push(id);}a.ammo[id]=e.capacity;
 return {ok:true,message:e.name+(owned?' mühimmatı dolduruldu.':' satın alındı ve takıldı. İlk mühimmat dahil.')};
}

export class EquipmentSystem{
 constructor(sim,arsenal){this.sim=sim;this.kit=cleanArsenal(arsenal);this.cooldowns={turret:0,mine:0,oil:0};this.turretOn=true;this.hazards=[];this.traces=[];sim.player.attachments=[...this.kit.equipped];}
 usable(id){return this.kit.equipped.includes(id)&&this.kit.ammo[id]>0&&this.cooldowns[id]<=0;}
 consume(id){this.kit.ammo[id]--;this.sim.event('ammo',{id,remaining:this.kit.ammo[id]});}
 deploy(id){
  const s=this.sim,p=s.player;if(!this.usable(id)){s.event('toast',{text:!this.kit.equipped.includes(id)?'EKİPMAN TAKILI DEĞİL · ATÖLYEDEN SATIN AL':this.kit.ammo[id]<=0?'MÜHİMMAT BİTTİ · ATÖLYEDEN DOLDUR':'EKİPMAN SOĞUYOR'});return false;}
  const at={x:p.x-Math.cos(p.angle)*65,y:p.y-Math.sin(p.angle)*65};
  if(!pointDrivable(s.world,at,12)){s.event('toast',{text:'ARKANDA YER YOK · YOLA ÇIK'});return false;}
  this.consume(id);this.cooldowns[id]=id==='mine'?2:4;this.hazards.push({...at,type:id,life:id==='mine'?35:14,arm:.35,r:id==='mine'?29:75});s.event('deploy',{kind:id});return true;
 }
 update(dt,input={}){
  const s=this.sim,p=s.player;for(const id of Object.keys(this.cooldowns))this.cooldowns[id]=Math.max(0,this.cooldowns[id]-dt);
  this.traces=this.traces.filter(t=>(t.life-=dt)>0);
  for(const h of this.hazards){h.life-=dt;h.arm-=dt;if(h.arm>0||h.life<=0)continue;
   for(const cop of s.cops){if(!cop.alive||distance(h,cop)>h.r+cop.width*.4)continue;
    if(h.type==='mine'){cop.tireBlown=true;cop.oily=1.6;cop.spin=(s.rng()<.5?-1:1)*1.4;s.damage(cop,36);h.life=0;s.spark(h.x,h.y,0,-1);s.event('tire');s.addPopup('LASTİK PATLADI',cop.x,cop.y,'#e9c77b');s.score+=60;break;}
    cop.oily=3.5;cop.spin=(cop.role%2?1:-1)*1.7;
   }
  }
  this.hazards=this.hazards.filter(h=>h.life>0);
  if(!p.alive)return;
  
  if(input.mine)this.deploy('mine');if(input.oil)this.deploy('oil');
  p.turretAngle=p.angle+Math.PI;
  if(!(input.rearFire||input.turretToggle)||!this.usable('turret'))return;
  const target=s.cops.filter(c=>c.alive&&distance(p,c)<450&&Math.abs(angleDiff(Math.atan2(c.y-p.y,c.x-p.x),p.angle+Math.PI))<1.55&&lineClear(s.world,p,c,8)).sort((a,b)=>distance(p,a)-distance(p,b))[0];
  if(!target)return;p.turretAngle=Math.atan2(target.y-p.y,target.x-p.x);this.consume('turret');this.cooldowns.turret=.42;
  this.traces.push({x:p.x-Math.cos(p.angle)*15,y:p.y-Math.sin(p.angle)*15,tx:target.x,ty:target.y,life:.10});s.damage(target,20);s.spark(target.x,target.y,0,-1);s.event('shot');
 }
}

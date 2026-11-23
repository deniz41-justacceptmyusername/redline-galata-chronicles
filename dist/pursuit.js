import {clamp,distance,angleDiff} from './math.js';
import {lineClear,underCover,nearestRoadNode,pointDrivable} from './world.js';

export const DIFFICULTIES=[null,
 {stars:1,cap:4,speed:420,accel:265,spawnInterval:4.5,vision:1000,heavy:0,roadblock:Infinity,helicopter:false,label:'4 devriye · yakın takip'},
 {stars:2,cap:6,speed:450,accel:285,spawnInterval:3.7,vision:1080,heavy:0,roadblock:Infinity,helicopter:false,label:'6 ekip · hızlı ön kesiciler'},
 {stars:3,cap:8,speed:475,accel:305,spawnInterval:3,vision:1150,heavy:.2,roadblock:34,helicopter:false,label:'8 ekip · zırhlı araç · barikat'},
 {stars:4,cap:11,speed:495,accel:320,spawnInterval:2.3,vision:1200,heavy:.35,roadblock:26,helicopter:true,heliSpeed:355,label:'11 ekip · helikopter · barikat'},
 {stars:5,cap:14,speed:515,accel:335,spawnInterval:1.8,vision:1280,heavy:.5,roadblock:18,helicopter:true,heliSpeed:385,label:'14 ekip · ağır baskı · hava takibi'}
];
export function difficultyFor(stars){return DIFFICULTIES[clamp(Math.floor(stars)||1,1,5)];}
export class PursuitDirector{
 constructor(sim){this.sim=sim;this.noticeCooldown=0;}
 updateHelicopter(dt,config,groundSeen){
  const s=this.sim,p=s.human?.pursuitPosition()||s.player,h=s.heli;
  h.active=s.pursuit&&config.helicopter;
  h.visible=false;s.covered=!!s.human?.interior||underCover(s.world,p);
  if(!h.active){h.initialized=false;return;}
  if(!h.initialized){h.x=p.x-520;h.y=p.y-260;h.initialized=true;h.spotX=p.x;h.spotY=p.y;}
  const contact=distance(h,p)<h.radius&&!s.covered;
  if(contact||groundSeen||s.mode==='chaos'){s.lastKnown={x:p.x,y:p.y};h.spotX=p.x;h.spotY=p.y;}
  const memory=s.lastKnown;
  const target=contact||groundSeen||s.mode==='chaos'?{x:p.x-Math.cos(p.angle)*90,y:p.y-Math.sin(p.angle)*90}:{x:memory.x+Math.cos(s.time*.25)*300,y:memory.y+Math.sin(s.time*.25)*300};
  const dx=target.x-h.x,dy=target.y-h.y,d=Math.hypot(dx,dy),step=Math.min(d,config.heliSpeed*dt);
  if(d>1){h.x+=dx/d*step;h.y+=dy/d*step;const targetAngle=Math.atan2(dy,dx);h.angle+=angleDiff(targetAngle,h.angle)*Math.min(1,dt*3);}
  h.visible=distance(h,p)<h.radius&&!s.covered;
  if(h.visible){h.spotX=p.x;h.spotY=p.y;s.lastKnown={x:p.x,y:p.y};}
  else {h.spotX=memory.x+Math.cos(s.time*.7)*90;h.spotY=memory.y+Math.sin(s.time*.7)*90;}
 }
 update(dt){
  const s=this.sim,p=s.human?.pursuitPosition()||s.player;
  if(s.mode==='story'&&!s.pursuit){s.heat=s.heatLevel=0;s.heli.active=s.heli.visible=false;return;}
  if(s.mode==='free'){s.heat=s.heatLevel=0;s.pursuit=false;s.heli.active=false;return;}
  this.noticeCooldown=Math.max(0,this.noticeCooldown-dt);
  if(s.mode==='chaos'){s.heat=s.heatLevel=s.chaosStars;s.pursuit=true;s.escape=0;s.calmTime=0;s.lastKnown={x:p.x,y:p.y};}
  else s.heatLevel=s.pursuit?clamp(Math.floor(s.heat),1,5):0;
  const config=difficultyFor(s.heatLevel);
  let groundSeen=false,nearby=false;
  for(const cop of s.cops){if(!cop.alive)continue;const d=distance(cop,p);if(d<280)nearby=true;if(!s.human?.interior&&d<config.vision&&lineClear(s.world,cop,p,8))groundSeen=true;}
  if(s.human?.onFoot)groundSeen ||= s.human.people.some(a=>a.alive&&a.kind!=='ped'&&a.scene===s.human.scene()&&['officer','swat'].includes(a.kind)&&distance(a,s.player)<750&&lineClear(s.human.actorWorld(),a,s.player,3));
  if(groundSeen)s.lastKnown={x:p.x,y:p.y};
  this.updateHelicopter(dt,config,groundSeen);
  const seen=groundSeen||s.heli.visible;s.seenBy=s.heli.visible?'helicopter':groundSeen?'police':nearby?'search':'';
  s.escapeRequired=18+Math.max(1,s.heatLevel)*2;
  if(s.mode==='chaos'){
   s.searching=false;s.escape=0;
  }else if(seen){
   if(!s.pursuit){s.pursuit=true;s.heat=Math.max(1,s.heat);}
   s.escape=0;s.searching=false;s.heat=Math.min(5,s.heat+dt*.014);
  }else if(s.pursuit){
   s.searching=true;s.escape=nearby?Math.max(0,s.escape-dt*.5):s.escape+dt;
   if(s.escape>=s.escapeRequired){
    const reward=550*Math.max(1,s.heatLevel);s.score+=reward;s.cash+=Math.round(reward*.2);s.escapes++;
    s.pursuit=false;s.searching=false;s.escape=0;s.heat=s.heatLevel=0;s.calmTime=22;s.respawnTimer=5;s.heli.active=false;s.heli.visible=false;
    s.event('escape',{text:`İZİNİ KAYBETTİRDİN · +${reward}`});
   }
  }
  if(!s.pursuit){
   s.calmTime-=dt;
   if(s.calmTime<=0&&s.mode!=='story'){s.pursuit=true;s.heat=1+Math.min(2,s.time/200);s.heatLevel=Math.floor(s.heat);s.lastKnown={x:p.x,y:p.y};s.spawnCop();s.respawnTimer=2;s.event('toast',{text:'YENİ İHBAR · EKİPLER SEVK EDİLDİ'});}
  }
  s.respawnTimer-=dt;
  const activeConfig=difficultyFor(s.heatLevel);
  if(s.pursuit&&s.respawnTimer<=0&&s.cops.filter(c=>c.alive&&!c.abandoned&&!c.roadblock).length<activeConfig.cap){
   s.spawnCop(undefined,undefined,undefined,s.searching?s.lastKnown:p);
   s.respawnTimer=s.searching?activeConfig.spawnInterval+3:activeConfig.spawnInterval;
  }
  s.roadblockTimer-=dt;
  if(s.pursuit&&s.heatLevel>=3&&s.roadblockTimer<=0){this.dispatchRoadblock(activeConfig);s.roadblockTimer=activeConfig.roadblock;}
 }
 dispatchRoadblock(config){
  const s=this.sim,p=s.human?.pursuitPosition()||s.player;if(s.cops.length>config.cap+1)return;
  const speed=Math.hypot(p.vx,p.vy),dx=speed>30?p.vx/speed:Math.cos(p.angle),dy=speed>30?p.vy/speed:Math.sin(p.angle);
  const candidates=s.world.navNodes.filter(n=>{const d=distance(n,p);return d>400&&d<1000&&((n.x-p.x)*dx+(n.y-p.y)*dy)>300&&lineClear(s.world,p,n,15);}).sort((a,b)=>distance(a,{x:p.x+dx*700,y:p.y+dy*700})-distance(b,{x:p.x+dx*700,y:p.y+dy*700}));
  const point=candidates[0];if(!point)return;
  const horizontal=Math.abs(dx)>Math.abs(dy);
  for(const side of [-1,1]){const x=point.x+(horizontal?0:side*48),y=point.y+(horizontal?side*48:0);if(!pointDrivable(s.world,{x,y},25))continue;const cop=s.spawnCop(x,y,horizontal?Math.PI/2:0);if(cop){cop.roadblock=true;cop.roadblockUntil=s.time+20;cop.age=2;}}
  s.event('toast',{text:'YOL BARİKATI · ALTERNATİF SOKAK BUL'});
 }
}

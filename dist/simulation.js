import {makeRealWorld} from './real-world.js';
import {HumanSystem} from './human.js';
import {StoryDirector} from './story.js';
import {TAU,clamp,angleDiff,distance,random} from './math.js';
import {CARS,MISSIONS} from './catalog.js';
import {makeWorld,setUnlockedRegions,regionAt,regionOpen,REGIONS,pointDrivable,nearestRoadNode,lineClear,routeTo,nodePoint,roadCoord,roadIndex,WORLD_SIZE,ROAD_COUNT} from './world.js';
import {createCar,drive,collideWorld,carsContact} from './physics.js';
import {PursuitDirector,difficultyFor} from './pursuit.js';
import {EquipmentSystem} from './equipment.js';
import {TrafficDirector} from './traffic.js';
const policeSpec={...CARS[0],speed:405,accel:240,steer:2.15,grip:5.8,health:65,color:'#e6e8d6',width:28,length:55};
const trafficSpec={...CARS[0],speed:145,accel:140,steer:2,grip:8,health:45,color:'#abb595',width:27,length:51};
export class Simulation{
 constructor(options={}){this.world=options.mapId==='real'?makeRealWorld():makeWorld(7193,options.regions||['galata']);this.rng=random(options.seed||Math.floor(Math.random()*100000));this.events=[];this.reset(options);}
 reset({carId='comet',color,mode='chase',demo=false,chaosStars=2,regions=['galata'],safehouses=['galata'],spawnRegion='galata',carSpec,arsenal,mapId='classic',storyState,armory}={}){
  this.mapId=mapId;if(mapId==='real'&&this.world.mapKind!=='real')this.world=makeRealWorld();if(mapId!=='real'&&this.world.mapKind==='real')this.world=makeWorld();mode=mode==='timed'?'chaos':mode;this.chaosStars=clamp(Math.round(chaosStars)||2,1,5);this.safehouses=[...safehouses];this.human=null;this.abandonedVehicles=[];this.copSerial=0;this.service=null;this.serviceCooldown=0;this.covered=false;this.seenBy='';this.escapeRequired=20;this.gateNotice=0;this.waypoint=null;this.navRoute=[];
  setUnlockedRegions(this.world,regions);
  this.mode=mode;this.demo=demo;this.time=0;this.done=false;this.win=false;this.score=0;this.cash=0;this.wrecks=0;this.escapes=0;this.driftScore=0;this.longestDrift=0;this.fastTime=0;this.maxSpeed=0;this.mission=0;this.missionsDone=0;this.combo=0;this.comboTime=0;this.comboMultiplier=1;this.comboCaption='DRIFT';this.heat=mode==='free'?0:mode==='chaos'?this.chaosStars:1;this.heatLevel=this.heat;this.escape=0;this.searching=false;this.pursuit=mode!=='free';this.respawnTimer=mode==='free'?Infinity:2;this.calmTime=0;this.particles=[];this.skids=[];this.wreckage=[];this.popups=[];this.shake=0;this.flash=0;this.slowmo=0;this.stuntChain=0;this.chainTimer=0;this.garage=null;this.events=[];this.trafficTimer=0;this.roadblockTimer=55;this.heli={x:0,y:0,active:false,visible:false,initialized:false,angle:0,radius:660,spotX:0,spotY:0};this.lastKnown={x:2220,y:2220};this.nearMisses=0;this.totalDrift=0;this.stuckTimer=0;
  const spec=carSpec||CARS.find(c=>c.id===carId)||CARS[0];const region=REGIONS.find(r=>r.id===spawnRegion&&this.safehouses.includes(r.id)&&this.world.unlockedRegions.includes(r.id))||REGIONS[0];const spawn=this.world.spawn||region.spawn;this.player=createCar(spawn.x,spawn.y,spawn.angle??-Math.PI/2,spec);if(color)this.player.color=color;this.lastKnown={x:this.player.x,y:this.player.y};this.controller=new PursuitDirector(this);this.equipment=new EquipmentSystem(this,arsenal);this.trafficDirector=new TrafficDirector(this);
  this.cops=[];this.traffic=[];this.world.pickups.forEach(p=>{p.active=true;p.cooldown=0;});
  this.missionList=mode==='free'?[MISSIONS[0],MISSIONS[3],MISSIONS[4],{title:'İğne deliğinden geç',desc:'Trafikte 10 yakın geçiş yap.',stat:'nearMisses',target:10,reward:1200},{title:'Şehri keşfet',desc:'3 dakika sürüş yap.',stat:'time',target:180,reward:1500}]:mode==='chaos'?[MISSIONS[1],MISSIONS[0],{title:'Baskıyı kır',desc:'60 saniye hayatta kal.',stat:'time',target:60,reward:700},MISSIONS[3],MISSIONS[5],{title:'Kaosun içinden',desc:'3 dakika dayan.',stat:'time',target:180,reward:2000},MISSIONS[4]]:MISSIONS;
  if(mode!=='free')for(let k=0;k<(mode==='chaos'?Math.min(4,difficultyFor(this.heatLevel).cap):3);k++)this.spawnCop();
  this.roadblockTimer=mode==='chaos'?12:35;
  for(let k=0;k<9;k++)this.spawnTraffic();
  this.human=new HumanSystem(this,armory);this.story=new StoryDirector(this,storyState);if(mode==='story'){this.heat=this.heatLevel=0;this.pursuit=false;this.calmTime=Infinity;this.cops=[];}
  this.demoTarget=0;this.demoRoute=[nodePoint(3,3),nodePoint(3,2),nodePoint(4,2),nodePoint(4,3),nodePoint(3,3)];if(this.world.mapKind==='real'){this.demoRoute=[];let n=nearestRoadNode(this.world,this.player),previous=null;for(let i=0;i<22&&n;i++){this.demoRoute.push({x:n.x,y:n.y});const next=n.neighbors.filter(id=>id!==previous),id=next[Math.floor(this.rng()*next.length)]||n.neighbors[0];previous=n.id;n=this.world.navIndex.get(id);}if(this.demoRoute.length<2)this.demoRoute=[{x:this.player.x,y:this.player.y},{x:this.player.x+100,y:this.player.y}];}
 }
 event(type,data={}){this.events.push({type,...data});}
 addPopup(text,x,y,color='#f9d78c'){this.popups.push({text,x,y,life:1.6,maxLife:1.6,color});}
 addScore(points,caption,x=this.player.x,y=this.player.y){this.score+=points;this.addPopup('+'+Math.round(points),x,y);if(caption)this.event('toast',{text:caption});}
 spawnCop(x,y,angle,center=this.human?.pursuitPosition()||this.player){
  const p=this.human?.pursuitPosition()||this.player,config=difficultyFor(this.heatLevel);
  if(x===undefined){
   let candidates=this.world.navNodes.filter(n=>{const d=distance(n,center);return d>700&&d<1800&&distance(n,p)>650&&!this.cops.some(c=>distance(c,n)<110);});
   if(!candidates.length)candidates=this.world.navNodes.filter(n=>distance(n,p)>600&&!this.cops.some(c=>distance(c,n)<100));
   if(!candidates.length)return null;
   const chosen=candidates[Math.floor(this.rng()*candidates.length)];x=chosen.x+(this.rng()-.5)*45;y=chosen.y+(this.rng()-.5)*45;angle=Math.atan2(center.y-y,center.x-x);
  }
  if(!pointDrivable(this.world,{x,y},22))return null;
  const heavy=this.rng()<config.heavy,interceptor=!heavy&&this.copSerial%3===1;
  const spec={...policeSpec,speed:config.speed+(interceptor?20:heavy?-18:0),accel:config.accel,health:heavy?145:80,width:heavy?33:28,length:heavy?62:55,steer:heavy?2.1:2.5,grip:6.5};
  const cop=createCar(x,y,angle,spec,'cop');cop.swat=this.heatLevel>=4&&(heavy||this.copSerial%2===0);if(cop.swat){cop.hp=cop.maxHp=210;cop.color='#263f4a';}cop.role=this.copSerial++%3;cop.heavy=heavy;cop.interceptor=interceptor;cop.routeTimer=0;cop.sirenOffset=this.rng()*TAU;this.cops.push(cop);return cop;
 }
 spawnTraffic(){return this.trafficDirector.spawn();}
 ai(c,dt){
  const p=this.human?.pursuitPosition()||this.player,d=distance(c,p);
  if(c.abandoned||c.dismounted||(this.human?.onFoot&&d<300))return {throttle:0,brake:c.speed>3?1:0,stop:true,steer:0};
  if(c.roadblock){if(this.time>(c.roadblockUntil??Infinity))c.roadblock=false;else{c.vx=c.vy=0;return {throttle:0,brake:0,steer:0};}}
  c.routeTimer-=dt;
  const canSee=d<difficultyFor(this.heatLevel).vision&&lineClear(this.world,c,p,16);
  let target=canSee||this.mode==='chaos'||this.heli.visible?p:this.lastKnown;
  if((canSee||this.mode==='chaos'||this.heli.visible)&&c.role>0){const projected={x:clamp(p.x+p.vx*(c.role===1?.8:1.3),70,this.world.size-70),y:clamp(p.y+p.vy*(c.role===1?.8:1.3),70,WORLD_SIZE-70)};target=pointDrivable(this.world,projected,24)?projected:nearestRoadNode(this.world,projected)||p;}
  if(c.routeTimer<=0){c.route=routeTo(this.world,c,target);c.routeTimer=.5+this.rng()*.25;}
  if(canSee&&lineClear(this.world,c,target,30))c.route=[target];
  while(c.route.length>1&&distance(c,c.route[0])<105)c.route.shift();
  const t=c.route[0]||target,desired=Math.atan2(t.y-c.y,t.x-c.x),diff=angleDiff(desired,c.angle);
  if(c.speed<22)c.stuck+=dt;else c.stuck=Math.max(0,c.stuck-dt*2);
  if(c.stuck>1.3&&c.reverse<=0){c.reverse=.85;c.stuck=0;}
  if(c.reverse>0){c.reverse-=dt;return {throttle:0,brake:1,steer:-Math.sign(diff||1)};}
  const turn=Math.abs(diff),throttle=turn>1.2&&c.speed>155?0:turn>.65&&c.speed>245?.16:1;
  let avoidance=0;if(d>180)for(const other of this.cops){if(other===c||!other.alive)continue;const ox=other.x-c.x,oy=other.y-c.y,front=ox*Math.cos(c.angle)+oy*Math.sin(c.angle),side=-ox*Math.sin(c.angle)+oy*Math.cos(c.angle);if(front>0&&front<110&&Math.abs(side)<42)avoidance-=Math.sign(side||1)*.35;}
  return {throttle,brake:turn>1.2&&c.speed>190?.5:0,steer:clamp(diff*1.9+avoidance,-1,1),handbrake:turn>.9&&turn<1.4&&c.speed>250,nitro:d>450&&turn<.2&&this.heatLevel>=2};
 }
 explode(car,source='crash',chainDepth=0){
  if(!car.alive)return;car.alive=false;this.shake=Math.max(this.shake,car.type==='player'?19:10);this.flash=Math.max(this.flash,.13);this.slowmo=Math.max(this.slowmo,car.type==='player'?.75:.08);
  this.wreckage.push({x:car.x,y:car.y,angle:car.angle,width:car.width,length:car.length,life:26,fire:5});
  for(let k=0;k<42;k++){const a=this.rng()*TAU,s=30+this.rng()*270;this.particles.push({x:car.x,y:car.y,vx:Math.cos(a)*s+car.vx*.25,vy:Math.sin(a)*s+car.vy*.25,r:3+this.rng()*12,life:.4+this.rng()*.9,maxLife:1.3,type:k<26?'fire':'debris',color:k%3===0?'#fff2ac':k%3===1?'#ed8a38':'#ce542d'});}
  for(let k=0;k<12;k++)this.particles.push({x:car.x+(this.rng()-.5)*20,y:car.y+(this.rng()-.5)*20,vx:(this.rng()-.5)*45,vy:(this.rng()-.5)*45-15,r:12+this.rng()*20,life:2+this.rng(),maxLife:3,type:'smoke',color:'#20291f'});
  this.event('explosion',{distance:distance(car,this.player),player:car.type==='player'});
  if(car.type==='player'&&this.human)this.human.bailout(car);
  if(car.type==='cop'){
   this.wrecks++;this.stuntChain=this.chainTimer>0?this.stuntChain+1:1;this.chainTimer=2.6;
   const reward=Math.round((car.heavy?240:150)*Math.min(5,1+(this.stuntChain-1)*.5));this.score+=reward;this.cash+=Math.round(reward*.15);this.combo+=reward;this.comboTime=2.5;this.comboMultiplier=clamp(1+this.stuntChain*.5,1,5);this.comboCaption=this.stuntChain>1?'ZİNCİRLEME KAOS':'POLİS SAF DIŞI';
   this.addPopup('+'+reward,car.x,car.y);if(this.stuntChain>=2)this.event('toast',{text:`${this.stuntChain} ARAÇ · ZİNCİRLEME PATLAMA`});
   if(this.mode!=='chaos')this.heat=Math.min(5,this.heat+.17);
  }else if(car.type==='traffic'){this.score+=50;this.heat=Math.min(5,this.heat+.08);this.addPopup('+50',car.x,car.y);}
  if(chainDepth<3){for(const other of [...this.cops,...this.traffic])if(other.alive&&other!==car&&distance(car,other)<88)this.explode(other,'chain',chainDepth+1);}
  if(car.type!=='player'&&distance(car,this.player)<68&&this.player.invulnerable<=0){this.damage(this.player,8);this.player.invulnerable=.6;}
 }
 damage(car,amount){if(!car.alive||car.invulnerable>0)return;car.hp=Math.max(0,car.hp-amount);car.invulnerable=car.type==='player'?.5:.2;if(car.hp<=0)this.explode(car);else if(car.type==='player'){this.event('hit');this.shake=Math.max(this.shake,4);}}
 particlesUpdate(dt){
  this.particles=this.particles.filter(p=>{p.life-=dt;if(p.life<=0)return false;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-2*dt);p.vy*=Math.exp(-2*dt);if(p.type==='smoke')p.r+=dt*10;return true;});
  if(this.particles.length>650)this.particles.splice(0,this.particles.length-650);
  this.skids=this.skids.filter(s=>(s.life-=dt)>0);if(this.skids.length>2300)this.skids.splice(0,this.skids.length-2300);
  this.wreckage=this.wreckage.filter(w=>{w.life-=dt;w.fire-=dt;return w.life>0;});
  this.popups=this.popups.filter(p=>{p.life-=dt;p.y-=dt*28;return p.life>0;});
 }
 update(dt,input={}){
  this.particlesUpdate(dt);this.shake=Math.max(0,this.shake-dt*27);this.flash=Math.max(0,this.flash-dt);this.slowmo=Math.max(0,this.slowmo-dt);
  if(this.done)return;
  if(input.vehicle&&!this.demo)this.human?.toggleVehicle();const p=this.player;this.time+=dt;this.chainTimer=Math.max(0,this.chainTimer-dt);this.comboTime=Math.max(0,this.comboTime-dt);
  if(!this.comboTime){this.combo=0;this.comboMultiplier=1;this.totalDrift=0;}
  if(this.demo){
   let target=this.demoRoute[this.demoTarget];if(distance(p,target)<110){this.demoTarget=(this.demoTarget+1)%this.demoRoute.length;target=this.demoRoute[this.demoTarget];}
   const diff=angleDiff(Math.atan2(target.y-p.y,target.x-p.x),p.angle);input={throttle:1,steer:clamp(diff*1.65,-1,1),handbrake:Math.abs(diff)>.4&&p.speed>180,nitro:false};p.hp=p.maxHp;
  }
  if(!this.human?.onFoot)drive(p,input,dt);const wall=this.human?.onFoot?{impact:0,normal:{x:0,y:0}}:collideWorld(p,this.world);
  if(wall.impact>65){this.damage(p,Math.max(2,(wall.impact-50)*.085));this.spark(p.x,p.y,wall.normal.x,wall.normal.y);if(wall.impact>130){this.combo=0;this.comboTime=0;}}
  this.maxSpeed=Math.max(this.maxSpeed,p.speed*.3);if(p.speed*.3>130)this.fastTime+=dt;
  if(p.skid>.1&&p.speed>90&&Math.abs(p.steer)>.1){
   const points=dt*(10+p.speed*.16)*Math.max(.3,p.skid);this.totalDrift+=dt;this.comboMultiplier=Math.max(this.comboMultiplier,clamp(1+Math.floor(this.totalDrift/2)*.5,1,5));const earned=points*this.comboMultiplier;
   this.score+=earned;this.driftScore+=earned;this.combo+=earned;this.comboTime=2.3;if(this.chainTimer<=0)this.comboCaption='DRIFT';this.longestDrift=Math.max(this.longestDrift,this.totalDrift);
  }
  if(!this.human?.onFoot)this.equipment.update(dt,input);
  this.updateVehicles(dt);
  this.resolveContacts();
  this.cops=this.cops.filter(c=>c.alive);this.traffic=this.traffic.filter(c=>c.alive);
  this.trafficTimer-=dt;if(this.trafficTimer<=0&&this.traffic.length<12){this.spawnTraffic();this.trafficTimer=1.6;}
  if(this.mode!=='free')this.updatePursuit(dt);
  this.updateInteractions(dt,input);
  this.updatePickups(dt);
  if(!this.demo){this.human.update(dt,input);this.story.update(dt);}
  const mission=this.missionList[this.mission];if(mission&&this[mission.stat]>=mission.target){this.score+=mission.reward;this.cash+=Math.round(mission.reward*.25);this.mission++;this.missionsDone++;this.event('mission',{text:`GÖREV TAMAM · +${mission.reward}`});}
  if(!p.alive&&!this.demo){this.deathTimer=(this.deathTimer||0)+dt;if(this.deathTimer>1.35)this.finish(false);}else this.deathTimer=0;
  
  if(this.demo&&(!p.alive||this.time>70))this.reset({demo:true,mapId:this.mapId});
 }
 updateVehicles(dt){if(this.human?.interior)return;const p=this.player;
  for(const car of [p,...this.cops,...this.traffic]){
   if(!car.alive||car===p&&this.human?.onFoot)continue;
   if(car!==p){
    let control;
    if(car.type==='cop')control=this.ai(car,dt);
    else control=this.trafficDirector.control(car,dt);
    drive(car,control,dt);const result=collideWorld(car,this.world);
    if(result.impact>190){if(car.type==='cop')this.damage(car,(result.impact-155)*(car.heavy?.25:.42));else this.damage(car,15);this.spark(car.x,car.y,result.normal.x,result.normal.y);}
    if(distance(car,p)>2800&&car.age>10||car.type==='traffic'&&car.age>150)car.alive=false;
   }
   if(car.skid>.18){const nx=-Math.sin(car.angle),ny=Math.cos(car.angle),backX=car.x-Math.cos(car.angle)*car.length*.27,backY=car.y-Math.sin(car.angle)*car.length*.27;
    for(const side of [-1,1])this.skids.push({x:backX+nx*car.width*.43*side,y:backY+ny*car.width*.43*side,px:backX+nx*car.width*.43*side-car.vx*dt,py:backY+ny*car.width*.43*side-car.vy*dt,life:17,alpha:car.skid*.38});
    if(this.rng()<.35)this.particles.push({x:backX,y:backY,vx:-car.vx*.1+(this.rng()-.5)*30,vy:-car.vy*.1+(this.rng()-.5)*30,r:5+this.rng()*5,life:.5+this.rng()*.5,maxLife:1,type:'smoke',color:'#c1c7b5'});
   }
   if(car.hp<car.maxHp*.35&&this.rng()<dt*12)this.particles.push({x:car.x+Math.cos(car.angle)*20,y:car.y+Math.sin(car.angle)*20,vx:0,vy:-20,r:7,life:1,maxLife:1,type:'smoke',color:'#333a2d'});
   if(car.boost&&this.rng()<.6)this.particles.push({x:car.x-Math.cos(car.angle)*car.length*.5,y:car.y-Math.sin(car.angle)*car.length*.5,vx:-Math.cos(car.angle)*70,vy:-Math.sin(car.angle)*70,r:5,life:.2,maxLife:.2,type:'fire',color:'#a3dfe8'});
  }
 }
 resolveContacts(){if(this.human?.interior)return;const p=this.player;if(this.human?.onFoot){for(const car of [...this.cops,...this.traffic]){const d=distance(car,p);if(d<car.width*.5+13){const nx=(p.x-car.x)/(d||1),ny=(p.y-car.y)/(d||1);p.x+=nx*(car.width*.5+14-d);p.y+=ny*(car.width*.5+14-d);if(car.speed>45)this.human.hit(p,Math.min(24,car.speed*.07),'traffic');}}return;}
  const cars=[p,...this.cops.filter(c=>c.alive),...this.traffic.filter(c=>c.alive)];
  for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
   const a=cars[i],b=cars[j];if(!a.alive||!b.alive||a.age<.6||b.age<.6)continue;
   const contact=carsContact(a,b);
   if(contact){const {nx,ny,depth}=contact,relative=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny,impact=Math.hypot(a.vx-b.vx,a.vy-b.vy);
    const massA=a.type==='player'&&a.spec.id==='brute'?2:1,massB=b.type==='player'&&b.spec.id==='brute'?2:1,wa=massB/(massA+massB),wb=massA/(massA+massB);
    a.x-=nx*(depth+1)*wa;a.y-=ny*(depth+1)*wa;b.x+=nx*(depth+1)*wb;b.y+=ny*(depth+1)*wb;
    if(relative>0){a.vx-=nx*relative*1.4*wa;a.vy-=ny*relative*1.4*wa;b.vx+=nx*relative*1.4*wb;b.vy+=ny*relative*1.4*wb;}
    if(impact>105&&a.crashCooldown<=0&&b.crashCooldown<=0){
     if(a.type!=='player'&&b.type!=='player'){this.explode(a);this.explode(b);}
     else {const npc=a===p?b:a;this.damage(p,clamp(impact*.055,6,26));this.damage(npc,impact*.5);this.spark(p.x,p.y,nx,ny);this.comboTime=0;}
     a.crashCooldown=.45;b.crashCooldown=.45;
    }
   }else if(a===p&&p.speed>180&&!b.nearMiss&&distance(p,b)<62){b.nearMiss=true;this.nearMisses++;this.score+=75;this.addPopup('SIYIRDI +75',p.x,p.y-20,'#d6e9b1');}
  }
 }
 updatePickups(dt){if(this.human?.interior)return;const p=this.player;
  for(const pickup of this.world.pickups){if(!regionOpen(this.world,pickup))continue;if(!pickup.active){pickup.cooldown-=dt;if(pickup.cooldown<=0)pickup.active=true;continue;}if(distance(p,pickup)<36){pickup.active=false;pickup.cooldown=60;this.event('pickup',{kind:pickup.type});
   if(pickup.type==='repair'){p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.4);this.addPopup('TAMİR +%40',p.x,p.y,'#c4e3a4');}
   if(pickup.type==='nitro'){p.nitro=100;this.addPopup('NİTRO DOLU',p.x,p.y,'#a6dde2');}
   if(pickup.type==='cash'){this.cash+=120;this.score+=200;this.addPopup('₺120  +200',p.x,p.y);}
  }}
 }
 updateInteractions(dt,input){
  const p=this.player;if(this.human?.onFoot){this.garage=this.service=null;return;}this.garage=null;this.service=null;this.serviceCooldown=Math.max(0,this.serviceCooldown-dt);this.gateNotice=Math.max(0,this.gateNotice-dt);
  if(p.alive&&p.speed<85){
   this.garage=this.world.garages.find(g=>regionOpen(this.world,g)&&distance(p,g)<g.r)||null;
   this.service=this.world.services.find(g=>regionOpen(this.world,g)&&distance(p,g)<g.r)||null;
  }
  if(input.interact&&this.service&&this.serviceCooldown<=0){this.serviceCooldown=3;this.event('service',{kind:this.service.type});return;}
  if(input.interact&&this.garage){
   if(this.mode==='chaos')this.event('toast',{text:'KAOSTA SIĞINAK YOK · TAKİP KESİLMEZ'});
   else if(!this.safehouses.includes(this.garage.id))this.event('toast',{text:'BU SIĞINAĞI ŞEHİR MENÜSÜNDEN SATIN AL'});
   else if(this.pursuit)this.event('toast',{text:'ÖNCE TAKİBİ TAMAMEN ATLAT'});
   else this.finish(true);
  }
  if(this.gateNotice<=0){const ahead={x:p.x+Math.cos(p.angle)*65,y:p.y+Math.sin(p.angle)*65};const region=regionAt(ahead);if(this.world.mapKind!=='real'&&!this.world.unlockedRegions.includes(region.id)){this.gateNotice=4;this.event('toast',{text:region.name+' KİLİTLİ · ŞEHİR MENÜSÜNDEN RUHSAT AL'});}}
 }
 updatePursuit(dt){this.controller.update(dt);}
 spark(x,y,nx,ny){for(let k=0;k<7;k++)this.particles.push({x,y,vx:nx*80+(this.rng()-.5)*180,vy:ny*80+(this.rng()-.5)*180,r:1+this.rng()*2,life:.2+this.rng()*.3,maxLife:.5,type:'spark',color:'#f7d387'});}
 finish(win=false){if(this.done)return;this.done=true;this.win=win;this.event('end',{win});}
 rescue(){const p=this.player,point=nearestRoadNode(this.world,p);if(!point)return;p.x=point.x;p.y=point.y;p.vx=0;p.vy=0;p.angle=-Math.PI/2;p.hp=Math.max(1,p.hp-p.maxHp*.12);p.invulnerable=2;this.combo=0;this.comboTime=0;this.event('toast',{text:'YOLA DÖNDÜN · KAPORTA −%12'});}
}

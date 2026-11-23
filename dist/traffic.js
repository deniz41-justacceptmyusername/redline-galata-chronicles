import {clamp,distance,angleDiff} from './math.js';
import {SPACING,pointDrivable} from './world.js';
import {CARS} from './catalog.js';
import {createCar} from './physics.js';
export function signalPhase(time,i,j){const t=((time+(i+j)%3*3)%30+30)%30;return {ew:t<11?'green':t<13?'amber':'red',ns:t>=15&&t<26?'green':t>=26&&t<28?'amber':'red'};}
export function lanePoint(a,b,at=b,lane=30){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;return {x:at.x-dy/d*lane,y:at.y+dx/d*lane};}
export class TrafficDirector{
 constructor(sim){this.sim=sim;}
 spawn(){
  const s=this.sim,p=s.player,candidates=s.world.navNodes.filter(n=>distance(n,p)>320&&distance(n,p)<1600&&n.neighbors.length);
  for(let attempt=0;attempt<12&&candidates.length;attempt++){
   const a=candidates[Math.floor(s.rng()*candidates.length)],b=s.world.navIndex.get(a.neighbors[Math.floor(s.rng()*a.neighbors.length)]),t=.2+s.rng()*.5,at=lanePoint(a,b,{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},s.world.mapKind==='real'?9:30);
   if(!pointDrivable(s.world,at,28)||[p,...s.traffic,...s.cops].some(c=>distance(c,at)<170))continue;
   const spec={...CARS[0],color:['#c3bca3','#889d9d','#ab7764','#8d877c','#d8cfad'][Math.floor(s.rng()*5)],health:45,length:48+Math.floor(s.rng()*3)*5,width:27,speed:110+s.rng()*50,accel:140,steer:2.4,grip:9};
   const car=createCar(at.x,at.y,Math.atan2(b.y-a.y,b.x-a.x),spec,'traffic');car.trafficRoute={from:a.id,to:b.id,committed:false};car.vx=Math.cos(car.angle)*spec.speed*.65;car.vy=Math.sin(car.angle)*spec.speed*.65;s.traffic.push(car);return car;
  }return null;
 }
 control(c,dt){
  const s=this.sim,w=s.world,route=c.trafficRoute;let a=w.navIndex.get(route?.from),b=w.navIndex.get(route?.to);
  if(!a||!b){c.alive=false;return {};}
  let target=lanePoint(a,b,b,w.mapKind==='real'?9:30),d=distance(c,target),dir={x:(b.x-a.x)/(distance(a,b)||1),y:(b.y-a.y)/(distance(a,b)||1)};
  const ahead=(b.x-c.x)*dir.x+(b.y-c.y)*dir.y;
  if(d<(w.mapKind==='real'?38:76)||ahead<12){const options=b.neighbors.filter(id=>id!==a.id),nextId=options.length?options[Math.floor(s.rng()*options.length)]:a.id,next=w.navIndex.get(nextId);route.from=b.id;route.to=nextId;route.committed=false;a=b;b=next;target=lanePoint(a,b,b,w.mapKind==='real'?9:30);d=distance(c,target);dir={x:(b.x-a.x)/(distance(a,b)||1),y:(b.y-a.y)/(distance(a,b)||1)};}
  const desired=Math.atan2(target.y-c.y,target.x-c.x),diff=angleDiff(desired,c.angle),horizontal=Math.abs(dir.x)>Math.abs(dir.y),along=(b.x-c.x)*dir.x+(b.y-c.y)*dir.y;
  const signal=signalPhase(s.time,b.i,b.j)[horizontal?'ew':'ns'];if(along<(w.mapKind==='real'?38:115))route.committed=true;
  const stopAtSignal=(w.mapKind!=='real'||w.signalIds?.has(b.id))&&!route.committed&&signal!=='green'&&along<(w.mapKind==='real'?180:280);
  const cos=Math.cos(c.angle),sin=Math.sin(c.angle);let obstacleDistance=Infinity;
  for(const o of [s.player,...s.traffic,...s.cops]){if(o===c||!o.alive)continue;const dx=o.x-c.x,dy=o.y-c.y,front=dx*cos+dy*sin,side=-dx*sin+dy*cos;if(front>0&&front<240&&Math.abs(side)<(o.width+c.width)/2+17)obstacleDistance=Math.min(obstacleDistance,front-(o.length+c.length)/2);}
  const turn=Math.abs(diff),cruise=c.spec.speed*(turn>.65?.35:turn>.3?.65:1),signalSpeed=stopAtSignal?Math.sqrt(Math.max(0,along-(w.mapKind==='real'?56:136))*110):Infinity,obstacleSpeed=Math.sqrt(Math.max(0,obstacleDistance-30)*120),targetSpeed=Math.min(cruise,signalSpeed,obstacleSpeed);
  c.stopReason=targetSpeed<4?(obstacleDistance<120?'obstacle':'red light'):'';c.braking=c.speed>targetSpeed+4;if(targetSpeed<3&&c.speed<9){c.vx=c.vy=0;c.speed=0;}
  return {throttle:c.speed<targetSpeed-3?1:0,brake:c.speed>targetSpeed+5?Math.min(1,(c.speed-targetSpeed)/65):0,stop:true,steer:clamp(diff*2.6,-1,1)};
 }
}

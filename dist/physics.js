import {polygonDistance,onBridge,roadClearance} from './real-world.js';
import {clamp,lerp} from './math.js';
import {CARS} from './catalog.js';
import {nearbyBuildings} from './world.js';
export function createCar(x,y,angle=0,spec=CARS[0],type='player'){
 return {x,y,px:x,py:y,angle,vx:0,vy:0,speed:0,steer:0,yaw:0,width:spec.width,length:spec.length,spec,type,color:spec.color,hp:spec.health,maxHp:spec.health,nitro:100,alive:true,invulnerable:0,age:0,skid:0,drift:0,boost:false,stuck:0,reverse:0,route:[],routeTimer:0,crashCooldown:0};
}
export function drive(car,input,dt){
 if(!car.alive)return;
 car.px=car.x;car.py=car.y;car.age+=dt;car.invulnerable=Math.max(0,car.invulnerable-dt);car.crashCooldown=Math.max(0,car.crashCooldown-dt);
 const spec=car.spec,c=Math.cos(car.angle),s=Math.sin(car.angle),forward=car.vx*c+car.vy*s;
 const absSpeed=Math.hypot(car.vx,car.vy),steer=clamp(input.steer||0,-1,1),throttle=input.throttle||0,brake=input.brake||0;
 car.steer=lerp(car.steer,steer,1-Math.exp(-12*dt));
 car.oily=Math.max(0,(car.oily||0)-dt);
 const hb=input.handbrake&&absSpeed>55;
 car.boost=!!(input.nitro&&car.nitro>.5&&throttle>0&&forward>-10);
 if(car.boost)car.nitro=Math.max(0,car.nitro-dt*25/spec.nitro);else car.nitro=Math.min(100,car.nitro+dt*(car.type==='player'?(spec.nitroRegen||4.5):8));
 const reverse=forward< -15?-1:1;
 const yawTarget=car.steer*spec.steer*clamp(absSpeed/115,0,1)*(hb?1.42:1)*reverse/(1+Math.max(0,absSpeed-310)*.0011);
 car.yaw=lerp(car.yaw,yawTarget,1-Math.exp(-9*dt));car.angle+=(car.yaw+(car.oily>0?(car.spin||1.5)*Math.min(1,absSpeed/100):0))*dt;
 let acceleration=throttle*spec.accel*(car.boost?1.78:1)*(car.tireBlown?.6:1);
 if(brake)acceleration-=forward>12?spec.accel*1.8*(spec.brakeStrength||1):input.stop?Math.max(0,forward)/Math.max(dt,.001):spec.accel*.7;
 if(hb)acceleration-=Math.max(0,forward)*.22;
 car.vx+=c*acceleration*dt;car.vy+=s*acceleration*dt;
 const nc=Math.cos(car.angle),ns=Math.sin(car.angle);
 let f=car.vx*nc+car.vy*ns,l=-car.vx*ns+car.vy*nc;
 const slipGrip=car.oily>0?.24:hb?.95:spec.grip*(car.tireBlown?.5:1);
 l*=Math.exp(-slipGrip*dt);
 f*=Math.exp(-(throttle?0.25:brake?.52:.67)*dt);
 const max=spec.speed*(car.boost?1.4:1)*(car.tireBlown?.55:1);
 f=clamp(f,-spec.speed*.28,max);
 car.vx=nc*f-ns*l;car.vy=ns*f+nc*l;
 car.x+=car.vx*dt;car.y+=car.vy*dt;
 car.speed=Math.hypot(car.vx,car.vy);
 car.drift=Math.abs(Math.atan2(l,Math.max(1,Math.abs(f))));
 car.skid=absSpeed>70&&((hb&&Math.abs(car.steer)>.08)||car.drift>.15||car.oily>0)?clamp(Math.abs(l)/100+(hb?.45:0),0,1):0;
}
export function collideWorld(car,world){
 let maxImpact=0,normal={x:0,y:0};
 const radius=car.width*.48,offset=car.length*.27;
 for(let pass=0;pass<2;pass++)for(const k of [-1,1]){
  let cx=car.x+Math.cos(car.angle)*offset*k,cy=car.y+Math.sin(car.angle)*offset*k;
  for(const b of nearbyBuildings(world,cx,cy,radius+2)){
   let nx,ny,len;if(b.poly){if(b.kind!=='water'&&world.mapKind==='real'&&roadClearance(world,{x:cx,y:cy},radius))continue;if(b.kind==='water'&&onBridge(world,{x:cx,y:cy}))continue;const hit=polygonDistance({x:cx,y:cy},b.poly);if(!hit.inside&&hit.distance>=radius)continue;nx=cx-hit.point.x;ny=cy-hit.point.y;const d=Math.hypot(nx,ny)||1;nx/=d;ny/=d;if(hit.inside){nx=-nx;ny=-ny;}len=hit.inside?-hit.distance:hit.distance;const penetration=radius-len+.1;car.x+=nx*penetration;car.y+=ny*penetration;cx+=nx*penetration;cy+=ny*penetration;const vn=car.vx*nx+car.vy*ny;if(vn<0){maxImpact=Math.max(maxImpact,-vn);normal={x:nx,y:ny};car.vx-=nx*vn*1.22;car.vy-=ny*vn*1.22;}continue;}nx=cx-clamp(cx,b.x,b.x+b.w);ny=cy-clamp(cy,b.y,b.y+b.h);len=Math.hypot(nx,ny);
   if(len>=radius)continue;
   if(len<.001){const edges=[{d:Math.abs(cx-b.x),x:-1,y:0},{d:Math.abs(cx-b.x-b.w),x:1,y:0},{d:Math.abs(cy-b.y),x:0,y:-1},{d:Math.abs(cy-b.y-b.h),x:0,y:1}].sort((a,b)=>a.d-b.d);nx=edges[0].x;ny=edges[0].y;len=-edges[0].d;}
   else {nx/=len;ny/=len;}
   const penetration=radius-len+.1;car.x+=nx*penetration;car.y+=ny*penetration;cx+=nx*penetration;cy+=ny*penetration;
   const vn=car.vx*nx+car.vy*ny;
   if(vn<0){maxImpact=Math.max(maxImpact,-vn);normal={x:nx,y:ny};car.vx-=nx*vn*1.22;car.vy-=ny*vn*1.22;car.vx*=.85;car.vy*=.85;car.yaw*=.4;}
  }
 }
 for(const axis of ['x','y']){const v='v'+axis;if(car[axis]<45){maxImpact=Math.max(maxImpact,-car[v]);car[axis]=45;car[v]=Math.abs(car[v])*.35;}if(car[axis]>world.size-45){maxImpact=Math.max(maxImpact,car[v]);car[axis]=world.size-45;car[v]=-Math.abs(car[v])*.35;}}
 return {impact:maxImpact,normal};
}
export function carsContact(a,b){
 if(Math.abs(a.x-b.x)>75||Math.abs(a.y-b.y)>75)return null;
 const ra=a.width*.49,rb=b.width*.49;
 let best=null;
 for(const ka of [-1,1])for(const kb of [-1,1]){
  const ax=a.x+Math.cos(a.angle)*a.length*.25*ka,ay=a.y+Math.sin(a.angle)*a.length*.25*ka,bx=b.x+Math.cos(b.angle)*b.length*.25*kb,by=b.y+Math.sin(b.angle)*b.length*.25*kb;
  let dx=bx-ax,dy=by-ay,dist=Math.hypot(dx,dy);
  if(dist<ra+rb){if(dist<.01){dx=Math.cos(a.angle+Math.PI/2);dy=Math.sin(a.angle+Math.PI/2);dist=1;}const depth=ra+rb-dist;if(!best||depth>best.depth)best={nx:dx/dist,ny:dy/dist,depth};}
 }
 return best;
}

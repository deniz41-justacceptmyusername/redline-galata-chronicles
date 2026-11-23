import {drawLocalizedText} from './i18n.js';
import {signalPhase} from './traffic.js';
import {clamp,lerp,TAU} from './math.js';
import {WORLD_SIZE,SPACING,ROAD_START,ROAD_WIDTH,ROAD_COUNT,roadCoord,REGIONS,regionAt,regionOpen} from './world.js';
const visible=(o,b,margin=60)=>o.x+(o.w||margin)>b.x&&o.y+(o.h||margin)>b.y&&o.x-margin<b.x+b.w&&o.y-margin<b.y+b.h;
const roundRect=(ctx,x,y,w,h,r=3)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
export function drawCar(ctx,car,time=0,{shadow=true,night=false,ghost=false}={}){
 const {x,y,angle,width:w,length:l,color,type}=car;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);
 if(shadow){ctx.fillStyle='#101b1480';roundRect(ctx,-l/2+5,-w/2+7,l+2,w+2,5);ctx.fill();}
 if(ghost)ctx.globalAlpha=.7;
 if(night){
  const beam=ctx.createLinearGradient(l/2,0,l/2+190,0);beam.addColorStop(0,'#fff5ce33');beam.addColorStop(1,'#fff5ce00');ctx.fillStyle=beam;
  ctx.beginPath();ctx.moveTo(l/2,-w*.35);ctx.lineTo(l/2+190,-55);ctx.lineTo(l/2+190,55);ctx.lineTo(l/2,w*.35);ctx.closePath();ctx.fill();
 }
 ctx.fillStyle='#171c19';
 for(const side of [-1,1]){ctx.fillRect(-l*.32,side*w*.48-3,11,6);ctx.save();ctx.translate(l*.28,side*w*.48);ctx.rotate((car.steer||0)*.45);ctx.fillRect(-6,-3,12,6);ctx.restore();}
 ctx.fillStyle=car.swat?'#253d49':type==='cop'?'#e3e4d5':color;roundRect(ctx,-l/2,-w/2,l,w,4);ctx.fill();
 ctx.fillStyle='#111c17';ctx.fillRect(-l/2+1,-w/2+2,3,w-4);ctx.fillRect(l/2-3,-w/2+2,3,w-4);
 ctx.fillStyle='#ffffff28';ctx.fillRect(-l/2+5,-w/2+1,l-11,2);
 ctx.fillStyle='#00000027';ctx.fillRect(-l/2+5,w/2-3,l-11,3);
 if(type==='cop'){ctx.fillStyle='#28352d';ctx.fillRect(l*.18,-w/2+1,l*.28,w-2);ctx.fillRect(-l/2+4,-w/2+1,9,w-2);}
 ctx.fillStyle='#263b37';ctx.beginPath();ctx.moveTo(l*.18,-w*.39);ctx.lineTo(l*.29,-w*.31);ctx.lineTo(l*.29,w*.31);ctx.lineTo(l*.18,w*.39);ctx.closePath();ctx.fill();
 ctx.fillStyle='#8ea79b60';ctx.beginPath();ctx.moveTo(l*.19,-w*.34);ctx.lineTo(l*.26,-w*.28);ctx.lineTo(l*.26,0);ctx.lineTo(l*.19,0);ctx.closePath();ctx.fill();
 ctx.fillStyle='#263b37';ctx.beginPath();ctx.moveTo(-l*.2,-w*.37);ctx.lineTo(-l*.3,-w*.28);ctx.lineTo(-l*.3,w*.28);ctx.lineTo(-l*.2,w*.37);ctx.closePath();ctx.fill();
 ctx.fillStyle=type==='cop'?'#cfd7c6':color;roundRect(ctx,-l*.2,-w*.37,l*.38,w*.74,2);ctx.fill();
 ctx.strokeStyle='#eef2d82c';ctx.lineWidth=1;ctx.stroke();
 // Mirrors, panel seams and hood vents.
 ctx.fillStyle=type==='cop'?'#d2d8cb':color;ctx.fillRect(l*.13,-w/2-3,5,4);ctx.fillRect(l*.13,w/2-1,5,4);
 ctx.strokeStyle='#17231c50';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(l*.36,-w*.38);ctx.lineTo(l*.36,w*.38);ctx.moveTo(-l*.36,-w*.38);ctx.lineTo(-l*.36,w*.38);ctx.stroke();
 if(car.spec?.id==='spectre'||car.spec?.id==='ronin'){ctx.fillStyle='#263329';ctx.fillRect(-l/2+1,-w/2-2,4,w+4);ctx.fillRect(l*.31,-w*.15,5,w*.3);}
 if(car.spec?.id==='brute'){ctx.fillStyle='#28362988';ctx.fillRect(l*.28,-w*.14,10,w*.28);}
 ctx.fillStyle='#f9efbe';ctx.fillRect(l/2-3,-w/2+3,3,6);ctx.fillRect(l/2-3,w/2-9,3,6);
 ctx.fillStyle=car.braking?'#ff4c27':'#bb4a35';ctx.fillRect(-l/2,-w/2+3,2,6);ctx.fillRect(-l/2,w/2-9,2,6);
 if(type==='cop'){
  ctx.fillStyle='#293c32';ctx.font='bold 7px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.save();ctx.rotate(Math.PI/2);drawLocalizedText(ctx,car.swat?'SWAT':'POLİS',0,0);ctx.restore();
  const phase=Math.sin(time*18+(car.sirenOffset||0));ctx.fillStyle='#25342b';ctx.fillRect(-3,-w*.4,6,w*.8);
  for(const side of [-1,1]){const on=phase*side>0;ctx.fillStyle=side===1?(on?'#fa634e':'#a3382d'):(on?'#7bcaff':'#365c80');ctx.fillRect(-2,side===1?1:-w*.38,4,w*.34);if(on){ctx.save();ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(0,side*w*.28,1,0,side*w*.28,night?70:28);g.addColorStop(0,side===1?'#ff433480':'#439fff80');g.addColorStop(1,'#00000000');ctx.fillStyle=g;ctx.fillRect(-75,-80,150,160);ctx.restore();}}
 }
 if(car.tireBlown){ctx.strokeStyle='#ecbd75';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-l*.3,-w*.65);ctx.lineTo(-l*.15,-w*.35);ctx.moveTo(-l*.15,-w*.65);ctx.lineTo(-l*.3,-w*.35);ctx.stroke();}
 if(car.attachments?.includes('mine')){ctx.fillStyle='#e5b96a';ctx.fillRect(-l*.42,-w*.3,7,7);ctx.fillRect(-l*.42,w*.3-7,7,7);}
 if(car.attachments?.includes('oil')){ctx.fillStyle='#394f54';ctx.fillRect(-l*.39,-w*.16,12,w*.32);ctx.strokeStyle='#9cbbc1';ctx.lineWidth=1;ctx.strokeRect(-l*.39,-w*.16,12,w*.32);}
 if(car.attachments?.includes('turret')){ctx.fillStyle='#233a37';ctx.fillRect(-l*.31,-3,12,6);}
 if(car.boost){ctx.fillStyle='#bce9ee';ctx.beginPath();ctx.moveTo(-l/2,-7);ctx.lineTo(-l/2-15-Math.sin(time*80)*5,0);ctx.lineTo(-l/2,7);ctx.fill();ctx.fillStyle='#f5f7ce';ctx.fillRect(-l/2-6,-3,7,6);}
 ctx.restore();
}
export class Renderer{
 constructor(canvas,sim,settings={}){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.sim=sim;this.settings=settings;this.camera={x:sim.player.x,y:sim.player.y,zoom:1};this.w=innerWidth;this.h=innerHeight;this.ratio=1;this.resize();}
 resize(){this.w=innerWidth;this.h=innerHeight;this.ratio=Math.min(devicePixelRatio||1,this.settings.quality==='low'?1:1.6);this.canvas.width=Math.round(this.w*this.ratio);this.canvas.height=Math.round(this.h*this.ratio);}
 setSim(sim){this.sim=sim;this.camera.x=sim.player.x;this.camera.y=sim.player.y;}
 render(dt=1/60){
  if(this.sim.human?.interior){this.renderInterior(dt);return;}
  const s=this.sim,p=s.player,c=this.ctx,t=s.time;
  const baseZoom=this.w<600?.68:this.w<900?.83:1;
  const zoom=(s.demo?.94:baseZoom)*(1-clamp(p.speed/2200,0,.23));
  this.camera.zoom=lerp(this.camera.zoom,zoom,1-Math.exp(-2*dt));
  const menuOffset=s.demo?(this.w>800?210:this.w>520?175:0):0;
  this.camera.x=lerp(this.camera.x,p.x+p.vx*.36-menuOffset/this.camera.zoom,1-Math.exp(-4.5*dt));
  this.camera.y=lerp(this.camera.y,p.y+p.vy*.36,1-Math.exp(-4.5*dt));
  const shake=this.settings.shake!==false&&!s.demo?s.shake:0,z=this.camera.zoom;
  c.setTransform(this.ratio,0,0,this.ratio,0,0);c.fillStyle='#52634b';c.fillRect(0,0,this.w,this.h);
  c.save();c.translate(this.w/2+(Math.random()-.5)*shake,this.h/2+(Math.random()-.5)*shake);c.scale(z,z);c.translate(-this.camera.x,-this.camera.y);
  const b={x:this.camera.x-this.w/(2*z)-100,y:this.camera.y-this.h/(2*z)-100,w:this.w/z+200,h:this.h/z+200};
  this.drawWorld(c,b);
  for(const skid of s.skids){if(!visible(skid,b,5))continue;c.strokeStyle=`rgba(22,31,25,${skid.alpha*Math.min(1,skid.life/3)})`;c.lineWidth=3.5;c.beginPath();c.moveTo(skid.px,skid.py);c.lineTo(skid.x,skid.y);c.stroke();}
  if(s.waypoint&&s.navRoute?.length){c.strokeStyle='#ef9e573d';c.lineWidth=5;c.setLineDash([10,15]);c.beginPath();c.moveTo(p.x,p.y);for(const point of s.navRoute)c.lineTo(point.x,point.y);c.stroke();c.setLineDash([]);}
  for(const garage of s.world.garages)if(regionOpen(s.world,garage)&&visible(garage,b,90))this.drawGarage(c,garage,t);
  for(const pickup of s.world.pickups)if(pickup.active&&regionOpen(s.world,pickup)&&visible(pickup,b,30))this.drawPickup(c,pickup,t);
  for(const station of s.world.services)if(regionOpen(s.world,station)&&visible(station,b,90))this.drawService(c,station);
  if(this.settings.night){c.fillStyle='#071d3466';c.fillRect(b.x,b.y,b.w,b.h);this.streetLights(c,b);}
  this.drawEquipment(c,b);
  for(const w of s.wreckage)if(visible(w,b,60))this.drawWreck(c,w,t);
  for(const car of [...s.traffic,...s.cops,...(s.abandonedVehicles||[]),...(s.human?.onFoot?[s.human.vehicle]:[p])])if(car.alive&&visible(car,b,100))drawCar(c,car,t,{night:this.settings.night});
  if(p.alive&&!s.demo&&!s.human?.onFoot){c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.fillStyle='#ececd2';c.globalAlpha=.75;c.beginPath();c.moveTo(41,0);c.lineTo(34,-5);c.lineTo(34,5);c.fill();c.restore();}
  this.drawPeople(c,b);this.drawParticles(c,b);
  for(const prop of s.world.props)if(prop.type==='tree'&&visible(prop,b,50))this.drawTree(c,prop);
  this.drawCovers(c,b);
  this.drawLockedGates(c,b);
  if(s.heli.active)this.drawHeli(c,s.heli,t);
  c.textAlign='center';c.textBaseline='middle';c.font='700 20px "Barlow Condensed",Arial';
  for(const pop of s.popups){c.globalAlpha=Math.min(1,pop.life*2);c.fillStyle='#172219';drawLocalizedText(c,pop.text,pop.x+1,pop.y+2);c.fillStyle=pop.color;drawLocalizedText(c,pop.text,pop.x,pop.y);}c.globalAlpha=1;
  c.restore();
  if(p.hp<p.maxHp*.25&&p.alive&&!s.demo){c.fillStyle=`rgba(142,35,21,${.04+.025*Math.sin(t*5)})`;c.fillRect(0,0,this.w,this.h);}
  if(s.flash>0&&this.settings.shake!==false){c.fillStyle=`rgba(255,207,125,${s.flash*.6})`;c.fillRect(0,0,this.w,this.h);}
  // Subtle film texture, without obscuring the road.
  c.fillStyle='#0a160c05';for(let y=0;y<this.h;y+=4)c.fillRect(0,y,this.w,1);
 }
 drawEquipment(c,b){
  for(const h of this.sim.equipment.hazards){if(!visible(h,b,100))continue;c.save();c.translate(h.x,h.y);c.globalAlpha=Math.min(1,h.life/2);
   if(h.type==='oil'){c.fillStyle='#101c27bf';c.beginPath();c.ellipse(0,0,h.r,h.r*.7,.4,0,TAU);c.fill();c.strokeStyle='#73a2ac70';c.lineWidth=3;c.beginPath();c.ellipse(-6,-7,h.r*.6,h.r*.34,.4,0,TAU);c.stroke();c.strokeStyle='#927bb24a';c.beginPath();c.ellipse(7,8,h.r*.45,h.r*.25,.4,0,TAU);c.stroke();}
   else{c.fillStyle='#26392b';c.beginPath();c.arc(0,0,13,0,TAU);c.fill();c.strokeStyle='#e7bc7d';c.lineWidth=3;for(let k=0;k<6;k++){const a=k*TAU/6;c.beginPath();c.moveTo(Math.cos(a)*7,Math.sin(a)*7);c.lineTo(Math.cos(a)*20,Math.sin(a)*20);c.stroke();}c.fillStyle=h.arm>0?'#a8ae90':'#ff865d';c.beginPath();c.arc(0,0,4,0,TAU);c.fill();}c.restore();
  }
  for(const t of this.sim.equipment.traces){c.strokeStyle='#ffdf9b';c.lineWidth=2.5;c.beginPath();c.moveTo(t.x,t.y);c.lineTo(t.tx,t.ty);c.stroke();}
 }
 drawWorld(c,b){
  const world=this.sim.world;
  c.fillStyle='#637653';c.fillRect(0,0,WORLD_SIZE,WORLD_SIZE);
  c.fillStyle='#50594c';
  for(let i=0;i<ROAD_COUNT;i++){const at=roadCoord(i);c.fillRect(at-ROAD_WIDTH/2,0,ROAD_WIDTH,WORLD_SIZE);c.fillRect(0,at-ROAD_WIDTH/2,WORLD_SIZE,ROAD_WIDTH);}
  // Pavement edges keep junctions easy to read at speed.
  for(const block of world.blocks){if(!visible(block,b))continue;
   c.fillStyle=block.region==='surici'?'#b2a58a':block.region==='kadikoy'?'#b1b6a1':'#a8ab91';c.fillRect(block.x,block.y,block.w,block.h);
   c.fillStyle=block.region==='galata'?'#888a71':block.region==='surici'?'#988b71':block.region==='kadikoy'?'#8d9c86':'#829574';c.fillRect(block.x+9,block.y+9,block.w-18,block.h-18);
   c.strokeStyle='#c2c1a125';c.lineWidth=1;
   for(let k=20;k<block.w;k+=30){c.beginPath();c.moveTo(block.x+k,block.y);c.lineTo(block.x+k,block.y+9);c.moveTo(block.x+k,block.y+block.h-9);c.lineTo(block.x+k,block.y+block.h);c.moveTo(block.x,block.y+k);c.lineTo(block.x+9,block.y+k);c.moveTo(block.x+block.w-9,block.y+k);c.lineTo(block.x+block.w,block.y+k);c.stroke();}
   if(block.kind==='park'){
    c.fillStyle='#687e52';c.fillRect(block.x+14,block.y+14,block.w-28,block.h-28);
    c.fillStyle='#9b9b76';c.fillRect(block.x+block.w/2-13,block.y+14,26,block.h-28);c.fillRect(block.x+14,block.y+block.h/2-13,block.w-28,26);
    c.strokeStyle='#c8c39b33';c.lineWidth=2;c.strokeRect(block.x+24,block.y+24,block.w-48,block.h-48);
    for(const q of [85,block.w-100]){c.fillStyle='#5c5d42';c.fillRect(block.x+q,block.y+block.w/2+20,35,8);c.fillRect(block.x+q,block.y+block.w/2-28,35,8);}
   }else if(block.kind==='parking'||block.landmark==='drift'){
    c.fillStyle='#68705c';c.fillRect(block.x+15,block.y+15,block.w-30,block.h-30);
    c.strokeStyle='#c2c4a585';c.lineWidth=2;for(let k=0;k<8;k++)for(const row of [48,block.h-110]){c.beginPath();c.moveTo(block.x+48+k*48,block.y+row);c.lineTo(block.x+48+k*48,block.y+row+66);c.lineTo(block.x+96+k*48,block.y+row+66);c.stroke();}
    c.fillStyle='#d2d0ab80';c.font='bold 55px Arial';c.textAlign='center';drawLocalizedText(c,'P',block.x+block.w/2,block.y+block.h/2+20);
   }
  }
  c.setLineDash([20,20]);c.lineWidth=1.5;c.strokeStyle='#b4af7c99';
  for(let i=0;i<ROAD_COUNT;i++){const at=roadCoord(i);if(at>b.x-100&&at<b.x+b.w+100)for(let j=0;j<ROAD_COUNT-1;j++){c.beginPath();c.moveTo(at-3,roadCoord(j)+95);c.lineTo(at-3,roadCoord(j+1)-95);c.moveTo(at+3,roadCoord(j)+95);c.lineTo(at+3,roadCoord(j+1)-95);c.stroke();}if(at>b.y-100&&at<b.y+b.h+100)for(let j=0;j<ROAD_COUNT-1;j++){c.beginPath();c.moveTo(roadCoord(j)+95,at-3);c.lineTo(roadCoord(j+1)-95,at-3);c.moveTo(roadCoord(j)+95,at+3);c.lineTo(roadCoord(j+1)-95,at+3);c.stroke();}}
  c.setLineDash([]);
  for(let i=0;i<ROAD_COUNT;i++)for(let j=0;j<ROAD_COUNT;j++){
   const x=roadCoord(i),y=roadCoord(j);if(!visible({x:x-115,y:y-115,w:230,h:230},b))continue;
   c.fillStyle='#c2c1a66b';for(const side of [-1,1])for(let k=0;k<10;k++){c.fillRect(x-65+k*13,y+side*98-9,7,18);c.fillRect(x+side*98-9,y-65+k*13,18,7);}
   c.strokeStyle='#b9bba354';c.lineWidth=2;for(const side of [-1,1]){c.beginPath();c.moveTo(x+side*122,y+5);c.lineTo(x+side*122,y+70);c.moveTo(x-5,y+side*122);c.lineTo(x-70,y+side*122);c.stroke();}
   c.fillStyle='#363e33';c.beginPath();c.ellipse(x+22,y-20,8,7,0,0,TAU);c.fill();c.strokeStyle='#7a836b';c.lineWidth=1;c.stroke();
   // Street lamps and signals are scenery, not invisible collision walls.
   for(const [sx,sy] of [[-1,-1],[1,1]]){const lx=x+sx*91,ly=y+sy*91;c.strokeStyle='#354a32';c.lineWidth=3;c.beginPath();c.moveTo(lx+8,ly+14);c.lineTo(lx,ly);c.stroke();c.fillStyle='#d9d6ab';c.fillRect(lx-4,ly-3,8,4);c.fillStyle='#343d30';c.fillRect(lx+sx*10,ly-4,5,12);const light=signalPhase(this.sim.time,i,j)[sx<0?'ew':'ns'];c.fillStyle=light==='green'?'#a5df72':light==='amber'?'#ffd27b':'#f06548';c.fillRect(lx+sx*10+1,ly-2,3,3);}
  }
  // Painted direction arrows.
  c.fillStyle='#c6c7ad65';for(let i=0;i<ROAD_COUNT;i++)for(let j=0;j<ROAD_COUNT-1;j++){
   const x=roadCoord(i),y=roadCoord(j)+SPACING/2;if(visible({x,y},b,70)){for(const dir of [-1,1]){c.save();c.translate(x-dir*36,y);c.rotate(dir>0?Math.PI/2:-Math.PI/2);c.fillRect(-13,-2,20,4);c.beginPath();c.moveTo(13,0);c.lineTo(3,-7);c.lineTo(3,7);c.fill();c.restore();}}
   if(visible({x:y,y:x},b,70)){for(const dir of [-1,1]){c.save();c.translate(y,x+dir*36);c.rotate(dir>0?0:Math.PI);c.fillRect(-13,-2,20,4);c.beginPath();c.moveTo(13,0);c.lineTo(3,-7);c.lineTo(3,7);c.fill();c.restore();}}
  }
  for(const building of world.buildings)if(!building.hidden&&visible(building,b,80))this.drawBuilding(c,building);
  for(const prop of world.props){if(!visible(prop,b,60))continue;if(prop.type==='parked')drawCar(c,{...prop,angle:prop.a,length:50,width:25,type:'traffic'});if(prop.type==='fountain'){
   c.fillStyle='#45533e';c.beginPath();c.ellipse(prop.x+5,prop.y+7,prop.r+7,prop.r+7,0,0,TAU);c.fill();c.fillStyle='#b4b99b';c.beginPath();c.arc(prop.x,prop.y,prop.r+5,0,TAU);c.fill();c.fillStyle='#638b7e';c.beginPath();c.arc(prop.x,prop.y,prop.r,0,TAU);c.fill();c.strokeStyle='#b9d6bb66';c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();c.arc(prop.x,prop.y,8+(this.sim.time*9+k*12)%35,0,TAU);c.stroke();}c.fillStyle='#c5d1b4';c.beginPath();c.arc(prop.x,prop.y,6,0,TAU);c.fill();}
  }
  this.drawGeography(c,b);
  // City boundary retaining wall.
  c.strokeStyle='#acb08c';c.lineWidth=8;c.strokeRect(22,22,WORLD_SIZE-44,WORLD_SIZE-44);c.strokeStyle='#28372b';c.lineWidth=18;c.strokeRect(10,10,WORLD_SIZE-20,WORLD_SIZE-20);
 }
 drawGeography(c,b){
  const world=this.sim.world,t=this.sim.time;
  c.fillStyle='#416d70';for(const water of world.water)if(visible(water,b)){c.fillRect(water.x,water.y,water.w,water.h);c.save();c.beginPath();c.rect(water.x,water.y,water.w,water.h);c.clip();c.strokeStyle='#93b4a427';c.lineWidth=2;for(let y=Math.max(water.y,Math.floor(b.y/35)*35);y<Math.min(water.y+water.h,b.y+b.h);y+=35){c.beginPath();for(let x=Math.max(water.x,b.x);x<Math.min(water.x+water.w,b.x+b.w);x+=40){c.moveTo(x,y+Math.sin(x*.03+t)*3);c.lineTo(x+17,y+Math.sin(x*.03+t)*3);}c.stroke();}c.restore();}
  for(const bridge of world.bridges)if(visible(bridge,b,90)){
   c.fillStyle='#253f3655';c.fillRect(bridge.x+15,bridge.y+18,bridge.w,bridge.h);c.fillStyle=bridge.tunnel?'#506360':'#666c59';c.fillRect(bridge.x,bridge.y,bridge.w,bridge.h);
   c.strokeStyle='#b6b895';c.lineWidth=5;c.strokeRect(bridge.x,bridge.y,bridge.w,bridge.h);c.strokeStyle='#bab38388';c.lineWidth=2;c.setLineDash([18,18]);c.beginPath();if(bridge.horizontal){c.moveTo(bridge.x,bridge.y+82);c.lineTo(bridge.x+bridge.w,bridge.y+82);}else{c.moveTo(bridge.x+82,bridge.y);c.lineTo(bridge.x+82,bridge.y+bridge.h);}c.stroke();c.setLineDash([]);
   if(!bridge.tunnel){c.fillStyle='#c2c0a5';if(bridge.horizontal)for(const x of [bridge.x+50,bridge.x+bridge.w-60]){c.fillRect(x,bridge.y-12,13,24);c.fillRect(x,bridge.y+bridge.h-12,13,24);}else for(const y of [bridge.y+50,bridge.y+bridge.h-60]){c.fillRect(bridge.x-12,y,24,13);c.fillRect(bridge.x+bridge.w-12,y,24,13);}}
  }
  for(const prop of world.props)if(visible(prop,b,100)&&['tower','domes','drift','seaside'].includes(prop.type)){
   const x=prop.x,y=prop.y;c.fillStyle='#b1ac8e';c.fillRect(x-180,y-180,360,360);c.strokeStyle='#d4c9a03d';c.lineWidth=2;for(let k=-170;k<=170;k+=34){c.beginPath();c.moveTo(x+k,y-180);c.lineTo(x+k,y+180);c.moveTo(x-180,y+k);c.lineTo(x+180,y+k);c.stroke();}
   if(prop.type==='tower'){c.fillStyle='#3c493450';c.beginPath();c.ellipse(x+30,y+40,58,75,-.4,0,TAU);c.fill();c.fillStyle='#9f9b80';c.beginPath();c.arc(x,y,56,0,TAU);c.fill();c.strokeStyle='#d5cba4';c.lineWidth=7;c.stroke();c.fillStyle='#53716b';c.beginPath();c.arc(x,y,42,0,TAU);c.fill();c.fillStyle='#78958a';c.beginPath();c.moveTo(x-38,y-18);c.lineTo(x,y-8);c.lineTo(x+24,y-31);c.lineTo(x,y-42);c.closePath();c.fill();c.fillStyle='#d0ccb0';c.beginPath();c.arc(x,y,6,0,TAU);c.fill();}
   if(prop.type==='domes'){c.fillStyle='#c4b598';c.fillRect(x-120,y-110,240,220);for(const [dx,dy,r] of [[0,0,65],[-77,-72,28],[77,-72,28],[-77,72,28],[77,72,28]]){c.fillStyle='#4c605e';c.beginPath();c.arc(x+dx,y+dy,r,0,TAU);c.fill();c.strokeStyle='#a6b7a7';c.lineWidth=3;c.stroke();c.fillStyle='#8b9c8c';c.beginPath();c.arc(x+dx-r*.2,y+dy-r*.2,r*.55,0,TAU);c.fill();}for(const dx of [-133,133])for(const dy of [-130,130]){c.fillStyle='#b7b49a';c.beginPath();c.arc(x+dx,y+dy,12,0,TAU);c.fill();c.fillStyle='#546d65';c.beginPath();c.arc(x+dx,y+dy,7,0,TAU);c.fill();}}
   if(prop.type==='drift'){c.fillStyle='#697461';c.fillRect(x-205,y-205,410,410);c.strokeStyle='#ddd0a080';c.lineWidth=4;for(const r of [80,155]){c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();}c.fillStyle='#e3bd72';c.font='bold 34px Arial';c.textAlign='center';drawLocalizedText(c,'DRIFT PARK',x,y+12);}
   if(prop.type==='seaside'){c.fillStyle='#7f9165';c.fillRect(x-180,y-180,360,360);c.fillStyle='#b8b08b';c.fillRect(x-20,y-180,40,360);c.fillRect(x-180,y-20,360,40);}
  }
  for(const [x0,y0,a] of [[5100,900,Math.PI/2],[5100,2700,Math.PI/2],[5100,6900,Math.PI/2],[1600,5100,0],[3200,5100,0]]){const x=x0+Math.cos(a)*Math.sin(t*.04)*95,y=y0+Math.sin(a)*Math.sin(t*.04)*95;if(!visible({x,y},b,100))continue;c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#b1c7b4';c.beginPath();c.moveTo(60,0);c.lineTo(30,-21);c.lineTo(-55,-21);c.lineTo(-60,0);c.lineTo(-55,21);c.lineTo(30,21);c.closePath();c.fill();c.fillStyle='#e0d8bd';c.fillRect(-35,-15,70,30);c.fillStyle='#667f73';c.fillRect(-20,-12,35,24);c.fillStyle='#ac5540';c.fillRect(-4,-7,10,14);c.restore();}
 }
 drawCovers(c,b){for(const cover of this.sim.world.covers)if(visible(cover,b,100)){
  const {x,y,w,h}=cover;c.fillStyle='#1a2c2780';c.fillRect(x,y,w,h);c.fillStyle='#a8ad9388';for(let i=0;i<(w>h?w:h);i+=45){if(w>h)c.fillRect(x+i,y,12,h);else c.fillRect(x,y+i,w,12);}c.strokeStyle='#3d5549';c.lineWidth=6;c.strokeRect(x,y,w,h);c.fillStyle='#d5dec2';c.font='600 12px Arial';c.textAlign='center';drawLocalizedText(c,'HAVA GÖRÜŞÜ KAPALI',x+w/2,y+17);
 }}
 drawService(c,g){c.fillStyle=g.type==='repair'?'#3d583a':'#34505a';roundRect(c,g.x-39,g.y-29,78,58,4);c.fill();c.strokeStyle=g.type==='repair'?'#d1d6a3':'#a4cfd8';c.lineWidth=2;c.stroke();c.fillStyle='#dbe3c7';c.font='bold 28px Arial';c.textAlign='center';drawLocalizedText(c,g.type==='repair'?'+':'ϟ',g.x,g.y+8);c.font='600 10px Arial';drawLocalizedText(c,g.name,g.x,g.y+46);c.fillStyle='#ebbf80';drawLocalizedText(c,'₺'+g.price,g.x,g.y+60);}
 drawLockedGates(c,b){
  const world=this.sim.world;
  for(const region of world.lockedRegions)if(visible(region,b,0)){c.fillStyle='#0e17202e';c.fillRect(region.x,region.y,region.w,region.h);}
  const draw=(x,y,horizontal)=>{if(!visible({x,y},b,100))return;c.save();c.translate(x,y);if(!horizontal)c.rotate(Math.PI/2);c.fillStyle='#20261f';c.fillRect(-10,-88,20,176);c.fillStyle='#c4a45f';for(let k=-85;k<85;k+=22)c.fillRect(-10,k,20,10);c.fillStyle='#182b23';c.fillRect(-38,-29,76,58);c.fillStyle='#edc17c';c.font='bold 10px Arial';c.textAlign='center';drawLocalizedText(c,'RUHSAT',0,-3);drawLocalizedText(c,'GEREKLİ',0,12);c.restore();};
  for(let j=0;j<ROAD_COUNT;j++){const y=roadCoord(j),left=regionOpen(world,{x:4800,y}),right=regionOpen(world,{x:5400,y});if(left!==right&&[2,5,13].includes(j))draw(5100,y,true);}
  for(let i=0;i<ROAD_COUNT;i++){const x=roadCoord(i),up=regionOpen(world,{x,y:4800}),down=regionOpen(world,{x,y:5400});if(up!==down&&(i>=8||[2,5].includes(i)))draw(x,5100,false);}
 }
 drawBuilding(c,b){
  const {x,y,w,h,height}=b;c.fillStyle='#23352455';c.beginPath();c.moveTo(x+9,y+9);c.lineTo(x+w+height,y+height);c.lineTo(x+w+height,y+h+height);c.lineTo(x+height,y+h+height);c.closePath();c.fill();
  c.fillStyle='#424d3b';c.fillRect(x+5,y+6,w,h);c.fillStyle=b.color;c.fillRect(x,y,w,h);
  c.fillStyle='#d1d0a94d';c.fillRect(x,y,w,4);c.fillRect(x,y,4,h);c.fillStyle='#34442d66';c.fillRect(x+w-5,y,5,h);c.fillRect(x,y+h-5,w,5);
  c.strokeStyle='#394a343f';c.lineWidth=2;c.strokeRect(x+10,y+10,w-20,h-20);
  if(b.industrial){
   c.strokeStyle='#303e3044';c.lineWidth=2;for(let yy=y+16;yy<y+h-15;yy+=12){c.beginPath();c.moveTo(x+14,yy);c.lineTo(x+w-14,yy);c.stroke();}
   c.fillStyle='#a4afa14d';c.fillRect(x+w*.35,y+20,w*.2,h-40);c.fillStyle='#4a5941';c.fillRect(x+w*.35+4,y+22,w*.2-8,h-44);
  }else{
   c.fillStyle='#aeb59b25';c.fillRect(x+17,y+17,w-34,h-34);
   const ax=x+w*.63,ay=y+h*.59;c.fillStyle='#3e4f3b55';c.fillRect(ax+5,ay+5,27,32);c.fillStyle='#9da68c';c.fillRect(ax,ay,27,32);c.fillStyle='#5a6751';c.fillRect(ax+3,ay+3,21,26);c.strokeStyle='#96a185';c.lineWidth=1;for(let k=0;k<5;k++){c.beginPath();c.moveTo(ax+5,ay+6+k*4);c.lineTo(ax+22,ay+6+k*4);c.stroke();}
   if(b.roof>.4){c.fillStyle='#45553f66';c.fillRect(x+29,y+35,35,35);c.fillStyle='#9da88f';c.beginPath();c.arc(x+40,y+44,15,0,TAU);c.fill();c.fillStyle='#5f7056';c.beginPath();c.arc(x+40,y+44,11,0,TAU);c.fill();c.strokeStyle='#b3bea0';c.beginPath();c.moveTo(x+31,y+44);c.lineTo(x+49,y+44);c.moveTo(x+40,y+35);c.lineTo(x+40,y+53);c.stroke();}
   for(let k=20;k<w-15;k+=30){c.fillStyle='#253e324f';c.fillRect(x+k,y+h-4,15,4);c.fillStyle='#c6cbab66';c.fillRect(x+k+1,y+h-3,12,1);}
  }
  if(b.sign&&w>120){c.fillStyle='#303c30';c.fillRect(x+15,y+h-25,w-30,19);c.fillStyle=b.sign==='REDLINE'?'#eb8c57':'#d5d6b4';c.font=`600 ${Math.min(13,(w-35)/b.sign.length*1.5)}px "Barlow Condensed",Arial`;c.textAlign='center';c.textBaseline='middle';drawLocalizedText(c,b.sign,x+w/2,y+h-15);}
 }
 drawTree(c,p){
  c.fillStyle='#1f36274d';c.beginPath();c.arc(p.x+9,p.y+11,p.r,0,TAU);c.fill();
  c.fillStyle=p.hue>.5?'#526c43':'#587747';c.beginPath();c.arc(p.x,p.y,p.r,0,TAU);c.fill();
  c.fillStyle=p.hue>.5?'#718552':'#6d8951';c.beginPath();c.arc(p.x-p.r*.25,p.y-p.r*.25,p.r*.7,0,TAU);c.fill();
  c.fillStyle='#90a05d55';c.beginPath();c.arc(p.x-p.r*.35,p.y-p.r*.35,p.r*.34,0,TAU);c.fill();
 }
 drawGarage(c,g,t){
  c.fillStyle='#a2c48713';c.strokeStyle='#b5d09b80';c.lineWidth=2;c.setLineDash([8,7]);c.beginPath();c.arc(g.x,g.y,g.r,0,TAU);c.fill();c.stroke();c.setLineDash([]);
  c.fillStyle='#203820df';roundRect(c,g.x-22,g.y-22,44,44,4);c.fill();c.strokeStyle='#b1d295';c.lineWidth=2;c.beginPath();c.moveTo(g.x-13,g.y+11);c.lineTo(g.x-13,g.y-7);c.lineTo(g.x,g.y-16);c.lineTo(g.x+13,g.y-7);c.lineTo(g.x+13,g.y+11);c.closePath();c.stroke();c.strokeRect(g.x-7,g.y,14,11);
  c.textAlign='center';c.textBaseline='middle';c.font='600 11px "Barlow Condensed",Arial';c.fillStyle='#d0ddbc';drawLocalizedText(c,g.name,g.x,g.y+36);if(!this.sim.safehouses.includes(g.id)){c.fillStyle='#f0b784';drawLocalizedText(c,'SATILIK SIĞINAK',g.x,g.y+52);}
 }
 drawPickup(c,p,t){
  const color=p.type==='repair'?'#bfdaa0':p.type==='nitro'?'#a3d5db':'#e6c17e';
  c.fillStyle=color+'16';c.beginPath();c.arc(p.x,p.y,26+Math.sin(t*3)*3,0,TAU);c.fill();c.save();c.translate(p.x,p.y);c.rotate(Math.PI/4);c.fillStyle='#253628e8';c.fillRect(-14,-14,28,28);c.strokeStyle=color+'99';c.lineWidth=1.5;c.strokeRect(-14,-14,28,28);c.restore();
  c.fillStyle=color;c.font='bold 23px Arial';c.textAlign='center';c.textBaseline='middle';drawLocalizedText(c,p.type==='repair'?'+':p.type==='nitro'?'ϟ':'₺',p.x,p.y+1);
 }
 drawParticles(c,b){for(const p of this.sim.particles){if(!visible(p,b,70))continue;const a=clamp(p.life/p.maxLife,0,1);c.globalAlpha=a*(p.type==='smoke'?.25:1);c.fillStyle=p.color;if(p.type==='debris'||p.type==='spark'){c.save();c.translate(p.x,p.y);c.rotate(p.life*9);c.fillRect(-p.r,-p.r/2,p.r*2,p.r);c.restore();}else{c.beginPath();c.arc(p.x,p.y,p.r*(p.type==='fire'?.5+a:1),0,TAU);c.fill();}}c.globalAlpha=1;}
 drawWreck(c,w,t){c.save();c.translate(w.x,w.y);c.rotate(w.angle);c.globalAlpha=Math.min(1,w.life/3);c.fillStyle='#212a22';roundRect(c,-w.length/2,-w.width/2,w.length,w.width,5);c.fill();c.fillStyle='#3e4436';c.fillRect(-w.length*.2,-w.width*.32,w.length*.38,w.width*.64);c.strokeStyle='#6d4e32';c.lineWidth=2;c.beginPath();c.moveTo(-w.length*.4,-w.width*.3);c.lineTo(w.length*.3,w.width*.3);c.moveTo(-w.length*.1,w.width*.4);c.lineTo(w.length*.2,-w.width*.4);c.stroke();if(w.fire>0){const flame=4+Math.sin(t*18+w.x)*3;c.fillStyle='#e7853088';c.beginPath();c.arc(w.length*.28,0,flame+4,0,TAU);c.fill();c.fillStyle='#ffc966bb';c.beginPath();c.arc(w.length*.28,0,flame,0,TAU);c.fill();}c.restore();}
 streetLights(c,b){c.save();c.globalCompositeOperation='screen';for(let i=0;i<ROAD_COUNT;i++)for(let j=0;j<ROAD_COUNT;j++){const x=roadCoord(i)-90,y=roadCoord(j)-90;if(!visible({x,y},b,120))continue;const g=c.createRadialGradient(x,y,0,x,y,120);g.addColorStop(0,'#f7c97822');g.addColorStop(1,'#f7c97800');c.fillStyle=g;c.fillRect(x-120,y-120,240,240);}c.restore();}
 drawHeli(c,h,t){
  c.save();c.globalCompositeOperation='screen';const grad=c.createRadialGradient(h.spotX,h.spotY,0,h.spotX,h.spotY,150);grad.addColorStop(0,h.visible?'#edcf8d55':'#dfe8b92e');grad.addColorStop(1,'#dfe8b900');c.fillStyle=grad;c.beginPath();c.arc(h.spotX,h.spotY,150,0,TAU);c.fill();c.restore();
  c.save();c.translate(h.x,h.y);c.rotate(h.angle);c.fillStyle='#10251b66';c.beginPath();c.ellipse(35,40,45,20,0,0,TAU);c.fill();c.fillStyle='#2b3b31';c.fillRect(-68,-5,55,10);c.fillRect(-65,-22,8,44);c.fillStyle='#c1cbad';c.beginPath();c.ellipse(0,0,32,15,0,0,TAU);c.fill();c.fillStyle='#334e43';c.beginPath();c.ellipse(15,0,13,12,0,0,TAU);c.fill();c.strokeStyle='#192d21';c.lineWidth=2;c.strokeRect(-19,-23,45,46);c.rotate(t*34);c.fillStyle='#182b1c99';c.fillRect(-74,-3,148,6);c.fillRect(-3,-74,6,148);c.restore();
 }
 drawMap(canvas,full=false){
  const c=canvas.getContext('2d'),s=this.sim,p=s.player,W=canvas.width,H=canvas.height,scale=full?W/WORLD_SIZE:W/1800;
  c.fillStyle='#162a23';c.fillRect(0,0,W,H);c.save();if(!full)c.translate(W/2-p.x*scale,H/2-p.y*scale);c.scale(scale,scale);
  c.fillStyle='#56614b';for(let i=0;i<ROAD_COUNT;i++){const a=roadCoord(i);c.fillRect(a-65,0,130,WORLD_SIZE);c.fillRect(0,a-65,WORLD_SIZE,130);}
  for(const b of s.world.blocks){c.fillStyle=b.kind==='park'?'#3e5b36':b.region==='surici'?'#5c503d':'#33452f';c.fillRect(b.x+15,b.y+15,b.w-30,b.h-30);}
  c.fillStyle='#254c55';c.fillRect(4890,0,420,WORLD_SIZE);c.fillRect(0,4890,4890,420);
  for(const bridge of s.world.bridges){c.fillStyle=bridge.tunnel?'#718c8b':'#8c8d72';c.fillRect(bridge.x,bridge.y,bridge.w,bridge.h);}
  if(full){for(const b of s.world.buildings){if(b.hidden)continue;c.fillStyle='#b0b89928';c.fillRect(b.x,b.y,b.w,b.h);}}
  for(const r of s.world.lockedRegions){c.fillStyle='#0a121dd9';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#9da78833';c.lineWidth=1/scale;c.strokeRect(r.x+35,r.y+35,r.w-70,r.h-70);}
  if(full){c.textAlign='center';for(const r of REGIONS){const open=s.world.unlockedRegions.includes(r.id);c.fillStyle=open?'#e2ddbd':'#9a9d90';c.font='bold 210px Arial';drawLocalizedText(c,r.name,r.x+r.w/2,r.y+r.h/2);c.font='105px Arial';c.fillStyle=open?'#b9c4a6':'#d29b72';drawLocalizedText(c,open?'RUHSAT AÇIK':'KİLİTLİ · ₺'+r.price,r.x+r.w/2,r.y+r.h/2+210);}c.save();c.translate(5120,5700);c.rotate(-Math.PI/2);c.font='110px Arial';c.fillStyle='#91b3b5';drawLocalizedText(c,'BOĞAZ',0,0);c.restore();c.fillStyle='#91b3b5';c.font='110px Arial';drawLocalizedText(c,'HALİÇ',2400,5160);}
  if(s.waypoint){c.strokeStyle='#efaa6b';c.lineWidth=2/scale;c.setLineDash([4/scale,3/scale]);c.beginPath();c.moveTo(p.x,p.y);for(const q of s.navRoute||[])c.lineTo(q.x,q.y);c.stroke();c.setLineDash([]);c.beginPath();c.arc(s.waypoint.x,s.waypoint.y,8/scale,0,TAU);c.stroke();}
  for(const cover of s.world.covers)if(regionOpen(s.world,cover)){c.fillStyle='#8a9db055';c.fillRect(cover.x,cover.y,cover.w,cover.h);}
  for(const g of s.world.garages)if(regionOpen(s.world,g)){const owned=s.safehouses.includes(g.id);c.fillStyle=owned?'#b0d18e':'#e3b783';c.fillRect(g.x-5/scale,g.y-5/scale,10/scale,10/scale);c.fillStyle='#244021';c.font='bold '+8/scale+'px Arial';c.textAlign='center';c.textBaseline='middle';drawLocalizedText(c,owned?'G':'₺',g.x,g.y+.3/scale);}
  for(const g of s.world.services)if(regionOpen(s.world,g)){c.fillStyle=g.type==='repair'?'#c5d4a3':'#9bd0dc';c.font='bold '+9/scale+'px Arial';c.textAlign='center';drawLocalizedText(c,g.type==='repair'?'+':'ϟ',g.x,g.y);}
  for(const q of s.world.pickups)if(q.active&&regionOpen(s.world,q)&&!full){c.fillStyle=q.type==='repair'?'#adc993':q.type==='nitro'?'#89bdca':'#c4ae6e';c.beginPath();c.arc(q.x,q.y,1.5/scale,0,TAU);c.fill();}
  for(const cop of s.cops){c.fillStyle=cop.heavy?'#e69a68':'#ef7967';c.beginPath();c.arc(cop.x,cop.y,(full?3.7:3)/scale,0,TAU);c.fill();}
  if(s.heli.active){const h=s.heli;c.fillStyle=h.visible?'#f49b4b22':'#adc9e015';c.strokeStyle=h.visible?'#efb06f80':'#adc9e055';c.lineWidth=1/scale;c.beginPath();c.arc(h.x,h.y,h.radius,0,TAU);c.fill();c.stroke();c.fillStyle='#efd39b';c.font='bold '+12/scale+'px Arial';drawLocalizedText(c,'H',h.x,h.y);}
  c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.fillStyle='#f79552';c.beginPath();c.moveTo(7/scale,0);c.lineTo(-5/scale,-4.5/scale);c.lineTo(-3/scale,0);c.lineTo(-5/scale,4.5/scale);c.closePath();c.fill();c.strokeStyle='#e9dfba';c.lineWidth=.8/scale;c.stroke();c.restore();c.restore();
  if(!full){c.strokeStyle='#b1c19633';c.lineWidth=.5;c.beginPath();c.moveTo(W/2,0);c.lineTo(W/2,H);c.moveTo(0,H/2);c.lineTo(W,H/2);c.stroke();}
 }
}

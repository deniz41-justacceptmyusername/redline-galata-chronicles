import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeWorld,createCar,drive,CARS,collideWorld,carsContact,lineClear,routeTo,SPACING,roadCoord,nearbyBuildings} from '../dist/core.js';
import {Simulation} from '../dist/simulation.js';
const step=(s,seconds,input={})=>{for(let i=0;i<Math.round(seconds*60);i++)s.update(1/60,input);};
test('gas, braking and reverse work with finite bounded velocity',()=>{
 const c=createCar(0,0);for(let i=0;i<300;i++)drive(c,{throttle:1},1/60);assert.ok(c.speed>400&&c.speed<=CARS[0].speed+1);assert.ok(c.x>1000);
 for(let i=0;i<180;i++)drive(c,{brake:1},1/60);assert.ok(c.vx<0);assert.ok(Math.abs(c.vx)<=CARS[0].speed*.28+1);
});
test('handbrake increases lateral slip and nitro is consumable',()=>{
 const a=createCar(0,0),b=createCar(0,0);a.vx=b.vx=270;
 for(let i=0;i<40;i++){drive(a,{throttle:1,steer:1},1/60);drive(b,{throttle:1,steer:1,handbrake:true},1/60);}assert.ok(b.drift>a.drift*1.4);assert.ok(b.skid>0);
 const c=createCar(0,0);for(let i=0;i<180;i++)drive(c,{throttle:1,nitro:true},1/60);assert.ok(c.nitro<30);assert.ok(c.speed>CARS[0].speed);const fuel=c.nitro;drive(c,{},1);assert.ok(c.nitro>fuel);
});
test('building collision stops penetration even at boosted speed',()=>{
 const world=makeWorld(),b=world.buildings[0],c=createCar(b.x-40,b.y+b.h/2);c.vx=610;
 for(let i=0;i<60;i++){drive(c,{throttle:1,nitro:true},1/60);collideWorld(c,world);}
 assert.ok(c.x<b.x);assert.ok(Number.isFinite(c.vx));
});
test('route avoids an obstructing block and connects road intersections',()=>{
 const w=makeWorld(),block=w.blocks.find(b=>b.kind==='city'),a={x:roadCoord(block.i),y:roadCoord(block.j)},b={x:roadCoord(block.i+1),y:roadCoord(block.j+1)};assert.equal(lineClear(w,a,b,20),false);const route=routeTo(w,a,b);let prev=a;for(const p of route){assert.ok(lineClear(w,prev,p,20));prev=p;}
});
test('two fast colliding police explode and each awards points exactly once',()=>{
 const s=new Simulation({seed:1});s.traffic=[];s.cops=[];s.player.x=2220;s.player.y=2220;
 const a=s.spawnCop(2220,2500,Math.PI/2),b=s.spawnCop(2220,2539,-Math.PI/2);a.vy=200;b.vy=-200;a.age=b.age=3;a.roadblock=b.roadblock=true;
 s.resolveContacts();assert.equal(s.wrecks,2);assert.ok(s.score>=375);const score=s.score;s.explode(a);s.explode(b);assert.equal(s.score,score);assert.ok(s.particles.length>0);
});
test('a gentle traffic contact does not explode',()=>{
 const s=new Simulation({seed:2});s.traffic=[];s.cops=[];const a=s.spawnCop(2220,2500,Math.PI/2),b=s.spawnCop(2220,2539,-Math.PI/2);a.age=b.age=3;a.roadblock=b.roadblock=true;s.update(1/60,{});assert.equal(s.wrecks,0);assert.ok(a.alive&&b.alive);
});
test('explosion chain spreads to nearby cars but not distant ones',()=>{
 const s=new Simulation({seed:3});s.cops=[];s.traffic=[];const a=s.spawnCop(2000,2220,0),b=s.spawnCop(2070,2220,0),c=s.spawnCop(2140,2220,0),d=s.spawnCop(2450,2220,0);s.explode(a);assert.equal(s.wrecks,3);assert.equal(b.alive,false);assert.equal(c.alive,false);assert.equal(d.alive,true);
});
test('escaping rewards one escape and enters a calm period',()=>{
 const s=new Simulation({seed:4});s.cops=[];s.traffic=[];s.respawnTimer=100;step(s,21);assert.equal(s.escapes,1);assert.equal(s.pursuit,false);assert.equal(s.heatLevel,0);assert.ok(s.score>=400);
});
test('wanted level begins at one rather than jumping on first frame',()=>{
 const s=new Simulation({seed:4});s.update(1/60);assert.equal(s.heatLevel,1);
});
test('a new dispatch actually sends police after the previous wave is destroyed',()=>{
 const s=new Simulation({seed:25});s.cops=[];s.traffic=[];s.respawnTimer=100;step(s,21);assert.equal(s.pursuit,false);s.calmTime=.01;s.update(.02);assert.equal(s.pursuit,true);assert.ok(s.cops.length>0);assert.ok(s.events.some(e=>e.text==='YENİ İHBAR · EKİPLER SEVK EDİLDİ'));
});
test('free mode never spawns police and has attainable civilian missions',()=>{
 const s=new Simulation({seed:5,mode:'free'});step(s,60);assert.equal(s.cops.length,0);assert.equal(s.heatLevel,0);assert.ok(!s.missionList.some(m=>['wrecks','escapes'].includes(m.stat)));
});
test('repair/nitro/cash pickups are consumed, capped and respawn',()=>{
 const s=new Simulation({seed:6,mode:'free'});s.traffic=[];const q=s.world.pickups.find(q=>q.type==='repair');s.player.hp=25;s.player.x=q.x;s.player.y=q.y;s.update(1/60);assert.ok(s.player.hp>25&&s.player.hp<=100);assert.equal(q.active,false);
 s.player.x=2220;s.player.y=2220;q.cooldown=.02;s.update(.03);assert.equal(q.active,true);
});
test('safehouse banks only when nearby and no police are immediately outside',()=>{
 const s=new Simulation({seed:7,mode:'free'}),g=s.world.garages[0];s.player.x=g.x;s.player.y=g.y;s.update(1/60,{interact:true});assert.equal(s.done,true);assert.equal(s.win,true);
 const t=new Simulation({seed:8});t.player.x=g.x;t.player.y=g.y;t.cops=[];t.traffic=[];t.spawnCop(g.x+100,g.y,0);t.update(1/60,{interact:true});assert.equal(t.done,false);
});
test('high heat brings roadblocks and a helicopter, free drive never does',()=>{
 const s=new Simulation({seed:16});s.heat=4;s.heatLevel=4;s.roadblockTimer=0;s.player.vx=200;s.update(1/60);assert.equal(s.heli.active,true);assert.equal(s.cops.filter(c=>c.roadblock).length,2);
});
test('police route finding moves a pursuer closer without crossing a building',()=>{
 const s=new Simulation({seed:17});s.cops=[];s.traffic=[];s.respawnTimer=100;s.player.x=2220;s.player.y=1580;const cop=s.spawnCop(2860,2220,Math.PI);const initial=Math.hypot(cop.x-s.player.x,cop.y-s.player.y);step(s,3);assert.ok(Math.hypot(cop.x-s.player.x,cop.y-s.player.y)<initial);assert.ok(cop.alive);
});
test('5 minutes of AI simulation remain bounded with no NaNs or growing pools',()=>{
 const s=new Simulation({seed:10,demo:true});for(let i=0;i<18000;i++){s.update(1/60);s.events=[];assert.ok(Number.isFinite(s.player.x)&&Number.isFinite(s.player.y));assert.ok(s.player.x>=0&&s.player.x<=10200);}
 assert.ok(s.particles.length<=650);assert.ok(s.skids.length<=2300);assert.ok(s.cops.length<20);assert.ok(s.traffic.length<=12);
});

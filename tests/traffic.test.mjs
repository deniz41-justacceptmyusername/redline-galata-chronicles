import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../dist/simulation.js';
import {createCar,drive,collideWorld} from '../dist/physics.js';
import {CARS} from '../dist/catalog.js';
import {nodePoint,pointDrivable} from '../dist/world.js';
import {lanePoint,signalPhase} from '../dist/traffic.js';
function trafficFixture(from=[3,3],to=[4,3],fraction=.2){const s=new Simulation({mode:'free',seed:38});s.cops=[];s.traffic=[];s.player.x=4500;s.player.y=4500;const a=nodePoint(...from),b=nodePoint(...to),p=lanePoint(a,b,{x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction}),c=createCar(p.x,p.y,Math.atan2(b.y-a.y,b.x-a.x),{...CARS[0],speed:140,accel:140,grip:9,steer:2.4},'traffic');c.trafficRoute={from:from.join(','),to:to.join(','),committed:false};c.vx=Math.cos(c.angle)*120;c.vy=Math.sin(c.angle)*120;s.traffic.push(c);return {s,c};}
function trafficSteps(s,c,seconds,advance=true){let impact=0;for(let i=0;i<seconds*60;i++){if(advance)s.time+=1/60;drive(c,s.trafficDirector.control(c,1/60),1/60);impact=Math.max(impact,collideWorld(c,s.world).impact);}return impact;}
test('civilians brake for a stationary player and leave a safe gap',()=>{const {s,c}=trafficFixture();s.player.x=c.x+200;s.player.y=c.y;s.time=0;trafficSteps(s,c,8,false);assert.ok(s.player.x-c.x>65);assert.ok(c.speed<5);assert.equal(c.stopReason,'obstacle');});
test('civilian queues stop before red light and move again on green',()=>{const {s,c}=trafficFixture([3,3],[4,3],.4);s.time=15;assert.equal(signalPhase(s.time,4,3).ew,'red');trafficSteps(s,c,9,false);assert.ok(c.x<2740&&c.x>2670);assert.ok(c.speed<5);assert.equal(c.stopReason,'red light');s.time=0;trafficSteps(s,c,3,false);assert.ok(c.x>2750);assert.ok(c.speed>30);});
test('a following civilian stops behind a queue without reversing',()=>{const {s,c}=trafficFixture();const lead=createCar(c.x+170,c.y,0,CARS[0],'traffic');s.traffic.push(lead);trafficSteps(s,c,8,false);assert.ok(lead.x-c.x>65);assert.ok(c.vx>=0);assert.ok(c.speed<5);});
test('civilian navigation chooses turns at map edge without hitting retaining walls',()=>{const {s,c}=trafficFixture([1,0],[0,0],.6);const impact=trafficSteps(s,c,65);assert.ok(impact<30,'Unexpected wall impact '+impact);assert.ok(pointDrivable(s.world,c,10));assert.ok(c.x>200&&c.y>200);assert.ok(c.trafficRoute.from!==c.trafficRoute.to);});

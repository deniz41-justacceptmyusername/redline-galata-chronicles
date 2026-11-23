import {clamp} from './core.js';
export class AudioEngine{
 constructor(settings){this.settings=settings;this.ready=false;this.muted=!settings.sound;this.musicStep=0;this.nextBeat=0;}
 async init(){
  if(this.ready){if(this.ctx.state==='suspended')await this.ctx.resume().catch(()=>{});return;}
  try{
   this.ctx=new (window.AudioContext||window.webkitAudioContext)();const c=this.ctx;
   this.master=c.createGain();this.master.gain.value=this.settings.sound?this.settings.volume*.45:0;this.master.connect(c.destination);
   this.engine=c.createOscillator();this.engine.type='sawtooth';this.engine2=c.createOscillator();this.engine2.type='triangle';this.engineFilter=c.createBiquadFilter();this.engineFilter.type='lowpass';this.engineFilter.frequency.value=350;
   this.engineGain=c.createGain();this.engineGain.gain.value=0;this.engine.connect(this.engineFilter);this.engine2.connect(this.engineFilter);this.engineFilter.connect(this.engineGain);this.engineGain.connect(this.master);this.engine.start();this.engine2.start();
   const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);
   this.noiseBuffer=buffer;this.skid=c.createBufferSource();this.skid.buffer=buffer;this.skid.loop=true;this.skidFilter=c.createBiquadFilter();this.skidFilter.type='bandpass';this.skidFilter.frequency.value=1600;this.skidFilter.Q.value=.8;this.skidGain=c.createGain();this.skidGain.gain.value=0;this.skid.connect(this.skidFilter);this.skidFilter.connect(this.skidGain);this.skidGain.connect(this.master);this.skid.start();
   this.siren=c.createOscillator();this.siren.type='triangle';this.sirenGain=c.createGain();this.sirenGain.gain.value=0;this.siren.connect(this.sirenGain);this.sirenGain.connect(this.master);this.siren.start();this.ready=true;this.nextBeat=c.currentTime;
  }catch{this.ready=false;}
 }
 setSettings(){this.muted=!this.settings.sound;if(this.ready)this.master.gain.setTargetAtTime(this.muted?0:this.settings.volume*.45,this.ctx.currentTime,.08);}
 update(sim,active){
  if(!this.ready)return;const c=this.ctx,now=c.currentTime,p=sim.player;const on=active&&p.alive;
  const gear=Math.max(1,Math.floor(p.speed/95)),rpm=(p.speed%95)/95;
  this.engine.frequency.setTargetAtTime(38+rpm*45+(p.boost?20:0),now,.07);this.engine2.frequency.setTargetAtTime(76+rpm*90,now,.07);this.engineFilter.frequency.setTargetAtTime(200+p.speed*1.1,now,.1);this.engineGain.gain.setTargetAtTime(on?.045+p.speed*.00012:0,now,.15);
  this.skidGain.gain.setTargetAtTime(on?p.skid*.15:0,now,.08);
  const nearest=sim.cops.reduce((d,cop)=>Math.min(d,Math.hypot(cop.x-p.x,cop.y-p.y)),1500);this.siren.frequency.setTargetAtTime(570+Math.sin(sim.time*4)*160,now,.03);this.sirenGain.gain.setTargetAtTime(on&&sim.pursuit?clamp(1-nearest/850,0,1)*.06:0,now,.12);
  if(this.settings.music&&active&&now>=this.nextBeat){this.music(now);this.nextBeat=now+.23;}else if(!active)this.nextBeat=now;
 }
 tone(freq,duration,volume=.15,type='sine',offset=0){if(!this.ready)return;const c=this.ctx,t=c.currentTime+offset,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);}
 music(t){const bass=[55,55,65.4,55,49,49,43.65,49],step=this.musicStep++;if(step%2===0)this.tone(bass[Math.floor(step/2)%8],.28,.11,'triangle');if(step%4===0)this.tone(60,.11,.12,'sine');if(step%4===2)this.noise(.06,.05,1200);if(step%8===7)this.tone(220,.18,.025,'triangle');}
 noise(duration,volume,cutoff=500){if(!this.ready)return;const c=this.ctx,src=c.createBufferSource(),g=c.createGain(),filter=c.createBiquadFilter();src.buffer=this.noiseBuffer;filter.type='lowpass';filter.frequency.value=cutoff;g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);src.connect(filter);filter.connect(g);g.connect(this.master);src.start();src.stop(c.currentTime+duration+.02);}
 event(e){
  if(e.type==='shot'){this.tone(115,.045,.07,'sawtooth');return;}if(e.type==='deploy'){this.tone(260,.08,.08,'square');return;}if(e.type==='tire'){this.tone(75,.16,.1,'sawtooth');return;}if(!this.ready||this.muted)return;if(e.type==='explosion'){const volume=clamp(1-(e.distance||0)/1300,.05,1);this.noise(.65,.55*volume,750);this.tone(45,.45,.4*volume,'sine');}else if(e.type==='hit'){this.noise(.17,.2,1400);}else if(e.type==='pickup'){this.tone(660,.12,.1,'triangle');this.tone(880,.2,.08,'triangle',.1);}else if(e.type==='mission'||e.type==='escape'){[440,554,659,880].forEach((f,i)=>this.tone(f,.25,.1,'triangle',i*.09));}}
}

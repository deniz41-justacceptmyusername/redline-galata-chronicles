export const TAU=Math.PI*2;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const formatTime=s=>`${Math.floor(Math.max(0,s)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,s)%60).toString().padStart(2,'0')}`;
export function random(seed=72141){let v=seed|0;return ()=>{v|=0;v=v+0x6D2B79F5|0;let t=Math.imul(v^v>>>15,1|v);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}

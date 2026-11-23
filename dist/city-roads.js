// Keep OSM street topology, but remove duplicate edges and distinguish foot access.
const rank={primary:0,secondary:1,tertiary:2,primary_link:3,secondary_link:3,tertiary_link:3,residential:4,unclassified:4,living_street:5,service:6,pedestrian:7,cycleway:8,footway:9,steps:10,path:11};
const roadWidths={primary:112,secondary:100,tertiary:84,primary_link:76,secondary_link:70,tertiary_link:68,residential:72,unclassified:72,living_street:66,service:62,pedestrian:62,cycleway:14,footway:13,steps:15,path:11};
function segmentKey(a,b){const k=p=>Math.round(p[1])+','+Math.round(p[2]),x=k(a),y=k(b);return x<y?x+'|'+y:y+'|'+x;}
function error2(p,a,b){const dx=b[1]-a[1],dy=b[2]-a[2],t=Math.max(0,Math.min(1,((p[1]-a[1])*dx+(p[2]-a[2])*dy)/(dx*dx+dy*dy||1)));return (p[1]-a[1]-t*dx)**2+(p[2]-a[2]-t*dy)**2;}
function simplifyRun(points,tolerance,mandatory){if(points.length<3)return points;let pivot=-1,max=tolerance*tolerance;for(let i=1;i<points.length-1;i++){if(mandatory.has(points[i][0])){pivot=i;break;}const e=error2(points[i],points[0],points.at(-1));if(e>max){max=e;pivot=i;}}return pivot<0?[points[0],points.at(-1)]:[...simplifyRun(points.slice(0,pivot+1),tolerance,mandatory).slice(0,-1),...simplifyRun(points.slice(pivot),tolerance,mandatory)];}
export function prepareCityRoads(source){
 // Pedestrian streets remain usable alleys in this arcade driving world; steps and paths stay foot access.
 source=source.map(r=>({...r,walk:r.walk&&r.kind!=='pedestrian'}));
 const neighbors=new Map();for(const r of source)if(!r.walk)for(let i=1;i<r.points.length;i++){const a=r.points[i-1][0],b=r.points[i][0];if(!neighbors.has(a))neighbors.set(a,new Set());if(!neighbors.has(b))neighbors.set(b,new Set());neighbors.get(a).add(b);neighbors.get(b).add(a);}
 const junctions=new Set([...neighbors].filter(([,links])=>links.size!==2).map(([id])=>id)),seen=new Set(),roads=[];let duplicates=0;
 for(const r of [...source].sort((a,b)=>(rank[a.kind]??6)-(rank[b.kind]??6))){let run=[],part=0;const flush=()=>{if(run.length>1){const points=simplifyRun(run,r.walk?1.5:3,junctions);const xs=points.map(p=>p[1]),ys=points.map(p=>p[2]);roads.push({...r,bounds:{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)},id:r.id+(part++?':'+part:''),points,width:roadWidths[r.kind]||(r.walk?14:62)});}run=[];};for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i];if(Math.hypot(b[1]-a[1],b[2]-a[2])<.5)continue;const key=segmentKey(a,b);if(seen.has(key)){duplicates++;flush();continue;}seen.add(key);if(!run.length)run.push(a);else if(run.at(-1)[0]!==a[0]){flush();run.push(a);}run.push(b);}flush();}
 return {roads,junctions,duplicates};
}

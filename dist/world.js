import {polygonDistance,onBridge,roadRouteTo,roadClearance,pointInPolygon} from './real-world.js';
import {clamp,random,distance} from './math.js';

export const WORLD_SIZE=10200,SPACING=640,ROAD_START=300,ROAD_WIDTH=164,ROAD_COUNT=16;
export const REGIONS=[
 {id:'galata',name:'GALATA',subtitle:'Karaköy rıhtımı · atölyeler · dar aralar',x:0,y:0,w:5100,h:5100,price:0,color:'#b7956b',spawn:{x:2220,y:2220},neighbors:['surici','uskudar'],description:'Başlangıç bölgesi. Kule meydanı, depo sokakları ve Haliç kıyısı.'},
 {id:'uskudar',name:'ÜSKÜDAR',subtitle:'Boğaz köprüleri · korular · sahil yolu',x:5100,y:0,w:5100,h:5100,price:3000,color:'#8da386',spawn:{x:6700,y:2220},neighbors:['galata','kadikoy'],description:'Asya yakasına geç. Daha uzun sahil yolları ve iki yeni servis noktası.'},
 {id:'surici',name:'SURİÇİ',subtitle:'Haliç · çarşı · kapalı geçitler',x:0,y:5100,w:5100,h:5100,price:5000,color:'#b38a6b',spawn:{x:2220,y:6700},neighbors:['galata','kadikoy'],description:'Yoğun çarşı dokusu, tarihi meydanlar ve helikopterden saklanacak geçitler.'},
 {id:'kadikoy',name:'KADIKÖY',subtitle:'Moda kıyısı · geniş bulvarlar · drift parkı',x:5100,y:5100,w:5100,h:5100,price:8000,color:'#88afb0',spawn:{x:7340,y:7340},neighbors:['uskudar','surici'],description:'Geniş drift alanları, marinalar ve iki yakayı birleştiren tünel.'}
];
export const BRIDGE_ROWS=[2,5,13],HALIC_BRIDGE_COLUMNS=[2,5];
export function roadIndex(n){return clamp(Math.round((n-ROAD_START)/SPACING),0,ROAD_COUNT-1);}
export function roadCoord(i){return ROAD_START+i*SPACING;}
export function nearestNode(p){return {i:roadIndex(p.x),j:roadIndex(p.y)};}
export function nodePoint(i,j){return {x:roadCoord(i),y:roadCoord(j)};}
export function regionAt(p){return REGIONS.find(r=>p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h)||REGIONS[0];}
export function district(p){return regionAt(p).name;}
export function contains(rect,p,pad=0){return p.x>rect.x-pad&&p.x<rect.x+rect.w+pad&&p.y>rect.y-pad&&p.y<rect.y+rect.h+pad;}
export function isRoad(x,y,padding=0){return Math.abs(x-roadCoord(roadIndex(x)))<ROAD_WIDTH/2-padding||Math.abs(y-roadCoord(roadIndex(y)))<ROAD_WIDTH/2-padding;}
export function underCover(world,p){return world.covers.some(c=>c.poly?pointInPolygon(p,c.poly):contains(c,p,-10));}
export function regionOpen(world,p){return world.mapKind==='real'||world.unlockedRegions.includes(regionAt(p).id);}

function waterSegments(start,end,gaps){
 const out=[];let at=start;
 for(const [a,b] of gaps.sort((a,b)=>a[0]-b[0])){if(a>at)out.push([at,a]);at=Math.max(at,b);}
 if(at<end)out.push([at,end]);return out;
}

export function makeWorld(seed=7193,unlockedRegions=REGIONS.map(r=>r.id)){
 const rng=random(seed),buildings=[],blocks=[],props=[],pickups=[],garages=[],services=[],covers=[],water=[],bridges=[];
 for(const [a,b] of waterSegments(0,WORLD_SIZE,BRIDGE_ROWS.map(j=>[roadCoord(j)-86,roadCoord(j)+86])))water.push({x:4890,y:a,w:420,h:b-a,kind:'water'});
 for(const j of BRIDGE_ROWS)bridges.push({x:4850,y:roadCoord(j)-82,w:500,h:164,horizontal:true,tunnel:j===13,name:j===13?'AVRASYA GEÇİDİ':'BOĞAZ KÖPRÜSÜ'});
 for(const [a,b] of waterSegments(0,4890,HALIC_BRIDGE_COLUMNS.map(i=>[roadCoord(i)-86,roadCoord(i)+86])))water.push({x:a,y:4890,w:b-a,h:420,kind:'water'});
 for(const i of HALIC_BRIDGE_COLUMNS)bridges.push({x:roadCoord(i)-82,y:4850,w:164,h:500,horizontal:false,name:i===5?'GALATA KÖPRÜSÜ':'HALİÇ GEÇİŞİ'});
 water.push({x:10080,y:0,w:120,h:WORLD_SIZE,kind:'water'},{x:0,y:10080,w:WORLD_SIZE,h:120,kind:'water'});
 covers.push({x:4800,y:roadCoord(13)-82,w:600,h:164,name:'AVRASYA TÜNELİ'});
 const landmarkBlocks=new Map([['2,3','tower'],['3,10','domes'],['8,3','seaside'],['11,11','drift']]);
 const names={galata:['KARAKÖY OTO','GALATA MOTOR','RIHTIM DEPO','PERŞEMBE PAZARI','VAPUR İSKELESİ'],uskudar:['KUZGUNCUK','SAHİL KAFE','KORU MARKET','BOĞAZ OTO'],surici:['KAPALI ÇARŞI','BALAT GARAJ','BAHÇE HAN','EMİNÖNÜ'],kadikoy:['MODA MOTOR','RIHTIM ATÖLYE','YELDEĞİRMENİ','SOKAK 34']};
 const palettes={galata:['#9b927c','#8c8a72','#a3957a','#7a8270'],uskudar:['#9b9e83','#849a82','#a9a18b','#8b9481'],surici:['#a38e71','#b09b7d','#8d826b','#aa9473'],kadikoy:['#8e9d90','#a1a895','#8b9c95','#a5a895']};
 for(let i=0;i<15;i++)for(let j=0;j<15;j++){
  if(i===7||j===7&&i<7)continue;
  const x=roadCoord(i)+82,y=roadCoord(j)+82,w=SPACING-164,region=regionAt({x:x+w/2,y:y+w/2});
  const landmark=landmarkBlocks.get(i+','+j);
  let kind=landmark?'landmark':(i===3&&j===2||i===12&&j===10||i===2&&j===12)?'parking':rng()<(region.id==='uskudar'?.23:.09)?'park':i===6||i===8?'depot':'city';
  const block={x,y,w,h:w,kind,i,j,region:region.id,landmark};blocks.push(block);
  if(kind==='landmark'){
   props.push({x:x+w/2,y:y+w/2,type:landmark,w:w-40,r:70});
   if(landmark==='tower'||landmark==='domes'){const bw=landmark==='domes'?240:90,bh=landmark==='domes'?220:90;buildings.push({x:x+w/2-bw/2,y:y+w/2-bh/2,w:bw,h:bh,kind:'landmark',hidden:true});}
   if(landmark==='seaside')for(let k=0;k<12;k++)props.push({x:x+40+(k%4)*125,y:y+70+Math.floor(k/4)*150,type:'tree',r:17,hue:rng()});
  }else if(kind==='park'){
   for(let k=0;k<22;k++)props.push({x:x+36+rng()*(w-72),y:y+36+rng()*(w-72),type:'tree',r:13+rng()*17,hue:rng()});
   if((i+j)%4===0)props.push({x:x+w/2,y:y+w/2,type:'fountain',r:40});
  }else if(kind==='parking'){
   for(let k=0;k<7;k++)props.push({x:x+80+k*48,y:y+80,type:'parked',a:Math.PI/2,color:palettes[region.id][k%4]});
  }else{
   const dense=region.id==='surici',gap=dense?17:24,margin=30,cols=kind==='depot'?2:dense?4:rng()<.55?2:3,rows=kind==='depot'?1:dense?3:2;
   const bw=(w-margin*2-gap*(cols-1))/cols,bh=(w-margin*2-gap*(rows-1))/rows;
   for(let a=0;a<cols;a++)for(let b=0;b<rows;b++){
    const list=names[region.id];buildings.push({x:x+margin+a*(bw+gap),y:y+margin+b*(bh+gap),w:bw,h:bh,color:palettes[region.id][Math.floor(rng()*4)],roof:rng(),sign:rng()<.24?list[Math.floor(rng()*list.length)]:'',industrial:kind==='depot',height:dense?10:12+rng()*15,region:region.id});
   }
   for(let k=0;k<4;k++)props.push({x:x+12+(k%2)*(w-24),y:y+32+Math.floor(k/2)*(w-64),type:'tree',r:10+rng()*7,hue:rng()});
  }
  if((i+j)%3===0)pickups.push({x:roadCoord(i)+SPACING*.5,y:roadCoord(j)+29,type:['repair','nitro','cash'][(i+j*2)%3],active:true,cooldown:0,region:region.id});
 }
 const facilities=[
  ['galata',3,2,'KARAKÖY SIĞINAĞI'],['uskudar',10,2,'KUZGUNCUK SIĞINAĞI'],['surici',2,11,'BALAT SIĞINAĞI'],['kadikoy',12,11,'MODA SIĞINAĞI']
 ];
 for(const [region,i,j,name] of facilities){
  garages.push({x:roadCoord(i)+320,y:roadCoord(j)+142,r:67,id:region,name,region});
  services.push({x:roadCoord(i)+155,y:roadCoord(j)+145,r:60,type:'repair',price:180,name:'OTO ATÖLYESİ',region});
  services.push({x:roadCoord(i)+480,y:roadCoord(j)+145,r:55,type:'nitro',price:100,name:'NİTRO İSTASYONU',region});
  covers.push({x:roadCoord(i)-86,y:roadCoord(j+2)+140,w:172,h:250,name:region==='surici'?'KAPALI ÇARŞI GEÇİDİ':'KAPALI ALT GEÇİT'});
 }
 const facilitiesAll=[...garages,...services];
 const filtered=buildings.filter(b=>!facilitiesAll.some(g=>g.x>b.x-75&&g.x<b.x+b.w+75&&g.y>b.y-75&&g.y<b.y+b.h+75));
 const world={seed,buildings:filtered,blocks,props,pickups,garages,services,covers,water,bridges,regions:REGIONS,buckets:new Map(),cell:320,size:WORLD_SIZE,unlockedRegions:[],navNodes:[],navIndex:new Map()};
 setUnlockedRegions(world,unlockedRegions);return world;
}

export function setUnlockedRegions(world,ids){
 if(world.mapKind==='real'){world.unlockedRegions=[...new Set(['galata',...ids])];return;}
 world.unlockedRegions=[...new Set(['galata',...ids.filter(id=>REGIONS.some(r=>r.id===id))])];
 world.lockedRegions=REGIONS.filter(r=>!world.unlockedRegions.includes(r.id));
 world.obstacles=[...world.buildings,...world.water,...world.lockedRegions.map(r=>({...r,kind:'locked'}))];
 world.buckets.clear();
 for(const b of world.obstacles)for(let i=Math.floor(b.x/world.cell);i<=Math.floor((b.x+b.w)/world.cell);i++)for(let j=Math.floor(b.y/world.cell);j<=Math.floor((b.y+b.h)/world.cell);j++){const key=i+','+j;if(!world.buckets.has(key))world.buckets.set(key,[]);world.buckets.get(key).push(b);}
 world.navNodes=[];world.navIndex=new Map();
 for(let i=0;i<ROAD_COUNT;i++)for(let j=0;j<ROAD_COUNT;j++){const p=nodePoint(i,j);if(pointDrivable(world,p,24)){const n={...p,i,j,id:i+','+j,neighbors:[]};world.navNodes.push(n);world.navIndex.set(n.id,n);}}
 for(const n of world.navNodes)for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const next=world.navIndex.get((n.i+di)+','+(n.j+dj));if(next&&lineClear(world,n,next,24))n.neighbors.push(next.id);}
}
export function nearbyBuildings(world,x,y,r=65){const result=new Set();for(let i=Math.floor((x-r)/world.cell);i<=Math.floor((x+r)/world.cell);i++)for(let j=Math.floor((y-r)/world.cell);j<=Math.floor((y+r)/world.cell);j++)for(const b of world.buckets.get(i+','+j)||[])result.add(b);return result;}
export function pointDrivable(world,p,margin=15){if(p.x<=40||p.y<=40||p.x>=world.size-40||p.y>=world.size-40)return false;const street=world.mapKind==='real'&&roadClearance(world,p,margin);return ![...nearbyBuildings(world,p.x,p.y,margin)].some(b=>{if(b.kind==='water'&&onBridge(world,p))return false;if(b.kind!=='water'&&street)return false;if(b.poly){const hit=polygonDistance(p,b.poly);return hit.inside||hit.distance<margin;}return contains(b,p,margin);});}
export function lineClear(world,a,b,margin=10){
 const dx=b.x-a.x,dy=b.y-a.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/40));
 for(let k=1;k<=steps;k++){const p={x:a.x+dx*k/steps,y:a.y+dy*k/steps};if(!pointDrivable(world,p,margin))return false;}return true;
}
export function nearestRoadNode(world,p){let best=null,min=Infinity;for(const n of world.navNodes){const d=distance(n,p);if(d<min){min=d;best=n;}}return best;}
function visibleRoadNode(world,p){
 const candidates=[...world.navNodes].sort((a,b)=>distance(a,p)-distance(b,p));return candidates.slice(0,12).find(n=>lineClear(world,p,n,18))||candidates[0];
}
export function routeTo(world,start,target){
 if(world.mapKind==='real')return roadRouteTo(world,start,target);
 if(lineClear(world,start,target,23))return [{x:target.x,y:target.y}];
 const s=visibleRoadNode(world,start),t=visibleRoadNode(world,target);if(!s||!t)return [];
 const frontier=[s.id],previous=new Map([[s.id,null]]);let head=0;
 while(head<frontier.length){const id=frontier[head++];if(id===t.id)break;for(const neighbor of world.navIndex.get(id).neighbors)if(!previous.has(neighbor)){previous.set(neighbor,id);frontier.push(neighbor);}}
 if(!previous.has(t.id))return [{x:s.x,y:s.y}];
 const path=[];for(let id=t.id;id!==null;id=previous.get(id)){const n=world.navIndex.get(id);path.unshift({x:n.x,y:n.y});}
 if(lineClear(world,t,target,20))path.push({x:target.x,y:target.y});
 while(path.length>1&&lineClear(world,start,path[1],25))path.shift();return path;
}

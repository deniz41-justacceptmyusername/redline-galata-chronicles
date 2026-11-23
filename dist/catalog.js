export const CARS=[
  {id:'comet',name:'COMET RS',tag:'SOKAKLARIN KLASİĞİ',price:0,color:'#ef783c',speed:440,accel:260,steer:2.25,grip:4.6,health:100,nitro:1,width:27,length:52,stats:[72,76,60]},
  {id:'ronin',name:'RONIN 86',tag:'YANLAMAK İÇİN DOĞDU',price:1800,color:'#e9e6cf',speed:465,accel:275,steer:2.6,grip:3.4,health:85,nitro:1.1,width:26,length:53,stats:[79,98,45]},
  {id:'brute',name:'BRUTE V8',tag:'AĞIRLIK AVANTAJDIR',price:4200,color:'#91a97b',speed:410,accel:240,steer:1.95,grip:5.2,health:180,nitro:.85,width:32,length:60,stats:[60,52,100]},
  {id:'spectre',name:'SPECTRE GT',tag:'DİKİZ AYNASINDA BİR HAYALET',price:7500,color:'#a3cbd1',speed:525,accel:310,steer:2.4,grip:4.1,health:90,nitro:1.4,width:28,length:57,stats:[100,88,50]}
];
export const PAINTS=['#ef783c','#e9e6cf','#91a97b','#a3cbd1','#c77270','#a39bc7'];
export const MISSIONS=[
 {title:'Lastik izini bırak',desc:'Drift ile 400 puan topla.',stat:'driftScore',target:400,reward:350},
 {title:'Birbirlerine girsinler',desc:'3 polis aracını saf dışı bırak.',stat:'wrecks',target:3,reward:600},
 {title:'Gözden kaybol',desc:'Bir kovalamacadan kurtul.',stat:'escapes',target:1,reward:800},
 {title:'Kırmızı çizgi',desc:'130 km/h üstünde 5 saniye git.',stat:'fastTime',target:5,reward:700},
 {title:'Sokakların hâkimi',desc:'Toplam 2.500 drift puanı yap.',stat:'driftScore',target:2500,reward:1000},
 {title:'Hurda koleksiyoncusu',desc:'10 polis aracını saf dışı bırak.',stat:'wrecks',target:10,reward:1500},
 {title:'Uzun gece',desc:'5 dakika hayatta kal.',stat:'time',target:300,reward:2000}
];

CARS.push(...[
 ['marmara','MARMARA S',0,'#c5c0ac',395,225,145,29,57],['courier','RIHTIM VAN',1200,'#c3b68c',365,230,190,32,64],['karasu','KARASU 90',1500,'#6f97a1',445,270,125,28,54],['anka','ANKA SPORT',3600,'#b25e53',505,310,115,28,55],['boga','BOĞA 4x4',4800,'#72866e',425,260,230,34,64],['minibus','DOLMUŞ',3000,'#c1a65b',330,190,270,35,74],['phantom','PHANTOM R',14500,'#c9d4d5',640,370,110,28,59],['kuzgun','KUZGUN ZIRHLI',19000,'#344b51',470,280,360,36,68]
].map(([id,name,price,color,speed,accel,health,width,length])=>({...CARS[0],id,name,price,color,speed,accel,health,width,length,tag:health>200?'AĞIRLIK AVANTAJDIR':'SOKAKLARIN KLASİĞİ',stats:[Math.min(100,speed/6.4),65,Math.min(100,health/3.6)]})));

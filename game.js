import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const canvas=document.querySelector('#scene');
const loading=document.querySelector('#loading');
const toastEl=document.querySelector('#toast');
const overlay=document.querySelector('#overlay');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x030a09);
scene.fog=new THREE.FogExp2(0x030a09,.027);
const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.1,180);
scene.add(new THREE.HemisphereLight(0x9acbff,0x101b12,2.0));
const moon=new THREE.DirectionalLight(0xb5ffd1,2.5);moon.position.set(-10,18,7);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);scene.add(moon);
const greenLight=new THREE.PointLight(0x13ff68,30,25);greenLight.position.set(0,4,-15);scene.add(greenLight);

const mat=(color,roughness=.7,metalness=.1,emissive=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:1});
const floorMat=mat(0x101a17,.85),wallMat=mat(0x17231f,.75,.3),darkMat=mat(0x050a08,.6,.35),neonMat=mat(0x25ff72,.3,.1,0x12ff5c),redMat=mat(0xff2548,.3,.1,0xff1233),blueMat=mat(0x64baff,.25,.2,0x147cff);
function box(w,h,d,material,x,y,z,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o}
function cylinder(r1,r2,h,material,x,y,z,segments=12){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o}

// Industrial escape facility
box(70,1,100,floorMat,0,-.6,-26,false);
for(let x=-18;x<=18;x+=6){box(.16,.03,85,mat(0x254234),x,.01,-26,false)}
for(let z=10;z>-68;z-=8){box(54,.08,.12,mat(0x244235),0,.02,z,false)}
// perimeter walls and neon strips
for(const side of [-1,1]){
 box(1.1,5,82,wallMat,side*20,2,-27);
 box(.12,.1,82,neonMat,side*19.42,1.1,-27,false);
 for(let z=10;z>-67;z-=9){box(1.7,3.2,1.6,darkMat,side*17.4,1.6,z);box(.12,.12,1.2,side===-1?redMat:neonMat,side*16.5,2.8,z,false)}
}
// distant facility
box(18,11,5,darkMat,0,5.0,-60);
box(12,7,.18,blueMat,0,5,-57.35,false);
box(5,1,.2,neonMat,0,1.5,-57.2,false);
for(let x=-7;x<=7;x+=3.5){box(1.3,8,1.2,wallMat,x,4,-63);box(1.35,.1,1.3,neonMat,x,7.5,-62.3,false)}
// crates, cover and machinery
const obstacles=[];
function obstacle(x,z,w=2,d=2,h=1.8){const o=box(w,h,d,darkMat,x,h/2,z);obstacles.push({x,z,w,d,h});box(w+.05,.09,d+.05,neonMat,x,h+.04,z,false);return o}
obstacle(-8,-4,3,2,1.5);obstacle(7,-9,2.5,3,2);obstacle(-11,-17,3,2.5,1.8);obstacle(10,-24,3,2,2);obstacle(-5,-32,2,3,1.4);obstacle(6,-40,3,2,1.8);obstacle(-10,-47,2.5,2.5,2);
for(let z=5;z>-55;z-=12){box(1.1,7,1.1,wallMat,-14,3.5,z);box(1.2,.16,1.2,redMat,-14,6.8,z,false)}
// exit gate
box(5,4,.5,darkMat,0,2,-55);
box(3.5,3.2,.15,neonMat,0,1.7,-54.65,false);
box(4.5,.16,.18,neonMat,0,4.1,-54.6,false);
const exitMarker=new THREE.Mesh(new THREE.TorusGeometry(1.25,.08,8,32),neonMat);exitMarker.position.set(0,1.7,-53.9);scene.add(exitMarker);

// collectable data cores
const cores=[];
for(const [x,z] of [[-7,-7],[8,-15],[-7,-23],[8,-35],[-3,-46]]){
 const group=new THREE.Group();group.position.set(x,1.15,z);scene.add(group);
 const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.55),neonMat);gem.castShadow=true;group.add(gem);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.035,8,24),blueMat);ring.rotation.x=Math.PI/2;group.add(ring);
 const light=new THREE.PointLight(0x1bff68,4,5);group.add(light);cores.push({group,gem,got:false});
}
// cameras and scanning red beams
const cameras=[];
for(const [x,z] of [[-13,-10],[13,-28],[-13,-43]]){
 const g=new THREE.Group();g.position.set(x,4.3,z);scene.add(g);
 const body=new THREE.Mesh(new THREE.BoxGeometry(1,.5,.6),darkMat);g.add(body);
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.17,12,12),redMat);eye.position.set(0,-.03,-.34);g.add(eye);
 const beam=new THREE.Mesh(new THREE.ConeGeometry(2.8,9,18,1,true),new THREE.MeshBasicMaterial({color:0xff1746,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false}));beam.position.set(0,-4.3,-1.4);beam.rotation.x=Math.PI/2;g.add(beam);
 cameras.push({g,x,z,beam,phase:Math.random()*6});
}
// Character built from simple 3D shapes
const player=new THREE.Group();scene.add(player);
const bodyMat=mat(0x101c18,.5,.2),shirtMat=mat(0x172e25,.65,.1),skinMat=mat(0xd69b72),pantsMat=mat(0x101622,.8),shoeMat=mat(0x9ba9ad,.45,.15);
const torso=new THREE.Mesh(new THREE.BoxGeometry(.72,.9,.42),shirtMat);torso.position.y=1.18;torso.castShadow=true;player.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),skinMat);head.position.set(0,1.9,0);head.castShadow=true;player.add(head);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.3,12,8,0,Math.PI*2,0,Math.PI*.62),darkMat);hair.position.set(0,2.02,0);player.add(hair);
const backpack=new THREE.Mesh(new THREE.BoxGeometry(.48,.58,.22),bodyMat);backpack.position.set(0,1.27,.29);player.add(backpack);
const limbs=[];
function limb(w,h,d,material,x,y,z){const pivot=new THREE.Group();pivot.position.set(x,y,z);const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.y=-h/2;m.castShadow=true;pivot.add(m);player.add(pivot);limbs.push(pivot);return pivot}
const armL=limb(.2,.72,.22,shirtMat,-.48,1.52,0),armR=limb(.2,.72,.22,shirtMat,.48,1.52,0);
const legL=limb(.27,.72,.3,pantsMat,-.22,.82,0),legR=limb(.27,.72,.3,pantsMat,.22,.82,0);
for(const x of [-.22,.22]){const shoe=new THREE.Mesh(new THREE.BoxGeometry(.3,.16,.42),shoeMat);shoe.position.set(x,.12,-.07);shoe.castShadow=true;player.add(shoe)}
player.position.set(0,0,5);

// Controls and game state
let paused=false,ended=false,won=false,running=false,crouching=false,jumpVel=0,onGround=true,elapsed=0,toastTimer=0;
const keys={};let joy={x:0,y:0};let stickActive=false;let lastTime=performance.now();
const clockEl=document.querySelector('#timer');
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');toastTimer=2}
function updateHUD(){const count=cores.filter(c=>c.got).length;document.querySelector('#cores').textContent=`${count} / ${cores.length}`;document.querySelector('#progress').style.width=(count/cores.length*100)+'%';if(count===5)document.querySelector('#missionText').textContent='كل البيانات معك! توجه إلى البوابة الخضراء.'}
function reset(){player.position.set(0,0,5);player.rotation.y=0;cores.forEach(c=>{c.got=false;c.group.visible=true});elapsed=0;paused=false;ended=false;won=false;running=false;crouching=false;jumpVel=0;onGround=true;overlay.classList.add('hidden');updateHUD();toast('تمت إعادة تشغيل المرحلة');}
function showOverlay(title,text,symbol='Ⅱ',end=false){paused=true;overlay.classList.remove('hidden');document.querySelector('#overlayTitle').textContent=title;document.querySelector('#overlayText').textContent=text;document.querySelector('#overlaySymbol').textContent=symbol;document.querySelector('#resume').style.display=end?'none':'block';}
document.querySelector('#pause').onclick=()=>{if(!ended&&!won)showOverlay('إيقاف مؤقت','النظام ينتظرك. استعد عندما تكون جاهزًا.');};
document.querySelector('#resume').onclick=()=>{paused=false;overlay.classList.add('hidden')};
document.querySelector('#restart').onclick=reset;
document.querySelector('#jump').addEventListener('pointerdown',e=>{e.preventDefault();if(onGround&&!paused){jumpVel=7.8;onGround=false}});
document.querySelector('#run').addEventListener('pointerdown',e=>{e.preventDefault();running=true;document.querySelector('#run').classList.add('active')});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>document.querySelector('#run').addEventListener(ev,()=>{running=false;document.querySelector('#run').classList.remove('active')}));
document.querySelector('#crouch').addEventListener('pointerdown',e=>{e.preventDefault();crouching=true;document.querySelector('#crouch').classList.add('active')});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>document.querySelector('#crouch').addEventListener(ev,()=>{crouching=false;document.querySelector('#crouch').classList.remove('active')}));
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Space'&&onGround&&!paused){jumpVel=7.8;onGround=false}if(e.code==='Escape'&&!paused)showOverlay('إيقاف مؤقت','اللعبة متوقفة مؤقتًا.')});
window.addEventListener('keyup',e=>keys[e.code]=false);
const stick=document.querySelector('#stick'),knob=document.querySelector('#knob');
function setJoy(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.34,dist=Math.hypot(dx,dy);if(dist>max){dx=dx/dist*max;dy=dy/dist*max}joy.x=dx/max;joy.y=dy/max;knob.style.transform=`translate(${dx}px,${dy}px)`}
stick.addEventListener('pointerdown',e=>{stickActive=true;stick.setPointerCapture(e.pointerId);setJoy(e)});
stick.addEventListener('pointermove',e=>{if(stickActive)setJoy(e)});
function releaseStick(){stickActive=false;joy={x:0,y:0};knob.style.transform='translate(0,0)'}
stick.addEventListener('pointerup',releaseStick);stick.addEventListener('pointercancel',releaseStick);

function collides(x,z){for(const o of obstacles){if(Math.abs(x-o.x)<o.w/2+.48&&Math.abs(z-o.z)<o.d/2+.38)return true}return false}
function gameOver(msg){ended=true;showOverlay('تم كشفك!',msg,'⚠',true);document.querySelector('#overlaySymbol').style.color='#ff536e'}
function win(){won=true;showOverlay('نجحت في الهروب!','أحسنت! جمعت كل نوى البيانات وخرجت من المنشأة. هل تستطيع إنهاء المرحلة بزمن أسرع؟','✓',true);document.querySelector('#overlaySymbol').style.color='#62ff96'}
function update(dt){
 if(paused||ended||won)return;
 elapsed+=dt;const sec=Math.floor(elapsed);clockEl.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
 cores.forEach((c,i)=>{if(!c.got){c.group.rotation.y+=dt*1.2;c.group.position.y=1.15+Math.sin(elapsed*2+i)*.14;const dx=player.position.x-c.group.position.x,dz=player.position.z-c.group.position.z;if(dx*dx+dz*dz<1.65){c.got=true;c.group.visible=false;updateHUD();toast('تم جمع نواة بيانات!')}}});
 const ix=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0)+joy.x;
 const iz=(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0)+joy.y;
 const inputLen=Math.hypot(ix,iz);let vx=0,vz=0;
 if(inputLen>.08){const speed=(running?8.2:4.8)*(crouching?.48:1);vx=ix/inputLen*speed;vz=iz/inputLen*speed;player.rotation.y=Math.atan2(vx,vz);const nx=player.position.x+vx*dt,nz=player.position.z+vz*dt;if(!collides(nx,player.position.z))player.position.x=THREE.MathUtils.clamp(nx,-18.1,18.1);if(!collides(player.position.x,nz))player.position.z=THREE.MathUtils.clamp(nz,-52,10)}
 if(!onGround){jumpVel-=18*dt;player.position.y+=jumpVel*dt;if(player.position.y<=0){player.position.y=0;jumpVel=0;onGround=true}}
 const moving=inputLen>.08,anim=moving?Math.sin(elapsed*(running?13:8))*.65:0;
 armL.rotation.x=anim;armR.rotation.x=-anim;legL.rotation.x=-anim;legR.rotation.x=anim;
 torso.position.y=crouching? .85:1.18;head.position.y=crouching?1.47:1.9;backpack.position.y=crouching?.94:1.27;
 // camera follows behind character, smoothing
 const back=new THREE.Vector3(Math.sin(player.rotation.y)*6,3.6,Math.cos(player.rotation.y)*6);
 const target=new THREE.Vector3(player.position.x-back.x,player.position.y+back.y,player.position.z-back.z);
 camera.position.lerp(target,1-Math.pow(.001,dt));camera.lookAt(player.position.x,player.position.y+1.25,player.position.z-1.4);
 cameras.forEach(c=>{c.g.rotation.y=Math.sin(elapsed*.65+c.phase)*.45;const dx=player.position.x-c.x,dz=player.position.z-c.z;if(dx*dx+dz*dz<8&&Math.abs(dz)<5&&!crouching){gameOver('الكاميرا رصدت حركتك. أعد المحاولة وتسلل قرب أجهزة المراقبة.')}});
 exitMarker.rotation.z=Math.sin(elapsed*1.8)*.12;
 if(player.position.z<-51&&Math.abs(player.position.x)<3){if(cores.every(c=>c.got))win();else toastTimer=Math.max(toastTimer,.1)}
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toastEl.classList.remove('show')}
}
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;update(dt);renderer.render(scene,camera)}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
loading.style.display='none';toast('اجمع نوى البيانات الخمس واهرب!');updateHUD();animate(performance.now());

/* 폴더 설정: name = assets/work 안의 하위폴더 이름
   width = 물고기 크기(px), faces = 원본 물고기가 보는 방향
   trim = 이미지 아래 투명 여백(px), 폴더명 간격 맞춤용 */
const FOLDERS = [
  { name:"graphic",  fish:"assets/fish/graphic.gif",  width:96,  faces:"right", trim:5 },
  { name:"apparel",  fish:"assets/fish/apparel.gif",  width:120, faces:"right", trim:4 },
  { name:"campaign", fish:"assets/fish/campaign.gif", width:105, faces:"left" , trim:1 },
  { name:"video",    fish:"assets/fish/video.gif",    width:96,  faces:"left" , trim:0 },
  { name:"space",    fish:"assets/fish/space.gif",    width:120, faces:"left" , trim:16 },
  { name:"archive",  fish:"assets/fish/archive.gif",  width:120, faces:"right", trim:5 }
].map(f => ({ ...f, works: WORKS[f.name] || [] }));

const sea=document.getElementById("sea"), folder=document.getElementById("folder");
const rnd=(a,b)=>a+Math.random()*(b-a);
/* 서로 확실히 구분되는 색 12개를 섞어서 하나씩 나눠줌: 12개까지는 겹치지 않음 */
const COLORS=["#e6002d","#f26a00","#b58900","#6f8f00","#00962f","#008c8c","#0088d8","#1a2fe0","#7a1fe0","#c400c4","#ff2e93","#8a4510"];
/* 첫 화면의 빨강은 맨 밑 do not feed them 전용 */
const RED=COLORS[0];
function paint(root){
  let deck=[];
  const hidden=e=>e.closest("[hidden]")?1:0;   /* 보이는 글자부터 색을 받음 */
  [...root.querySelectorAll(".c")].sort((a,b)=>hidden(a)-hidden(b)).forEach(e=>{
    if(!deck.length){ deck=COLORS.filter(x=>x!==RED||!document.body.classList.contains("home")); for(let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; } }
    e.style.color=deck.pop();
  });
}
function el(tag,cls,text){ const e=document.createElement(tag); if(cls)e.className=cls; if(text!=null)e.textContent=text; return e; }

const swimmers=FOLDERS.map((d,i)=>{
  const a=el("a","fish"); a.href="#"+d.name;
  const img=el("img"); img.src=d.fish; img.alt=""; img.width=d.width; img.style.marginBottom=-d.trim+"px";
  a.append(img,el("span","c",d.name)); sea.append(a);
  const s={a,img,x:null,y:null,vx:rnd(22,48)*(Math.random()<.5?-1:1),vy:rnd(6,18)*(Math.random()<.5?-1:1),p:rnd(0,6),stop:false};
  a.onpointerenter=a.onfocus=()=>s.stop=true; a.onpointerleave=a.onblur=()=>s.stop=false;
  return s;
});
/* 물고기 먹이: 빈 곳을 누르면 떨어짐 */
const foods=[];
sea.addEventListener("click",e=>{
  if(e.target.closest(".fish"))return;
  const img=el("img","food"); img.src="assets/food.png"; img.alt="";
  const r=sea.getBoundingClientRect(), f={img,x:e.clientX-r.left,y:e.clientY-r.top};
  moveFood(f); sea.append(img); foods.push(f);
  if(foods.length>20)foods.shift().img.remove();
});
function moveFood(f){ f.img.style.transform=`translate(${f.x-5}px,${f.y-5}px)`; }
/* 먹이 한 무더기에는 한 마리만: 가장 가까운 물고기가 맡음 */
function assign(){
  for(const s of swimmers)if(s.food&&!foods.includes(s.food)){ s.food=null; s.dir=0; }
  for(;;){
    const taken=swimmers.map(s=>s.food).filter(Boolean);
    let pick=null,dist=Infinity;
    for(const f of foods){
      if(taken.some(t=>Math.hypot(t.x-f.x,t.y-f.y)<160))continue;
      for(const s of swimmers){
        if(s.food||s.x===null)continue;
        const d=Math.hypot(f.x-s.x-s.a.offsetWidth/2,f.y-s.y-s.a.offsetHeight/2);
        if(d<dist){dist=d;pick=[s,f];}
      }
    }
    if(!pick)return;
    pick[0].food=pick[1];
  }
}
function chase(s,dt){
  const w=s.img.offsetWidth, cx=s.x+s.img.offsetLeft+w/2, cy=s.y+s.img.offsetTop+s.img.offsetHeight/2+Math.sin(s.p)*4;
  const best=s.food;
  if(Math.abs(best.x-cx)>w/2)s.dir=Math.sign(best.x-cx); else if(!s.dir)s.dir=Math.sign(s.vx);
  const dx=best.x-(cx+s.dir*w*.42), dy=best.y-cy, d=Math.hypot(dx,dy);
  if(d<9){ best.img.remove(); foods.splice(foods.indexOf(best),1); s.food=null; s.dir=0; return; }
  const step=Math.min(d,130*dt); s.x+=dx/d*step; s.y+=dy/d*step;
  s.vx=Math.abs(s.vx)*s.dir;
}
/* 뭉치면 서로 반대 방향으로 흩어짐 */
function spread(dt){
  for(let i=0;i<swimmers.length;i++)for(let j=i+1;j<swimmers.length;j++){
    const a=swimmers[i], b=swimmers[j]; if(a.x===null||b.x===null)continue;
    const dx=(b.x+b.a.offsetWidth/2)-(a.x+a.a.offsetWidth/2), dy=(b.y+b.a.offsetHeight/2)-(a.y+a.a.offsetHeight/2);
    if(Math.abs(dx)>(a.a.offsetWidth+b.a.offsetWidth)/2+12||Math.abs(dy)>(a.a.offsetHeight+b.a.offsetHeight)/2+8)continue;
    const sx=Math.sign(dx)||1, sy=Math.sign(dy)||1;
    for(const [s,k] of [[a,-1],[b,1]]){
      if(s.stop||s.food)continue;   /* 마우스를 올렸거나 먹이 먹으러 가는 중이면 그대로 */
      s.vx=Math.abs(s.vx)*sx*k; s.vy=Math.abs(s.vy)*sy*k;
      if(!still){ s.x+=sx*k*28*dt; s.y+=sy*k*18*dt; }
    }
  }
}
function place(){
  const W=sea.clientWidth,H=sea.clientHeight,n=swimmers.length;
  swimmers.forEach((s,i)=>{ if(s.x===null&&W){ s.x=rnd(.05,.8)*(W-90); s.y=60+(i+rnd(.1,.6))*(H-140)/n; } });
}
const still=matchMedia("(prefers-reduced-motion: reduce)").matches;
let last=performance.now();
function tick(t){
  const dt=Math.min((t-last)/1000,.05); last=t;
  if(!sea.hidden){
    place(); const W=sea.clientWidth,H=sea.clientHeight;
    for(let i=foods.length-1;i>=0;i--){   /* 먹이는 천천히 가라앉음 */
      const f=foods[i]; f.y+=16*dt; moveFood(f);
      if(f.y>H){ f.img.remove(); foods.splice(i,1); }
    }
    assign(); spread(dt);
    for(const s of swimmers){
      if(s.x===null)continue;
      const hungry=!!s.food;
      if(hungry)chase(s,dt);
      else { s.dir=0; if(!s.stop&&!still){ s.x+=s.vx*dt; s.y+=s.vy*dt; s.p+=dt*2; } }
      const mx=Math.max(0,W-s.a.offsetWidth), my=Math.max(52,H-s.a.offsetHeight-8);
      if(!hungry){   /* 가장자리에서 방향 전환 (먹이 쫓다 벗어나면 천천히 복귀) */
        if(s.x<0)s.vx=Math.abs(s.vx); if(s.x>mx)s.vx=-Math.abs(s.vx);
        if(s.y<52)s.vy=Math.abs(s.vy); if(s.y>my)s.vy=-Math.abs(s.vy);
        s.x=Math.max(-s.a.offsetWidth,Math.min(s.x,W)); s.y=Math.max(-40,Math.min(s.y,H-40));
        if(still){ s.x=Math.max(0,Math.min(s.x,mx)); s.y=Math.max(52,Math.min(s.y,my)); }
      }
      s.img.style.transform=(s.vx<0)!==(FOLDERS[swimmers.indexOf(s)].faces==="left")?"scaleX(-1)":"";   /* 헤엄치는 방향을 보게 뒤집기 */
      s.a.style.transform=`translate(${s.x}px,${s.y+Math.sin(s.p)*4}px)`;
    }
  }
  requestAnimationFrame(tick);
}
/* 크게 보기: 화살표·방향키·밀기로 넘기고, 빈 곳이나 close, Esc 로 닫음 */
let viewer=null;
function openViewer(slides,title,from){
  const box=el("div"); box.id="viewer"; box.setAttribute("role","dialog"); box.setAttribute("aria-modal","true"); box.setAttribute("aria-label",title);
  const stage=el("div","stage");
  const button=(cls,text,label,fn)=>{ const b=el("button",cls+" c",text); b.type="button"; b.setAttribute("aria-label",label); b.onclick=fn; return b; };
  const count=el("p","count c");
  let i=0;
  const go=n=>{
    i=(n+slides.length)%slides.length; const s=slides[i];
    const m=el(s.video?"video":"img");
    if(s.video){ m.controls=m.autoplay=m.loop=m.playsInline=true; m.muted=!s.sound; m.src=s.video;
      m.onloadedmetadata=()=>m.style.setProperty("--r",m.videoWidth/m.videoHeight);
      if(s.sound)m.play().catch(()=>{ m.muted=true; m.play().catch(()=>{}); });   /* 소리 재생이 막히면 음소거로 */
    } else { m.src=s.img; m.alt=title; }
    stage.replaceChildren(m); count.textContent=slides.length>1?`${i+1} / ${slides.length}`:"";
  };
  const close=button("close","close","close",closeViewer);
  box.append(stage,count,close);
  if(slides.length>1)box.append(button("prev","←","previous",()=>go(i-1)),button("next","→","next",()=>go(i+1)));
  let startX=null;
  box.onpointerdown=e=>startX=e.clientX;
  box.onpointerup=e=>{
    const dx=startX===null?0:e.clientX-startX; startX=null;
    if(Math.abs(dx)>40&&slides.length>1)go(i+(dx<0?1:-1));
    else if(e.target===box||e.target===stage)setTimeout(closeViewer);
  };
  viewer={box,from,key:e=>{
    if(e.key==="Escape")closeViewer();
    if(slides.length>1&&e.key==="ArrowLeft")go(i-1);
    if(slides.length>1&&e.key==="ArrowRight")go(i+1);
  }};
  addEventListener("keydown",viewer.key);
  document.body.style.overflow="hidden"; document.body.append(box); paint(box); go(0); close.focus({preventScroll:true});
}
function closeViewer(){
  if(!viewer)return;
  removeEventListener("keydown",viewer.key); viewer.box.remove(); document.body.style.overflow="";
  viewer.from.focus({preventScroll:true}); viewer=null;
}
/* archive: 바닥에 깔린 사진 더미. 끌어서 치우고, 누르면 크게 보기 */
function pile(items){
  const floor=el("div","floor"), n=items.length;
  /* 사진이 많을수록 조금씩 작게 */
  const base=Math.max(80,Math.min(176,Math.min(innerWidth,innerHeight)*.256*Math.min(1,Math.pow(14/Math.max(n,1),.25))));
  /* 한곳에 몰리지 않게 칸을 나눠 한 장씩 놓고, 칸 안에서 크게 흩트림 */
  const cols=Math.max(1,Math.round(Math.sqrt(n*innerWidth/innerHeight))), rows=Math.ceil(n/cols);
  const order=items.map((w,i)=>[Math.random(),w,i]).sort((a,b)=>a[0]-b[0]);
  const cells=order.map((o,i)=>i).sort(()=>Math.random()-.5);
  let top=n;
  order.forEach(([,w,id],z)=>{
    const b=el("button","photo"); b.type="button"; b.setAttribute("aria-label",`archive ${id+1}`);
    const m=el(w.video?"video":"img"), size=Math.round(base*rnd(.7,1.15));
    if(w.video){ m.muted=m.loop=m.playsInline=true; m.preload="metadata"; m.src=w.video+"#t=0.001"; } else { m.src=w.img; m.alt=""; m.draggable=false; }
    m.style.maxWidth=m.style.maxHeight=size+"px";
    const c=cells[z]%cols, r=Math.floor(cells[z]/cols);
    let x=(c+.5+rnd(-.55,.55))/cols, y=(r+.5+rnd(-.55,.55))/rows;
    x=.5+(x-.5)*.74; y=.5+(y-.5)*.66;   /* 가운데로 모아서 뭉텅이 느낌 */
    const set=()=>{ b.style.left=x*100+"%"; b.style.top=y*100+"%"; };
    const edge=Math.round(size*.64);   /* 처음 놓을 때는 위아래·양옆이 잘리지 않게 */
    const keep=v=>`clamp(${edge}px,${v*100}%,calc(100% - ${edge}px))`;
    b.style.transform=`translate(-50%,-50%) rotate(${rnd(-17,17).toFixed(1)}deg)`; b.style.zIndex=z; b.style.left=keep(x); b.style.top=keep(y);
    let from=null, moved=false;
    b.onpointerdown=e=>{ if(e.button)return; x=b.offsetLeft/floor.clientWidth; y=b.offsetTop/floor.clientHeight; from={px:e.clientX,py:e.clientY,x,y}; moved=false; b.style.zIndex=++top; b.setPointerCapture(e.pointerId); };
    b.onpointermove=e=>{
      if(!from)return;
      const dx=e.clientX-from.px, dy=e.clientY-from.py;
      if(!moved&&Math.hypot(dx,dy)<6)return;
      moved=true;
      x=Math.max(0,Math.min(1,from.x+dx/floor.clientWidth)); y=Math.max(0,Math.min(1,from.y+dy/floor.clientHeight)); set();
    };
    b.onpointerup=b.onpointercancel=()=>{ from=null; };
    b.onclick=e=>{ if(moved&&e.detail)return; openViewer([w],"archive",b); };
    b.append(m); floor.append(b);
  });
  return floor;
}
/* archive 낙서: 빈 곳을 끌면 선이 그려지고, 한 번 끌 때마다 색이 바뀜. 폴더를 나가면 지워짐 */
let doodle=null, ink="";
const strokes=new Map();
let hint=0, drew=false;   /* 한 번도 안 그렸으면 잠시 뒤 낙서 한 줄이 저절로 그려짐 */
function sketch(){
  doodle=el("canvas","doodle"); doodle.setAttribute("aria-hidden","true");
  doodle.width=innerWidth; doodle.height=innerHeight;
  drew=false; wait();
  return doodle;
}
function wait(){ clearTimeout(hint); hint=setTimeout(scribble,5500); }
const nextInk=()=>{ const rest=COLORS.filter(c=>c!==ink); return ink=rest[Math.floor(Math.random()*rest.length)]; };
/* 고양이 낙서 (120×80). 일부러 삐뚤빼뚤하게. 한 묶음이 한 획, 숫자는 x,y 순서 */
const CAT=[
  "37,63 25,57 18,46 20,31 28,19 33,14", "26,24 31,17 31,5 37,8 47,23",
  "45,23 58,21 68,24 72,21 73,2 78,9 91,25", "86,20 96,27 104,42 102,55 88,66",
  "47,35 44,38 44,41 47,40 49,36 46,35 45,40 47,37 46,39", "76,39 80,36 82,38 81,41 77,42 78,38 80,40 79,38",
  "47,49 56,49 61,45 63,47", "58,46 57,53 63,57 67,52 62,50", "66,52 78,54 81,45",
  "33,42 18,40 2,35", "34,47 20,52 8,65", "92,45 101,40 108,32 118,30", "94,51 105,56 111,66 119,69",
  "39,63 28,65 25,73 29,78 49,79 50,70 40,65 33,66", "36,69 37,76", "43,68 42,75",
  "57,79 57,71 66,65", "65,66 75,70 85,69 87,79 58,78", "65,74 64,79", "72,73 71,78",
  "6,78 27,79", "30,79 61,80 88,79 103,82 116,80"
].map(s=>rough(smooth(s.split(" ").map(p=>{ const [x,y]=p.split(",").map(Number); return {x,y}; }))));
/* 마우스로 대충 그은 것처럼 선을 살짝 흔듦 */
function rough(p){
  const a=Math.random()*6, b=Math.random()*6;
  return p.map((q,i)=>({x:q.x+Math.sin(i*.55+a)*.8, y:q.y+Math.sin(i*.8+b)*.8}));
}
/* 꺾인 점들을 손으로 그린 듯한 곡선으로 */
function smooth(p){
  const out=[p[0]];
  for(let i=0;i<p.length-1;i++){
    const a=p[i-1]||p[i], b=p[i], c=p[i+1], d=p[i+2]||c;
    for(let k=1;k<=8;k++){
      const t=k/8, f=v=>.5*(2*b[v]+(c[v]-a[v])*t+(2*a[v]-5*b[v]+4*c[v]-d[v])*t*t+(3*b[v]-a[v]-3*c[v]+d[v])*t*t*t);
      out.push({x:f("x"),y:f("y")});
    }
  }
  return out;
}
function scribble(){
  if(drew||!doodle?.isConnected)return;
  if(document.hidden||document.getElementById("viewer"))return wait();
  const W=innerWidth, H=innerHeight, color=nextInk();
  /* 구석 중에서 사진·글자에 안 가리는 자리를 고름 */
  const busy=[...document.querySelectorAll(".photo,header,#folder h1,footer a,footer span")].map(e=>e.getBoundingClientRect());
  const low=Math.min(...[...document.querySelectorAll("footer a,footer span")].map(e=>e.getBoundingClientRect().top),H)-92;
  const spots=[[W-140,low],[20,low],[W-140,76],[20,76]].map(([x,y])=>({x,y}));
  const o=spots.find(p=>!busy.some(r=>r.right>p.x&&r.left<p.x+120&&r.bottom>p.y&&r.top<p.y+80))||spots[0];
  const path=CAT.flatMap(s=>s.slice(1).map((b,i)=>[s[i],b])), total=path.length;
  const move=p=>({x:p.x+o.x,y:p.y+o.y});
  const canvas=doodle; let start, done=0;
  requestAnimationFrame(function step(now){
    if(drew||canvas!==doodle||!canvas.isConnected)return;
    start??=now; const n=Math.round(total*Math.min(1,(now-start)/2600));
    for(;done<n;done++)line(move(path[done][0]),move(path[done][1]),color);
    if(done<total)requestAnimationFrame(step);
  });
}
/* 옛날 그림판처럼 각진 2px 점을 이어 찍음 */
function line(a,b,color){
  const g=doodle.getContext("2d"), n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));
  g.fillStyle=color;
  for(let i=0;i<=n;i++)g.fillRect(Math.round(a.x+(b.x-a.x)*i/n)-1,Math.round(a.y+(b.y-a.y)*i/n)-1,2,2);
}
addEventListener("pointerdown",e=>{
  if(!doodle?.isConnected||e.button)return;
  if(e.target.closest(".photo"))wait();   /* 사진을 만지는 동안은 미룸 */
  if(e.target.closest("a,button,#viewer"))return;
  e.preventDefault(); drew=true;
  strokes.set(e.pointerId,{x:e.clientX,y:e.clientY,color:nextInk()});
});
addEventListener("pointermove",e=>{
  const s=strokes.get(e.pointerId);
  if(!s||!doodle?.isConnected)return;
  line(s,{x:e.clientX,y:e.clientY},s.color); s.x=e.clientX; s.y=e.clientY;
});
const lift=e=>strokes.delete(e.pointerId);
addEventListener("pointerup",lift); addEventListener("pointercancel",lift);
/* 창 크기가 바뀌어도 그린 건 남김 */
addEventListener("resize",()=>{
  if(!doodle?.isConnected)return;
  const old=el("canvas"); old.width=doodle.width; old.height=doodle.height; old.getContext("2d").drawImage(doodle,0,0);
  doodle.width=Math.max(innerWidth,old.width); doodle.height=Math.max(innerHeight,old.height); doodle.getContext("2d").drawImage(old,0,0);
});
/* 이름 옆 6 을 누르면 연차 설명 */
const six=document.getElementById("six"), year=document.getElementById("year");
six.onclick=()=>{ year.hidden=!year.hidden; six.setAttribute("aria-expanded",String(!year.hidden)); };
/* 영상은 화면에 보이는 것만 재생. 화면 밖으로 나가면 멈추고 소리도 끔 */
const watcher=new IntersectionObserver(list=>list.forEach(({target:v,isIntersecting})=>{
  if(isIntersecting){ v.play().catch(()=>{}); return; }
  v.pause();
  if(!v.muted){ v.muted=true; const s=v.parentElement.querySelector(".snd"); s.textContent="♪ sound off"; s.setAttribute("aria-pressed","false"); }
}),{threshold:.25});
function show(){
  watcher.disconnect();
  closeViewer();
  year.hidden=true; six.setAttribute("aria-expanded","false");
  const d=FOLDERS.find(f=>"#"+f.name===location.hash);
  foods.splice(0).forEach(f=>f.img.remove());
  strokes.clear(); clearTimeout(hint);
  document.body.classList.toggle("home",!d);
  sea.hidden=!!d; folder.hidden=!d; folder.replaceChildren();
  const heap=d&&d.name==="archive";
  document.body.classList.toggle("pile",!!heap);
  if(heap){
    folder.append(el("h1","c",d.name),pile(d.works),sketch()); window.scrollTo(0,0);
    folder.querySelectorAll("video").forEach(v=>watcher.observe(v));
  }
  else if(d){
    const grid=el("div","grid");
    d.works.forEach((w,i)=>{
      const fig=el("figure"); let media;
      if(w.video){ media=el("video"); media.muted=media.loop=media.playsInline=true; media.preload="metadata"; media.src=w.video+"#t=0.001";   /* 첫 장면을 미리 보여줌 */ media.setAttribute("aria-label",w.title); }
      else {
        const img=el("img"); img.src=w.img; img.alt=w.title;
        media=el("button","thumb"); media.type="button"; media.append(img);
        media.onclick=()=>openViewer(w.slides||[{img:w.img}],w.title,media);
      }
      /* 설명이 있는 작업만 [+] 를 붙이고 눌러서 펼침. 없으면 그냥 제목 */
      const title=[w.year,w.company,w.title].filter(Boolean).join(" / ");
      const b=el(w.desc?"button":"p","cap c",title);
      const p=w.desc?el("p","desc",w.desc):null;
      if(p){
        const mark=el("span","mark"), sign=el("span","sign","+"); mark.append("[",sign,"]"); mark.setAttribute("aria-hidden","true");
        b.type="button"; b.append(mark); p.hidden=true; p.id="d"+i;
        b.setAttribute("aria-controls",p.id); b.setAttribute("aria-expanded","false");
        b.onclick=()=>{ p.hidden=!p.hidden; sign.textContent=p.hidden?"+":"\u2212"; b.setAttribute("aria-expanded",String(!p.hidden)); };
      }
      fig.append(media);
      /* 영상: 누르면 크게 보기. 소리 있는 영상은 크게 볼 때 소리가 켜짐 */
      if(w.video){
        media.tabIndex=0; media.setAttribute("role","button");
        media.onclick=()=>{
          grid.querySelectorAll("video").forEach(v=>v.muted=true);
          grid.querySelectorAll(".snd").forEach(x=>{ x.textContent="♪ sound off"; x.setAttribute("aria-pressed","false"); });
          openViewer((w.slides||[{video:w.video}]).map(s=>s.video?{...s,sound:!w.silent}:s),w.title,media);
        };
        media.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); media.onclick(); } };
      }
      if(w.video&&!w.silent){
        /* 소리: 글자는 지금 상태를 보여줌. 글자를 누르면 켜기/끄기, 한 번에 하나만 */
        const s=el("button","cap c","♪ sound off"); s.type="button"; s.setAttribute("aria-pressed","false");
        const toggle=()=>{
          const on=media.muted;
          grid.querySelectorAll("video").forEach(v=>v.muted=true);
          grid.querySelectorAll(".snd").forEach(x=>{ x.textContent="♪ sound off"; x.setAttribute("aria-pressed","false"); });
          media.muted=!on;
          if(on){ s.textContent="♪ sound on"; s.setAttribute("aria-pressed","true"); media.currentTime=0; media.play().catch(()=>{}); }
        };
        s.classList.add("snd"); s.onclick=toggle; fig.append(s);
      }
      fig.append(b); if(p)fig.append(p); grid.append(fig);
    });
    folder.append(el("h1","c",d.name),grid); window.scrollTo(0,0);
    grid.querySelectorAll("video").forEach(v=>watcher.observe(v));
  }
  paint(document);
}
addEventListener("hashchange",show); show(); requestAnimationFrame(tick);

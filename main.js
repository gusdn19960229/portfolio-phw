/* 폴더 설정: name = assets/work 안의 하위폴더 이름
   width = 물고기 크기(px), faces = 원본 물고기가 보는 방향
   trim = 이미지 아래 투명 여백(px), 폴더명 간격 맞춤용 */
const FOLDERS = [
  { name:"graphic",  fish:"assets/fish/graphic.gif",  width:96,  faces:"right", trim:5 },
  { name:"campaign", fish:"assets/fish/campaign.gif", width:105, faces:"left" , trim:1 },
  { name:"video",    fish:"assets/fish/video.gif",    width:96,  faces:"left" , trim:0 },
  { name:"space",    fish:"assets/fish/space.gif",    width:120, faces:"left" , trim:16 },
  { name:"archive",  fish:"assets/fish/archive.gif",  width:120, faces:"right", trim:5 }
].map(f => ({ ...f, works: WORKS[f.name] || [] }));

const sea=document.getElementById("sea"), folder=document.getElementById("folder");
const rnd=(a,b)=>a+Math.random()*(b-a);
function color(){ const h=Math.floor(rnd(0,360)); const l=(h>40&&h<200)?rnd(25,32):rnd(40,50); return `hsl(${h} 100% ${l}%)`; }
function paint(root){ root.querySelectorAll(".c").forEach(e=>e.style.color=color()); }
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
    if(s.video){ m.controls=m.autoplay=m.loop=m.muted=m.playsInline=true; m.src=s.video; } else { m.src=s.img; m.alt=title; }
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
/* 이름 옆 6 을 누르면 연차 설명 */
const six=document.getElementById("six"), year=document.getElementById("year");
const letter=(t,i)=>{ const e=document.createElement("span"); e.textContent=t; e.style.animationDelay=-i*.2+"s"; e.setAttribute("aria-hidden","true"); return e; };
const phrase=year.textContent;
year.setAttribute("aria-label",phrase); year.setAttribute("role","note");
year.replaceChildren(...[...phrase].map((t,i)=>letter(t,phrase.length-i)));
six.onclick=()=>{ year.hidden=!year.hidden; six.setAttribute("aria-expanded",String(!year.hidden)); };
function show(){
  closeViewer();
  year.hidden=true; six.setAttribute("aria-expanded","false");
  const d=FOLDERS.find(f=>"#"+f.name===location.hash);
  foods.splice(0).forEach(f=>f.img.remove());
  document.body.classList.toggle("home",!d);
  sea.hidden=!!d; folder.hidden=!d; folder.replaceChildren();
  if(d){
    const grid=el("div","grid");
    d.works.forEach((w,i)=>{
      const fig=el("figure"); let media;
      if(w.video){ media=el("video"); media.muted=media.loop=media.autoplay=media.playsInline=true; media.src=w.video; media.setAttribute("aria-label",w.title); }
      else {
        const img=el("img"); img.src=w.img; img.alt=w.title;
        media=el("button","thumb"); media.type="button"; media.append(img);
        media.onclick=()=>openViewer(w.slides||[{img:w.img}],w.title,media);
      }
      const b=el("button","cap c",[w.year,w.company,w.title].filter(Boolean).join(" / ")); b.type="button";
      const p=el("p","desc c",w.desc); p.hidden=true; p.id="d"+i;
      b.setAttribute("aria-controls",p.id); b.setAttribute("aria-expanded","false");
      b.onclick=()=>{ p.hidden=!p.hidden; b.setAttribute("aria-expanded",String(!p.hidden)); };
      fig.append(media);
      if(w.video){
        /* 소리: 영상이나 글자를 누르면 켜기/끄기, 한 번에 하나만 */
        const s=el("button","cap c","♪ sound on"); s.type="button";
        const toggle=()=>{
          const on=media.muted;
          grid.querySelectorAll("video").forEach(v=>v.muted=true);
          grid.querySelectorAll(".snd").forEach(x=>x.textContent="♪ sound on");
          media.muted=!on;
          if(on){ s.textContent="♪ sound off"; media.currentTime=0; media.play().catch(()=>{}); }
        };
        s.classList.add("snd"); s.onclick=media.onclick=toggle; fig.append(s);
      }
      fig.append(b,p); grid.append(fig);
    });
    folder.append(el("h1","c",d.name),grid); window.scrollTo(0,0);
  }
  paint(document);
}
addEventListener("hashchange",show); show(); requestAnimationFrame(tick);

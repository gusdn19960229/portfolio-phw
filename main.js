/* 폴더 설정: name = assets/work 안의 하위폴더 이름
   width = 물고기 크기(px), faces = 원본 물고기가 보는 방향 */
const FOLDERS = [
  { name:"video",      fish:"assets/fish/video.gif",      width:96,  faces:"left"  },
  { name:"graphics",   fish:"assets/fish/graphics.gif",   width:96,  faces:"right" },
  { name:"commercial", fish:"assets/fish/commercial.gif", width:105, faces:"left"  },
  { name:"offline",    fish:"assets/fish/offline.gif",    width:120, faces:"left"  }
].map(f => ({ ...f, works: WORKS[f.name] || [] }));

const sea=document.getElementById("sea"), folder=document.getElementById("folder");
const rnd=(a,b)=>a+Math.random()*(b-a);
function color(){ const h=Math.floor(rnd(0,360)); const l=(h>40&&h<200)?rnd(25,32):rnd(40,50); return `hsl(${h} 100% ${l}%)`; }
function paint(root){ root.querySelectorAll(".c").forEach(e=>e.style.color=color()); }
function el(tag,cls,text){ const e=document.createElement(tag); if(cls)e.className=cls; if(text!=null)e.textContent=text; return e; }

const swimmers=FOLDERS.map((d,i)=>{
  const a=el("a","fish"); a.href="#"+d.name;
  const img=el("img"); img.src=d.fish; img.alt=""; img.width=d.width;
  a.append(img,el("span","c",d.name)); sea.append(a);
  const s={a,img,x:null,y:null,vx:rnd(22,48)*(Math.random()<.5?-1:1),vy:rnd(6,18)*(Math.random()<.5?-1:1),p:rnd(0,6),stop:false};
  a.onpointerenter=a.onfocus=()=>s.stop=true; a.onpointerleave=a.onblur=()=>s.stop=false;
  return s;
});
/* 물고기 먹이: 빈 곳을 누르면 떨어지고, 가장 가까운 먹이를 먹으러 감 */
const foods=[];
sea.addEventListener("click",e=>{
  if(e.target.closest(".fish"))return;
  const img=el("img","food"); img.src="assets/food.png"; img.alt="";
  const r=sea.getBoundingClientRect(), f={img,x:e.clientX-r.left,y:e.clientY-r.top};
  moveFood(f); sea.append(img); foods.push(f);
  if(foods.length>20)foods.shift().img.remove();
});
function moveFood(f){ f.img.style.transform=`translate(${f.x-5}px,${f.y-5}px)`; }
function chase(s,dt){
  const w=s.img.offsetWidth, cx=s.x+s.img.offsetLeft+w/2, cy=s.y+s.img.offsetTop+s.img.offsetHeight/2+Math.sin(s.p)*4;
  let best=null,dist=Infinity;
  for(const f of foods){ const d=Math.hypot(f.x-cx,f.y-cy); if(d<dist){dist=d;best=f;} }
  if(Math.abs(best.x-cx)>w/2)s.dir=Math.sign(best.x-cx); else if(!s.dir)s.dir=Math.sign(s.vx);
  const dx=best.x-(cx+s.dir*w*.42), dy=best.y-cy, d=Math.hypot(dx,dy);
  if(d<9){ best.img.remove(); foods.splice(foods.indexOf(best),1); s.dir=0; return; }
  const step=Math.min(d,130*dt); s.x+=dx/d*step; s.y+=dy/d*step;
  s.vx=Math.abs(s.vx)*s.dir;
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
    for(const s of swimmers){
      if(s.x===null)continue;
      const hungry=foods.length>0;
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
function show(){
  const d=FOLDERS.find(f=>"#"+f.name===location.hash);
  foods.splice(0).forEach(f=>f.img.remove());
  sea.hidden=!!d; folder.hidden=!d; folder.replaceChildren();
  if(d){
    const grid=el("div","grid");
    d.works.forEach((w,i)=>{
      const fig=el("figure"); let media;
      if(w.video){ media=el("video"); media.muted=media.loop=media.autoplay=media.playsInline=true; media.src=w.video; media.setAttribute("aria-label",w.title); }
      else { media=el("img"); media.src=w.img; media.alt=w.title; }
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

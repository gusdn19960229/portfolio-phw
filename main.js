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
    for(const s of swimmers){
      if(s.x===null)continue;
      if(!s.stop&&!still){ s.x+=s.vx*dt; s.y+=s.vy*dt; s.p+=dt*2; }
      const mx=Math.max(0,W-s.a.offsetWidth), my=Math.max(52,H-s.a.offsetHeight-8);
      if(s.x<0){s.x=0;s.vx=Math.abs(s.vx)} if(s.x>mx){s.x=mx;s.vx=-Math.abs(s.vx)}
      if(s.y<52){s.y=52;s.vy=Math.abs(s.vy)} if(s.y>my){s.y=my;s.vy=-Math.abs(s.vy)}
      s.img.style.transform=(s.vx<0)!==(FOLDERS[swimmers.indexOf(s)].faces==="left")?"scaleX(-1)":"";   /* 헤엄치는 방향을 보게 뒤집기 */
      s.a.style.transform=`translate(${s.x}px,${s.y+Math.sin(s.p)*4}px)`;
    }
  }
  requestAnimationFrame(tick);
}
function show(){
  const d=FOLDERS.find(f=>"#"+f.name===location.hash);
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
      fig.append(media,b,p); grid.append(fig);
    });
    folder.append(el("h1","c",d.name),grid); window.scrollTo(0,0);
  }
  paint(document);
}
addEventListener("hashchange",show); show(); requestAnimationFrame(tick);

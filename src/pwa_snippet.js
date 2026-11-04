<script>
/* ---------- 웹앱: 오프라인 캐시 · 버전 확인 · 자동 업데이트 ---------- */
(function(){
const APP_VERSION="__VER__";
const bar=document.querySelector("#bar"),brand=bar.querySelector(".brand");
const b=document.createElement("button");b.id="verBadge";b.type="button";
b.style.cssText="border:0;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:600;white-space:nowrap;min-height:30px;display:inline-flex;align-items:center;gap:5px";
brand.after(b);
const ST={check:["#5d6876","#e8ebea","확인 중…"],ok:["#ffffff","#11875a",""],upd:["#1b2430","#f2b33d","⟳ 업데이트 중…"],ready:["#ffffff","#1f5fd1","업데이트 완료 · 눌러서 재시작"],off:["#ffffff","#5d6876",""],err:["#ffffff","#b3261e",""]};
let state="check";
function ld(k){try{return localStorage.getItem(k)}catch(e){return null}}function sv(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function when(t){if(!t)return"없음";const d=new Date(+t);return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`}
function show(s,text){state=s;const[c,bg,def]=ST[s];b.style.color=c;b.style.background=bg;b.textContent=text||def}
show("check");
const tip=t=>{const el=document.querySelector("#toast");if(!el)return;el.textContent=t;el.classList.add("show");clearTimeout(tip.t);tip.t=setTimeout(()=>el.classList.remove("show"),4500)};
b.onclick=()=>{if(state==="ready"){location.reload();return}
  tip(`앱 버전 ${APP_VERSION} · 마지막 확인 ${when(ld("mdn.lastCheck"))} · ${state==="ok"?"최신 버전이고 오프라인 준비가 끝났습니다. 와이파이를 꺼도 됩니다":state==="off"?"인터넷 없음. 와이파이에 연결하면 최신 버전을 확인합니다":"확인 중입니다"}`);check()};
if(!("serviceWorker" in navigator)){show("err","이 브라우저는 앱 설치를 지원하지 않습니다");return}
let reg=null,checking=false;
async function offlineReady(){try{return !!navigator.serviceWorker.controller&&await caches.has("mangdo-"+APP_VERSION)}catch(e){return false}}
async function check(){if(checking)return;checking=true;
  try{
    if(!reg)reg=await navigator.serviceWorker.register("sw.js");
    let latest=null;
    try{const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});if(r.ok)latest=(await r.json()).version}catch(e){}
    if(!latest){show("off",`오프라인 · v${APP_VERSION}`);return}
    sv("mdn.lastCheck",String(Date.now()));
    if(latest!==APP_VERSION){show("upd");await reg.update();waitForNew();return}
    // same version: make sure files are cached before saying it's safe to go offline
    for(let i=0;i<40&&!(await offlineReady());i++)await new Promise(r=>setTimeout(r,500));
    if(await offlineReady())show("ok",`✓ 최신 v${APP_VERSION} · 준비완료`);else show("upd","오프라인 준비 중…")
  }catch(e){console.error(e);show("err","업데이트 확인 실패")}finally{checking=false}}
function waitForNew(){const done=()=>show("ready");
  const watch=w=>{if(!w)return;if(w.state==="activated")return done();w.addEventListener("statechange",()=>{if(w.state==="activated")done()})};
  if(reg.installing)watch(reg.installing);else if(reg.waiting)watch(reg.waiting);
  reg.addEventListener("updatefound",()=>watch(reg.installing));
  navigator.serviceWorker.addEventListener("controllerchange",done,{once:true})}

/* in-app install button */
const ib=document.createElement("button");ib.type="button";ib.textContent="⬇ 앱 설치";ib.hidden=true;
ib.style.cssText="border:0;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700;min-height:30px;background:#e01b24;color:#fff;white-space:nowrap";
b.after(ib);let deferred=null;
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;if(!standalone())ib.hidden=false});
ib.onclick=async()=>{if(!deferred){tip("브라우저 메뉴(⋮ 또는 ⋯)에서 '앱 설치' / '홈 화면에 추가'를 누르세요");return}
  deferred.prompt();const r=await deferred.userChoice.catch(()=>null);deferred=null;ib.hidden=true;if(r&&r.outcome==="accepted")tip("설치했습니다. 홈 화면(또는 앱 목록)의 망도노트 아이콘으로 실행하세요")};
window.addEventListener("appinstalled",()=>{ib.hidden=true;tip("설치 완료. 이제 망도노트 아이콘으로 실행하세요")});
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
window.addEventListener("online",check);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)check()});
check();
})();
</script>

const KR_FONT_B64="__FONT_B64__";
(function(){
"use strict";
const $=s=>document.querySelector(s);
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsLib.GlobalWorkerOptions.workerSrc || "";

/* ---------- defaults ---------- */
const AREA_PATS={none:"없음(윤곽만)",solid:"채움",netcrack:"망상균열 (빗금 벽돌)",cross:"교차 X (재료분리)",grid:"격자 (박리·파손)",circles:"동그라미 (백태)",hex:"벌집 (누수·체수)",dotsdense:"촘촘한 점 (변색·녹물)",xmarks:"× 표시 (철판보강부)",diag:"사선 / (강재부식)",dashh:"가로 점선 (소성변형)",scour:"v 표시 (기초 세굴)",vert:"세로선 (보수흔적)",speckle:"얼룩 (이물질 퇴적)",rdiag:"사선 \\",horiz:"가로선",diagwide:"넓은 사선 /",rdiagwide:"넓은 사선 \\",dots:"점","netcrack+circles":"망상균열 + 백태","hex+circles":"누수 + 백태","grid+dots":"격자 + 점"};
const LINE_STYLES={plain:"실선 (균열)",zigzag:"지그재그 (시공이음·층분리)",wave:"물결 (좌굴·변형)",rebar:"×══× (철근노출)",rebarcor:"×▨▨× (철근부식)",dashed:"점선",crackef:"균열 + 둘레 동그라미 (균열부백태)"};
AREA_PATS.rebarsym="×══× 사각형 (철근노출)";AREA_PATS.rebarcorsym="×▨▨× 사각형 (철근부식)";
const POINT_SYMS={x:"⊗ 표시",star:"별 (펀칭·공동)",dot:"● 점"};
const PATS_BY_GEOM={area:AREA_PATS,line:LINE_STYLES,point:POINT_SYMS};
const GEOMS={line:"선",area:"면",point:"점"};
const UNIT={line:"m",area:"㎡",point:"EA"};
const UNITS=["m","㎡","EA"];
const UNIT_TITLE={"m":"m · 길이 손상","㎡":"㎡ · 면적 손상","EA":"EA · 개소 손상"};
const L_=(id,name,short,geom,unit,hatch,widths,shape)=>({id,name,short,geom,unit,hatch,widths:widths||"",shape:shape||""});
/* 회사 손상범례 기준 (균열 외 해치는 범례 그림을 따름) */
const DEF_LIB=[
 L_("c1","균열(Cw=0.3㎜미만)","균열","line","m","plain","0.1,0.2"),
 L_("c2","균열(Cw=0.3㎜이상)","균열","line","m","plain","0.3,0.4,0.5,1.0"),
 L_("cef","균열부백태(Cw=0.3㎜미만)","균열부백태","line","m","crackef","0.1,0.2"),
 L_("crp","보수부균열(Cw=0.3㎜미만)","보수부균열","line","m","plain","0.1,0.2"),
 L_("crp2","보수부균열(Cw=0.3㎜이상)","보수부균열","line","m","plain","0.3,0.4,0.5,1.0"),
 L_("joint","시공이음분리","시공이음분리","line","m","zigzag"),
 L_("dlam","층분리","층분리","line","m","zigzag"),
 L_("dfm","좌굴, 변형","변형","line","m","wave"),
 L_("rebar","철근노출","철근노출","area","㎡","rebarsym","","rect"),
 L_("rcor","철근부식","철근부식","area","㎡","rebarcorsym","","rect"),
 L_("net","망상균열","망상균열","area","㎡","netcrack"),
 L_("netef","망상균열,백태","망상균열,백태","area","㎡","netcrack+circles"),
 L_("seg","재료분리","재료분리","area","㎡","cross"),
 L_("scal","박리","박리","area","㎡","grid"),
 L_("brk","파손","파손","area","㎡","grid"),
 L_("spall","박락","박락","area","㎡","grid"),
 L_("efl","백태","백태","area","㎡","circles","",""),
 L_("leak","누수","누수","area","㎡","hex","",""),
 L_("seep","체수","체수","area","㎡","hex","",""),
 L_("leakef","누수흔적및백태","누수흔적,백태","area","㎡","hex+circles","",""),
 L_("disc","콘크리트변색","콘크리트변색","area","㎡","dotsdense","",""),
 L_("rust","녹물","녹물","area","㎡","dotsdense","",""),
 L_("plate","철판보강부","철판보강부","area","㎡","xmarks"),
 L_("cor","강재부식","강재부식","area","㎡","diag","",""),
 L_("plast","소성변형","소성변형","area","㎡","dashh"),
 L_("scour","기초의 세굴","세굴","area","㎡","scour"),
 L_("rtrace","보수흔적","보수흔적","area","㎡","vert","",""),
 L_("debris","이물질 퇴적","이물질 퇴적","area","㎡","speckle"),
 L_("paint","도장박리","도장박리","area","㎡","rdiagwide"),
 L_("void","펀칭, 공동","공동","point","EA","star"),
 L_("bolt","볼트체결불량","볼트체결불량","point","EA","x"),
 L_("drn","배수관탈락","배수관 탈락","point","EA","x"),
 L_("drc","배수구막힘","배수구막힘","point","EA","x"),
 L_("etc","기타","기타","point","EA","x")
];
/* 추가 입력값: depth → T(mm) 깊이, cw → 망상균열 등 면적 손상의 균열폭 */
const FLAG_DEF={scal:{depth:true},spall:{depth:true},step:{depth:true},net:{cw:true},netef:{cw:true}};
DEF_LIB.splice(DEF_LIB.findIndex(t=>t.id==="dfm")+1,0,L_("step","단차","단차","line","m","dashed"));
for(const t of DEF_LIB)Object.assign(t,FLAG_DEF[t.id]||{});
const TAGS=[["","없음"],["상","상반기"],["하","하반기"],["정기","정기점검"],["정밀","정밀점검"],["진단","정밀안전진단"],["성능","성능평가"]];
const DEF_OPT={fs:6,showName:true,showEx:true,hatchSp:2.2,lw:0.6,lwThick:1.1,fingerDraw:false,repeat:false,
  stNew:"#e01b24",stOld:"#111111",stRep:"#1f5fd1",stDel:"#8a9099",stChg:"#f08c00",yearColors:{},curYear:new Date().getFullYear(),inkColor:"#e01b24",xch:"X",by:"",toScale:true};
const STATUS=[["new","신규"],["old","기존"],["rep","보수"]];
const JUDGE=[["keep","유지"],["prog","변경"],["rep","보수"],["del","삭제"]];
/* 부재위치 (교량 · 터널) — 처음 한 번 고르면 다음 손상부터 자동 */
const MEMBERS={bridge:["교면포장","바닥판","거더 외부","거더 내부","가로보","세로보","교대","교각","기초","받침장치","받침콘크리트","신축이음","난간 및 연석","날개벽","배수시설","점검시설","공중이 이용하는 부위","부착시설물","방호·보호시설","기타"],
  tunnel:["천정부","아치부(어깨부)","측벽부","바닥부·인버트","공동구","배수시설","기지갱·연결갱","수직구","환기구","갱문·갱구부","기전실 등 부대시설","피난·안전시설","공중이 이용하는 부위","부착시설","기타"]};
const CIRC="①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚";
/* 상태평가 기준 요약 (2026.1 세부지침 안전점검·진단편) — a~e */
const GRADES={
 tunnel:[
  [/누수|체수/,"터널 누수 [표 2.11]",["없음","스며있음","떨어짐","흐름","분출"]],
  [/박리/,"터널 재질열화 · 박리",["없음","깊이 6㎜ 미만","6㎜ 이상~25㎜ 미만","25㎜ 이상 또는 조골재 손실","박리가 극심하여 즉시 보수 필요"]],
  [/박락|층분리/,"터널 재질열화 · 층분리 및 박락",["없음","깊이 12㎜ 미만 또는 직경 75㎜ 미만","깊이 12~25㎜ 또는 직경 75~150㎜","깊이 25㎜ 이상 또는 직경 150㎜ 이상","박락이 극심하여 즉시 보수 필요"]],
  [/백태|재료분리/,"터널 재질열화 · 백태, 재료분리",["없음","면적율 5% 미만","면적율 5~10%","면적율 10~20%","면적율 20% 이상"]],
  [/철근노출|철근부식/,"터널 재질열화 · 철근노출",["없음","면적율 1% 미만","면적율 1~3%","면적율 3~5%","면적율 5% 이상"]],
  [/파손|손상/,"터널 파손 및 손상 [표 2.12] (손상두께/설계두께)",["없음","1/6 미만","1/6 이상~1/3 미만","1/3 이상~1/2 미만","1/2 이상"]]],
 bridge:[
  [/망상균열/,"콘크리트 바닥판 · 2방향 균열 [표 1.11]",["망상균열폭 0.1㎜ 미만","0.1㎜ 이상~0.3㎜ 미만","0.3㎜ 이상","망상균열 진전으로 박리 발생","박리가 심해 펀칭파괴 가능성"]],
  [/균열/,"콘크리트 바닥판 · 1방향 균열 [표 1.11]",["균열폭 0.1㎜ 미만","0.1~0.3㎜ · 균열률 2% 미만","0.3~0.5㎜ · 균열률 2~10%","0.5~1.0㎜ · 균열률 10~20%","1.0㎜ 이상 · 균열률 20% 이상"]],
  [/누수|체수|백태/,"콘크리트 바닥판 · 누수 및 백태 [표 1.11]",["없음","누수·백태 면적 10% 미만","누수·백태 면적 10% 이상","누수로 데크플레이트 심한 부식·탈락","—"]],
  [/철근노출|철근부식/,"콘크리트 바닥판 · 철근부식 [표 1.11]",["없음","없음","철근부식 손상면적 2% 미만","철근부식 손상면적 2% 이상","단면감소가 심해 안전성 저하"]],
  [/박리|박락|파손|층분리|재료분리/,"콘크리트 바닥판 · 표면손상 [표 1.11]",["없음","표면손상 면적 2% 미만","면적 2% 이상~10% 미만","면적 10% 이상","—"]]]};
const INK_COLORS=["#e01b24","#1f5fd1","#111111","#11875a"];
const GEN_CHIPS=[0.1,0.2,0.3,0.5,1.0,1.5,2.0];

/* ---------- state ---------- */
const S={pdf:null,bytes:null,name:"",size:0,key:"",isSample:false,n:1,count:1,W:1191,H:842,
  tool:"pen",armed:null,z:1,tx:0,ty:0,sel:null,selEx:null,doc:{pages:{}},lib:null,opt:null,panelAll:false,
  undo:{},redo:{},renderScale:0,renderTask:null,recent:[],ex:{}};
function ld(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
S.lib=ld("mdn.lib3",null)||JSON.parse(JSON.stringify(DEF_LIB));
for(const t of S.lib){if(FLAG_DEF[t.id]&&t.depth===undefined&&t.cw===undefined)Object.assign(t,FLAG_DEF[t.id]);if((t.id==="rebar"||t.id==="rcor")&&t.geom==="line"){const d=DEF_LIB.find(x=>x.id===t.id);Object.assign(t,{geom:"area",hatch:d.hatch,shape:"rect"})}}
for(const t of S.lib){if(t.geom==="area"&&t.shape==="ellipse")t.shape="";if(t.id==="cef"&&t.hatch==="plain")t.hatch="crackef"}
if(!S.lib.find(t=>t.id==="crp2")){const d=DEF_LIB.find(t=>t.id==="crp2");const i=S.lib.findIndex(t=>t.id==="crp");S.lib.splice(i>=0?i+1:S.lib.length,0,JSON.parse(JSON.stringify(d)))}
S.opt=Object.assign({},DEF_OPT,ld("mdn.opt2",{}));S.opt.memExtra=S.opt.memExtra||{bridge:[],tunnel:[]};S.opt.yearColors=S.opt.yearColors||{};
S.recent=ld("mdn.recent2",[]);
if(!S.lib.find(t=>t.id==="step")){const d=DEF_LIB.find(t=>t.id==="step");const i=S.lib.findIndex(t=>t.id==="dfm");S.lib.splice(i>=0?i+1:S.lib.length,0,JSON.parse(JSON.stringify(d)))}
const saveOpt=()=>sv("mdn.opt2",S.opt);
const yearColor=yr=>S.opt.yearColors[String(yr||"").slice(-4)]||S.opt.stOld;
const itemColor=it=>it.st==="chg"?(S.opt.stChg||"#f08c00"):it.st==="rep"?S.opt.stRep:it.st==="old"?yearColor(it.yr):S.opt.stNew;
const exColor=(j,yr)=>j==="rep"?S.opt.stRep:j==="del"?S.opt.stDel:j==="prog"?(S.opt.stChg||"#f08c00"):yearColor(yr);
const stName=s=>s==="chg"?"변경":(STATUS.find(x=>x[0]===s)||STATUS[0])[1];
const jName=j=>(JUDGE.find(x=>x[0]===j)||JUDGE[0])[1];
function libById(id){if(id&&id.startsWith("ex:")){const g=id.slice(3);return{id,name:"",short:"",geom:g,unit:UNIT[g],hatch:g==="line"?"plain":g==="point"?"x":"none",widths:""}}
  return S.lib.find(t=>t.id===id)||DEF_LIB.find(t=>t.id===id)||{id,name:id,short:id,geom:"area",unit:"㎡",hatch:"none",widths:""}}
function kindNow(){const k=(S.cur&&S.cur.kind)||(S.doc&&S.doc.kind)||"";return k==="bridge"||k==="tunnel"?k:""}
function setKind(k){const old=kindNow();if(S.cur){S.cur.kind=k;try{libSave()}catch(e){}}S.doc.kind=k;if(old!==k&&S.doc.mem&&!memList(k).includes(S.doc.mem))S.doc.mem="";autosave()}
function kindSwap(){const k=kindNow(),to=k==="bridge"?"tunnel":"bridge",nm={bridge:"교량",tunnel:"터널"};
  modal("구조물 종류 바꾸기",`<p class="help" style="color:var(--ink)">지금 <b>${nm[k]||"미지정"}</b>입니다. <b>${nm[to]}</b>(으)로 옮길까요?<br>부재위치 목록과 상태등급 기준이 ${nm[to]} 것으로 바뀝니다. 이미 기입한 손상의 부재위치는 그대로 남으니 필요하면 손상을 눌러 고치세요.</p><div class="mact"><button class="btn" id="kwCx">취소</button><button class="btn primary" id="kwOk">${nm[to]}(으)로 옮기기</button></div>`);
  $("#kwCx").onclick=closeModal;$("#kwOk").onclick=()=>{setKind(to);closeModal();redraw();toast(`${nm[to]}(으)로 옮겼습니다`)}}
function memList(k){k=k||kindNow();if(!k)return[];const ex=(S.opt.memExtra&&S.opt.memExtra[k])||[];return MEMBERS[k].concat(ex.filter(x=>!MEMBERS[k].includes(x)))}
function gradeInfo(it){const k=kindNow()||"tunnel";const nm=typeOf(it).name||"";for(const g of GRADES[k])if(g[0].test(nm))return{title:g[1],d:g[2]};return null}
function page(n=S.n){const p=S.doc.pages[n]||(S.doc.pages[n]={label:"",scale:0,items:[]});p.exj=p.exj||{};p.exq=p.exq||{};p.exp=p.exp||{};return p}

/* ---------- utils ---------- */
const fmt=v=>{if(v===""||v==null||isNaN(v))return"";return String(+(+v).toFixed(3))};
const f1=v=>{if(v===""||v==null||isNaN(v))return"";const n=+v;return Number.isInteger(Math.round(n*1e6)/1e5)?n.toFixed(1):String(+n.toFixed(3))};
const f2=v=>v===""||v==null||isNaN(v)?"":(+v).toFixed(2);
const r2=v=>Math.round(v*100)/100;
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function polyLen(p){let s=0;for(let i=1;i<p.length;i++)s+=dist(p[i-1],p[i]);return s}
function bbox(p){let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const[x,y]of p){a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x);d=Math.max(d,y)}return{x:a,y:b,w:c-a,h:d-b,x2:c,y2:d}}
function rdp(pts,eps){if(pts.length<3)return pts;let dm=0,ix=0;const a=pts[0],b=pts[pts.length-1];
  for(let i=1;i<pts.length-1;i++){const d=segDist(pts[i],a,b);if(d>dm){dm=d;ix=i}}
  if(dm>eps){const l=rdp(pts.slice(0,ix+1),eps),r=rdp(pts.slice(ix),eps);return l.slice(0,-1).concat(r)}return[a,b]}
function segDist(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
function polyDist(p,pts){let m=1e9;for(let i=1;i<pts.length;i++)m=Math.min(m,segDist(p,pts[i-1],pts[i]));if(pts.length===1)m=dist(p,pts[0]);return m}
function inPoly(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];
  if((yi>p[1])!==(yj>p[1])&&p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi)c=!c}return c}
const round=p=>p.map(([x,y])=>[Math.round(x*100)/100,Math.round(y*100)/100]);
function uid(){return Math.random().toString(36).slice(2,9)}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function txtW(s,fs){let w=0;for(const ch of s)w+=/[ᄀ-ᇿ㄰-㆏가-힯①-⓿㈀-㏿]/.test(ch)?fs*.98:fs*.58;return w}
let toastT;function toast(m,ms=2200){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("show"),ms)}

/* ---------- existing damages: parse the PDF's own 손상물량표 + numbered labels ---------- */
/*PARSER*/
async function ensureEx(n){if(S.ex[n])return S.ex[n];try{const pg=await S.pdf.getPage(n);const vp=pg.getViewport({scale:1});const tc=await pg.getTextContent();
  const items=tc.items.filter(i=>i.str&&i.str.trim()).map(i=>{const[x,y]=vp.convertToViewportPoint(i.transform[4],i.transform[5]);return{s:i.str,x,y,h:Math.hypot(i.transform[2],i.transform[3])}});
  S.ex[n]=parseExisting(items)}catch(e){console.error(e);S.ex[n]={rows:[],labels:{}}}return S.ex[n]}
const exRows=n=>(S.ex[n]&&S.ex[n].rows)||[];
function exDefault(row){return /보수/.test(row.note)?"rep":/삭제/.test(row.note)?"del":"keep"}
function exJ(n,row){const p=S.doc.pages[n];return(p&&p.exj&&p.exj[row.no])||exDefault(row)}
function exChanged(n,row){const p=S.doc.pages[n];return !!(p&&p.exj&&p.exj[row.no]&&p.exj[row.no]!==exDefault(row))}
function geomOfRow(row){const u=(row.u||"").trim();return /EA|개소/i.test(u)?"point":/㎡|m2/.test(u)?"area":"line"}
function rowQtyText(row,q){const g=geomOfRow(row),x=S.opt.xch;q=q||{};const n=+(q.n??row.n)||1,ea=n>1?` ${n}EA`:"";
  if(g==="line"){const w=q.w??row.w,L=q.L??row.L;return(w!==""&&w!=null?`${f1(w)}/${f1(L)}`:`L=${f1(L)}`)+ea}
  if(g==="area")return `${f1(q.a??row.w)}${x}${f1(q.b??row.L)}${ea}`;return `${n}EA`}
function rowQty(row,q){const g=geomOfRow(row);if(!q)return{v:+row.q||0,u:row.u||UNIT[g]};const n=+q.n||1;
  if(g==="line")return{v:r2((+q.L||0)*n),u:"m"};if(g==="area")return{v:r2((+q.a||0)*(+q.b||0)*n),u:"㎡"};return{v:n,u:"EA"}}
function exRing(n,row){const lb=S.ex[n]&&S.ex[n].labels[row.no];if(!lb)return null;const w=txtW(String(row.no),lb.h);return{cx:lb.x+w/2,cy:lb.y-lb.h*.36,r:Math.max(lb.h*.78,w*.75),lb}}
function nextNo(n=S.n){let m=(S.ex[n]&&S.ex[n].maxNo)||0;for(const r of exRows(n))m=Math.max(m,r.no);for(const it of page(n).items)if(it.no)m=Math.max(m,it.no);return m+1}
function knownYears(){const ys=new Set([String(S.opt.curYear)]);for(const k in S.ex)for(const r of S.ex[k].rows)if(r.yr)ys.add(r.yr);
  for(const k in S.doc.pages)for(const it of S.doc.pages[k].items)if(it.yr)ys.add(String(it.yr));return[...ys].sort()}

/* ---------- hatch / line-style geometry (shared by screen + PDF export) ---------- */
const HDEF={diag:[[45,1]],rdiag:[[135,1]],cross:[[45,.8],[135,.8]],grid:[[0,.9],[90,.9]],horiz:[[0,1]],vert:[[90,.8]],diagwide:[[45,2]],rdiagwide:[[135,2]]};
function scanLines(poly,ang,sp){const a=ang*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  const P=poly.map(([x,y])=>[x*c+y*s,-x*s+y*c]);let mn=1e9,mx=-1e9;for(const p of P){mn=Math.min(mn,p[1]);mx=Math.max(mx,p[1])}
  const out=[];for(let yy=Math.ceil(mn/sp)*sp;yy<=mx;yy+=sp){const xs=[];
    for(let i=0;i<P.length;i++){const[x1,y1]=P[i],[x2,y2]=P[(i+1)%P.length];if((y1<=yy&&y2>yy)||(y2<=yy&&y1>yy))xs.push(x1+(yy-y1)*(x2-x1)/(y2-y1))}
    xs.sort((m,n)=>m-n);for(let k=0;k+1<xs.length;k+=2){const u1=xs[k],u2=xs[k+1];out.push([u1*c-yy*s,u1*s+yy*c,u2*c-yy*s,u2*s+yy*c])}}
  return out}
/* 선분을 다각형 안쪽만 남기고 자름 */
function clipSeg(poly,x1,y1,x2,y2){const ts=[0,1],dx=x2-x1,dy=y2-y1;
  for(let i=0;i<poly.length;i++){const[ax,ay]=poly[i],[bx,by]=poly[(i+1)%poly.length],ex=bx-ax,ey=by-ay,den=dx*ey-dy*ex;if(Math.abs(den)<1e-12)continue;
    const t=((ax-x1)*ey-(ay-y1)*ex)/den,u=((ax-x1)*dy-(ay-y1)*dx)/den;if(t>0&&t<1&&u>=0&&u<=1)ts.push(t)}
  ts.sort((a,b)=>a-b);const out=[];for(let i=0;i+1<ts.length;i++){const ta=ts[i],tb=ts[i+1];if(tb-ta<1e-6)continue;const tm=(ta+tb)/2;
    if(inPoly([x1+dx*tm,y1+dy*tm],poly))out.push([x1+dx*ta,y1+dy*ta,x1+dx*tb,y1+dy*tb])}return out}
/* 회전 좌표계에서 무늬를 만들고 되돌려서 자르기 */
function tiled(poly,ang,gen){const a=ang*Math.PI/180,c=Math.cos(a),s=Math.sin(a);const P=poly.map(([x,y])=>[x*c+y*s,-x*s+y*c]);const B=bbox(P);
  const out=[];for(const[x1,y1,x2,y2]of gen(B)){const X1=x1*c-y1*s,Y1=x1*s+y1*c,X2=x2*c-y2*s,Y2=x2*s+y2*c;out.push(...clipSeg(poly,X1,Y1,X2,Y2))}return out}
const hash2=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295};
function hatchGeom(poly,style,sp){const o={segs:[],dots:[],rings:[],fill:false};if(poly.length<3)return o;const B=bbox(poly);
  for(const st of String(style||"none").split("+")){
    if(st==="solid")o.fill=true;
    if(HDEF[st])for(const[a,m]of HDEF[st])o.segs.push(...scanLines(poly,a,sp*m));
    if(st==="dots"||st==="dotsdense"){const step=sp*(st==="dots"?1.5:0.7);let row=0;
      for(let y=Math.ceil(B.y/step)*step;y<=B.y2;y+=step,row++)for(let x=Math.ceil(B.x/step)*step+(row%2?step/2:0);x<=B.x2;x+=step)if(inPoly([x,y],poly))o.dots.push([x,y,st==="dots"?.35:.25])}
    if(st==="circles"){const step=sp*1.5,r=sp*.48;let row=0;const off=style.includes("+")?step/2:0;
      for(let y=Math.ceil(B.y/step)*step+off;y<=B.y2;y+=step*.87,row++)for(let x=Math.ceil(B.x/step)*step+(row%2?step/2:0)+off;x<=B.x2;x+=step)if(inPoly([x,y],poly))o.rings.push([x,y,r])}
    if(st==="netcrack")o.segs.push(...tiled(poly,45,b=>{const h=sp*1.1,S2=[];let row=0;for(let y=Math.floor(b.y/h)*h;y<=b.y2+h;y+=h,row++){S2.push([b.x-h,y,b.x2+h,y]);for(let x=Math.floor(b.x/(2*h))*2*h+(row%2?h:0);x<=b.x2+h;x+=2*h)S2.push([x,y,x,y+h])}return S2}));
    if(st==="hex")o.segs.push(...tiled(poly,0,b=>{const R=sp*.8,w=Math.sqrt(3)*R,S2=[];let row=0;for(let y=Math.floor(b.y/(1.5*R))*1.5*R-R;y<=b.y2+R;y+=1.5*R,row++)for(let x=Math.floor(b.x/w)*w-w+(row%2?w/2:0);x<=b.x2+w;x+=w){const v=[];for(let k=0;k<6;k++){const an=Math.PI/180*(60*k-30);v.push([x+R*Math.cos(an),y+R*Math.sin(an)])}for(let k=0;k<3;k++){const p=v[k],q=v[k+1];S2.push([p[0],p[1],q[0],q[1]])}}return S2}));
    if(st==="dashh")o.segs.push(...tiled(poly,0,b=>{const h=sp*.9,dl=sp*.9,gp=sp*.5,S2=[];let row=0;for(let y=Math.floor(b.y/h)*h;y<=b.y2;y+=h,row++)for(let x=Math.floor(b.x/(dl+gp))*(dl+gp)-(row%2?(dl+gp)/2:0);x<=b.x2;x+=dl+gp)S2.push([x,y,x+dl,y]);return S2}));
    if(st==="xmarks"){const step=sp*1.5,d=sp*.32;let row=0;for(let y=Math.ceil(B.y/step)*step;y<=B.y2;y+=step,row++)for(let x=Math.ceil(B.x/step)*step+(row%2?step/2:0);x<=B.x2;x+=step)if(inPoly([x,y],poly)){o.segs.push([x-d,y-d,x+d,y+d],[x-d,y+d,x+d,y-d])}}
    if(st==="scour"){const step=sp*1.7,d=sp*.3;let row=0;for(let y=Math.ceil(B.y/step)*step;y<=B.y2;y+=step*.8,row++)for(let x=Math.ceil(B.x/step)*step+(row%2?step/2:0);x<=B.x2;x+=step)if(inPoly([x,y],poly)){o.segs.push([x-d,y-d,x,y],[x,y,x+d,y-d]);if(inPoly([x+step*.35,y+d],poly))o.dots.push([x+step*.35,y+d,.22])}}
    if(st==="speckle"){const step=sp*.8;const i0=Math.floor(B.x/step),j0=Math.floor(B.y/step);for(let j=j0;j*step<=B.y2;j++)for(let i=i0;i*step<=B.x2;i++){const h=hash2(i,j),jx=hash2(j,i+7),jy=hash2(i+3,j+11);const x=(i+jx)*step,y=(j+jy)*step;if(!inPoly([x,y],poly))continue;
      if(h<.32)o.dots.push([x,y,h<.08?.42:.22]);else if(h<.42){const d=sp*.22;o.segs.push([x,y-d,x+d,y+d*.6],[x+d,y+d*.6,x-d,y+d*.6],[x-d,y+d*.6,x,y-d])}}}}
  return o}
function ellipsePoly(b,n=32){const cx=b.x+b.w/2,cy=b.y+b.h/2,out=[];for(let i=0;i<n;i++){const a=2*Math.PI*i/n;out.push([cx+b.w/2*Math.cos(a),cy+b.h/2*Math.sin(a)])}return out}
/* 선 따라 일정 간격으로 점·법선 얻기 */
function walk(pts,step,fn){let acc=0;for(let i=1;i<pts.length;i++){const[a,b]=[pts[i-1],pts[i]],L=dist(a,b);if(L<1e-9)continue;const ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L;
  for(let d=(acc>0?step-acc:0);d<=L;d+=step)fn(a[0]+ux*d,a[1]+uy*d,-uy,ux);acc=(acc+L)%step}}
function offsetLine(pts,off){const out=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const L=dist(a,b)||1;const nx=-(b[1]-a[1])/L,ny=(b[0]-a[0])/L;out.push([pts[i][0]+nx*off,pts[i][1]+ny*off])}return out}
/* 손상 하나를 그리는 기본 도형들 (화면 SVG와 PDF가 같이 씀) */
function itemPrims(it,k){k=k||1;const t=libById(it.type),P={paths:[],segs:[],dots:[],rings:[]};const sty=t.hatch||"";
  if(t.geom==="line"){const thick=/이상/.test(t.name)||(+it.w>=0.3);const w=(thick?S.opt.lwThick:S.opt.lw)*k,pts=it.pts;if(pts.length<2)return P;
    if(sty==="zigzag"){const z=[],amp=.7*k;let sg=1;walk(pts,.8*k,(x,y,nx,ny)=>{z.push([x+nx*amp*sg,y+ny*amp*sg]);sg=-sg});if(z.length>1)P.paths.push({pts:z,w:w*.8})}
    else if(sty==="wave"){const z=[],amp=1.1*k,wl=6*k;let d=0;walk(pts,.3*k,(x,y,nx,ny)=>{const v=Math.sin(d/wl*2*Math.PI)*amp;z.push([x+nx*v,y+ny*v]);d+=.3*k});if(z.length>1)P.paths.push({pts:z,w:w*.8})}
    else if(sty==="rebar"||sty==="rebarcor"){const o=.55*k;P.paths.push({pts:offsetLine(pts,o),w:w*.6},{pts:offsetLine(pts,-o),w:w*.6});
      const X=(p,q)=>{const L=dist(p,q)||1,ux=(q[0]-p[0])/L,uy=(q[1]-p[1])/L,d=2.0*k;P.segs.push([p[0]+(ux-uy)*d*.7,p[1]+(uy+ux)*d*.7,p[0]-(ux-uy)*d*.7,p[1]-(uy+ux)*d*.7,w*.6],[p[0]+(ux+uy)*d*.7,p[1]+(uy-ux)*d*.7,p[0]-(ux+uy)*d*.7,p[1]-(uy-ux)*d*.7,w*.6])};
      X(pts[0],pts[1]);X(pts[pts.length-1],pts[pts.length-2]);
      if(sty==="rebarcor")walk(pts,.6*k,(x,y,nx,ny)=>{P.segs.push([x-nx*o,y-ny*o,x+nx*o+(ny)*.35*k,y+ny*o-(nx)*.35*k,w*.45])})}
    else if(sty==="crackef"){P.paths.push({pts,w});let sg=1,i=0;walk(pts,1.7*k,(x,y,nx,ny)=>{if(i++%1===0){const o=(.95+.25*((i*7)%3)/2)*k*sg;P.rings.push([x+nx*o,y+ny*o,(.42+.12*((i*5)%3)/2)*k,.25*k]);sg=-sg}})}
    else P.paths.push({pts,w,dash:sty==="dashed"?[2*k,1.2*k]:null})}
  else if(t.geom==="area"&&(sty==="rebarsym"||sty==="rebarcorsym")){const B=bbox(it.pts),hor=B.w>=B.h,cx=B.x+B.w/2,cy=B.y+B.h/2,L=(hor?B.w:B.h),T=(hor?B.h:B.w);
    const o=Math.min(T*.18,.7*k),d=Math.max(.6*k,Math.min(T*.42,1.8*k)),w=S.opt.lw*k*.8,m=Math.min(d*1.1,L*.2);
    const pt=(u,v)=>hor?[B.x+u,cy+v]:[cx+v,B.y+u];
    P.paths.push({pts:it.pts,closed:true,w:.01,fill:true,fillOp:0});
    const ln=(u1,v1,u2,v2,ww)=>{const a=pt(u1,v1),b=pt(u2,v2);P.segs.push([a[0],a[1],b[0],b[1],ww])};
    ln(m,-o,L-m,-o,w);ln(m,o,L-m,o,w);
    for(const u of[m,L-m]){ln(u-d*.7,-d*.7,u+d*.7,d*.7,w);ln(u-d*.7,d*.7,u+d*.7,-d*.7,w)}
    if(sty==="rebarcorsym")for(let u=m+.5*k;u<L-m-.3*k;u+=.6*k)ln(u,o,u+.4*k,-o,w*.7)}
  else if(t.geom==="area"){const h=hatchGeom(it.pts,sty,S.opt.hatchSp*k);
    P.paths.push({pts:it.pts,closed:true,w:.55*k,fill:true,fillOp:h.fill?.45:.06,dash:sty==="none"?[2*k,1.2*k]:null});
    for(const q of h.segs)P.segs.push([q[0],q[1],q[2],q[3],.3*k]);for(const d of h.dots)P.dots.push([d[0],d[1],(d[2]||.35)*k]);for(const r of h.rings)P.rings.push([r[0],r[1],r[2],.28*k])}
  else{const[x,y]=it.pts[0];
    if(sty==="star"){const z=[];for(let i=0;i<16;i++){const r=(i%2?1:2.3)*k,a=Math.PI*i/8;z.push([x+r*Math.cos(a),y+r*Math.sin(a)])}P.paths.push({pts:z,closed:true,w:.5*k})}
    else if(sty==="dot")P.dots.push([x,y,1*k]);
    else{P.rings.push([x,y,1.8*k,.6*k]);P.segs.push([x-1.2*k,y-1.2*k,x+1.2*k,y+1.2*k,.45*k],[x+1.2*k,y-1.2*k,x-1.2*k,y+1.2*k,.45*k])}}
  return P}
function primsSVG(P,c){let g="";const f=v=>v.toFixed(2);
  for(const p of P.paths)g+=`<path d="${p.pts.map((q,i)=>(i?"L":"M")+f(q[0])+" "+f(q[1])).join("")}${p.closed?"Z":""}" fill="${p.fill?c:"none"}" ${p.fill?`fill-opacity="${p.fillOp}"`:""} stroke="${c}" stroke-width="${f(p.w)}" stroke-linecap="round" stroke-linejoin="round" ${p.dash?`stroke-dasharray="${p.dash.join(" ")}"`:""}/>`;
  if(P.segs.length){const byW={};for(const q of P.segs)(byW[q[4]]=byW[q[4]]||[]).push(q);for(const w in byW)g+=`<path d="${byW[w].map(q=>`M${f(q[0])} ${f(q[1])}L${f(q[2])} ${f(q[3])}`).join("")}" stroke="${c}" stroke-width="${(+w).toFixed(2)}" stroke-linecap="round"/>`}
  if(P.dots.length)g+=`<path d="${P.dots.map(d=>`M${f(d[0]-d[2])} ${f(d[1])}a${f(d[2])} ${f(d[2])} 0 1 0 ${f(2*d[2])} 0a${f(d[2])} ${f(d[2])} 0 1 0 ${f(-2*d[2])} 0`).join("")}" fill="${c}"/>`;
  for(const r of P.rings)g+=`<circle cx="${f(r[0])}" cy="${f(r[1])}" r="${f(r[2])}" fill="none" stroke="${c}" stroke-width="${f(r[3])}"/>`;
  return g}

/* ---------- 사진번호 (#0000) ---------- */
const phText=ph=>String(ph||"").split(",").map(x=>x.trim()).filter(Boolean).map(x=>"#"+x).join(", ");
function lastPhoto(){return +S.opt.lastPhoto||0}
function notePhoto(ph){const ns=String(ph||"").split(",").map(x=>parseInt(x)).filter(x=>x>0);if(ns.length){S.opt.lastPhoto=Math.max(...ns);saveOpt()}}
function phChips(){const l=lastPhoto();return l?[String(l+1),String(l+2),String(l)]:[]}

/* ---------- labels for drawn items ---------- */
const shortOf=n=>String(n).replace(/\(.*?\)/g,"").trim()||n;
function typeOf(it){const t=libById(it.type);return it.tname?Object.assign({},t,{name:it.tname,short:shortOf(it.tname)}):t}
function unitOf(it){if(it.u)return it.u;const t=libById(it.type);return t.unit||UNIT[t.geom]||"㎡"}
function qtyText(it){const u=unitOf(it),x=S.opt.xch;const n=+it.n||1;const ea=n>1?` ${n}EA`:"";
  if(u==="m")return(it.w!==""&&it.w!=null?`${f1(it.w)}/${f1(it.L)}`:`L=${f1(it.L)}`)+ea;
  if(u==="㎡")return `${f1(it.a)}${x}${f1(it.b)}${ea}`;return `${n}EA`}
function qtyValue(it){const u=unitOf(it),n=+it.n||1;
  if(u==="m")return{v:r2((+it.L||0)*n),u:"m"};if(u==="㎡")return{v:r2((+it.a||0)*(+it.b||0)*n),u:"㎡"};return{v:n,u:"EA"}}
function anchorOf(it){const g=libById(it.type).geom;if(g==="line")return it.pts[it.pts.length-1];
  if(g==="area"){const b=bbox(it.pts);return[b.x2,b.y]}return it.pts[0]}
function labelLines(it){const t=typeOf(it);const top=[it.no?String(it.no):"",S.opt.showName?(t.short||t.name):""].filter(Boolean).join(" ");return top?[top,qtyText(it)]:[qtyText(it)]}
/* label = ⓝ(적출년도 색 동그라미) + 손상명 / 수량 / ['26,상] / #사진 */
const FSb=()=>(S.doc&&S.doc.fs)||S.opt.fs;
function tagText(it){const tg=S.doc&&S.doc.tag;const yy=String(it.yr||S.opt.curYear).slice(-2);if(it.st==="chg")return tg?`['${yy},${tg} 변경]`:`['${yy} 변경]`;if(!tg||it.st!=="new")return"";return `['${yy},${tg}]`}
function cwSuffix(it){return it.cw!==""&&it.cw!=null&&libById(it.type).geom!=="line"?`(cw=${fmt(it.cw)}㎜)`:""}
function labelLayout(it,measure){const fs=FSb()*(it.ls||1),t=typeOf(it),W=measure||txtW;const name=(S.opt.showName?(t.short||t.name)+cwSuffix(it)+(it.gr?`(${it.gr})`:""):"")+(it.prog&&!it.chg?`(${it.prog}번 진행분)`:""),q=qtyText(it),no=it.no?String(it.no):"";
  const x=it.lp[0],yq=it.lp[1],y1=yq-fs*1.15,r=fs*.62,hasTop=!!name;
  const tx=no?x+2*r+fs*.25:x;const lines=[];
  if(hasTop)lines.push({t:name,x:tx,y:y1,size:fs*.85,bold:false});
  lines.push({t:q,x:tx,y:yq,size:fs,bold:true});
  let yy=yq;if(it.T!==""&&it.T!=null){yy+=fs*1.05;lines.push({t:`T=${fmt(it.T)}mm`,x:tx,y:yy,size:fs*.85,bold:false})}
  const tg=tagText(it);if(tg){yy+=fs*1.05;lines.push({t:tg,x:tx,y:yy,size:fs*.8,bold:false})}
  if(it.ph){yy+=fs*1.1;lines.push({t:phText(it.ph),x:tx,y:yy,size:fs*.9,bold:true,ph:true})}
  /* 부재위치: 화면 확인용(설정에서 켜기/끄기). PDF·CAD 내보내기에는 절대 넣지 않음 (measure 있으면 내보내기) */
  if(it.mem&&S.opt.showMem&&!measure){yy+=fs*1.05;lines.push({t:`[${it.mem}]`,x:tx,y:yy,size:fs*.75,bold:false,col:"#5b6472"})}
  const circ=no?{cx:x+r,cy:(hasTop?y1:yq)-fs*.32,r,no,size:no.length>2?fs*.62:no.length>1?fs*.74:fs*.8}:null;
  const w=(tx-x)+Math.max(...lines.map(l=>W(l.t,l.size)))+fs*.4;const top=(hasTop?y1:yq)-fs*.95;
  const bot=yy+fs*.3;return{box:{x:x-fs*.2,y:top,w,h:bot-top},circ,lines}}
function labelBox(it){return labelLayout(it).box}

/* ---------- swatch ---------- */
function swatchSVG(t,col){const c=col||S.opt.stNew;const k=1.45;let it;
  if(t.geom==="line")it={type:t.id,pts:t.hatch==="rebar"||t.hatch==="rebarcor"?[[5,10],[25,10]]:[[3,14],[9,7],[15,12],[21,6],[27,9]],w:/이상/.test(t.name)?"0.3":""};
  else if(t.geom==="point")it={type:t.id,pts:[[15,10]]};
  else it={type:t.id,pts:[[2,2],[28,2],[28,18],[2,18]]};
  return `<svg viewBox="0 0 30 20">${primsSVG(itemPrims(it,k),c)}</svg>`}

/* ---------- overlay rendering ---------- */
const ov=$("#ov");
function pathD(p){return p.map((q,i)=>(i?"L":"M")+q[0]+" "+q[1]).join("")}
function itemSVG(it){
  if(it.kind==="ink")return `<path d="${pathD(it.pts)}" fill="none" stroke="${it.color}" stroke-width="${it.w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if(it.kind!=="damage")return "";
  const c=itemColor(it),fs=FSb()*(it.ls||1);let g=`<g>`+primsSVG(itemPrims(it),c);
  const an=anchorOf(it),lb=labelBox(it);
  if(dist(an,[lb.x,lb.y+lb.h])>fs*1.6&&dist(an,[lb.x,lb.y])>fs*1.6)g+=`<path d="M${an[0]} ${an[1]}L${lb.x} ${lb.y+lb.h-fs*.2}" stroke="${c}" stroke-width=".3"/>`;
  const LO=labelLayout(it);
  if(LO.circ){const C=LO.circ;g+=`<circle cx="${C.cx.toFixed(2)}" cy="${C.cy.toFixed(2)}" r="${C.r.toFixed(2)}" fill="#fff" stroke="${c}" stroke-width="${(fs*.09).toFixed(2)}"/><text x="${C.cx.toFixed(2)}" y="${(C.cy+C.size*.36).toFixed(2)}" font-size="${C.size.toFixed(2)}" text-anchor="middle" font-weight="600" fill="${c}">${esc(C.no)}</text>`}
  for(const l of LO.lines)g+=`<text x="${l.x.toFixed(2)}" y="${l.y.toFixed(2)}" font-size="${l.size.toFixed(2)}" ${l.bold?'font-weight="600"':""} fill="${l.col||c}" stroke="#fff" stroke-width="${(fs*.22).toFixed(2)}" paint-order="stroke" stroke-linejoin="round">${esc(l.t)}</text>`;
  if(S.rs&&S.rs.id===it.id){const hs=7/S.z;g+=`<rect x="${(lb.x-1).toFixed(2)}" y="${(lb.y-1).toFixed(2)}" width="${(lb.w+2).toFixed(2)}" height="${(lb.h+2).toFixed(2)}" fill="rgba(42,111,219,.06)" stroke="#2a6fdb" stroke-width="${(1.2/S.z).toFixed(2)}"/><rect x="${(lb.x+lb.w+1-hs/2).toFixed(2)}" y="${(lb.y+lb.h+1-hs/2).toFixed(2)}" width="${hs.toFixed(2)}" height="${hs.toFixed(2)}" fill="#2a6fdb"/>`}
  else if(S.sel===it.id){const b=bbox(it.pts),p=2;g+=`<rect x="${lb.x-1}" y="${lb.y-1}" width="${lb.w+2}" height="${lb.h+2}" fill="none" stroke="#2a6fdb" stroke-width=".5" stroke-dasharray="1.5 1"/><rect x="${b.x-p}" y="${b.y-p}" width="${b.w+p*2}" height="${b.h+p*2}" fill="none" stroke="#2a6fdb" stroke-width=".6" stroke-dasharray="2 1.2"/>`}
  return g+"</g>"}
function incItemOf(n,no){const p=S.doc.pages[n];return p?p.items.find(i=>i.kind==="damage"&&(i.chg===no||i.prog===no)):null}
function exTag(n,row){const j=exJ(n,row);if(j==="keep"||j==="prog")return"";if(j==="prog"){const q=page(n).exq[row.no];const inc=incItemOf(n,row.no);return "진행 "+rowQtyText(row,q)+(inc?` → ${inc.no}`:"")}return jName(j)}
/* 기존 손상 사진번호: 기존 라벨(번호·손상명·수량·표기) 바로 아래, 끌어서 옮길 수 있음 */
function exPhotoBox(n,row){const p=S.doc.pages[n];const ph=p&&p.exp&&p.exp[row.no];if(!ph)return null;const lb=S.ex[n]&&S.ex[n].labels[row.no];if(!lb)return null;
  const fs=FSb()*.9,t=phText(ph),off=(p.expo&&p.expo[row.no])||[0,0];const x=(lb.nx||lb.x)+off[0],y=(lb.by||lb.y)+fs*1.25+off[1];
  return{x,y,t,size:fs,box:{x:x-.5,y:y-fs*.95,w:txtW(t,fs)+1,h:fs*1.25}}}
function exSVG(n){if(!S.opt.showEx)return"";let s="";const fs=FSb();
  for(const row of exRows(n)){const R=exRing(n,row);if(!R)continue;const j=exJ(n,row),ch=exChanged(n,row),c=exColor(j,row.yr),sel=S.selEx===row.no;
    s+=`<circle cx="${R.cx.toFixed(2)}" cy="${R.cy.toFixed(2)}" r="${R.r.toFixed(2)}" fill="${sel?"rgba(42,111,219,.12)":"none"}" stroke="${sel?"#2a6fdb":c}" stroke-width="${ch||sel?.9:.35}" ${ch?"":'stroke-dasharray="1 .8"'}/>`;
    if(j==="del"&&ch)s+=`<path d="M${R.cx-R.r} ${R.cy-R.r}L${R.cx+R.r} ${R.cy+R.r}" stroke="${c}" stroke-width=".7"/>`;
    const PB=exPhotoBox(n,row);if(PB)s+=`<text x="${PB.x.toFixed(2)}" y="${PB.y.toFixed(2)}" font-size="${PB.size.toFixed(2)}" font-weight="700" fill="${S.opt.stNew}" stroke="#fff" stroke-width="${(PB.size*.25).toFixed(2)}" paint-order="stroke">${esc(PB.t)}</text>${sel?`<rect x="${PB.box.x.toFixed(2)}" y="${PB.box.y.toFixed(2)}" width="${PB.box.w.toFixed(2)}" height="${PB.box.h.toFixed(2)}" fill="none" stroke="#2a6fdb" stroke-width=".4" stroke-dasharray="1.2 .8"/>`:""}`;
    const tag=ch?exTag(n,row):"";if(tag)s+=`<text x="${(R.cx-R.r).toFixed(2)}" y="${(R.cy-R.r-1).toFixed(2)}" font-size="${fs*.9}" font-weight="700" fill="${c}" stroke="#fff" stroke-width="${fs*.22}" paint-order="stroke">${esc(tag)}</text>`}
  return s}
function redraw(){const pg=page();let s=exSVG(S.n);for(const it of pg.items)s+=itemSVG(it);s+=`<g id="live"></g>`;ov.innerHTML=s;
  {const sc=scaleXY(pg);$("#scaleTag").textContent=(sc?(Math.abs(sc[0]-sc[1])<1e-9?`축척 1pt = ${fmt(r2(sc[0]*1000))}mm`:`축척 가로 1pt=${fmt(r2(sc[0]*1000))}mm · 세로 1pt=${fmt(r2(sc[1]*1000))}mm`)+(S.opt.toScale?" · 수량대로 그리기 켜짐":""):"축척 미설정 — 수량대로 그리려면 축척 도구로 설정")+` · 이번 조사 ${S.opt.curYear}`}
  renderPanel();renderSelbar();markThumb(S.n)}

/* ---------- camera ---------- */
const viewer=$("#viewer"),stage=$("#stage");
function applyCam(){stage.style.transform=`translate(${S.tx}px,${S.ty}px) scale(${S.z})`;scheduleHiRes()}
function fit(){const r=viewer.getBoundingClientRect();const z=Math.min((r.width-24)/S.W,(r.height-24)/S.H);S.z=z;S.tx=(r.width-S.W*z)/2;S.ty=(r.height-S.H*z)/2;applyCam()}
function toPage(cx,cy){const r=viewer.getBoundingClientRect();return[(cx-r.left-S.tx)/S.z,(cy-r.top-S.ty)/S.z]}
function zoomAt(cx,cy,f){const r=viewer.getBoundingClientRect();const p=toPage(cx,cy);S.z=Math.max(.15,Math.min(24,S.z*f));S.tx=cx-r.left-p[0]*S.z;S.ty=cy-r.top-p[1]*S.z;applyCam()}
function centerOn(x,y,minZ){const v=viewer.getBoundingClientRect();if(S.z<minZ)S.z=minZ;S.tx=v.width/2-x*S.z;S.ty=v.height/2-y*S.z;applyCam()}

/* ---------- PDF rendering ---------- */
let hiT;function scheduleHiRes(){clearTimeout(hiT);hiT=setTimeout(()=>{const want=targetScale();if(!S.renderScale||Math.abs(want-S.renderScale)/S.renderScale>.25)renderPdf(want)},220)}
function targetScale(){const dpr=window.devicePixelRatio||1;const cap=Math.sqrt(15e6/(S.W*S.H));return Math.max(.5,Math.min(S.z*dpr,cap))}
let renderSeq=0;
async function renderPdf(scale){if(!S.pdf)return;const seq=++renderSeq;S.mainBusy=true;setTimeout(()=>{if(seq===renderSeq)S.mainBusy=false},4000);$("#busy").textContent="도면 그리는 중…";
  try{const pg=await S.pdf.getPage(S.n);if(seq!==renderSeq)return;const vp=pg.getViewport({scale});
    const cv=document.createElement("canvas");cv.width=Math.floor(vp.width);cv.height=Math.floor(vp.height);
    if(S.renderTask){try{S.renderTask.cancel()}catch(e){}}
    S.renderTask=pg.render({canvasContext:cv.getContext("2d"),viewport:vp,background:"#ffffff"});await S.renderTask.promise;
    if(seq!==renderSeq)return;const old=stage.querySelector("canvas");if(old)old.remove();stage.insertBefore(cv,ov);S.renderScale=scale;S.mainBusy=false;$("#busy").textContent=""}
  catch(e){S.mainBusy=false;if(e&&e.name==="RenderingCancelledException")return;$("#busy").textContent="";console.error(e)}}
async function gotoPage(n,keepCam){if(!S.pdf)return;n=Math.max(1,Math.min(S.count,n|0||1));commitLabel();S.n=n;S.sel=null;S.selEx=null;
  const pg=await S.pdf.getPage(n);const vp=pg.getViewport({scale:1});S.W=vp.width;S.H=vp.height;
  stage.style.width=S.W+"px";stage.style.height=S.H+"px";ov.setAttribute("width",S.W);ov.setAttribute("height",S.H);ov.setAttribute("viewBox",`0 0 ${S.W} ${S.H}`);
  $("#pgIn").value=n;$("#pgCnt").textContent="/ "+S.count;thCurrent(n);if(S.cur&&S.cur.lastPage!==n){S.cur.lastPage=n;libSave()}$("#lblIn").value=page().label||"";
  if(!keepCam)fit();redraw();S.renderScale=0;await renderPdf(Math.min(targetScale(),1.5));scheduleHiRes();
  await ensureEx(n);if(S.n===n&&!S.isSample&&S.doc.tag===undefined&&!S.tagHinted&&S.ex[n].rows.some(r=>r.fromLabel&&r.yr)){S.tagHinted=true;toast("이 망도는 ['25,상]처럼 조사 표기를 씁니다. 설정 → '이 망도 라벨 표기'에서 고르세요",5000)}
  if(S.n===n){if(!page().label){const t=S.ex[n].title;if(t){$("#lblIn").placeholder=t}}redraw()}}
let lblDirty=false;function commitLabel(){if(!S.pdf||!lblDirty)return;lblDirty=false;const v=$("#lblIn").value.trim();const p=page();if((p.label||"")!==v){p.label=v;autosave()}}
const pageLabel=n=>(S.doc.pages[n]&&S.doc.pages[n].label)||(S.ex[n]&&S.ex[n].title)||"";

/* ---------- undo (per page: items + existing judgments) ---------- */
const pstate=()=>JSON.stringify({items:page().items,exj:page().exj,exq:page().exq,exp:page().exp,expo:page().expo||{}});
function restore(s){const o=JSON.parse(s);const p=page();p.items=o.items;p.exj=o.exj||{};p.exq=o.exq||{};p.exp=o.exp||{};p.expo=o.expo||{}}
function snap(){const k=S.n;(S.undo[k]=S.undo[k]||[]).push(pstate());if(S.undo[k].length>80)S.undo[k].shift();S.redo[k]=[]}
function undo(){const k=S.n,u=S.undo[k];if(!u||!u.length)return toast("되돌릴 작업이 없습니다");(S.redo[k]=S.redo[k]||[]).push(pstate());restore(u.pop());S.sel=null;S.selEx=null;redraw();autosave()}
function redo(){const k=S.n,r=S.redo[k];if(!r||!r.length)return;S.undo[k].push(pstate());restore(r.pop());redraw();autosave()}

/* ---------- pointer input ---------- */
const touches=new Map();let gest=null,draw=null,lastPen=0,lpT=null,spaceDown=false;
const LP_MS=450;
function liveSet(html){const g=ov.querySelector("#live");if(g)g.innerHTML=html}
viewer.addEventListener("contextmenu",e=>e.preventDefault());
viewer.addEventListener("pointerdown",e=>{
  if(!S.pdf)return;hideMenu();
  const isPen=e.pointerType==="pen";if(isPen)lastPen=Date.now();
  const barrel=isPen&&(e.button===2||e.button===5||(e.buttons&2));
  if(barrel||(e.pointerType==="mouse"&&e.button===2)){openMenu(e.clientX,e.clientY,toPage(e.clientX,e.clientY));return}
  const fingerOK=e.pointerType==="touch"&&S.opt.fingerDraw&&Date.now()-lastPen>1500;
  const canDraw=isPen||(e.pointerType==="mouse"&&e.button===0&&!spaceDown)||fingerOK;
  if(e.pointerType==="touch"&&draw&&draw.isPen)return;
  try{viewer.setPointerCapture(e.pointerId)}catch(err){}
  if(canDraw&&(isPen||touches.size===0)){if(isPen&&touches.size){touches.clear();gest=null}startDraw(e);return}
  if(draw&&e.pointerType==="touch")cancelDraw();
  touches.set(e.pointerId,[e.clientX,e.clientY]);startGesture()});
viewer.addEventListener("pointermove",e=>{
  if(touches.has(e.pointerId)){touches.set(e.pointerId,[e.clientX,e.clientY]);moveGesture();return}
  if(draw&&draw.pid===e.pointerId){const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];for(const ev of (evs.length?evs:[e]))moveDraw(ev)}});
viewer.addEventListener("pointerup",e=>{if(touches.has(e.pointerId)){touches.delete(e.pointerId);startGesture();return}if(draw&&draw.pid===e.pointerId)endDraw(e)});
viewer.addEventListener("pointercancel",e=>{if(draw&&draw.pid===e.pointerId)cancelDraw();touches.delete(e.pointerId);startGesture()});
viewer.addEventListener("wheel",e=>{e.preventDefault();if(e.ctrlKey||!e.shiftKey)zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*.0015));else{S.tx-=e.deltaX||e.deltaY;applyCam()}},{passive:false});
function startGesture(){const p=[...touches.values()];if(!p.length){gest=null;return}
  if(p.length===1)gest={m:p[0],tx:S.tx,ty:S.ty,z:S.z,d:0};
  else{const m=[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2];gest={m,tx:S.tx,ty:S.ty,z:S.z,d:dist(p[0],p[1])}}}
function moveGesture(){if(!gest)return;const p=[...touches.values()];const r=viewer.getBoundingClientRect();
  if(p.length===1){S.tx=gest.tx+p[0][0]-gest.m[0];S.ty=gest.ty+p[0][1]-gest.m[1]}
  else if(p.length>=2&&gest.d){const m=[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2];const z=Math.max(.15,Math.min(24,gest.z*dist(p[0],p[1])/gest.d));
    const px=(gest.m[0]-r.left-gest.tx)/gest.z,py=(gest.m[1]-r.top-gest.ty)/gest.z;S.z=z;S.tx=m[0]-r.left-px*z;S.ty=m[1]-r.top-py*z}
  applyCam()}
const inBox=(p,b,pad=2)=>p[0]>=b.x-pad&&p[0]<=b.x+b.w+pad&&p[1]>=b.y-pad&&p[1]<=b.y+b.h+pad;
function curTool(){return S.armed?"damage":S.tool}
function startDraw(e){const p=toPage(e.clientX,e.clientY);const tool=curTool();
  draw={pid:e.pointerId,isPen:e.pointerType==="pen",tool,pts:[p],sx:e.clientX,sy:e.clientY,moved:false,drag:null};
  if(tool==="pen"||tool==="damage"){clearTimeout(lpT);lpT=setTimeout(()=>{if(draw&&!draw.moved){const d=draw;draw=null;liveSet("");openMenu(d.sx,d.sy,d.pts[0])}},LP_MS)}
  if(S.rs){const it=page().items.find(i=>i.id===S.rs.id);if(it){const lb=labelBox(it),hx=lb.x+lb.w+1,hy=lb.y+lb.h+1;
      if(dist(p,[hx,hy])<14/S.z||inBox(p,lb)){draw.rsz={it,x0:lb.x,w0:lb.w+1,ls0:it.ls||1};return}}
    draw=null;return}
  if(tool==="select"){const sel=page().items.find(i=>i.id===S.sel);
    if(sel&&sel.kind==="damage"&&inBox(p,labelBox(sel))){snap();draw.drag={it:sel,off:[sel.lp[0]-p[0],sel.lp[1]-p[1]]};return}
    for(const row of exRows(S.n)){const PB=exPhotoBox(S.n,row);if(PB&&inBox(p,PB.box,1.5)){snap();const pg=page();pg.expo=pg.expo||{};S.sel=null;S.selEx=row.no;draw.dragPh={no:row.no,off0:(pg.expo[row.no]||[0,0]).slice(),p0:p};redraw();return}}
    const hit=hitTest(p);S.sel=null;S.selEx=null;
    if(hit&&hit.ex){S.selEx=hit.ex.no}
    else if(hit){S.sel=hit.id;if(hit.kind==="damage"&&inBox(p,labelBox(hit))){snap();draw.drag={it:hit,off:[hit.lp[0]-p[0],hit.lp[1]-p[1]]}}}
    redraw()}
  if(tool==="erase"){draw.erased=false;eraseAt(p)}}
function moveDraw(e){const p=toPage(e.clientX,e.clientY);if(!draw)return;
  if(!draw.moved&&Math.hypot(e.clientX-draw.sx,e.clientY-draw.sy)>7){draw.moved=true;clearTimeout(lpT)}
  draw.pts.push(p);const t=draw.tool;if(draw.dragPh){const D=draw.dragPh;page().expo[D.no]=[r2(D.off0[0]+p[0]-D.p0[0]),r2(D.off0[1]+p[1]-D.p0[1])];redraw();return}if(draw.rsz){const R=draw.rsz;R.it.ls=r2(Math.max(.3,Math.min(4,R.ls0*Math.max(.05,(p[0]-R.x0))/R.w0)));redraw();return}
  if(t==="pen")liveSet(`<path d="${pathD(draw.pts)}" fill="none" stroke="${S.opt.inkColor}" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"/>`);
  else if(t==="damage"){const ty=libById(S.armed),c=S.opt.stNew;
    if(ty.geom==="area"&&!isClosed(draw.pts)){const b=bbox([draw.pts[0],p]);liveSet(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-width=".6" stroke-dasharray="2 1"/><path d="${pathD(draw.pts)}" fill="none" stroke="${c}" stroke-width=".35" opacity=".5"/>`)}
    else liveSet(`<path d="${pathD(draw.pts)}" fill="none" stroke="${c}" stroke-width="${ty.geom==="line"?.8:.5}" stroke-linecap="round"/>`)}
  else if(t==="scale")liveSet(`<path d="M${draw.pts[0][0]} ${draw.pts[0][1]}L${p[0]} ${p[1]}" stroke="#2a6fdb" stroke-width=".8"/><circle cx="${draw.pts[0][0]}" cy="${draw.pts[0][1]}" r="1.2" fill="#2a6fdb"/><circle cx="${p[0]}" cy="${p[1]}" r="1.2" fill="#2a6fdb"/>`);
  else if(t==="erase")eraseAt(p);
  else if(draw.rsz){const R=draw.rsz;const f=Math.max(.3,Math.min(4,R.ls0*Math.max(.05,(p[0]-R.x0))/R.w0));R.it.ls=r2(f);redraw();return}
  else if(t==="select"&&draw.drag){draw.drag.it.lp=round([[p[0]+draw.drag.off[0],p[1]+draw.drag.off[1]]])[0];redraw()}}
function isClosed(pts){if(pts.length<8)return false;const L=polyLen(pts);return L>20/S.z&&dist(pts[0],pts[pts.length-1])<Math.max(10/S.z,L*.12)}
function cancelDraw(){clearTimeout(lpT);draw=null;liveSet("")}
function endDraw(){clearTimeout(lpT);const d=draw;draw=null;if(!d)return;if(d.rsz){redraw();return}if(d.dragPh){redraw();autosave();return}const t=d.tool;liveSet("");const tol=0.35/S.z;
  if(t==="pen"){if(d.pts.length<2&&!d.moved)return;snap();page().items.push({id:uid(),kind:"ink",pts:round(rdp(d.pts,tol)),color:S.opt.inkColor,w:0.7});redraw();autosave()}
  else if(t==="damage"){const ty=libById(S.armed);let pts;
    if(ty.geom==="point")pts=[d.pts[0]];
    else if(ty.geom==="line"){if(!d.moved)return;pts=round(rdp(d.pts,tol))}
    else{/* 면 손상은 항상 네모(사각 테두리) */let b;
      if(!d.moved){const s=6;const[x,y]=d.pts[0];b={x:x-s,y:y-s,x2:x+s,y2:y+s}}
      else if(isClosed(d.pts))b=bbox(d.pts);
      else{b=bbox([d.pts[0],d.pts[d.pts.length-1]]);if(b.w<1||b.h<1)return}
      pts=round([[b.x,b.y],[b.x2,b.y],[b.x2,b.y2],[b.x,b.y2]])}
    newDamage(ty,pts)}
  else if(t==="scale"){if(!d.moved)return;askScale(d.pts[0],d.pts[d.pts.length-1])}
  else if(t==="erase"){if(d.erased){redraw();autosave()}}
  else if(t==="select"&&d.drag){redraw();autosave()}}
function hitTest(p,itemsOnly){const tol=9/S.z;const its=page().items;
  for(let i=its.length-1;i>=0;i--){const it=its[i];if(it.kind==="ink"){if(polyDist(p,it.pts)<tol)return it;continue}
    if(it.kind!=="damage")continue;if(inBox(p,labelBox(it),0))return it;
    const g=libById(it.type).geom;if(g==="area"&&inPoly(p,it.pts))return it;if(polyDist(p,g==="area"?it.pts.concat([it.pts[0]]):it.pts)<tol)return it}
  if(!itemsOnly&&S.opt.showEx)for(const row of exRows(S.n)){const R=exRing(S.n,row);if(R&&dist(p,[R.cx,R.cy])<R.r+tol*.6)return{ex:row}}
  return null}
function eraseAt(p){const hit=hitTest(p,true);if(!hit)return;if(!draw.erased){snap();draw.erased=true}page().items=page().items.filter(i=>i!==hit);if(S.sel===hit.id)S.sel=null;redraw()}

/* ---------- damage menu (grouped by unit) ---------- */
const dmenu=$("#dmenu");let menuAnchor=null,menuMode="new";
let menuXY=[0,0];
function placeMenu(cx,cy){dmenu.hidden=false;const w=dmenu.offsetWidth,hh=dmenu.offsetHeight;
  dmenu.style.left=Math.max(8,Math.min(cx+12,innerWidth-w-8))+"px";dmenu.style.top=Math.max(8,Math.min(cy-20,innerHeight-hh-8))+"px"}
function memPickerHTML(){const k=kindNow();let h=`<div class="mh"><span>부재위치 먼저 선택</span><em>다음 손상부터 자동</em></div>
  <div class="kseg"><button data-kind="bridge" class="${k==="bridge"?"on":""}">교량</button><button data-kind="tunnel" class="${k==="tunnel"?"on":""}">터널</button></div>`;
  if(!k)return h+`<p class="mhelp">이 구조물이 교량인지 터널인지 먼저 고르세요. 한 번 고르면 구조물에 저장됩니다.</p>`;
  memList(k).forEach((m,i)=>h+=`<button data-mem="${esc(m)}" class="${S.doc.mem===m?"on":""}"><span class="k">${CIRC[i]||i+1}</span><span>${esc(m)}</span></button>`);
  return h+`<button data-memadd="1"><span class="k">${CIRC[memList(k).length]||"+"}</span><span>＋ 부재 직접 추가</span></button>`}
function openMenu(cx,cy,anchor,mode="new",forceMem){menuAnchor=anchor;menuMode=mode;menuXY=[cx,cy];
  if(mode==="new"&&(forceMem||!S.doc.mem)){dmenu.innerHTML=memPickerHTML();placeMenu(cx,cy);return}
  let h="";let k=0;
  if(mode==="new")h+=`<div class="mh memh"><span>부재 <b>${esc(S.doc.mem)}</b></span><span><button data-kswap="1" title="교량/터널 바꾸기">${kindNow()==="bridge"?"교량":"터널"} ⇄</button> <button data-memchg="1">변경</button></span></div><div class="mh memt"><button data-memshow="1">${S.opt.showMem?"☑":"☐"} 도면에 부재위치 표시 (화면만)</button></div>`;
  const rec=S.recent.map(id=>S.lib.find(t=>t.id===id)).filter(Boolean).slice(0,3);
  if(rec.length&&mode==="new"){h+=`<div class="mh">최근</div>`;rec.forEach(t=>h+=menuBtn(t,""))}
  for(const g of UNITS){const ts=S.lib.filter(t=>!t.custom&&(t.unit||UNIT[t.geom])===g);if(!ts.length)continue;
    h+=`<div class="mh"><span>${UNIT_TITLE[g]}</span><em>${g}</em></div>`;ts.forEach(t=>{k++;h+=menuBtn(t,k<=9?String(k):"")})}
  const cu=S.lib.filter(t=>t.custom);h+=`<div class="mh"><span>신규손상 (직접 등록)</span><em>${cu.length}</em></div>`;cu.forEach(t=>h+=menuBtn(t,""));
  h+=`<button data-newdmg="1"><span class="k">＋</span><span>신규손상 이름 등록</span></button>`;
  dmenu.innerHTML=h;placeMenu(cx,cy)}
function menuOrder(){return UNITS.flatMap(g=>S.lib.filter(t=>!t.custom&&(t.unit||UNIT[t.geom])===g))}
function textModal(title,label,ph,onOk,extra){modal(title,`<label class="fld2">${label}<input id="tmIn" placeholder="${esc(ph||"")}"></label>${extra||""}<div class="mact"><button class="btn" id="tmCx">취소</button><button class="btn primary" id="tmOk">등록</button></div>`);
  const inp=$("#tmIn");setTimeout(()=>inp.focus(),60);const ok=()=>{const v=inp.value.trim();if(!v)return toast("이름을 입력하세요");if(onOk(v)!==false)closeModal()};
  $("#tmOk").onclick=ok;$("#tmCx").onclick=closeModal;inp.onkeydown=e=>{if(e.key==="Enter")ok()}}
function addMember(after){const k=kindNow();if(!k)return toast("교량/터널을 먼저 고르세요");
  textModal(`부재 직접 추가 · ${k==="bridge"?"교량":"터널"}`,"부재 이름","예: 중앙분리대",v=>{const ex=S.opt.memExtra[k]=S.opt.memExtra[k]||[];if(!MEMBERS[k].includes(v)&&!ex.includes(v))ex.push(v);saveOpt();S.doc.mem=v;autosave();if(after)after(v)})}
function registerDamage(){let u="㎡";
  textModal("신규손상 이름 등록","손상 이름 (물량표 명칭)","예: 들뜸",v=>{if(S.lib.find(t=>t.name===v)){toast("같은 이름이 이미 있습니다");return false}
    const geom=u==="m"?"line":u==="EA"?"point":"area";const t={id:"u"+uid(),name:v,short:v,geom,unit:u,hatch:geom==="area"?"grid":geom==="line"?"plain":"x",widths:geom==="line"?"0.1,0.2,0.3":"",shape:geom==="area"?"rect":"",custom:true};
    S.lib.push(t);sv("mdn.lib3",S.lib);setTimeout(()=>chooseType(t.id),0)},
    `<div class="fld2">단위 <span class="st" id="tmU">${UNITS.map(x=>`<button class="btn ${x===u?"on":""}" data-u="${x}">${x}</button>`).join("")}</span></div><p class="help">㎡는 박리·박락 해치(격자) 네모로 그려집니다. m는 선, EA는 점입니다. 등록한 손상은 메뉴 맨 아래 '신규손상'에 나오고, 단위는 수량 입력 때 바꿀 수 있습니다.</p>`);
  $("#tmU").onclick=e=>{const b=e.target.closest("[data-u]");if(!b)return;u=b.dataset.u;$("#tmU").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b))}}
function menuBtn(t,k){return `<button data-t="${t.id}"><span class="k">${k}</span>${swatchSVG(t)}<span>${esc(t.name)}</span></button>`}
function hideMenu(){dmenu.hidden=true}
dmenu.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const D=b.dataset;
  if(D.kind){setKind(D.kind);dmenu.innerHTML=memPickerHTML();placeMenu(...menuXY);return}
  if(D.mem!=null){S.doc.mem=D.mem;autosave();openMenu(menuXY[0],menuXY[1],menuAnchor,"new");return}
  if(D.memshow){S.opt.showMem=!S.opt.showMem;saveOpt();redraw();openMenu(menuXY[0],menuXY[1],menuAnchor,"new");return}
  if(D.kswap){hideMenu();kindSwap();return}
  if(D.memchg){openMenu(menuXY[0],menuXY[1],menuAnchor,"new",true);return}
  if(D.memadd){hideMenu();addMember(()=>openMenu(menuXY[0],menuXY[1],menuAnchor,"new"));return}
  if(D.newdmg){hideMenu();registerDamage();return}
  if(D.t)chooseType(D.t)});
function chooseType(id){hideMenu();const t=libById(id);S.recent=[id,...S.recent.filter(x=>x!==id)].slice(0,5);sv("mdn.recent2",S.recent);
  if(menuMode==="change"){const it=page().items.find(i=>i.id===S.sel);if(!it)return;const ot=libById(it.type);
    if(ot.geom!==t.geom)return toast(`그리는 방식이 다른 손상(${GEOMS[ot.geom]}→${GEOMS[t.geom]})으로는 바꿀 수 없습니다`);snap();it.type=id;redraw();autosave();return}
  if(t.geom==="point"&&menuAnchor){newDamage(t,[round([menuAnchor])[0]]);return}
  arm(id)}
function arm(id,label,hint){S.armed=id;const t=libById(id);$("#armedTx").textContent=label||t.name;$("#armed").classList.add("show");if(hint){toast(hint,4500);return}
  toast(t.geom==="line"?`${t.name}: 손상 선을 따라 그리세요`:`${t.name}: 범위를 대각선으로 끌거나, 둘레를 한 바퀴 그리세요`,3000)}
function disarm(){S.armed=null;S.armedInc=null;$("#armed").classList.remove("show")}
$("#bDisarm").onclick=disarm;
$("#bMenu").onclick=e=>{const r=e.currentTarget.getBoundingClientRect();const v=viewer.getBoundingClientRect();openMenu(r.left-200,r.bottom+4,toPage(v.left+v.width/2,v.top+v.height/2))};
document.addEventListener("pointerdown",e=>{if(!dmenu.hidden&&!dmenu.contains(e.target)&&!e.target.closest("#bMenu,#sType"))hideMenu()},true);

/* ---------- scale helpers (가로 sx · 세로 sy, m per pt) ---------- */
function scaleXY(p){p=p||page();const sx=p.sx||p.scale||p.sy||0,sy=p.sy||p.scale||p.sx||0;return sx&&sy?[sx,sy]:null}
function realLen(pts,sc){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot((pts[i][0]-pts[i-1][0])*sc[0],(pts[i][1]-pts[i-1][1])*sc[1]);return L}
/* 입력한 수량대로 도형 크기를 축척에 맞춤 (CAD로 옮길 때 다시 그릴 필요 없게) */
function fitToScale(it,resetLabel){if(!S.opt.toScale||it.kind!=="damage")return false;const sc=scaleXY();if(!sc)return false;const g=libById(it.type).geom,u=unitOf(it);const an0=anchorOf(it);
  if(g==="area"&&u==="㎡"){const a=+it.a,b=+it.b;if(!(a>0&&b>0))return false;const B=bbox(it.pts),cx=B.x+B.w/2,cy=B.y+B.h/2;
    const W=Math.max(.6,a/sc[0]),H=Math.max(.6,b/sc[1]);
    if(B.w<.01||B.h<.01)it.pts=[[cx-W/2,cy-H/2],[cx+W/2,cy-H/2],[cx+W/2,cy+H/2],[cx-W/2,cy+H/2]];
    else{const kx=W/B.w,ky=H/B.h;it.pts=it.pts.map(([x,y])=>[cx+(x-cx)*kx,cy+(y-cy)*ky])}}
  else if(g==="line"&&u==="m"){const L=+it.L;const RL=realLen(it.pts,sc);if(!(L>0&&RL>0))return false;const k=L/RL,p0=it.pts[0];it.pts=it.pts.map(([x,y])=>[p0[0]+(x-p0[0])*k,p0[1]+(y-p0[1])*k])}
  else return false;
  it.pts=round(it.pts);const an1=anchorOf(it);if(resetLabel){const fs=FSb();it.lp=[r2(an1[0]+fs*.5),r2(an1[1]-fs*.4)]}else it.lp=[r2(it.lp[0]+an1[0]-an0[0]),r2(it.lp[1]+an1[1]-an0[1])];return true}

/* ---------- quantity sheet ---------- */
const qty=$("#qty");let Q=null;
function newDamage(t,pts){const pg=page();const fs=FSb();
  const it={id:uid(),kind:"damage",type:t.id,no:nextNo(),by:S.opt.by||"",t:Date.now(),pts,st:"new",yr:String(S.opt.curYear),w:"",L:"",a:"",b:"",n:1,lp:[0,0]};
  const sc=scaleXY(pg);
  const INC=S.armedInc;
  const U=t.unit||UNIT[t.geom];
  if(U==="m"){const ws=(t.widths||"").split(",").map(s=>s.trim()).filter(Boolean);it.w=ws.length?ws[0]:"";if(sc&&t.geom==="line")it.L=fmt(Math.max(.1,Math.round(realLen(pts,sc)*10)/10))}
  if(U==="㎡"&&t.geom==="area"&&sc){const b=bbox(pts);it.a=fmt(Math.max(.1,Math.round(b.w*sc[0]*10)/10));it.b=fmt(Math.max(.1,Math.round(b.h*sc[1]*10)/10))}
  it.mem=S.doc.mem||"";
  if(INC&&INC.chg){it.no=INC.no;it.chg=INC.no;it.st="chg";if(INC.tname)it.tname=INC.tname;for(const k of["w","L","a","b","n"])if(INC.q[k]!=null&&INC.q[k]!=="")it[k]=INC.q[k]}
  else if(INC){it.prog=INC.no;if(INC.tname)it.tname=INC.tname;for(const k of["w","L","a","b","n"])if(INC.inc[k]!=null&&INC.inc[k]!=="")it[k]=INC.inc[k]}
  const an=anchorOf(it);it.lp=[r2(an[0]+fs*.5),r2(an[1]-fs*.4)];
  if(lastPhoto()&&S.opt.autoPhoto!==false)it.ph=String(lastPhoto()+1);
  liveSet(itemSVG(it));openQty(it,"new");if(it.ph){Q.phAuto=it.ph;renderQty()}}
function fieldsOf(it){const g=it.kind==="exq"?libById(it.type).geom:({m:"line","㎡":"area",EA:"point"})[unitOf(it)];let f;
  const T=it.kind==="damage"?typeOf(it):{};
  if(g==="line")f=[["w",T.cw||/균열/.test(T.name||"")?"Cw 폭 (mm)":"폭 (mm)"],["L","길이 (m)"]];else if(g==="area")f=[["a","가로 (m)"],["b","세로 (m)"]];else f=[];
  if(T.cw&&g!=="line")f.push(["cw","Cw 균열폭 (mm)"]);if(T.depth)f.push(["T","깊이 T (mm)"]);
  f.push(["n",g==="point"?"개소 (EA)":"개소"]);
  if(it.kind==="damage"){f=[["mem","부재위치"]].concat(f);f.push(["gr","상태등급"])}
  if(it.kind==="damage"&&it.st!=="new"&&it.st!=="chg")f=[["yr","적출년도"]].concat(f);if(it.kind==="damage"||it.kind==="photo")f=it.kind==="photo"?[["ph","사진번호 (#)"]]:f.concat([["ph","사진번호 #"]]);return f}
function openQty(it,mode,row){Q={it,mode,row,f:fieldsOf(it)[0][0],orig:JSON.stringify(it),fresh:true,pre:pstate()};
  const u=unitOf(it);if(mode==="new")Q.f=u==="m"?(libById(it.type).widths?"w":"L"):u==="㎡"?"a":"n";renderQty();qty.hidden=false}
function renderQty(){const it=Q.it,t=typeOf(it),isEx=Q.mode==="ex";
  const flds=fieldsOf(it);if(!flds.find(f=>f[0]===Q.f))Q.f=flds[0][0];
  let chips=Q.f==="mem"?memList().concat(["＋ 직접 추가"]):Q.f==="gr"?["a","b","c","d","e","없음"]:Q.f==="cw"?["0.1","0.2","0.3","0.5"]:Q.f==="T"?["5","10","20","30","50"]:Q.f==="ph"?phChips().concat(["없음"]):Q.f==="w"?(t.widths||"0.1,0.2,0.3").split(",").map(s=>s.trim()).filter(Boolean):Q.f==="n"?["1","2","3","4","5","6"]:Q.f==="yr"?knownYears():GEN_CHIPS.map(String);
  const isPh=Q.mode==="photo";
  const title=isPh?`${Q.row.no}. ${esc(Q.row.name)} <small style="color:var(--muted);font-weight:400">기존 손상 사진번호</small>`:isEx?`${Q.row.no}. ${esc(Q.row.name)} <small style="color:var(--muted);font-weight:400">${esc(Q.row.yr)} 적출 · 변경 후 전체 물량 입력</small>`:`${it.no?it.no+". ":""}${esc(t.name)}`;
  const qv=isPh?{v:"",u:""}:isEx?rowQty(Q.row,it):qtyValue(it),qt=isPh?"":isEx?rowQtyText(Q.row,it):qtyText(it);
  qty.innerHTML=`<div class="qh"><h4>${title}</h4>${isEx||isPh?"":it.st==="chg"?`<div class="st"><button class="on" style="background:${S.opt.stChg||"#f08c00"}">변경 · 기존 ${it.chg}번</button></div>`:`<div class="st">${STATUS.map(([k,n])=>{const c=k==="old"?yearColor(it.yr):k==="rep"?S.opt.stRep:S.opt.stNew;return `<button data-st="${k}" class="${it.st===k?"on":""}" style="${it.st===k?`background:${c}`:`color:${c}`}">${n}</button>`}).join("")}</div>`}</div>
  ${!isEx&&!isPh?`<div class="yrrow">${it.st==="new"?`적출년도 <b>${esc(it.yr||S.opt.curYear)}</b> (이번 조사)`:it.st==="chg"?`<b>${esc(tagText(it))}</b> · 번호 ${it.chg} 그대로`:""}<span class="sp" style="flex:1"></span>단위 <span class="st">${UNITS.map(u=>`<button data-u="${u}" class="${unitOf(it)===u?"on":""}" style="${unitOf(it)===u?"background:var(--ink);color:var(--chrome)":""}">${u}</button>`).join("")}</span></div>`:""}
  <div class="fields">${flds.map(([k,l])=>{const auto=k==="ph"&&Q.phAuto&&it.ph===Q.phAuto;return `<div class="fld ${Q.f===k?"on":""}" data-f="${k}"><small>${l}${auto?` <b style="color:var(--focus)">자동 제안 · 다르면 눌러서 수정</b>`:""}</small><span ${auto?'style="color:var(--focus)"':""}>${esc(String(it[k]??""))}</span></div>`}).join("")}</div>
  <div class="chips">${chips.map(c=>`<button data-c="${c}">${c}</button>`).join("")}<span class="sp"></span><span class="prev">표기 <b>${esc(qt)}</b> · 물량 ${qv.v}${qv.u}${it.ph?` · <b>${esc(phText(it.ph))}</b>`:""}</span></div>
  ${Q.f==="gr"?gradeBox(it):Q.f==="mem"&&!kindNow()?`<p class="help" style="margin:4px 2px">교량/터널 종류가 정해지지 않았습니다. 손상을 길게 눌러 메뉴 위쪽에서 고르세요.</p>`:""}
  <div class="pad">${["7","8","9","⌫","4","5","6","C","1","2","3","→","0",".","취소","확인"].map(k=>`<button data-k="${k}" class="${k==="확인"?"ok":k==="취소"||k==="→"||k==="C"?"cx":""}">${k==="."&&Q.f==="ph"?",":k}</button>`).join("")}</div>`;
  if(Q.mode==="new")liveSet(itemSVG(it));else redraw()}
qty.addEventListener("click",e=>{const b=e.target.closest("button,.fld");if(!b||!Q)return;const it=Q.it;
  if(b.dataset.u){const t=libById(it.type);it.u=b.dataset.u===(t.unit||UNIT[t.geom])?"":b.dataset.u;Q.f=fieldsOf(it)[0][0];if(Q.f==="yr")Q.f=fieldsOf(it)[1][0];Q.fresh=true;return renderQty()}
  if(b.dataset.st){it.st=b.dataset.st;if(it.st==="new")it.yr=String(S.opt.curYear);else if(String(it.yr)===String(S.opt.curYear)){const ys=knownYears().filter(y=>y!==String(S.opt.curYear));it.yr=ys.length?ys[ys.length-1]:""}return renderQty()}
  if(b.dataset.f){Q.f=b.dataset.f;Q.fresh=true;return renderQty()}
  if(b.dataset.c&&Q.f==="mem"){const v=b.dataset.c;if(v==="＋ 직접 추가"){addMember(m=>{if(Q){Q.it.mem=m;renderQty()}});return}it.mem=v;S.doc.mem=v;Q.fresh=true;return renderQty()}
  if(b.dataset.c&&Q.f==="gr"){it.gr=b.dataset.c==="없음"?"":b.dataset.c;Q.fresh=true;return renderQty()}
  if(b.dataset.c){if(Q.f==="ph"){const v=b.dataset.c==="없음"?"":b.dataset.c;it.ph=Q.fresh||!it.ph||!v?v:it.ph+","+v;Q.fresh=false;return renderQty()}it[Q.f]=b.dataset.c;Q.fresh=false;nextField();return renderQty()}
  const k=b.dataset.k;if(!k)return;let v=String(it[Q.f]??"");
  if(k==="확인")return commitQty();if(k==="취소")return cancelQty();
  if(k==="→"){nextField(true);return renderQty()}
  if(Q.f==="mem"||Q.f==="gr"){if(k==="⌫"||k==="C"){it[Q.f]="";renderQty()}return}
  if(k==="⌫")v=v.slice(0,-1);else if(k==="C")v="";else if(Q.f==="ph"){if(Q.fresh)v="";if(k==="."){if(!v||v.endsWith(","))return;v+=","}else v+=k}
  else{if(Q.fresh)v="";if(k==="."&&(v.includes(".")||Q.f==="yr"||Q.f==="n"))return;v=(v===""&&k===".")?"0.":v+k}
  Q.fresh=false;it[Q.f]=Q.f==="n"?(v===""?"":parseInt(v)||""):v;renderQty()});
function gradeBox(it){const G=gradeInfo(it);if(!G)return `<p class="help" style="margin:4px 2px">이 손상은 세부지침 요약 기준이 없습니다. 판단한 등급을 고르세요.</p>`;
  return `<div class="grd"><small>${esc(G.title)}${kindNow()?"":" · 종류 미지정(터널 기준)"}</small>${G.d.map((d,i)=>{const g="abcde"[i];return `<button data-c="${g}" class="${it.gr===g?"on":""}"><b>${g}</b> ${esc(d)}</button>`}).join("")}</div>`}
function nextField(force){const f=fieldsOf(Q.it).map(x=>x[0]);const i=f.indexOf(Q.f);if(force||i<f.length-1){Q.f=f[(i+1)%f.length];Q.fresh=true}}
function commitQty(){const it=Q.it;if(it.ph!=null)it.ph=String(it.ph).replace(/,+$/,"");notePhoto(it.ph);
  if(Q.mode==="photo"){(S.undo[S.n]=S.undo[S.n]||[]).push(Q.pre);S.redo[S.n]=[];const p=page();if(it.ph)p.exp[Q.row.no]=it.ph;else delete p.exp[Q.row.no];qty.hidden=true;Q=null;redraw();autosave();return}
  if(it.n===""||!it.n)it.n=1;
  for(const k of["w","L","a","b","cw","T"])if(it[k]!==""&&it[k]!=null)it[k]=fmt(parseFloat(it[k]));
  const p=page();if(Q.mode!=="ex"){const fitted=fitToScale(it,Q.mode==="new");if(!fitted&&S.opt.toScale&&!scaleXY()&&libById(it.type).geom!=="point"&&unitOf(it)!=="EA"&&!S.scaleHinted){S.scaleHinted=true;toast("축척을 설정하면 입력한 크기대로 도형이 자동으로 맞춰집니다 (상단 축척 도구)",4000)}}
  if(Q.mode==="new"){snap();p.items.push(it);if(it.mem)S.doc.mem=it.mem;if(!S.opt.repeat||it.prog||it.chg)disarm()}
  else if(Q.mode==="ex"){(S.undo[S.n]=S.undo[S.n]||[]).push(Q.pre);S.redo[S.n]=[];p.exq[Q.row.no]={w:it.w,L:it.L,a:it.a,b:it.b,n:it.n};p.exj[Q.row.no]="prog";
    const row=Q.row,q=p.exq[row.no];qty.hidden=true;Q=null;liveSet("");
    const ci=incItemOf(S.n,row.no);if(ci&&ci.chg){for(const k of["w","L","a","b","n"])if(q[k]!=null&&q[k]!=="")ci[k]=q[k];fitToScale(ci,false);redraw();autosave();toast(`${row.no}번 변경 물량을 고쳤습니다`);return}
    redraw();autosave();startChg(row,q);return}
  else{(S.undo[S.n]=S.undo[S.n]||[]).push(Q.pre);S.redo[S.n]=[]}
  qty.hidden=true;Q=null;liveSet("");redraw();autosave()}
function openExPhoto(row){const cur=page().exp[row.no]||"";const it={kind:"photo",type:"ex:point",ph:cur||(lastPhoto()?String(lastPhoto()+1):""),n:1};openQty(it,"photo",row);Q.f="ph";if(!cur&&it.ph)Q.phAuto=it.ph;renderQty()}
function cancelQty(){if(!Q)return;if(Q.mode==="new"&&S.armedInc)disarm();if(Q.mode==="edit")Object.assign(Q.it,JSON.parse(Q.orig));qty.hidden=true;Q=null;liveSet("");redraw()}
function openExProg(row){const g=geomOfRow(row);const q=page().exq[row.no];
  const it={kind:"exq",type:"ex:"+g,w:q?q.w:(g==="line"?row.w:""),L:q?q.L:(g==="line"?row.L:""),a:q?q.a:(g==="area"?row.w:""),b:q?q.b:(g==="area"?row.L:""),n:q?q.n:(+row.n||1)};
  for(const k of["w","L","a","b"])if(it[k]!=="")it[k]=fmt(it[k]);
  openQty(it,"ex",row);Q.f=g==="line"?"L":g==="area"?"a":"n";renderQty()}

/* ---------- 진행 → 이번 조사 신규 진행분 (기존은 그대로, 늘어난 만큼만 새 번호로) ---------- */
function incOf(row,q){const g=geomOfRow(row);const n0=+row.n||1,n1=+q.n||n0;
  if(g==="line"){const w0=+row.w||0,w1=q.w!==""&&q.w!=null?+q.w:w0,L0=+row.L||0,L1=+q.L||0,dL=r2(L1-L0);
    if(dL>0)return{w:q.w!==""?fmt(w1):"",L:fmt(dL),n:n1};
    if(n1>n0)return{w:q.w!==""?fmt(w1):"",L:fmt(L1),n:n1-n0};
    if(w1>w0)return{w:fmt(w1),L:fmt(L1),n:n1,wOnly:true};return null}
  if(g==="area"){const a0=+row.w||0,b0=+row.L||0,a1=+q.a||0,b1=+q.b||0,dA=r2(a1*b1-a0*b0);
    if(dA<=0){if(n1>n0)return{a:fmt(a1),b:fmt(b1),n:n1-n0};return null}
    if(Math.abs(a1-a0)<1e-9)return{a:fmt(a1),b:fmt(r2(b1-b0)),n:n1};
    if(Math.abs(b1-b0)<1e-9)return{a:fmt(r2(a1-a0)),b:fmt(b1),n:n1};
    return{a:fmt(a1),b:fmt(Math.max(.01,r2(dA/a1))),n:n1}}
  return n1>n0?{n:n1-n0}:null}
function startChg(row,q){const g=geomOfRow(row);const t=matchType(row.name,g);const id=t?t.id:"ex:"+g;
  setToolQuiet("pen");S.selEx=null;S.armedInc={no:row.no,chg:true,q,tname:t?"":row.name};const R=exRing(S.n,row);
  const qs=g==="line"?(q.w?`${q.w}/${q.L}`:`L=${q.L}`):g==="area"?`${q.a}X${q.b}`:`${q.n}EA`;
  if(g==="point"){const p0=R?[r2(R.cx+R.r*2.2),r2(R.cy+R.r*3.2)]:[S.W/2,S.H/2];menuAnchor=p0;newDamage(t||libById(id),[p0]);return}
  if(R)centerOn(R.cx,R.cy,2.4);
  arm(id,`${row.no}번 변경 ${qs}`,`${row.no}번 ${row.name}: 변경된 손상 범위를 그리세요. 번호 ${row.no} 그대로, '${tagText({st:"chg"})}'로 표기됩니다`)}
function matchType(name,g){const nm=String(name).replace(/\s+/g,"");return S.lib.find(t=>t.geom===g&&(t.name.replace(/\s+/g,"")===nm||(t.short||"").replace(/\s+/g,"")===nm))||null}
function startInc(row,inc){const g=geomOfRow(row);const t=matchType(row.name,g);const id=t?t.id:"ex:"+g;
  setToolQuiet("pen");S.selEx=null;S.armedInc={no:row.no,inc,tname:t?"":row.name};const R=exRing(S.n,row);
  const q=g==="line"?(inc.w?`${inc.w}/${inc.L}`:`L=${inc.L}`):g==="area"?`${inc.a}X${inc.b}`:`${inc.n}EA`;
  if(g==="point"){const p0=R?[r2(R.cx+R.r*2.2),r2(R.cy+R.r*3.2)]:[S.W/2,S.H/2];menuAnchor=p0;newDamage(t||libById(id),[p0]);return}
  if(R)centerOn(R.cx,R.cy,2.4);
  arm(id,`${row.no}번 진행분 ${q}`,`${row.no}번 ${row.name}: 늘어난 부분(${q}${inc.wOnly?", 폭 진행":""})을 기존 손상 옆에 그리세요. 이번 조사(${S.opt.curYear}) 신규 번호로 들어갑니다`)}

/* ---------- selection bar ---------- */
const selbar=$("#selbar");const selIt=()=>page().items.find(i=>i.id===S.sel);const selRow=()=>exRows(S.n).find(r=>r.no===S.selEx);
function renderSelbar(){const it=selIt(),row=selRow();
  if(row){const j=exJ(S.n,row);selbar.innerHTML=`<span class="lbl">기존 ${row.no}. ${esc(row.name)} <small style="color:var(--muted)">${esc(row.yr)}</small></span>`+
    JUDGE.map(([k,n])=>`<button class="btn ${j===k?"on":""}" data-j="${k}" style="${j===k?`background:${exColor(k,row.yr)}`:`color:${exColor(k,row.yr)}`}">${n}</button>`).join("")+
    `<button class="btn" data-ph="1" title="사진번호">📷 ${esc(phText(page().exp[row.no])||"사진#")}</button><button class="btn" data-j="reset" title="PDF 비고대로">원래대로</button><button class="btn" data-x="1">✕</button>`;selbar.hidden=false;return}
  if(it&&S.rs&&S.rs.id===it.id){selbar.innerHTML=`<span class="lbl">라벨 크기 ${Math.round((it.ls||1)*100)}%</span><button class="btn" data-r="-">−</button><button class="btn" data-r="+">+</button><button class="btn" data-r="all" style="background:var(--accent);color:#fff">이 크기로 전체 고정</button><button class="btn" data-r="one">이것만 적용</button><button class="btn" data-r="cx">취소</button>`;selbar.hidden=false;return}
  if(it){selbar.innerHTML=(it.kind==="damage"?`<button class="btn" data-a="no">번호 ${it.no||"-"}</button><button class="btn" data-a="edit">수량 수정</button><button class="btn" data-a="type" id="sType">손상 변경</button><button class="btn" data-a="stat">상태: ${stName(it.st)}</button><button class="btn" data-a="rs">라벨 크기</button>`:"")+
    `<button class="btn" data-a="del" style="color:var(--accent)">삭제</button><button class="btn" data-x="1">✕</button>`;selbar.hidden=false;return}
  selbar.hidden=true}
selbar.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.x){if(S.rs){const it=selIt();if(it){it.ls=S.rs.ls0;if(it.ls===1)delete it.ls}S.rs=null}S.sel=null;S.selEx=null;redraw();return}
  if(b.dataset.ph){const row=selRow();if(row)openExPhoto(row);return}
  if(b.dataset.j){const row=selRow();if(!row)return;const p=page();
    if(b.dataset.j==="prog"){openExProg(row);return}
    snap();if(b.dataset.j==="reset"){delete p.exj[row.no];delete p.exq[row.no]}else{p.exj[row.no]=b.dataset.j;if(b.dataset.j!=="prog")delete p.exq[row.no]}redraw();autosave();return}
  if(b.dataset.r){const it=selIt();if(!it||!S.rs)return;const r=b.dataset.r;
    if(r==="+"||r==="-"){it.ls=Math.max(.3,Math.min(4,r2((it.ls||1)*(r==="+"?1.12:1/1.12))));redraw();return}
    if(r==="all"){const f=it.ls||1;S.doc.fs=r2(FSb()*f);for(const k in S.doc.pages)for(const x of S.doc.pages[k].items)delete x.ls;S.rs=null;redraw();autosave();toast(`이 망도 라벨 크기를 ${fmt(S.doc.fs)}pt로 전체 고정했습니다`);return}
    if(r==="one"){S.rs=null;redraw();autosave();return}
    if(r==="cx"){it.ls=S.rs.ls0;if(it.ls===1)delete it.ls;S.rs=null;redraw();return}}
  const it=selIt();if(!it)return;const a=b.dataset.a;
  if(a==="no"){numPad(`손상 번호 · ${typeOf(it).name}`,String(it.no||""),v=>{const n=parseInt(v);if(!(n>0))return toast("번호를 입력하세요");
    const dup=!it.chg&&(page().items.some(x=>x!==it&&x.kind==="damage"&&x.no===n)||exRows(S.n).some(r=>r.no===n));snap();it.no=n;redraw();autosave();if(dup)toast(`${n}번이 이 페이지에 이미 있습니다. 확인해 주세요`,3500)});return}
  if(a==="rs"){snap();S.rs={id:it.id,ls0:it.ls||1};setToolQuiet("select");S.sel=it.id;redraw();toast("파란 네모 모서리를 끌거나 −/+로 크기를 맞추세요",3500);return}
  if(a==="edit")openQty(it,"edit");
  if(a==="type"){const r=b.getBoundingClientRect();openMenu(r.left,r.bottom+6,null,"change")}
  if(a==="stat"){snap();const i=STATUS.findIndex(s=>s[0]===it.st);it.st=STATUS[(i+1)%3][0];if(it.st==="new")it.yr=String(S.opt.curYear);redraw();autosave();if(it.st!=="new")toast("적출년도는 수량 수정에서 바꿀 수 있습니다")}
  if(a==="del"){snap();page().items=page().items.filter(i=>i!==it);S.sel=null;redraw();autosave()}});

/* ---------- 숫자 입력 패드 (번호 수정 등) ---------- */
function numPad(title,init,onOk){Q=null;let v=init||"",fresh=true;qty.hidden=false;
  const R=()=>{qty.innerHTML=`<div class="qh"><h4>${esc(title)}</h4></div><div class="fields"><div class="fld on"><small>번호</small><span>${esc(v)}</span></div></div>
   <div class="pad">${["7","8","9","⌫","4","5","6","C","1","2","3","","","0","취소","확인"].map(k=>`<button data-k="${k}" class="${k==="확인"?"ok":k==="취소"?"cx":""}" ${k===""?"disabled":""}>${k}</button>`).join("")}</div>`};
  R();qty.onclick=e=>{const k=e.target.dataset&&e.target.dataset.k;if(!k)return;
    if(k==="취소"){qty.hidden=true;qty.onclick=null;return}
    if(k==="확인"){qty.hidden=true;qty.onclick=null;onOk(v);return}
    if(k==="⌫")v=v.slice(0,-1);else if(k==="C")v="";else{if(fresh)v="";if(v.length<3)v+=k}fresh=false;R()}}

/* ---------- scale ---------- */
function askScale(A,B){Q=null;let v="";qty.hidden=false;const dx=Math.abs(B[0]-A[0]),dy=Math.abs(B[1]-A[1]);const hor=dx>=dy;const len=hor?dx:dy;const p=page();
  const other=hor?(p.sy||0):(p.sx||0);let same=!other;
  const R=()=>{qty.innerHTML=`<div class="qh"><h4>축척 설정 · ${hor?"가로(교축) 방향":"세로(횡) 방향"}</h4><span class="prev">그린 ${hor?"가로":"세로"} 길이 ${fmt(r2(len))} pt</span></div>
   <div class="fields"><div class="fld on"><small>이 구간의 실제 길이 (m)</small><span>${esc(v)}</span></div></div>
   <div class="chips" style="flex-direction:column;align-items:flex-start;gap:4px">
    <label class="prev" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="scSame" ${same?"checked":""}> ${hor?"세로":"가로"} 방향도 같은 축척 <span style="color:var(--muted)">(망도가 가로·세로 축척이 다르면 끄고 따로 한 번 더 그으세요)</span></label>
    <label class="prev" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="scAll"> 모든 페이지에 적용</label></div>
   <div class="pad">${["7","8","9","⌫","4","5","6","C","1","2","3","",".","0","취소","확인"].map(k=>`<button data-k="${k}" class="${k==="확인"?"ok":k==="취소"?"cx":""}" ${k===""?"disabled":""}>${k}</button>`).join("")}</div>`};
  R();qty.onclick=e=>{if(e.target.id==="scSame"){same=e.target.checked;return}const k=e.target.dataset&&e.target.dataset.k;if(!k)return;
    if(k==="취소"){qty.hidden=true;qty.onclick=null;return}
    if(k==="확인"){const m=parseFloat(v);if(!(m>0))return toast("실제 길이를 입력하세요");if(len<2)return toast("선을 더 길게 그어 주세요");const sc=m/len;same=$("#scSame").checked;
      const apply=pg=>{delete pg.scale;if(hor)pg.sx=sc;else pg.sy=sc;if(same){pg.sx=sc;pg.sy=sc}};
      snap();if($("#scAll").checked){for(let i=1;i<=S.count;i++)apply(page(i))}else apply(p);
      qty.hidden=true;qty.onclick=null;setTool("pen");redraw();autosave();
      toast(same?"축척을 설정했습니다. 이제 입력한 수량대로 도형이 맞춰집니다":`${hor?"가로":"세로"} 축척을 설정했습니다. ${hor?"세로":"가로"} 방향도 한 번 더 그어 설정하세요`,4000);return}
    if(k==="⌫")v=v.slice(0,-1);else if(k==="C")v="";else if(!(k==="."&&v.includes(".")))v+=k;R()}}


/* ---------- page thumbnails (left strip, lazy) ---------- */
const thumbsEl=$("#thumbs"),thList=$("#thList");let thObs=null,thQueue=new Set(),thBusy=false,thGen=0,thBuiltFor=null;
const thPref=()=>{try{const v=localStorage.getItem("mdn.thumbs");return v===null?innerWidth>=900:v==="1"}catch(e){return true}};
function setThumbs(on){thumbsEl.hidden=!on;try{localStorage.setItem("mdn.thumbs",on?"1":"0")}catch(e){}$("#bThumbs").classList.toggle("on",on);if(on&&S.pdf&&thBuiltFor!==S.pdf)buildThumbs();if(S.pdf)setTimeout(()=>{applyCam();thCurrent(S.n)},0)}
async function buildThumbs(){const my=++thGen;thBuiltFor=S.pdf;thQueue.clear();if(thObs)thObs.disconnect();thList.innerHTML="";if(!S.pdf)return;
  let ar=1.414;try{const v=(await S.pdf.getPage(1)).getViewport({scale:1});ar=v.width/v.height}catch(e){}if(my!==thGen)return;
  let h="";for(let n=1;n<=S.count;n++)h+=`<button class="th" data-p="${n}" aria-label="${n}쪽"><span class="tb" style="aspect-ratio:${ar.toFixed(4)}"></span><span class="tn">${n}</span></button>`;
  thList.innerHTML=h;
  thObs=new IntersectionObserver(es=>{for(const e of es){const n=+e.target.dataset.p;if(e.isIntersecting){if(!e.target.dataset.done)thQueue.add(n)}else thQueue.delete(n)}pumpThumbs(my)},{root:thList,rootMargin:"300px 0px"});
  thList.querySelectorAll(".th").forEach(el=>thObs.observe(el));markThumbs();thCurrent(S.n)}
async function pumpThumbs(my){if(thBusy)return;thBusy=true;
  try{while(thQueue.size&&my===thGen){if(S.mainBusy){await new Promise(r=>setTimeout(r,200));continue}
    const n=thQueue.values().next().value;thQueue.delete(n);const el=thList.querySelector(`.th[data-p="${n}"]`);if(!el||el.dataset.done)continue;
    try{const pg=await S.pdf.getPage(n);const v1=pg.getViewport({scale:1});const vp=pg.getViewport({scale:(thList.clientWidth*1.6)/v1.width});
      const cv=document.createElement("canvas");cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);
      await pg.render({canvasContext:cv.getContext("2d"),viewport:vp,background:"#ffffff"}).promise;if(my!==thGen)return;
      const img=new Image();img.alt="";img.src=cv.toDataURL("image/jpeg",.72);const tb=el.querySelector(".tb");tb.style.aspectRatio=(vp.width/vp.height).toFixed(4);tb.replaceChildren(img);el.dataset.done="1";cv.width=cv.height=0}
    catch(e){console.error(e)}}}
  finally{thBusy=false}}
function markThumb(n){const el=thList.querySelector(`.th[data-p="${n}"]`);if(!el)return;const p=S.doc.pages[n];
  const k=p?p.items.filter(i=>i.kind==="damage").length+Object.keys(p.exj||{}).length:0;let d=el.querySelector(".td");
  if(k){if(!d){d=document.createElement("i");d.className="td";el.appendChild(d)}d.textContent=k}else if(d)d.remove()}
function markThumbs(){for(const k in S.doc.pages)markThumb(+k)}
function thCurrent(n){if(thumbsEl.hidden)return;const o=thList.querySelector(".th.on");if(o)o.classList.remove("on");const el=thList.querySelector(`.th[data-p="${n}"]`);
  if(el){el.classList.add("on");const r=el.getBoundingClientRect(),R=thList.getBoundingClientRect();if(r.top<R.top||r.bottom>R.bottom)el.scrollIntoView({block:"center"})}}
thList.addEventListener("click",e=>{const b=e.target.closest(".th");if(b)gotoPage(+b.dataset.p,false)});
$("#bThumbs").onclick=()=>setThumbs(thumbsEl.hidden);

/* ---------- tools & keys ---------- */
function setTool(t){S.tool=t;disarm();S.rs=null;if(t!=="select"){S.sel=null;S.selEx=null}document.querySelectorAll("[data-tool]").forEach(b=>b.classList.toggle("on",b.dataset.tool===t));
  if(t==="scale")toast("도면에서 치수를 아는 구간(예: 경간장)을 따라 선을 그으세요",3200);if(t==="select")toast("손상이나 기존 손상 번호(동그라미)를 누르세요");redraw()}
document.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
function renderInk(){$("#inkCols").innerHTML=INK_COLORS.map(c=>`<button class="btn ${S.opt.inkColor===c?"on":""}" data-ink="${c}" aria-label="펜 색" style="padding:0 6px"><span class="dot" style="background:${c}"></span></button>`).join("")}
$("#inkCols").onclick=e=>{const b=e.target.closest("[data-ink]");if(!b)return;S.opt.inkColor=b.dataset.ink;saveOpt();renderInk();if(S.tool!=="pen")setTool("pen")};
document.addEventListener("keydown",e=>{if(e.target.matches("input,select,textarea")||!$("#lock").hidden)return;if($("#app").classList.contains("home")||!$("#modal").hidden)return;
  if(!qty.hidden&&Q){const map={Enter:"확인",Escape:"취소",Backspace:"⌫",Tab:"→"};const k=map[e.key]||(/^[0-9.]$/.test(e.key)?e.key:null);
    if(k){e.preventDefault();const b=qty.querySelector(`[data-k="${k}"]`);b&&b.click()}return}
  if(!dmenu.hidden){if(/^[1-9]$/.test(e.key)){const t=menuOrder()[+e.key-1];t&&chooseType(t.id)}if(e.key==="Escape")hideMenu();return}
  if(e.key===" "){spaceDown=true;return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();saveJson();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();redo();return}
  const k=e.key.toLowerCase();
  if(k==="arrowright"||k==="pagedown")gotoPage(S.n+1);else if(k==="arrowleft"||k==="pageup")gotoPage(S.n-1);
  else if(k==="t")setThumbs(thumbsEl.hidden);else if(k==="p")setTool("pen");else if(k==="v")setTool("select");else if(k==="e")setTool("erase");else if(k==="f")fit();
  else if(k==="s"){const v=viewer.getBoundingClientRect();openMenu(v.left+v.width/2-120,v.top+60,toPage(v.left+v.width/2,v.top+v.height/2))}
  else if(k==="escape"){disarm();S.sel=null;S.selEx=null;redraw()}
  else if((k==="delete"||k==="backspace")&&S.sel){const b=selbar.querySelector('[data-a="del"]');b&&b.click()}});
document.addEventListener("keyup",e=>{if(e.key===" ")spaceDown=false});
$("#bPrev").onclick=()=>gotoPage(S.n-1);$("#bNext").onclick=()=>gotoPage(S.n+1);
$("#pgIn").onchange=e=>gotoPage(parseInt(e.target.value));
$("#lblIn").oninput=()=>{lblDirty=true};$("#lblIn").onchange=commitLabel;
$("#bUndo").onclick=undo;$("#bRedo").onclick=redo;$("#bFit").onclick=fit;
$("#bPanel").onclick=()=>{$("#panel").hidden=!$("#panel").hidden;renderPanel();setTimeout(()=>{if(S.pdf)applyCam()},0)};
$("#bPanelX").onclick=()=>{$("#panel").hidden=true};
$("#vPage").onclick=()=>{S.panelAll=false;$("#vPage").classList.add("on");$("#vAll").classList.remove("on");renderPanel()};
$("#vAll").onclick=()=>{S.panelAll=true;$("#vAll").classList.add("on");$("#vPage").classList.remove("on");renderPanel()};
window.addEventListener("resize",()=>{if(S.pdf)applyCam()});

/* ---------- panel ---------- */
function pagesKnown(){const s=new Set(Object.keys(S.doc.pages).map(Number));for(const k in S.ex)s.add(+k);return[...s].sort((a,b)=>a-b)}
function drawnRows(n){const p=S.doc.pages[n];return p?p.items.filter(i=>i.kind==="damage"):[]}
function renderPanel(){if($("#panel").hidden)return;const pages=S.panelAll?pagesKnown():[S.n];
  const agg={};const jc={keep:0,prog:0,rep:0,del:0};let exN=0,newN=0;
  for(const n of pages){for(const it of drawnRows(n)){const t=typeOf(it),q=qtyValue(it);const k=t.name+"|"+it.st;agg[k]=agg[k]||{nm:t.name,st:it.st,yr:it.yr,cnt:0,v:0,u:q.u};agg[k].cnt++;agg[k].v+=q.v;newN++}
    for(const r of exRows(n)){jc[exJ(n,r)]++;exN++}}
  const ag=Object.values(agg).sort((a,b)=>a.st.localeCompare(b.st)||a.nm.localeCompare(b.nm,"ko"));
  $("#sum").innerHTML=`<span class="h">이번 조사 기입 ${newN}건</span><span class="h" style="text-align:right">개소</span><span class="h" style="text-align:right">물량</span>`+
    (ag.length?ag.map(a=>{const c=a.st==="rep"?S.opt.stRep:a.st==="old"?yearColor(a.yr):S.opt.stNew;return `<span><span style="color:${c}">●</span> ${esc(a.nm)} <small style="color:var(--muted)">${stName(a.st)}</small></span><span class="n">${a.cnt}</span><span class="n">${fmt(r2(a.v))} ${a.u}</span>`}).join(""):`<span style="grid-column:1/-1;color:var(--muted)">아직 없음</span>`)+
    (exN?`<span class="h" style="grid-column:1/-1;margin-top:6px">기존 손상 ${exN}건 판정</span><span style="grid-column:1/-1">${JUDGE.map(([k,n])=>`<span style="color:${exColor(k,"")}">●</span> ${n} <b class="n">${jc[k]}</b>`).join(" &nbsp; ")}</span>`:"");
  let h="";
  for(const n of pages){const dr=drawnRows(n),er=exRows(n);if(!dr.length&&!er.length&&S.panelAll)continue;
    if(S.panelAll)h+=`<div class="pgh" data-pg="${n}">p.${n} ${esc(pageLabel(n))}</div>`;
    if(dr.length){if(!S.panelAll)h+=`<div class="sec"><span>이번 조사 기입</span><span>${dr.length}건</span></div>`;
      for(const it of dr){const t=typeOf(it),c=itemColor(it);h+=`<div class="row ${it.id===S.sel?"sel":""}" data-pg="${n}" data-id="${it.id}"><span class="no">${it.no||""}</span><span class="nm"><b>${esc(t.name)}</b><small><span class="yr">${esc(it.yr||"")}</span>${esc(qtyText(it))} → ${qtyValue(it).v}${qtyValue(it).u}${it.chg?` · 기존 ${it.chg}번 변경`:it.prog?` · 기존 ${it.prog}번 진행분`:""}${it.mem?` · ${esc(it.mem)}`:""}${it.gr?` · 등급 ${it.gr}`:""}${it.by?` · ${esc(it.by)}`:""}${it.dup?` · <b style="color:var(--accent)">중복 의심</b>`:""}</small></span><span class="pill" style="background:${c}">${stName(it.st)}</span></div>`}}
    if(er.length){if(!S.panelAll)h+=`<div class="sec"><span>기존 손상 (${S.ex[n]&&S.ex[n].noTable?"도면 라벨에서 읽음":"도면 물량표"})</span><span>${er.length}건</span></div>`;
      for(const r of er){const j=exJ(n,r),ch=exChanged(n,r),c=exColor(j,r.yr);const q=S.doc.pages[n]&&S.doc.pages[n].exq&&S.doc.pages[n].exq[r.no];
        h+=`<div class="row ${n===S.n&&r.no===S.selEx?"sel":""}" data-pg="${n}" data-ex="${r.no}"><span class="no">${r.no}</span><span class="nm"><b style="font-weight:500">${esc(r.name)}</b><small><span class="yr">${esc(r.yr)}</span>${esc(rowQtyText(r))} → ${rowQty(r).v}${rowQty(r).u}${q?` · 변경 ${esc(rowQtyText(r,q))}`:""}${S.ex[n].labels[r.no]?"":" · 도면 위치 못 찾음"}</small></span><span class="pill ${ch?"":"ghost"}" style="background:${c};color:${ch?"#fff":c}">${jName(j)}</span></div>`}}}
  if(!h)h=`<div class="empty">펜으로 도면을 <b>길게 누르면</b> 손상 메뉴가 열립니다. 손상을 고르고 그린 뒤 수량을 입력하면 여기에 쌓입니다.<br><br>도면에 손상물량표가 있으면 기존 손상이 자동으로 읽혀서 여기에 나옵니다.</div>`;
  $("#list").innerHTML=h}
$("#list").onclick=async e=>{const r=e.target.closest("[data-pg]");if(!r)return;const n=+r.dataset.pg;if(n!==S.n)await gotoPage(n);
  if(r.dataset.id){setToolQuiet("select");S.sel=r.dataset.id;S.selEx=null;const it=selIt();if(it){const b=bbox(it.pts);centerOn(b.x+b.w/2,b.y+b.h/2,2.4)}redraw()}
  if(r.dataset.ex){setToolQuiet("select");S.selEx=+r.dataset.ex;S.sel=null;const row=selRow();const R=row&&exRing(S.n,row);if(R)centerOn(R.cx,R.cy,2.4);else toast("이 손상은 도면에서 번호 위치를 찾지 못했습니다");redraw()}};
function setToolQuiet(t){S.tool=t;disarm();document.querySelectorAll("[data-tool]").forEach(b=>b.classList.toggle("on",b.dataset.tool===t))}

/* ---------- storage (IndexedDB) ---------- */
let idb=null;
function idbOpen(){return new Promise(res=>{try{const r=indexedDB.open("mangdo-note",2);r.onupgradeneeded=()=>{const d=r.result;for(const n of["pdfs","docs","meta"])if(!d.objectStoreNames.contains(n))d.createObjectStore(n)};
  r.onsuccess=()=>{idb=r.result;res(idb)};r.onerror=()=>res(null);r.onblocked=()=>res(null)}catch(e){res(null)}})}
function idbReq(store,mode,fn){return new Promise(res=>{try{if(!idb)return res(null);const tx=idb.transaction(store,mode);const r=fn(tx.objectStore(store));
  if(r){r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}else tx.oncomplete=()=>res(true)}catch(e){res(null)}})}
let saveT=null;
async function doSave(){saveT=null;if(S.isSample||!S.key)return;
  const ok=await idbReq("docs","readwrite",s=>s.put({key:S.key,name:S.name,size:S.size,count:S.count,updated:Date.now(),doc:S.doc},S.key));
  if(S.cur){S.cur.updated=Date.now();S.cur.nDam=countDam(S.doc);S.cur.nJ=countJ(S.doc);S.cur.pages=S.count;await libSave()}
  $("#busy").textContent=ok?"자동 저장됨":"이 브라우저에선 자동 저장이 안 됩니다 — 작업 파일(.json)로 저장하세요";setTimeout(()=>{if(/자동 저장됨/.test($("#busy").textContent))$("#busy").textContent=""},1500)}
function autosave(){if(S.isSample||!S.key)return;S.dirty=true;$("#dirty").hidden=false;clearTimeout(saveT);saveT=setTimeout(doSave,600)}
async function flushSave(){if(saveT){clearTimeout(saveT);await doSave()}}

/* ---------- library: 용역 폴더 → 구조물 (PDF는 앱 안에 보관) ---------- */
const LIB={folders:[],structs:[]};let curKind=(()=>{try{return localStorage.getItem("mdn.curKind")||"all"}catch(e){return"all"}})();const kOK=x=>curKind==="all"||x.kind===curKind;let curFolder=(()=>{try{return localStorage.getItem("mdn.curFolder")||"all"}catch(e){return"all"}})();
const KIND={bridge:"교량",tunnel:"터널",other:"기타"};
const guessKind=n=>/터널|tunnel|갱구|갱문|라이닝|수직구|정거장|지하차도|공동구|GTX/i.test(n)?"tunnel":/교량|bridge|고가|램프|[가-힣0-9](?<!학)교(?=$|[\s_()\-.,·])/i.test(n)?"bridge":"other";
function kindSVG(k){if(k==="tunnel")return `<svg viewBox="0 0 26 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 15h24"/><path d="M5 15V9a8 7 0 0116 0v6"/><path d="M9 15v-5a4 3.5 0 018 0v5"/></svg>`;
  if(k==="bridge")return `<svg viewBox="0 0 26 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 6h24"/><path d="M1 6c4 0 6 3 6 9M25 6c-4 0-6 3-6 9M7 6v9M19 6v9"/><path d="M10 15c0-4 1.5-6 3-6s3 2 3 6"/></svg>`;
  return `<svg viewBox="0 0 26 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="2" width="16" height="12" rx="1.5"/><path d="M5 6h16"/></svg>`}
function countDam(doc){let n=0;for(const k in (doc&&doc.pages)||{})n+=(doc.pages[k].items||[]).filter(i=>i.kind==="damage").length;return n}
function countJ(doc){let n=0;for(const k in (doc&&doc.pages)||{})n+=Object.keys(doc.pages[k].exj||{}).length;return n}
async function libLoad(){const v=await idbReq("meta","readonly",s=>s.get("lib"));if(v){LIB.folders=v.folders||[];LIB.structs=v.structs||[]}}
function libSave(){return idbReq("meta","readwrite",s=>s.put({folders:LIB.folders,structs:LIB.structs},"lib"))}
async function migrate(){const keys=(await idbReq("docs","readonly",s=>s.getAllKeys()))||[];const known=new Set(LIB.structs.map(x=>x.key));
  const olds=keys.filter(k=>!known.has(k)&&!String(k).startsWith("s:"));if(!olds.length)return;
  let f=LIB.folders.find(x=>x.name==="이전 작업");if(!f){f={id:uid(),name:"이전 작업",created:Date.now()};LIB.folders.push(f)}
  for(const k of olds){const d=await idbReq("docs","readonly",s=>s.get(k));if(!d)continue;const has=await idbReq("pdfs","readonly",s=>s.count(k));
    LIB.structs.push({id:uid(),folderId:f.id,name:String(d.name||k).replace(/\.pdf$/i,""),kind:guessKind(d.name||""),key:k,pdfName:d.name,pdfSize:d.size,pages:d.count,created:Date.now(),updated:d.updated||Date.now(),nDam:countDam(d.doc),nJ:countJ(d.doc),noPdf:!has})}
  await libSave()}
const fName=id=>(LIB.folders.find(f=>f.id===id)||{}).name||"";
function when(t){if(!t)return"";const d=new Date(t),n=new Date();const hm=`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  return d.toDateString()===n.toDateString()?`오늘 ${hm}`:`${d.getMonth()+1}/${d.getDate()} ${hm}`}
function setFolder(id){curFolder=id;try{localStorage.setItem("mdn.curFolder",id)}catch(e){}renderHome()}
function setMode(m){const home=m==="home";$("#app").classList.toggle("home",home);
  if(home){hideMenu();qty.hidden=true;selbar.hidden=true;$("#cmenu").hidden=true;renderHome()}
  else{$("#curName").textContent=S.cur?S.cur.name:"예시 도면";$("#curFolder").textContent=S.cur?fName(S.cur.folderId):"연습용"}}
function cardHTML(st,showFolder){const unsaved=(st.nDam||st.nJ)&&(!st.jsonAt||st.jsonAt<st.updated);
  return `<div class="card" tabindex="0" role="button" data-s="${st.id}"><div class="ct"><span class="kind">${kindSVG(st.kind)}${KIND[st.kind]||"기타"}</span>${showFolder?`<span class="fol">· ${esc(fName(st.folderId))}</span>`:""}<button class="more" data-m="${st.id}" aria-label="구조물 메뉴">⋯</button></div>
   <span class="cn">${esc(st.name)}</span><span class="cf">${esc(st.pdfName||"")}${st.pages?` · ${st.pages}쪽`:""}</span>
   <div class="cs">${st.noPdf?`<b>PDF 없음 — 다시 넣기 필요</b>`:st.nDam||st.nJ?`<span>신규 <b>${st.nDam||0}</b>건</span>${st.nJ?`<span>판정 ${st.nJ}건</span>`:""}`:`<span style="color:var(--muted)">아직 기입 없음</span>`}${unsaved?`<span style="color:var(--accent)">● 작업파일 미저장</span>`:""}<span class="t">${when(st.updated)}</span></div></div>`}
async function renderStore(){try{if(!navigator.storage||!navigator.storage.estimate)return;const e=await navigator.storage.estimate();const mb=v=>v>1e9?(v/1e9).toFixed(1)+"GB":Math.round(v/1e6)+"MB";
  $("#hStore").innerHTML=`앱 저장공간 ${mb(e.usage||0)} 사용 · 여유 ${mb((e.quota||0)-(e.usage||0))}<div class="meter"><i style="width:${Math.min(100,(e.usage||0)/(e.quota||1)*100).toFixed(1)}%"></i></div>`}catch(err){}}
function renderHome(){if(curFolder!=="all"&&!LIB.folders.find(f=>f.id===curFolder))curFolder="all";
  const cnt=id=>LIB.structs.filter(x=>x.folderId===id).length;
  const fic=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6.5A1.5 1.5 0 014.5 5H9l2 2h8.5A1.5 1.5 0 0121 8.5v9A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5z"/></svg>`;
  $("#fList").innerHTML=`<button class="fi ${curFolder==="all"?"on":""}" data-f="all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg><span class="fn">전체 구조물</span><span class="fc">${LIB.structs.length}</span></button><div class="fdiv"></div>`+
    LIB.folders.map(f=>`<button class="fi ${curFolder===f.id?"on":""}" data-f="${f.id}">${fic}<span class="fn">${esc(f.name)}</span><span class="fc">${cnt(f.id)}</span></button>`).join("")+
    (LIB.folders.length?"":`<p class="help" style="padding:6px 10px">용역(현장)마다 폴더를 만들어 구조물을 나눠 담으세요.</p>`);
  const q=($("#hSearch").value||"").trim().toLowerCase();const F=LIB.folders.find(f=>f.id===curFolder);
  $("#hTitle").textContent=q?`'${$("#hSearch").value.trim()}' 검색`:F?F.name:"전체 구조물";
  $("#hCrumb").textContent=F?`용역 · 구조물 ${cnt(F.id)}개`:`용역 ${LIB.folders.length}개 · 구조물 ${LIB.structs.length}개`;
  let h="";const byName=(a,b)=>a.name.localeCompare(b.name,"ko",{numeric:true});
  const kc=k=>LIB.structs.filter(x=>(!F||x.folderId===F.id)&&(k==="all"||x.kind===k)).length;
  let tabs="";if(LIB.structs.length)tabs=`<div class="ktabs">${[["all","전체"],["bridge","교량"],["tunnel","터널"]].map(([k,v])=>`<button data-kf="${k}" class="${curKind===k?"on":""}">${k==="all"?"":kindSVG(k)}${v} <em>${kc(k)}</em></button>`).join("")}</div>`;
  if(!LIB.structs.length&&!F){h=`<div class="hempty"><h3>망도를 구조물별로 넣어 두세요</h3>
     <ol><li>왼쪽 <b>+ 새 용역</b>으로 폴더를 만듭니다 (예: 율현터널 7공구, 서울시 정밀점검)</li>
     <li><b>구조물 추가 (PDF)</b>로 탭에 받아 둔 기존 망도 PDF를 고릅니다. 여러 개를 한 번에 골라도 됩니다</li>
     <li>현장에서는 목록에서 구조물을 눌러 바로 기입합니다. PDF는 앱 안에 보관되어 인터넷 없이 열립니다</li></ol>
     <div class="btns"><button class="btn" data-act="newf">+ 새 용역 만들기</button><button class="btn" data-act="sample">예시 도면으로 연습하기</button></div></div>`}
  else if(q){const r=LIB.structs.filter(kOK).filter(x=>x.name.toLowerCase().includes(q)||(x.pdfName||"").toLowerCase().includes(q)).sort(byName);
    h=r.length?`<div class="sgrid">${r.map(x=>cardHTML(x,true)).join("")}</div>`:`<p class="help">찾는 구조물이 없습니다.</p>`}
  else if(F){const r=LIB.structs.filter(x=>x.folderId===F.id&&kOK(x)).sort(byName);
    h=`<div class="hsec"><span>구조물 ${r.length}개</span><span><button class="btn" data-act="renf">용역 이름 변경</button><button class="btn" data-act="delf">용역 삭제</button></span></div>`+
      (r.length?`<div class="sgrid">${r.map(x=>cardHTML(x,false)).join("")}</div>`:`<div class="hempty"><h3>이 용역에 아직 구조물이 없습니다</h3>위쪽 <b>구조물 추가 (PDF)</b>를 눌러 망도 PDF를 넣으세요. 여러 개를 한 번에 골라도 됩니다.</div>`)}
  else{const rec=LIB.structs.filter(x=>x.updated&&kOK(x)).sort((a,b)=>b.updated-a.updated).slice(0,4);
    if(rec.length)h+=`<div class="hsec"><span>최근 작업</span></div><div class="sgrid">${rec.map(x=>cardHTML(x,true)).join("")}</div>`;
    for(const f of LIB.folders){const r=LIB.structs.filter(x=>x.folderId===f.id&&kOK(x)).sort(byName);if(!r.length)continue;
      h+=`<div class="hsec"><span>${esc(f.name)} · ${r.length}</span></div><div class="sgrid">${r.map(x=>cardHTML(x,false)).join("")}</div>`}
    h+=`<p class="help"><button class="btn" data-act="sample" style="border:1px solid var(--line)">예시 도면으로 연습하기</button></p>`}
  $("#hBody").innerHTML=tabs+h;renderStore()}
$("#fList").onclick=e=>{const b=e.target.closest("[data-f]");if(b){$("#hSearch").value="";setFolder(b.dataset.f)}};
$("#hSearch").oninput=()=>renderHome();
$("#hNewF").onclick=()=>folderModal();
$("#hAdd").onclick=()=>$("#fileIn").click();
$("#hBody").addEventListener("click",e=>{const kf=e.target.closest("[data-kf]");if(kf){curKind=kf.dataset.kf;try{localStorage.setItem("mdn.curKind",curKind)}catch(err){}renderHome();return}
  const m=e.target.closest("[data-m]");if(m){e.stopPropagation();cardMenu(m.dataset.m,m);return}
  const a=e.target.closest("[data-act]");if(a){const k=a.dataset.act;if(k==="newf")folderModal();if(k==="sample")openSample();if(k==="renf")folderModal(curFolder);if(k==="delf")deleteFolder(curFolder);return}
  const c=e.target.closest("[data-s]");if(c)openStruct(c.dataset.s)});
$("#hBody").addEventListener("keydown",e=>{if(e.key==="Enter"){const c=e.target.closest&&e.target.closest("[data-s]");if(c&&!e.target.closest("[data-m]"))openStruct(c.dataset.s)}});
function folderModal(id){const f=LIB.folders.find(x=>x.id===id);
  modal(f?"용역 이름 변경":"새 용역 만들기",`<label class="fld2">용역 · 현장 이름<input id="fNm" value="${f?esc(f.name):""}" placeholder="예: 율현터널 7공구 / 서울시 정밀점검 2026"></label><div class="mact"><button class="btn" id="fCx">취소</button><button class="btn primary" id="fOk">${f?"바꾸기":"만들기"}</button></div>`);
  const inp=$("#fNm");setTimeout(()=>inp.focus(),50);
  const ok=async()=>{const v=inp.value.trim();if(!v)return toast("이름을 입력하세요");if(f)f.name=v;else{const nf={id:uid(),name:v,created:Date.now()};LIB.folders.push(nf);curFolder=nf.id;try{localStorage.setItem("mdn.curFolder",nf.id)}catch(e){}}
    await libSave();closeModal();renderHome();if(!f)toast(`'${v}' 용역을 만들었습니다. 이제 구조물 추가 (PDF)를 누르세요`,3500)};
  $("#fOk").onclick=ok;$("#fCx").onclick=closeModal;inp.onkeydown=e=>{if(e.key==="Enter")ok()}}
function deleteFolder(id){const f=LIB.folders.find(x=>x.id===id);if(!f)return;const n=LIB.structs.filter(x=>x.folderId===id).length;
  if(n){modal("용역 삭제",`<p class="help" style="color:var(--ink)">'${esc(f.name)}'에 구조물이 ${n}개 있습니다. 구조물을 다른 용역으로 옮기거나 먼저 삭제한 뒤 용역을 지울 수 있습니다.</p><div class="mact"><button class="btn primary" id="fCx">확인</button></div>`);$("#fCx").onclick=closeModal;return}
  modal("용역 삭제",`<p class="help" style="color:var(--ink)">빈 용역 '${esc(f.name)}'을 삭제할까요?</p><div class="mact"><button class="btn" id="fCx">취소</button><button class="btn danger" id="fOk">삭제</button></div>`);
  $("#fCx").onclick=closeModal;$("#fOk").onclick=async()=>{LIB.folders=LIB.folders.filter(x=>x.id!==id);curFolder="all";await libSave();closeModal();renderHome()}}
const cmenu=$("#cmenu");let cmTarget=null;
function cardMenu(id,btn){const st=LIB.structs.find(x=>x.id===id);if(!st)return;cmTarget=st;
  cmenu.innerHTML=`<button data-c="open">열기</button>${st.kind!=="tunnel"?`<button data-c="toT">터널로 옮기기</button>`:""}${st.kind!=="bridge"?`<button data-c="toB">교량으로 옮기기</button>`:""}<button data-c="edit">이름 · 종류 · 용역 변경</button>${st.noPdf?`<button data-c="repdf">PDF 다시 넣기</button>`:""}<button data-c="del" class="dz">삭제</button>`;
  cmenu.hidden=false;const r=btn.getBoundingClientRect();cmenu.style.left=Math.max(8,Math.min(r.right-200,innerWidth-212))+"px";cmenu.style.top=Math.min(r.bottom+4,innerHeight-cmenu.offsetHeight-8)+"px"}
document.addEventListener("pointerdown",e=>{if(!cmenu.hidden&&!cmenu.contains(e.target)&&!e.target.closest("[data-m]"))cmenu.hidden=true},true);
cmenu.onclick=e=>{const b=e.target.closest("[data-c]");if(!b||!cmTarget)return;cmenu.hidden=true;const st=cmTarget,c=b.dataset.c;
  if(c==="toT"||c==="toB"){st.kind=c==="toT"?"tunnel":"bridge";libSave().then(()=>{renderHome();toast(`${st.name} → ${KIND[st.kind]}(으)로 옮겼습니다`)});return}
  if(c==="open")openStruct(st.id);if(c==="edit")editStruct(st);if(c==="del")deleteStruct(st);if(c==="repdf"){S.repdf=st;$("#fileIn").click()}};
function editStruct(st){modal("구조물 정보",`<label class="fld2">구조물 이름<input id="sNm" value="${esc(st.name)}"></label>
  <label class="fld2">종류<select id="sKd">${Object.entries(KIND).map(([k,v])=>`<option value="${k}" ${st.kind===k?"selected":""}>${v}</option>`).join("")}</select></label>
  <label class="fld2">용역 · 현장<select id="sFd">${LIB.folders.map(f=>`<option value="${f.id}" ${st.folderId===f.id?"selected":""}>${esc(f.name)}</option>`).join("")}</select></label>
  <p class="help">PDF 파일: ${esc(st.pdfName||"")} · 이름을 바꿔도 여러 탭 합치기에는 영향이 없습니다.</p>
  <div class="mact"><button class="btn" id="sCx">취소</button><button class="btn primary" id="sOk">저장</button></div>`);
  $("#sCx").onclick=closeModal;$("#sOk").onclick=async()=>{const v=$("#sNm").value.trim();if(!v)return toast("이름을 입력하세요");st.name=v;st.kind=$("#sKd").value;if($("#sFd").value)st.folderId=$("#sFd").value;await libSave();closeModal();renderHome()}}
function deleteStruct(st){modal("구조물 삭제",`<p class="help" style="color:var(--ink)"><b>${esc(st.name)}</b>을 삭제하면 앱 안에 보관한 PDF와 기입 내용(신규 ${st.nDam||0}건, 판정 ${st.nJ||0}건)이 이 탭에서 지워집니다.<br>필요하면 먼저 구조물을 열어 <b>[저장]</b>으로 작업 파일(.json)을 받아 두세요.</p>
  <div class="mact"><button class="btn" id="sCx">취소</button><button class="btn danger" id="sOk">삭제</button></div>`);
  $("#sCx").onclick=closeModal;$("#sOk").onclick=async()=>{await idbReq("pdfs","readwrite",s=>s.delete(st.key));await idbReq("docs","readwrite",s=>s.delete(st.key));
    LIB.structs=LIB.structs.filter(x=>x!==st);await libSave();closeModal();renderHome();toast("삭제했습니다")}}
async function addStructs(files){
  if(S.repdf){const st=S.repdf;S.repdf=null;const f=files[0];if(!f)return;const buf=new Uint8Array(await f.arrayBuffer());
    if(st.pdfName&&f.name!==st.pdfName)toast(`주의: 원래 파일명은 '${st.pdfName}'입니다`,3500);
    if(await idbReq("pdfs","readwrite",s=>s.put(buf,st.key))){st.noPdf=false;st.pdfName=f.name;st.pdfSize=f.size;await libSave();renderHome();toast("PDF를 다시 넣었습니다")}return}
  let fid=curFolder!=="all"&&LIB.folders.find(f=>f.id===curFolder)?curFolder:null;
  if(!fid){if(LIB.folders.length===1)fid=LIB.folders[0].id;else{const nf={id:uid(),name:LIB.folders.length?"미분류":"기본 용역",created:Date.now()};const ex=LIB.folders.find(f=>f.name===nf.name);if(ex)fid=ex.id;else{LIB.folders.push(nf);fid=nf.id}}}
  let ok=0,i=0;const added=[];
  for(const f of files){i++;if(!/\.pdf$/i.test(f.name)&&f.type!=="application/pdf"){toast(`${f.name}: PDF가 아닙니다`);continue}
    toast(`가져오는 중… (${i}/${files.length}) ${f.name}`,60000);
    const buf=new Uint8Array(await f.arrayBuffer());let pages=0;
    try{const d=await pdfjsLib.getDocument({data:buf.slice(0),isEvalSupported:false}).promise;pages=d.numPages;d.destroy()}catch(e){toast(`${f.name}: PDF를 열 수 없습니다`,3000);continue}
    const id=uid(),key="s:"+id;if(!(await idbReq("pdfs","readwrite",s=>s.put(buf,key)))){toast("저장 공간이 부족해 더 넣을 수 없습니다",4000);break}
    const name=f.name.replace(/\.pdf$/i,"").replace(/[_]+/g," ").trim();
    const st={id,folderId:fid,name,kind:curKind!=="all"?curKind:guessKind(name),key,pdfName:f.name,pdfSize:f.size,pages,created:Date.now(),updated:0,nDam:0,nJ:0};LIB.structs.push(st);added.push(st);ok++}
  curFolder=fid;try{localStorage.setItem("mdn.curFolder",fid)}catch(e){}
  await libSave();renderHome();toast(ok?`구조물 ${ok}개를 '${fName(fid)}'에 추가했습니다. 이름은 ⋯ 메뉴에서 바꿀 수 있습니다`:"추가한 구조물이 없습니다",3500);
  const unk=added.filter(x=>x.kind!=="bridge"&&x.kind!=="tunnel");if(unk.length)askKind(unk)}
function askKind(list){modal("교량인가요, 터널인가요?",`<p class="help" style="color:var(--ink)">${list.map(x=>esc(x.name)).slice(0,4).join(", ")}${list.length>4?` 외 ${list.length-4}개`:""}<br>종류에 맞는 부재위치(교량: 바닥판·거더… / 터널: 천정부·측벽부…)와 상태평가 기준이 나옵니다.</p>
  <div class="mact"><button class="btn" id="kO">나중에</button><button class="btn primary" id="kB">교량</button><button class="btn primary" id="kT">터널</button></div>`);
  const set=async k=>{for(const x of list)x.kind=k;await libSave();closeModal();renderHome()};$("#kB").onclick=()=>set("bridge");$("#kT").onclick=()=>set("tunnel");$("#kO").onclick=closeModal}
async function openStruct(id){const st=LIB.structs.find(x=>x.id===id);if(!st)return;
  if(st.noPdf){toast("이 구조물의 PDF가 앱에 없습니다. ⋯ 메뉴 → PDF 다시 넣기",4000);return}
  toast(`${st.name} 여는 중…`,15000);const buf=await idbReq("pdfs","readonly",s=>s.get(st.key));
  if(!buf){st.noPdf=true;await libSave();renderHome();toast("PDF가 앱에서 지워졌습니다. ⋯ 메뉴 → PDF 다시 넣기",4000);return}
  const d=await idbReq("docs","readonly",s=>s.get(st.key));S.cur=st;setMode("work");
  await loadPdf(buf instanceof Uint8Array?buf:new Uint8Array(buf),st.pdfName,st.pdfSize,d?d.doc:null,false,st.key,st.lastPage||1);
  if(!st.updated){st.updated=Date.now();libSave()}toast(`${st.name}`,1200)}
async function openSample(){S.cur=null;setMode("work");try{const bytes=await makeSample();await loadPdf(new Uint8Array(bytes),"예시_망도.pdf",bytes.length,sampleDoc(),true);$("#panel").hidden=innerWidth<900;renderPanel();setTimeout(()=>applyCam(),0)}catch(e){console.error(e);toast("예시 도면을 만들지 못했습니다")}}
$("#bHome").onclick=async()=>{commitLabel();if(Q)cancelQty();await flushSave();setMode("home")};

/* ---------- open PDF ---------- */
$("#fileIn").onchange=async e=>{const fs=[...e.target.files];e.target.value="";if(fs.length)await addStructs(fs)};
async function loadPdf(buf,name,size,doc,isSample,key,startPage){$("#busy").textContent="PDF 여는 중…";commitLabel();lblDirty=false;
  if(S.pdf){try{S.pdf.destroy()}catch(e){}}
  S.bytes=buf;S.name=name;S.size=size;S.key=key||(name+"|"+size);S.dirty=false;$("#dirty").hidden=true;S.isSample=isSample;S.undo={};S.redo={};S.sel=null;S.selEx=null;S.ex={};S.n=1;disarm();
  S.pdf=await pdfjsLib.getDocument({data:buf.slice(0),isEvalSupported:false}).promise;S.count=S.pdf.numPages;S.doc=doc||{pages:{}};
  for(const k in S.doc.pages)for(const it of S.doc.pages[k].items||[])if(it.kind==="damage"&&libById(it.type).geom==="area"&&it.pts.length<3){const b=bbox(it.pts),pad=1;it.pts=[[b.x,b.y-pad],[b.x2,b.y-pad],[b.x2,b.y2+pad],[b.x,b.y2+pad]]}
  $("#banner").hidden=!isSample;if(isSample)$("#banner").innerHTML=`<b>예시 도면</b>(연습용)입니다. 왼쪽 위 <b>◂</b>를 눌러 목록에서 구조물을 추가하세요.`;
  thBuiltFor=null;if(!$("#thumbs").hidden)buildThumbs();
  await gotoPage(startPage||1)}

/* ---------- export ---------- */
function csvRowsFor(n){const lab=pageLabel(n);const out=[];
  for(const r of exRows(n)){const j=exJ(n,r),q=S.doc.pages[n]&&S.doc.pages[n].exq&&S.doc.pages[n].exq[r.no];const g=geomOfRow(r);const qv=rowQty(r,q);
    const q0=rowQty(r),inc=j==="prog"?incItemOf(n,r.no):null;const ci=inc&&inc.chg?inc:null;
    out.push({페이지:n,도면명:lab,연번:r.no,구분:"기존",적출년도:r.yr,결함종류:r.name,폭:r.w,길이:r.L,깊이:r.d,
      물량:f2(q0.v),단위:q0.u,개소:r.n,판정:jName(j),PDF비고:r.note,"변경(이번 조사)":q?`${rowQtyText(r,q)} (${f2(qv.v)}${qv.u})${inc&&!ci?` → 증가분 ${inc.no}번`:""}`:"",부재위치:ci?ci.mem||"":"",상태등급:ci?ci.gr||"":"",보수년월:r.ry,"공법명/자재명":r.m,보수물량:r.rq,도면표기:rowQtyText(r),사진번호:phText(S.doc.pages[n]&&S.doc.pages[n].exp&&S.doc.pages[n].exp[r.no])})}
  for(const it of drawnRows(n)){const t=typeOf(it),q=qtyValue(it);
    out.push({페이지:n,도면명:lab,연번:it.no||"",구분:it.chg?"변경":it.prog?"신규(진행분)":it.st==="new"?"신규":it.st==="rep"?"보수(추가기입)":"기존(추가기입)",적출년도:it.yr||"",결함종류:t.name+cwSuffix(it),폭:q.u==="m"?it.w:q.u==="㎡"?it.a:"",길이:q.u==="m"?it.L:q.u==="㎡"?it.b:"",깊이:it.T!==""&&it.T!=null?fmt(it.T/1000):"",
      물량:f2(q.v),단위:q.u,개소:it.n||1,판정:it.st==="new"?"신규":stName(it.st),PDF비고:it.chg?`기존 ${it.chg}번 변경(${tagText(it)})`:it.prog?`기존 ${it.prog}번 진행분`:"","변경(이번 조사)":"",부재위치:it.mem||"",상태등급:it.gr||"",보수년월:"","공법명/자재명":"",보수물량:"",도면표기:qtyText(it),사진번호:phText(it.ph)})}
  return out.sort((a,b)=>(+a.연번||0)-(+b.연번||0))}
function toCSV(rows){const ks=["페이지","도면명","연번","구분","적출년도","결함종류","폭","길이","깊이","물량","단위","개소","판정","PDF비고","변경(이번 조사)","부재위치","상태등급","보수년월","공법명/자재명","보수물량","도면표기","사진번호"];
  const q=v=>{v=String(v??"");return /[",\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v};return"﻿"+ks.join(",")+"\n"+rows.map(r=>ks.map(k=>q(r[k])).join(",")).join("\n")+"\n"}
async function saveFile(name,data){let dl=null;try{if(window.claude&&window.claude.use)dl=await window.claude.use("downloads")}catch(e){}
  const blob=data instanceof Blob?data:new Blob([data]);
  if(dl){try{await dl.save({filename:name,data:blob});toast("저장했습니다: "+name);return true}catch(e){if(e&&e.code==="declined")return false;toast("저장하지 못했습니다 ("+(e&&e.code||"오류")+")",3500);return false}}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);toast("저장했습니다 (다운로드 폴더): "+name,3000);return true}
const base=()=>(S.name||"망도").replace(/\.pdf$/i,"");
function stamp(){const d=new Date();return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`}
async function parseAll(){for(let n=1;n<=S.count;n++){if(!S.ex[n]){await ensureEx(n);if(n%10===0)$("#busy").textContent=`기존 손상 읽는 중… ${n}/${S.count}쪽`}}$("#busy").textContent=""}
function touchedPages(){return Object.keys(S.doc.pages).map(Number).filter(n=>{const p=S.doc.pages[n];return p.items.length||Object.keys(p.exp||{}).length||Object.keys(p.exj||{}).length}).sort((a,b)=>a-b)}
$("#bExport").onclick=()=>{commitLabel();const tp=touchedPages();const nNew=tp.reduce((s,n)=>s+drawnRows(n).length,0);
  modal("내보내기",`<div class="exl">
   <button id="xCsv"><b>손상물량표 (.csv) — 열람·기입한 페이지</b><small>${pagesKnown().length}개 페이지 · 기존(PDF 물량표)+이번 기입 · 연번·적출년도·결함종류·폭·길이·물량·단위·개소·판정</small></button>
   <button id="xCsvAll"><b>손상물량표 (.csv) — 전체 ${S.count}페이지</b><small>모든 페이지의 기존 손상을 읽어서 함께 내보냅니다 · 시간이 걸립니다</small></button>
   <button id="xPdfM"><b>기입한 망도 PDF — 기입한 페이지만</b><small>${tp.length}개 페이지 · 신규 ${nNew}건 · 기존 손상 판정(보수·삭제·변경) 표시 포함</small></button>
   <button id="xPdfA"><b>기입한 망도 PDF — 전체 ${S.count}페이지</b><small>원본 전체에 표기를 얹음</small></button>
   <button id="xJson"><b>작업 파일 (.json)</b><small>좌표·수량·판정 원자료 · 다른 기기에서 이어서 작업하거나 Claude에게 CAD/물량/보고서 작업을 맡길 때 사용</small></button>
   <button id="xMerge"><b>여러 탭 작업 파일 합치기</b><small>탭마다 저장한 .json 여러 개를 한 번에 골라 통합본으로 합칩니다 · 신규 번호를 다시 매기고 중복 의심 건을 표시</small></button>
   <button id="xLoad"><b>작업 파일 불러오기</b><small>같은 PDF를 연 상태에서 .json을 불러와 이어서 작업</small></button></div>`);
  $("#xCsv").onclick=()=>{closeModal();saveFile(`${base()}_손상물량표_${stamp()}.csv`,toCSV(pagesKnown().flatMap(csvRowsFor)))};
  $("#xCsvAll").onclick=async()=>{closeModal();toast("모든 페이지의 기존 손상을 읽고 있습니다…",4000);await parseAll();const all=[];for(let n=1;n<=S.count;n++)all.push(...csvRowsFor(n));saveFile(`${base()}_손상물량표_전체_${stamp()}.csv`,toCSV(all))};
  $("#xJson").onclick=()=>{closeModal();saveJson()};
  $("#xLoad").onclick=()=>$("#jsonIn").click();
  $("#xMerge").onclick=()=>{if(S.isSample)return toast("목록에서 해당 구조물을 연 다음 합치세요");$("#mergeIn").click()};
  $("#xPdfM").onclick=()=>exportPdf(true);$("#xPdfA").onclick=()=>exportPdf(false)};
function saveJson(){if(S.isSample){toast("예시 도면은 저장하지 않습니다. 목록에서 구조물을 여세요");return}commitLabel();const ex={};for(const k in S.ex)ex[k]=S.ex[k].rows;
  const d=new Date(),t=`${stamp()}_${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}`;
  const who=(S.opt.by||"").replace(/[\\/:*?"<>|\s]+/g,"");
  saveFile(`${base()}_작업_${who?who+"_":""}${t}.json`,JSON.stringify({app:"망도노트",ver:2,savedAt:d.toISOString(),pdf:{name:S.name,size:S.size,pages:S.count},curYear:S.opt.curYear,tag:S.doc.tag||"",kind:kindNow(),mem:S.doc.mem||"",fs:S.doc.fs||"",lib:S.lib,opt:{fs:S.opt.fs,hatchSp:S.opt.hatchSp,xch:S.opt.xch},
    coord:"pdf.js 뷰포트(scale=1, 페이지 회전 적용) 좌표, 단위 pt, 원점 좌상단",pages:S.doc.pages,existing:ex,quantities:pagesKnown().flatMap(csvRowsFor)},null,1)).then(ok=>{if(ok){S.dirty=false;$("#dirty").hidden=true;if(S.cur){S.cur.jsonAt=Date.now()+1000;libSave()}}})}
$("#bSave").onclick=saveJson;
$("#bRenum").onclick=async()=>{snap();const ds=page().items.filter(i=>i.kind==="damage");ds.forEach(i=>delete i.dup);
  for(let a=0;a<ds.length;a++)for(let b=a+1;b<ds.length;b++)if((ds[a].by||"")!==(ds[b].by||"")&&overlapDup(ds[a],ds[b]))ds[a].dup=ds[b].dup=true;
  await renumberPage(S.n,"pos");redraw();autosave();toast("이 페이지 신규 번호를 위치순으로 다시 매겼습니다")};
$("#jsonIn").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;try{const j=JSON.parse(await f.text());
  if(!j.pages)throw 0;if(j.pdf&&j.pdf.name!==S.name)toast(`주의: 작업 파일은 '${j.pdf.name}' 기준입니다`,3500);
  S.doc={pages:j.pages};if(j.tag!==undefined)S.doc.tag=j.tag;if(j.kind)S.doc.kind=j.kind;if(j.mem)S.doc.mem=j.mem;if(j.fs)S.doc.fs=+j.fs;if(j.lib){for(const t of j.lib)if(!S.lib.find(x=>x.id===t.id))S.lib.push(t);sv("mdn.lib3",S.lib)}closeModal();await gotoPage(1);autosave();toast("작업 파일을 불러왔습니다")}catch(err){toast("작업 파일 형식이 아닙니다")}};

function hexRgb(h){const n=parseInt(h.slice(1),16);return PDFLib.rgb((n>>16&255)/255,(n>>8&255)/255,(n&255)/255)}
async function exportPdf(onlyMarked){closeModal();const marked=touchedPages();
  if(onlyMarked&&!marked.length)return toast("기입한 페이지가 없습니다");
  toast("PDF 만드는 중… 잠시 기다려 주세요",60000);$("#busy").textContent="PDF 만드는 중…";
  try{const{PDFDocument,degrees}=PDFLib;const src=await PDFDocument.load(S.bytes,{ignoreEncryption:true,updateMetadata:false});
    let out=src,map={};
    if(onlyMarked){out=await PDFDocument.create();const cp=await out.copyPages(src,marked.map(n=>n-1));cp.forEach((p,i)=>{out.addPage(p);map[marked[i]]=i})}
    else marked.forEach(n=>map[n]=n-1);
    out.registerFontkit(fontkit);const font=await out.embedFont(Uint8Array.from(atob(KR_FONT_B64),c=>c.charCodeAt(0)),{subset:false});
    const pgs=out.getPages();
    for(const n of marked){await ensureEx(n);const fs=FSb();const pj=await S.pdf.getPage(n);const vp=pj.getViewport({scale:1});const rot=pj.rotate||0;const P=pgs[map[n]];
      const cv=([x,y])=>vp.convertToPdfPoint(x,y);const svgPath=pts=>pts.map((q,i)=>{const[a,b]=cv(q);return(i?"L":"M")+a.toFixed(2)+" "+(-b).toFixed(2)}).join(" ");
      const line=(a,b,c,w)=>{const A=cv(a),B=cv(b);P.drawLine({start:{x:A[0],y:A[1]},end:{x:B[0],y:B[1]},thickness:w,color:c})};
      const text=(s,x,y,size,c)=>{const A=cv([x,y]);P.drawText(s,{x:A[0],y:A[1],size,font,color:c,rotate:degrees(rot)})};
      const box=(x,y,w,h)=>P.drawSvgPath(svgPath([[x,y],[x+w,y],[x+w,y+h],[x,y+h]])+" Z",{x:0,y:0,color:PDFLib.rgb(1,1,1),opacity:.8});
      for(const row of exRows(n)){const R=exRing(n,row);if(!R)continue;const eph=S.doc.pages[n].exp&&S.doc.pages[n].exp[row.no];
        const PB=eph?exPhotoBox(n,row):null;if(PB){const tw=font.widthOfTextAtSize(PB.t,PB.size);box(PB.x-.5,PB.y-PB.size*.95,tw+1,PB.size*1.2);text(PB.t,PB.x,PB.y,PB.size,hexRgb(S.opt.stNew))}
        if(!exChanged(n,row))continue;const j=exJ(n,row),c=hexRgb(exColor(j,row.yr));
        const A=cv([R.cx,R.cy]);P.drawCircle({x:A[0],y:A[1],size:R.r,borderColor:c,borderWidth:.9});
        if(j==="del")line([R.cx-R.r,R.cy-R.r],[R.cx+R.r,R.cy+R.r],c,.7);
        const tag=exTag(n,row);if(tag){const tw=font.widthOfTextAtSize(tag,fs*.9);box(R.cx-R.r-.5,R.cy-R.r-1-fs*.85,tw+1,fs*1.05);text(tag,R.cx-R.r,R.cy-R.r-1,fs*.9,c)}}
      for(const it of S.doc.pages[n].items){
        if(it.kind==="ink"){if(it.pts.length>1)P.drawSvgPath(svgPath(it.pts),{x:0,y:0,borderColor:hexRgb(it.color),borderWidth:it.w,borderLineCap:1});continue}
        if(it.kind!=="damage")continue;const c=hexRgb(itemColor(it));const PR=itemPrims(it);
        for(const p of PR.paths){if(p.pts.length<2)continue;const o={x:0,y:0,borderColor:c,borderWidth:p.w,borderLineCap:1};if(p.fill){o.color=c;o.opacity=p.fillOp;o.borderOpacity=1}if(p.dash)o.borderDashArray=p.dash;P.drawSvgPath(svgPath(p.pts)+(p.closed?" Z":""),o)}
        for(const q of PR.segs)line([q[0],q[1]],[q[2],q[3]],c,q[4]);
        for(const d of PR.dots){const A=cv([d[0],d[1]]);P.drawCircle({x:A[0],y:A[1],size:d[2],color:c})}
        for(const r of PR.rings){const A=cv([r[0],r[1]]);P.drawCircle({x:A[0],y:A[1],size:r[2],borderColor:c,borderWidth:r[3]})}
        const LO=labelLayout(it,(t,sz)=>font.widthOfTextAtSize(t,sz));const an=anchorOf(it),lb=LO.box;
        if(dist(an,[lb.x,lb.y+lb.h])>fs*1.6&&dist(an,[lb.x,lb.y])>fs*1.6)line(an,[lb.x,lb.y+lb.h-fs*.2],c,.3);box(LO.box.x,LO.box.y,LO.box.w,LO.box.h);
        if(LO.circ){const C=LO.circ,A=cv([C.cx,C.cy]);P.drawCircle({x:A[0],y:A[1],size:C.r,color:PDFLib.rgb(1,1,1),borderColor:c,borderWidth:fs*.09});
          const nw=font.widthOfTextAtSize(C.no,C.size);text(C.no,C.cx-nw/2,C.cy+C.size*.36,C.size,c)}
        for(const l of LO.lines)text(l.t,l.x,l.y,l.size,c)}}
    const bytes=await out.save({useObjectStreams:true});$("#busy").textContent="";toast("PDF를 만들었습니다",1500);
    await saveFile(`${base()}_기입${onlyMarked?"페이지":"전체"}_${stamp()}.pdf`,new Blob([bytes],{type:"application/pdf"}))}
  catch(err){console.error(err);$("#busy").textContent="";toast("PDF를 만들지 못했습니다: "+(err.message||err),4000)}}


/* ---------- merge several tablets' work files ---------- */
function itemRef(it){const t=libById(it.type);if(t.geom==="point")return it.pts[0];const b=bbox(it.pts);return[b.x+b.w/2,b.y+b.h/2]}
function overlapDup(a,b){if(a.type!==b.type)return false;const g=libById(a.type).geom;
  if(g==="point")return dist(a.pts[0],b.pts[0])<10;
  const A=bbox(a.pts),B=bbox(b.pts);const pad=g==="line"?4:1;
  const ix=Math.min(A.x2,B.x2)+pad-Math.max(A.x,B.x)+pad,iy=Math.min(A.y2,B.y2)+pad-Math.max(A.y,B.y)+pad;if(ix<=0||iy<=0)return false;
  if(g==="line")return polyDist(a.pts[0],b.pts)<6||polyDist(b.pts[0],a.pts)<6;
  const inter=ix*iy,uni=(A.w+2)*(A.h+2)+(B.w+2)*(B.h+2)-inter;return inter/uni>.3}
async function renumberPage(n,order){await ensureEx(n);const p=page(n);let no=(S.ex[n]&&S.ex[n].maxNo)||0;for(const r of exRows(n))no=Math.max(no,r.no);
  const ds=p.items.filter(i=>i.kind==="damage"&&!i.chg);
  ds.sort(order==="time"?(a,b)=>(a.t||0)-(b.t||0):(a,b)=>{const A=itemRef(a),B=itemRef(b);return Math.abs(A[0]-B[0])>8?A[0]-B[0]:A[1]-B[1]});
  for(const it of ds)it.no=++no}
$("#mergeIn").onchange=async e=>{const files=[...e.target.files];e.target.value="";if(!files.length)return;
  const rep={files:[],skipped:[],added:0,same:0,conflicts:[],pages:new Set()};
  snapAll();
  for(const f of files){let j;try{j=JSON.parse(await f.text())}catch(err){rep.skipped.push(f.name+" (파일 형식 오류)");continue}
    if(!j.pages){rep.skipped.push(f.name+" (작업 파일 아님)");continue}
    if(j.pdf&&S.name&&j.pdf.name!==S.name){rep.skipped.push(`${f.name} (다른 PDF: ${j.pdf.name})`);continue}
    const tag=(f.name.match(/_작업_(.+)\.json$/i)||[])[1]||f.name.replace(/\.json$/i,"");let cnt=0;
    if(j.lib)for(const t of j.lib)if(!S.lib.find(x=>x.id===t.id))S.lib.push(t);
    if(j.tag!==undefined&&S.doc.tag===undefined)S.doc.tag=j.tag;
    for(const k in j.pages){const src=j.pages[k],dst=page(+k);if(!dst.label&&src.label)dst.label=src.label;if(!dst.scale&&src.scale)dst.scale=src.scale;
      for(const it of src.items||[]){if(dst.items.find(x=>x.id===it.id)){rep.same++;continue}const c=JSON.parse(JSON.stringify(it));if(c.kind==="damage"&&!c.by)c.by=tag;dst.items.push(c);cnt++;rep.pages.add(+k)}
      for(const no in (src.exj||{})){const v=src.exj[no],cur=dst.exj[no];
        if(cur&&cur!==v){rep.conflicts.push(`p.${k} 기존 ${no}번: ${jName(cur)} ↔ ${jName(v)} (${tag}) → '${jName(cur)}' 유지`);continue}
        dst.exj[no]=v;if(src.exq&&src.exq[no])dst.exq[no]=src.exq[no];rep.pages.add(+k)}
      for(const no in (src.exp||{})){const v=String(src.exp[no]),cur=dst.exp[no];if(!cur)dst.exp[no]=v;else if(cur!==v){const set=new Set((cur+","+v).split(",").filter(Boolean));dst.exp[no]=[...set].join(",")}rep.pages.add(+k)}}
    rep.added+=cnt;rep.files.push(`${f.name} — ${cnt}건`)}
  sv("mdn.lib3",S.lib);
  const order=$("#mgOrder")?$("#mgOrder").value:"pos";let dups=0;
  for(const n of rep.pages){const ds=page(n).items.filter(i=>i.kind==="damage");ds.forEach(i=>delete i.dup);
    for(let a=0;a<ds.length;a++)for(let b=a+1;b<ds.length;b++)if((ds[a].by||"")!==(ds[b].by||"")&&overlapDup(ds[a],ds[b])){ds[a].dup=ds[b].dup=true}
    dups+=ds.filter(i=>i.dup).length;$("#busy").textContent=`번호 다시 매기는 중… p.${n}`;await renumberPage(n,order)}
  $("#busy").textContent="";S.sel=null;S.selEx=null;redraw();autosave();
  modal("합치기 결과",`<div class="help" style="color:var(--ink)">
   <b>${rep.files.length}개 파일</b>에서 기입 <b>${rep.added}건</b>을 합쳤습니다 (${rep.pages.size}개 페이지).${rep.same?` 이미 들어 있던 ${rep.same}건은 건너뜀.`:""}<br>
   신규 번호는 각 페이지 <b>도면 물량표 마지막 연번 다음부터 위치순(왼쪽→오른쪽)</b>으로 다시 매겼습니다.<br><br>
   ${rep.files.map(s=>"· "+esc(s)).join("<br>")}
   ${rep.skipped.length?`<br><br><b style="color:var(--accent)">합치지 않은 파일</b><br>${rep.skipped.map(s=>"· "+esc(s)).join("<br>")}`:""}
   ${dups?`<br><br><b style="color:var(--accent)">중복 의심 ${dups}건</b> — 서로 다른 탭에서 같은 자리에 같은 손상을 기입했습니다. 물량 목록에서 '중복 의심' 표시된 건을 확인해 한쪽을 지우세요.`:""}
   ${rep.conflicts.length?`<br><br><b>기존 손상 판정이 서로 다른 건</b><br>${rep.conflicts.map(s=>"· "+esc(s)).join("<br>")}`:""}
   <br><br>확인 후 상단 <b>[저장]</b>을 눌러 통합본 작업 파일로 저장하세요.</div>`);
  $("#panel").hidden=false;S.panelAll=true;$("#vAll").classList.add("on");$("#vPage").classList.remove("on");renderPanel()};
function snapAll(){for(const k in S.doc.pages){(S.undo[k]=S.undo[k]||[]).push(JSON.stringify({items:S.doc.pages[k].items,exj:S.doc.pages[k].exj,exp:S.doc.pages[k].exp,exq:S.doc.pages[k].exq}));S.redo[k]=[]}}


/* ---------- 앱 잠금 (켤 때 한 번 비밀번호 · 비밀번호는 관리자가 Claude를 통해서만 변경) ---------- */
const LOCK_SALT="mangdo-note-lock-v1",LOCK_HASH="bfcf572663a9963b9ff3b1e675e7ecfc670b5f15c4c7b22378b2f20b58e03272";
function sha256hex(str){const K=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
  const b=new TextEncoder().encode(str),l=b.length,n=((l+9+63)>>6)<<6,m=new Uint8Array(n);m.set(b);m[l]=0x80;const bl=l*8;for(let i=0;i<8;i++)m[n-1-i]=Math.floor(bl/Math.pow(2,8*i))&255;
  let H=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225];const w=new Array(64),r=(x,k)=>(x>>>k)|(x<<(32-k));
  for(let o=0;o<n;o+=64){for(let i=0;i<16;i++)w[i]=(m[o+i*4]<<24)|(m[o+i*4+1]<<16)|(m[o+i*4+2]<<8)|m[o+i*4+3];
    for(let i=16;i<64;i++){const s0=r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3),s1=r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}
    let[a,b2,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const S1=r(e,6)^r(e,11)^r(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+w[i])|0,S0=r(a,2)^r(a,13)^r(a,22),mj=(a&b2)^(a&c)^(b2&c),t2=(S0+mj)|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b2;b2=a;a=(t1+t2)|0}
    H=[H[0]+a|0,H[1]+b2|0,H[2]+c|0,H[3]+d|0,H[4]+e|0,H[5]+f|0,H[6]+g|0,H[7]+h|0]}
  return H.map(x=>(x>>>0).toString(16).padStart(8,"0")).join("")}
const pwCheck=pw=>sha256hex(LOCK_SALT+"|"+pw)===LOCK_HASH;
function showLock(){$("#lock").hidden=false;$("#lockPw").value="";$("#lockMsg").textContent="";setTimeout(()=>$("#lockPw").focus(),80)}
$("#lockForm").addEventListener("submit",e=>{e.preventDefault();const pw=$("#lockPw").value;if(!pw){$("#lockMsg").textContent="비밀번호를 입력하세요";return}
  if(pwCheck(pw)){$("#lock").hidden=true;$("#lockPw").value=""}else{$("#lockMsg").textContent="비밀번호가 맞지 않습니다";$("#lockPw").select()}});
$("#lockForgot").onclick=()=>{$("#lockMsg").style.color="var(--muted)";$("#lockMsg").textContent="비밀번호는 관리자(고태훈)에게 문의하세요"};
try{localStorage.removeItem("mdn.lock")}catch(e){}

/* ---------- modal / settings ---------- */
function modal(title,html){$("#mTitle").textContent=title;$("#mBody").innerHTML=html;$("#modal").hidden=false}
function closeModal(){$("#modal").hidden=true}
$("#mX").onclick=closeModal;$("#modal").addEventListener("pointerdown",e=>{if(e.target.id==="modal")closeModal()});
$("#bSet").onclick=openSettings;
function openSettings(){const o=S.opt;const ys=knownYears().filter(y=>y!==String(o.curYear));
  modal("설정",`${S.pdf&&!S.isSample?`<h4>이 망도 라벨 표기</h4><div class="opt"><label>신규 손상 수량 아래에 붙일 조사 표기<select id="oTag">${TAGS.map(([k,v])=>`<option value="${k}" ${(S.doc.tag||"")===k?"selected":""}>${k?`['${String(o.curYear).slice(-2)},${k}] — ${v}`:"없음 (표기 안 함)"}</option>`).join("")}</select></label></div><p class="help">구조물(망도)마다 따로 정해집니다. 작업 파일에도 같이 저장됩니다.</p>`:""}<h4>이번 조사 · 색</h4><div class="opt">
   <label>이 탭 이름 / 조사자 (합칠 때 구분용)<input id="oBy" value="${esc(o.by||"")}" placeholder="예: 1번탭 고태훈"></label>
   <label>이번 조사 연도 (신규 손상 적출년도)<input id="oYr" type="number" value="${o.curYear}"></label>
   <label>신규 손상 색<input id="oC1" type="color" value="${o.stNew}"></label>
   <label>보수 색<input id="oC3" type="color" value="${o.stRep}"></label>
   <label>기존(살아있는 손상) 기본 색<input id="oC2" type="color" value="${o.stOld}"></label>
   <label>삭제 색<input id="oC4" type="color" value="${o.stDel}"></label></div>
  <h4>적출년도별 색 (기존 손상)</h4><p class="help">도면 물량표에서 읽은 연도입니다. 비워 두면 기본 색(검정)을 씁니다.</p>
  <div class="opt" id="yrCols">${ys.length?ys.map(y=>`<label>${y}년 적출<input type="color" data-yr="${y}" value="${o.yearColors[y]||o.stOld}"></label>`).join(""):`<span class="help">아직 읽은 연도가 없습니다. 도면 PDF를 열면 나타납니다.</span>`}</div>
  <h4>손상 목록 · 단위 · 해치</h4><p class="help">길게 누르면 나오는 메뉴는 <b>단위(m · ㎡ · EA)</b>별로 묶여 나옵니다(키보드 1~9). <b>그리기</b>는 도면에 그리는 방식(선·면·점), <b>단위</b>는 물량 단위입니다. 손상마다 수량 입력 때 단위를 바꿀 수도 있습니다. 면 손상은 모두 <b>네모</b>로 그려집니다(균열 등 선 손상 제외). <b>T</b>를 켜면 깊이(T=10mm) 칸, <b>Cw</b>를 켜면 면적 손상에 균열폭(cw=0.2㎜) 칸이 생깁니다.</p>
  <div class="tw"><table class="lt"><thead><tr><th></th><th>물량표 명칭</th><th>도면 표기</th><th>그리기</th><th>단위</th><th>해치·선 모양</th><th>T</th><th>Cw</th><th>폭 빠른선택(mm)</th><th></th></tr></thead><tbody id="libT"></tbody></table></div>
  <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn" id="libAdd" style="border:1px solid var(--line)">+ 손상 추가</button><button class="btn" id="libReset" style="border:1px solid var(--line)">기본값으로</button></div>
  <h4>표기</h4><div class="opt">
   <label>${S.pdf&&!S.isSample?"이 망도 라벨 크기 (pt)":"라벨 크기 기본값 (pt)"}<input id="oFs" type="number" step="0.5" min="2" max="20" value="${S.pdf&&!S.isSample?FSb():o.fs}"></label>
   <label>해치 간격 (pt)<input id="oHs" type="number" step="0.2" min="0.8" max="10" value="${o.hatchSp}"></label>
   <label>균열선 굵기 (얇은/굵은)<span style="display:flex;gap:6px"><input id="oLw" type="number" step="0.1" value="${o.lw}"><input id="oLw2" type="number" step="0.1" value="${o.lwThick}"></span></label>
   <label>면적 곱하기 표기<select id="oX"><option value="X" ${o.xch==="X"?"selected":""}>0.3X0.5</option><option value="x" ${o.xch==="x"?"selected":""}>0.3x0.5</option><option value="×" ${o.xch==="×"?"selected":""}>0.3×0.5</option></select></label>
   <label class="ck"><input id="oScale" type="checkbox" ${o.toScale?"checked":""}> 입력한 수량대로 축척에 맞춰 그리기</label>
   <label class="ck"><input id="oName" type="checkbox" ${o.showName?"checked":""}> 라벨에 손상명 표시</label>
   <label class="ck"><input id="oMem" type="checkbox" ${o.showMem?"checked":""}> 라벨에 부재위치 표시 (화면 확인용 · PDF·CAD에는 안 나옴)</label>
   <label class="ck"><input id="oEx" type="checkbox" ${o.showEx?"checked":""}> 기존 손상 번호에 동그라미 표시</label>
   <label class="ck"><input id="oRep" type="checkbox" ${o.repeat?"checked":""}> 같은 손상 연속 입력</label>
   <label class="ck"><input id="oFinger" type="checkbox" ${o.fingerDraw?"checked":""}> 손가락으로도 그리기</label></div>
  <h4>사용법</h4><div class="help">
   · <b>S펜으로 길게 누르기</b>(또는 펜 측면 버튼 누른 채 터치, PC는 우클릭) → 단위별 손상 메뉴<br>
   · 균열은 선을 따라, 면 손상은 대각선으로 끌거나 둘레를 한 바퀴. EA 손상은 메뉴에서 고르면 그 자리에 바로 찍힘<br>
   · 번호는 도면 물량표의 마지막 연번 다음부터 자동으로 이어집니다<br>
   · <b>선택</b> 도구로 기존 손상 번호(점선 동그라미)를 누르면 <b>유지·변경·보수·삭제</b> 판정. 변경은 바뀐 전체 물량을 입력한 뒤 변경된 범위를 그리면 같은 번호로 26.하 변경 표기<br>
   · 손가락: 한 손가락 이동, 두 손가락 확대/축소<br>
   · 단축키 <kbd>P</kbd> 펜 <kbd>V</kbd> 선택 <kbd>E</kbd> 지우개 <kbd>S</kbd> 손상메뉴 <kbd>F</kbd> 맞춤 <kbd>←</kbd><kbd>→</kbd> 페이지</div>`);
  renderLibT();
  if($("#oTag"))$("#oTag").onchange=e=>{S.doc.tag=e.target.value;redraw();autosave()};
  const bind=(id,k,f=v=>v)=>{$(id).onchange=e=>{S.opt[k]=f(e.target.type==="checkbox"?e.target.checked:e.target.value);saveOpt();redraw()}};
  bind("#oBy","by",v=>v.trim());$("#oFs").onchange=e=>{const v=parseFloat(e.target.value);if(!(v>0))return;if(S.pdf&&!S.isSample){S.doc.fs=v;autosave()}else{S.opt.fs=v;saveOpt()}redraw()};bind("#oHs","hatchSp",parseFloat);bind("#oLw","lw",parseFloat);bind("#oLw2","lwThick",parseFloat);bind("#oYr","curYear",v=>parseInt(v)||new Date().getFullYear());
  bind("#oC1","stNew");bind("#oC2","stOld");bind("#oC3","stRep");bind("#oC4","stDel");bind("#oX","xch");bind("#oName","showName");bind("#oMem","showMem");bind("#oScale","toScale");bind("#oEx","showEx");bind("#oRep","repeat");bind("#oFinger","fingerDraw");
  $("#yrCols").onchange=e=>{const y=e.target.dataset.yr;if(!y)return;S.opt.yearColors[y]=e.target.value;saveOpt();redraw()};
  $("#libAdd").onclick=()=>{S.lib.push({id:"u"+uid(),name:"새 손상",short:"새 손상",geom:"area",unit:"㎡",hatch:"grid",widths:"",shape:""});saveLib()};
  let armReset=false;$("#libReset").onclick=e=>{if(!armReset){armReset=true;e.target.textContent="한 번 더 누르면 초기화";return}S.lib=JSON.parse(JSON.stringify(DEF_LIB));saveLib()}}
function renderLibT(){$("#libT").innerHTML=S.lib.map((t,i)=>{const pats=PATS_BY_GEOM[t.geom]||AREA_PATS;return `<tr data-i="${i}"><td class="sw">${swatchSVG(t)}</td>
  <td><input data-k="name" value="${esc(t.name)}"></td><td><input data-k="short" value="${esc(t.short||"")}"></td>
  <td><select data-k="geom">${Object.entries(GEOMS).map(([k,v])=>`<option value="${k}" ${t.geom===k?"selected":""}>${v}</option>`).join("")}</select></td>
  <td><select data-k="unit">${UNITS.map(u=>`<option value="${u}" ${(t.unit||UNIT[t.geom])===u?"selected":""}>${u}</option>`).join("")}</select></td>
  <td><select data-k="hatch">${Object.entries(pats).map(([k,v])=>`<option value="${k}" ${t.hatch===k?"selected":""}>${v}</option>`).join("")}</select></td>
  <td style="text-align:center"><input type="checkbox" data-k="depth" ${t.depth?"checked":""} style="width:auto;min-height:0"></td>
  <td style="text-align:center">${t.geom!=="line"?`<input type="checkbox" data-k="cw" ${t.cw?"checked":""} style="width:auto;min-height:0">`:""}</td>
  <td><input data-k="widths" value="${esc(t.widths||"")}" ${(t.unit||UNIT[t.geom])!=="m"?"disabled":""} placeholder="0.2,0.3"></td>
  <td style="white-space:nowrap"><button class="mini" data-a="up">↑</button> <button class="mini" data-a="dn">↓</button> <button class="mini" data-a="rm">✕</button></td></tr>`}).join("");
  $("#libT").onchange=e=>{const tr=e.target.closest("tr");const t=S.lib[+tr.dataset.i];const k=e.target.dataset.k;
    if(k==="geom"&&Object.values(S.doc.pages).some(p=>p.items.some(it=>it.type===t.id))){toast("이미 도면에 쓰인 손상은 그리는 방식을 바꿀 수 없습니다");return renderLibT()}
    if(k==="shape")t.shape=e.target.checked?"ellipse":"";else if(k==="depth"||k==="cw")t[k]=e.target.checked;else t[k]=e.target.value;
    if(k==="geom"){const pats=PATS_BY_GEOM[t.geom];if(!pats[t.hatch])t.hatch=Object.keys(pats)[t.geom==="area"?2:0];if(!t.unit)t.unit=UNIT[t.geom]}
    saveLib()};
  $("#libT").onclick=e=>{const a=e.target.dataset.a;if(!a)return;const i=+e.target.closest("tr").dataset.i;
    if(a==="up"&&i>0)[S.lib[i-1],S.lib[i]]=[S.lib[i],S.lib[i-1]];if(a==="dn"&&i<S.lib.length-1)[S.lib[i+1],S.lib[i]]=[S.lib[i],S.lib[i+1]];
    if(a==="rm"){const used=Object.values(S.doc.pages).some(p=>p.items.some(it=>it.type===S.lib[i].id));if(used)return toast("이미 도면에 쓰인 손상은 지울 수 없습니다. 이름만 바꾸세요");S.lib.splice(i,1)}saveLib()}}
function saveLib(){sv("mdn.lib3",S.lib);renderLibT();redraw()}

/* ---------- sample drawing (first view) — includes a small 손상물량표 so existing damages are read ---------- */
async function makeSample(){const{PDFDocument,rgb}=PDFLib;const d=await PDFDocument.create();d.registerFontkit(fontkit);
  const font=await d.embedFont(Uint8Array.from(atob(KR_FONT_B64),c=>c.charCodeAt(0)),{subset:false});
  const W=1191,H=842,p=d.addPage([W,H]);const k=rgb(.12,.12,.12),g=rgb(.45,.45,.45),blue=rgb(.12,.37,.82);
  const T=(s,x,y,size,c)=>p.drawText(s,{x,y:H-y,size,font,color:c||k});const Ln=(x1,y1,x2,y2,w,c,da)=>p.drawLine({start:{x:x1,y:H-y1},end:{x:x2,y:H-y2},thickness:w,color:c||k,dashArray:da});
  p.drawRectangle({x:30,y:30,width:W-60,height:H-60,borderColor:k,borderWidth:1.2});
  T("외 관 조 사 망 도",50,62,16);T("(예시) 본선 바닥판 하면(S1)",870,790,12);
  const x0=70,y0=150,ww=600,hh=420;p.drawRectangle({x:x0,y:H-y0-hh,width:ww,height:hh,borderColor:k,borderWidth:.9});
  for(let i=1;i<6;i++){const y=y0+hh*i/6;Ln(x0,y,x0+ww,y,i%2?.35:.9,i%2?g:k)}
  for(let i=1;i<6;i++){const x=x0+ww*i/6;Ln(x,y0,x,y0+hh,.35,g,[4,3])}
  ["G3","G2","G1"].forEach((s,i)=>T(s,x0-22,y0+hh*(2*i+1)/6+4,9));T("A1",x0-6,y0+hh+18,9);T("P1",x0+ww-8,y0+hh+18,9);T("L = 30.0 m",x0+ww/2-26,y0+hh+20,9);
  // existing damages drawn on the drawing (black = 살아있는 손상, blue = 보수)
  const ex=[[1,"균열",160,215,"0.2/1.5 2EA",k],[2,"철근노출",330,300,"0.3X0.2",k],[3,"백태",480,240,"1.0X0.8",blue],[4,"박리",250,420,"0.4X0.3",k],[5,"배수관 탈락",560,500,"1EA",k]];
  for(const[no,nm,x,y,q,c]of ex){p.drawCircle({x:x+3,y:H-(y-2.5),size:5.2,borderColor:c,borderWidth:.6});T(String(no),x,y,7,c);T(nm,x+10,y,7,c);T(q,x+10,y+7.5,7,c)}
  Ln(130,230,150,222,.8,k);Ln(150,222,158,226,.8,k);p.drawRectangle({x:320,y:H-312,width:14,height:9,color:k,opacity:.5});
  p.drawRectangle({x:450,y:H-262,width:26,height:18,borderColor:blue,borderWidth:.6});p.drawRectangle({x:236,y:H-436,width:12,height:9,borderColor:k,borderWidth:.6});
  // 손상물량표
  T("손 상 물 량 표",730,95,15);const hy=128;
  const hdr=[["연번",720],["적 출",748],["결 함 종 류",800],["폭",860],["길이",880],["깊이",902],["물량",922],["단위",944],["개소",964],["년월",986],["공법명/자재명",1006],["물량",1070],["비고",1100]];
  for(const[s,x]of hdr)T(s,x,hy,7);Ln(715,hy+6,1130,hy+6,.6);Ln(715,115,1130,115,.6);
  const rows=[["1","2018","균열(Cw=0.3㎜미만)","0.20","1.50","","3.00","m","2","","","","기존"],["2","2020","철근노출","0.30","0.20","","0.06","㎡","1","","","","기존"],
    ["3","2022","백태","1.00","0.80","","0.80","㎡","1","2023","표면보수","0.80","보수"],["4","2023","박리","0.40","0.30","","0.12","㎡","1","","","","기존"],["5","2023","배수관탈락","","","","1.00","EA","1","","","","기존"]];
  rows.forEach((r,i)=>{const y=hy+20+i*14;const xs=[723,748,770,858,878,900,920,946,968,986,1006,1068,1100];r.forEach((s,j)=>{if(s)T(s,xs[j],y,7.5)});Ln(715,y+5,1130,y+5,.3,g)});
  return await d.save()}
function sampleDoc(){const it=(no,type,pts,o)=>Object.assign({id:uid(),kind:"damage",type,no,pts,st:"new",yr:String(S.opt.curYear),w:"",L:"",a:"",b:"",n:1,lp:[0,0]},o);
  const items=[it(6,"c2",[[390,330],[420,322],[444,328],[470,316]],{w:"0.3",L:"3.5",lp:[473,312]}),
    it(7,"spall",[[560,170],[600,170],[600,196],[560,196]],{a:"1.9",b:"1.3",lp:[603,166]}),
    it(8,"scal",[[600,420],[618,420],[618,432],[600,432]],{a:"0.8",b:"0.6",lp:[621,416]}),
    it(9,"bolt",[[200,520]],{n:4,lp:[204,516]})];
  return{pages:{1:{label:"",scale:30/600,items,exj:{2:"rep",4:"prog"},exq:{4:{a:"0.6",b:"0.5",n:1}}}}}}

/* ---------- boot ---------- */
async function boot(){showLock();renderInk();thumbsEl.hidden=!thPref();$("#bThumbs").classList.toggle("on",!thumbsEl.hidden);await idbOpen();await libLoad();await migrate();setMode("home");
  if(!idb)toast("이 브라우저에서는 앱 안에 보관할 수 없습니다. 앱으로 설치해서 쓰세요",5000)}
window.addEventListener("beforeunload",e=>{if(S.dirty){e.preventDefault();e.returnValue=""}});
window.__mdn=S;boot();
})();

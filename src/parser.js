/* PARSER_START */
/* 도면 위 손상 라벨: 번호(동그라미 안 숫자 또는 ①~㊿) + 손상명, 그 아래 수량, ['25,상] 같은 적출 표기 */
function circNum(s){const c=s.codePointAt(0);const R=[[0x2460,0x2473,1],[0x3251,0x325F,21],[0x32B1,0x32BF,36],[0x2776,0x277F,1],[0x2780,0x2789,1],[0x278A,0x2793,1],[0x24EB,0x24F4,11],[0x24F5,0x24FE,1]];
  for(const[a,b,o]of R)if(c>=a&&c<=b)return c-a+o;return 0}
const nameOK=s=>/^[가-힣]/.test(s)||(/^[A-Za-z]{2,}/.test(s)&&!/^EA(\b|$)/i.test(s));
function findLabels(draw){const out=[];
  for(const t of draw){const s=t.s.trim();if(!s)continue;let no=0,rest="";
    const cn=circNum(s);if(cn){no=cn;rest=s.slice(1).trim()}
    else{const m=s.match(/^(\d{1,3})\s*(.*)$/);if(!m)continue;no=+m[1];rest=m[2]}
    if(!no)continue;let nameTok=null,name="";
    if(nameOK(rest)){nameTok=t;name=rest}
    else if(!rest){nameTok=draw.find(o=>o!==t&&o.x>t.x+1&&o.x<t.x+t.h*3.4&&Math.abs(o.y-t.y)<t.h*.8&&nameOK(o.s.trim()));if(nameTok)name=nameTok.s.trim()}
    if(!nameTok)continue;out.push({no,t,nameTok,name})}
  return out}
function labelDetails(L,draw){const t=L.t,h=t.h,x0=Math.min(t.x,L.nameTok.x)-h*.5,x1=L.nameTok.x+h*14;
  const below=draw.filter(o=>o.y>t.y+h*.3&&o.y<t.y+h*3.6&&o.x>=x0&&o.x<=x1).sort((a,b)=>a.y-b.y);
  let q="",yr="",by=t.y;for(const o of below){const s=o.s.trim();if(!yr){const m=s.match(/\[?\s*['’`]?(\d{2})\s*[,.]?\s*([상하])?/);if(/[\[\]'’]/.test(s)&&m){yr=String(2000+ +m[1]);by=Math.max(by,o.y);continue}}
    if(!q&&/(\d|L=)/.test(s)&&/[\/xX×]|L\s*=|EA/i.test(s)){q=s;by=Math.max(by,o.y)}}
  return{q,yr,by}}
function rowFromLabel(L,det){const row={no:L.no,yr:det.yr,name:L.name.replace(/\s+/g," ").trim(),w:"",L:"",d:"",q:"",u:"",n:"1",ry:"",m:"",rq:"",note:"",fromLabel:true};
  let q=det.q.replace(/\s+/g," ").trim();const ea=q.match(/\(?\s*(\d+)\s*EA\s*\)?/i);
  if(ea){row.n=ea[1];q=q.replace(ea[0],"").trim()}
  let m;
  if((m=q.match(/^([\d.]+)\s*\/\s*([\d.]+)/))){row.w=m[1];row.L=m[2];row.u="m";row.q=String(+(+m[2]*+row.n).toFixed(2))}
  else if((m=q.match(/^L\s*=\s*([\d.]+)/i))){row.L=m[1];row.u="m";row.q=String(+(+m[1]*+row.n).toFixed(2))}
  else if((m=q.match(/^([\d.]+)\s*[xX×]\s*([\d.]+)/))){row.w=m[1];row.L=m[2];row.u="㎡";row.q=String(+(+m[1]*+m[2]*+row.n).toFixed(3))}
  else{row.u="EA";row.q=row.n}
  return row}
function parseExisting(items){
  const norm=s=>s.replace(/\s+/g,"");
  const hdr=items.find(i=>norm(i.s)==="연번");let rows=[],x0=1e9;
  if(hdr){
    const near=(t,minX)=>items.filter(i=>norm(i.s)===t&&Math.abs(i.y-hdr.y)<16&&i.x>=(minX||0)).sort((a,b)=>a.x-b.x);
    const H={no:hdr.x,yr:(near("적출")[0]||near("적출년도")[0]||{x:hdr.x+20}).x,nm:(near("결함종류")[0]||near("손상종류")[0]||{x:hdr.x+60}).x};
    const pick=(t,k)=>{const a=near(t);return a.length?a[k||0].x:null};
    const qtys=near("물량");H.w=pick("폭");H.L=pick("길이");H.d=pick("깊이");H.q=qtys[0]?qtys[0].x:null;H.u=pick("단위");H.n=pick("개소");H.ry=pick("년월");H.rq=qtys[1]?qtys[1].x:null;H.note=pick("비고");H.m=pick("공법명/자재명");
    if(H.w!=null&&H.note!=null){
      x0=hdr.x-12;const x1=H.note+30,yTop=hdr.y+14;
      const body=items.filter(i=>i.x>=x0&&i.x<=x1&&i.y>yTop);
      const rowsY=[];for(const it of body.filter(i=>Math.abs(i.x-hdr.x)<10&&/^\d+$/.test(i.s.trim())))rowsY.push({y:it.y,no:+it.s.trim()});
      const numCols=[["w",H.w],["L",H.L],["d",H.d],["q",H.q],["u",H.u],["n",H.n],["ry",H.ry],["rq",H.rq]].filter(c=>c[1]!=null);
      for(const r of rowsY){const toks=body.filter(i=>Math.abs(i.y-r.y)<3).sort((a,b)=>a.x-b.x);
        const row={no:r.no,yr:"",name:"",w:"",L:"",d:"",q:"",u:"",n:"",ry:"",m:"",rq:"",note:""};
        for(const t of toks){const s=t.s.trim();if(!s)continue;
          if(Math.abs(t.x-hdr.x)<10&&/^\d+$/.test(s))continue;
          if(t.x<H.yr+14&&/^\d{4}$/.test(s)){row.yr=s;continue}
          if(t.x<H.w-6){row.name+=(row.name?" ":"")+s;continue}
          if(Math.abs(t.x-H.note)<16&&!/^[\d.]+$/.test(s)){row.note+=s;continue}
          if(H.m!=null&&!/^[\d.]+$/.test(s)&&!/^(m|㎡|m2|EA|ea|개소|㎥)$/.test(s)&&t.x>(H.ry||H.n)+8){row.m+=s;continue}
          let best=null,bd=1e9;for(const[k,x]of numCols){const dd=Math.abs(t.x-x);if(dd<bd){bd=dd;best=k}}
          if(best)row[best]=(row[best]?row[best]+" ":"")+s}
        row.name=row.name.replace(/\s+/g," ").trim();rows.push(row)}}}
  // 도면 라벨 (물량표가 없는 페이지도 라벨에서 번호·손상·수량·적출년도를 읽음)
  const draw=items.filter(i=>i.x<x0-4);const labels={};let maxNo=0;
  const tableRows=rows.length>0;
  for(const L of findLabels(draw)){const inTable=tableRows&&rows.find(r=>!r.fromLabel&&r.no===L.no);const det=labelDetails(L,draw);
    if(!inTable&&!det.q&&!det.yr)continue; /* 축 번호·도면 제목 숫자 등은 제외 */
    maxNo=Math.max(maxNo,L.no);
    if(!inTable){if(tableRows)continue;if(!rows.find(r=>r.no===L.no))rows.push(rowFromLabel(L,det))}
    if(!labels[L.no])labels[L.no]={x:L.t.x,y:L.t.y,h:L.t.h,nx:L.nameTok.x,by:det.by||L.t.y}}
  if(rows.length&&rows[0].fromLabel)rows.sort((a,b)=>a.no-b.no);
  for(const r of rows)maxNo=Math.max(maxNo,r.no);
  return{rows,labels,maxNo,title:titleOf(items),noTable:!(rows.length&&!rows[0].fromLabel)}}
function titleOf(items){const dm=items.find(i=>i.s.replace(/\s+/g,"")==="도면명");if(!dm)return"";
  const c=items.filter(i=>i!==dm&&i.x>dm.x+5&&Math.abs(i.y-dm.y)<4).sort((a,b)=>a.x-b.x);return c.length?c[0].s.trim():""}
/* PARSER_END */
if(typeof module!=="undefined")module.exports={parseExisting};

'use strict';
const DATA=window.BUDGET_DATA.rows;
const COLORS=['#7860ed','#19b7a2','#f4aa4c','#ef6da3','#5798f3','#9b7fe7','#43c9db','#ea8064'];
const SECTOR={'전력운영':COLORS[0],'방위력개선':COLORS[1],'병무행정':COLORS[2]};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,d=0)=>Number(v).toLocaleString('ko-KR',{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=v=>v===null?'—':`${v>0?'+':''}${num(v*100,1)}%`;
const label=r=>r.program||r.account;
const sum=(rows,key)=>rows.reduce((s,r)=>s+r[key],0);
let filtered=DATA,sortKey='y27',sortDir=-1;
const unit=()=>Number($('unit').value);
const amount=v=>num(v/unit(),unit()===1?0:2);
const unitName=()=>unit()===1?'억 원':'조 원';
const short=(s,n=15)=>s.length>n?s.slice(0,n-1)+'…':s;
const tip=(name,a,b)=>`${name}\n2026년: ${num(a)}억 원\n2027년: ${num(b)}억 원\n증감: ${num(b-a)}억 원\n증감률: ${a?pct((b-a)/a):'—'}`;
const attr=t=>`data-tip="${esc(t)}" tabindex="0"`;
const text=(x,y,t,opts='')=>`<text x="${x}" y="${y}" ${/\bfill=/.test(opts)?'':'fill="#9195ab"'} ${/\bfont-size=/.test(opts)?'':'font-size="10"'} ${opts}>${esc(t)}</text>`;
const line=(x1,y1,x2,y2,color='#eeeff6')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}"/>`;
function svg(id,w,h,body,legend=''){$(id).innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc($(id).closest('article').querySelector('h3').textContent)}">${body}</svg>${legend}`;}
function empty(id,msg='현재 조건에 해당하는 데이터가 없습니다.'){$(id).innerHTML=`<div class="empty">${esc(msg)}</div>`;}
function legend(items){return `<div class="legend">${items.map(([name,c])=>`<span><i style="background:${c}"></i>${esc(name)}</span>`).join('')}</div>`;}
function group(rows,key){const map=new Map();rows.forEach(r=>{const name=typeof key==='function'?key(r):r[key];if(!map.has(name))map.set(name,{name,y26:0,y27:0});const g=map.get(name);g.y26+=r.y26;g.y27+=r.y27;});return [...map.values()];}
function extent(values){let lo=Math.min(0,...values),hi=Math.max(0,...values);if(lo===hi)hi=1;return[lo<0?lo*1.12:0,hi>0?hi*1.12:0];}
function paired(id,groups){
 if(!groups.length)return empty(id);
 const W=550,H=Math.max(245,groups.length*63+40),L=140,R=44,T=15,B=27;
 const [lo,hi]=extent(groups.flatMap(g=>[g.y26,g.y27]));const x=v=>L+(v-lo)/(hi-lo)*(W-L-R);let body='';
 for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;body+=line(x(v),T,x(v),H-B)+text(x(v),H-7,amount(v),'text-anchor="middle"');}
 body+=line(x(0),T,x(0),H-B,'#d5d5e7');
 const band=(H-T-B)/groups.length;
 groups.forEach((g,i)=>{const y=T+band*i+band/2;body+=text(L-12,y+3,short(g.name,14),'text-anchor="end" fill="#5b5e79"');
 [g.y26,g.y27].forEach((v,j)=>{const yy=y-17+j*19;body+=`<rect x="${Math.min(x(0),x(v))}" y="${yy}" width="${Math.max(1,Math.abs(x(v)-x(0)))}" height="13" rx="4" fill="${j?COLORS[0]:'#cfc5ff'}" ${attr(tip(g.name,g.y26,g.y27))}/>`;});});
 svg(id,W,H,body,legend([['2026년','#cfc5ff'],['2027년',COLORS[0]],[`단위: ${unitName()}`,'#ececf5']]));
}
function donut(id,groups,sectorColor=false){
 const positive=groups.filter(g=>g.y27>0),total=sum(positive,'y27');if(!total)return empty(id,'선택한 항목에 양수 재원이 없습니다.');
 const W=550,H=245,cx=145,cy=119,r=77,c=2*Math.PI*r;let acc=0,body=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f0edfb" stroke-width="29"/>`;
 positive.forEach((g,i)=>{const share=g.y27/total,color=sectorColor?SECTOR[g.name]:COLORS[i%COLORS.length];body+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="29" stroke-dasharray="${share*c} ${c-share*c}" stroke-dashoffset="${-acc*c}" transform="rotate(-90 ${cx} ${cy})" ${attr(`${g.name}\n${num(g.y27)}억 원\n양수 재원 비중: ${num(share*100,1)}%`)}/>`;acc+=share;
 const yy=55+i*40;body+=`<rect x="280" y="${yy-9}" width="9" height="9" rx="3" fill="${color}"/>`+text(298,yy,short(g.name,20),'fill="#5b5e79"')+text(298,yy+16,`${num(g.y27/10000,2)}조 원`,'font-size="9"')+text(535,yy+4,`${num(share*100,1)}%`,'text-anchor="end" fill="#353650" font-weight="700"');});
 body+=text(cx,cy-10,'양수 재원 합계','text-anchor="middle"')+text(cx,cy+19,num(total/10000,2),'text-anchor="middle" font-size="25" font-weight="800" fill="#34324d"')+text(cx,cy+39,'조 원','text-anchor="middle"');svg(id,W,H,body);
}
function bars(id,rows,key,limit){
 if(!rows.length)return empty(id);
 const data=[...rows].sort((a,b)=>key==='y27'?b.y27-a.y27:Math.abs(b[key])-Math.abs(a[key])).slice(0,limit);
 const W=550,H=Math.max(325,data.length*31+36),L=157,R=57,T=10,B=30;
 const vals=data.map(r=>r[key]);const [lo,hi]=extent(vals);const x=v=>L+(v-lo)/(hi-lo)*(W-L-R);let body='';
 for(let i=0;i<=4;i++){let v=lo+(hi-lo)*i/4;body+=line(x(v),T,x(v),H-B)+text(x(v),H-6,key==='rate'?`${num(v*100,0)}%`:amount(v),'text-anchor="middle" font-size="9"');}
 body+=line(x(0),T,x(0),H-B,'#d8d8e7');const band=(H-T-B)/data.length;
 data.forEach((r,i)=>{const v=r[key],y=T+band*i+band/2;const color=key==='y27'?SECTOR[r.sector]:v>=0?COLORS[1]:COLORS[3];
 body+=text(L-10,y+3,short(label(r),17),'text-anchor="end" fill="#63667f"')+`<rect x="${Math.min(x(0),x(v))}" y="${y-8}" width="${Math.max(1,Math.abs(x(v)-x(0)))}" height="17" rx="4" fill="${color}" ${attr(tip(label(r),r.y26,r.y27))}/>`;
 const labelValue=key==='rate'?pct(v):amount(v);body+=text(W-2,y+3,labelValue,'text-anchor="end" font-size="9" fill="#656982"');});
 svg(id,W,H,body,legend(key==='y27'?Object.entries(SECTOR):[['증가',COLORS[1]],['감소',COLORS[3]]]));
}
function scatter(rows){
 const data=rows.filter(r=>r.y27>0&&r.y26>0&&r.rate!==null);if(!data.length)return empty('scatter-chart','선택한 항목에 양수 예산이 없습니다.');
 const W=550,H=350,L=57,R=30,T=20,B=48,xmax=Math.max(...data.map(r=>r.y27))*1.12;
 let ymin=Math.min(0,...data.map(r=>r.rate))-.05,ymax=Math.max(.05,...data.map(r=>r.rate))+.08;
 const x=v=>L+v/xmax*(W-L-R),y=v=>H-B-(v-ymin)/(ymax-ymin)*(H-T-B);let body='';
 for(let i=0;i<=4;i++){const a=xmax*i/4,b=ymin+(ymax-ymin)*i/4;body+=line(x(a),T,x(a),H-B)+text(x(a),H-B+20,amount(a),'text-anchor="middle" font-size="9"')+line(L,y(b),W-R,y(b))+text(L-9,y(b)+3,`${num(b*100,0)}%`,'text-anchor="end"');}
 body+=line(L,y(0),W-R,y(0),'#c6c5dd');data.forEach(r=>{const radius=6+Math.sqrt(r.y27/xmax)*11;body+=`<circle cx="${x(r.y27)}" cy="${y(r.rate)}" r="${radius}" fill="${SECTOR[r.sector]}" fill-opacity=".7" stroke="white" stroke-width="2" ${attr(tip(label(r),r.y26,r.y27))}/>`;});
 data.slice().sort((a,b)=>b.y27-a.y27).slice(0,3).forEach(r=>body+=text(x(r.y27),y(r.rate)-20,short(label(r),12),'text-anchor="middle" font-size="9" fill="#646780"'));
 body+=text(W/2,H-3,`2027년 예산 (${unitName()})`,'text-anchor="middle"');svg('scatter-chart',W,H,body,legend(Object.entries(SECTOR)));
}
function waterfall(rows){
 if(!rows.length)return empty('waterfall-chart');
 const a=sum(rows,'y26'),b=sum(rows,'y27'),groups=group(rows,'sector');let running=a;
 const steps=[{name:'2026년',from:0,to:a,total:true}];groups.forEach(g=>{const to=running+g.y27-g.y26;steps.push({name:g.name,from:running,to,value:g.y27-g.y26});running=to;});steps.push({name:'2027년',from:0,to:b,total:true});
 const W=1120,H=260,L=65,R=30,T=20,B=48;const [lo,hi]=extent(steps.flatMap(g=>[g.from,g.to]));const y=v=>H-B-(v-lo)/(hi-lo)*(H-T-B),band=(W-L-R)/steps.length,bw=band*.42;let body='';
 for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;body+=line(L,y(v),W-R,y(v))+text(L-10,y(v)+4,amount(v),'text-anchor="end" font-size="9"');}
 steps.forEach((s,i)=>{const x=L+i*band+band/2-bw/2,top=y(Math.max(s.from,s.to)),bottom=y(Math.min(s.from,s.to));body+=`<rect x="${x}" y="${top}" width="${bw}" height="${Math.max(1,bottom-top)}" rx="5" fill="${s.total?COLORS[0]:s.value>=0?COLORS[1]:COLORS[3]}" ${attr(`${s.name}\n${s.total?'순재원':'증감'}: ${num(s.total?s.to:s.value)}억 원`)}/>`+text(x+bw/2,top-9,`${!s.total&&s.value>0?'+':''}${amount(s.total?s.to:s.value)}`,'text-anchor="middle" fill="#4f526d" font-weight="700"')+text(x+bw/2,H-B+24,s.name,'text-anchor="middle"');
 if(i<steps.length-1)body+=`<line x1="${x+bw}" y1="${y(s.to)}" x2="${L+(i+1)*band+band/2-bw/2}" y2="${y(s.to)}" stroke="#cac8de" stroke-dasharray="4 4"/>`;});svg('waterfall-chart',W,H,body,legend([[`단위: ${unitName()}`,'#ececf5']]));
}
// Recursive balanced area layout; every rectangle retains its source record.
function tile(items,x,y,w,h,result){
 if(!items.length)return;
 if(items.length===1){result.push({...items[0],x,y,w,h});return;}
 const total=sum(items,'y27');let acc=0,k=0;while(k<items.length-1&&acc<total/2){acc+=items[k].y27;k++;}
 if(w>=h){const cut=w*acc/total;tile(items.slice(0,k),x,y,cut,h,result);tile(items.slice(k),x+cut,y,w-cut,h,result);}
 else{const cut=h*acc/total;tile(items.slice(0,k),x,y,w,cut,result);tile(items.slice(k),x,y+cut,w,h-cut,result);}
}
function treemap(rows){
 const data=rows.filter(r=>r.y27>0).sort((a,b)=>b.y27-a.y27);if(!data.length)return empty('treemap-chart','선택한 항목에 양수 재원이 없습니다.');
 const W=1120,H=335,rects=[];tile(data,0,0,W,H,rects);let body='';
 rects.forEach((r,i)=>{body+=`<rect x="${r.x+2}" y="${r.y+2}" width="${Math.max(0,r.w-4)}" height="${Math.max(0,r.h-4)}" rx="7" fill="${SECTOR[r.sector]}" fill-opacity="${.65+(i%4)*.1}" ${attr(tip(label(r),r.y26,r.y27))}/>`;
 if(r.w>85&&r.h>42){body+=text(r.x+12,r.y+23,short(label(r),Math.floor((r.w-24)/12)),'fill="white" font-size="12" font-weight="700"');if(r.h>65)body+=text(r.x+12,r.y+44,`${amount(r.y27)} ${unitName()}`,'fill="#ffffffdb" font-size="10"');}});svg('treemap-chart',W,H,body,legend(Object.entries(SECTOR)));
}
function heatmap(rows){
 const groups=group(rows,r=>r.category||r.account);if(!groups.length)return empty('heatmap-chart');
 const W=1120,H=Math.max(220,groups.length*35+48),L=235,CW=(W-L-10)/2,m=Math.max(1,...groups.flatMap(g=>[Math.abs(g.y26),Math.abs(g.y27)]));let body=text(L+CW/2,17,'2026년','text-anchor="middle"')+text(L+CW*1.5,17,'2027년','text-anchor="middle"');
 groups.sort((a,b)=>b.y27-a.y27).forEach((g,i)=>{const y=30+i*35;body+=text(L-15,y+20,short(g.name,25),'text-anchor="end" fill="#666a84"');[g.y26,g.y27].forEach((v,j)=>{const intensity=.1+.84*Math.sqrt(Math.abs(v)/m),color=v<0?'239,109,163':j?'120,96,237':'25,183,162';body+=`<rect x="${L+j*CW}" y="${y}" width="${CW-7}" height="29" rx="5" fill="rgba(${color},${intensity})" ${attr(tip(g.name,g.y26,g.y27))}/>`+text(L+j*CW+CW/2,y+19,amount(v),`text-anchor="middle" fill="${intensity>.55?'white':'#686780'}" font-weight="600"`);});});svg('heatmap-chart',W,H,body);
}
function renderKpis(rows){const a=sum(rows,'y26'),b=sum(rows,'y27'),d=b-a,rate=a?d/a:null;
 const cards=[['2027년 순재원',num(b/10000,2),'조 원','현재 선택 범위의 총 재원','▥'],['2026년 순재원',num(a/10000,2),'조 원','비교 기준 연도','◷'],['전년 대비 증감',`${d>0?'+':''}${num(d/10000,2)}`,'조 원',`${num(d)}억 원 / 차감 항목 포함`,'↗'],['전년 대비 증감률',rate===null?'—':pct(rate),'',`${rows.length}개 항목 · 2026년 순재원 대비`,'%']];
 $('kpis').innerHTML=cards.map((c,i)=>`<div class="kpi"><span class="kpi-icon">${c[4]}</span><div class="kpi-label">${c[0]}</div><div class="kpi-value ${i>1?(d>=0?'positive':'negative'):''}">${c[1]}<small>${c[2]}</small></div><div class="kpi-sub">${c[3]}</div></div>`).join('');
}
function sortedRows(){return [...filtered].sort((a,b)=>{const x=a[sortKey],y=b[sortKey];return sortDir*(typeof x==='number'?x-y:String(x??'').localeCompare(String(y??''),'ko'));});}
function renderTable(){
 const rows=sortedRows();$('table-body').innerHTML=rows.length?rows.map(r=>`<tr><td><span class="sector-badge" style="color:${SECTOR[r.sector]};background:${SECTOR[r.sector]}16">${esc(r.sector)}</span></td><td>${esc(r.account)}</td><td>${esc(r.category||'—')}</td><td>${esc(r.program||'—')}</td><td>${num(r.y26)}</td><td>${num(r.y27)}</td><td class="${r.delta>=0?'positive':'negative'}">${r.delta>0?'+':''}${num(r.delta)}</td><td><span class="rate-badge ${r.rate<0?'down':''}">${pct(r.rate)}</span></td></tr>`).join(''):'<tr><td colspan="8" style="text-align:center;padding:35px">검색 결과가 없습니다.</td></tr>';
 $('table-count').textContent=`전체 ${DATA.length}개 중 ${rows.length}개 표시`;
 document.querySelectorAll('[data-sort]').forEach(b=>{const selected=b.dataset.sort===sortKey;b.setAttribute('aria-label',`${b.textContent.replace(/[↕↑↓]/g,'')} ${selected?(sortDir>0?'오름차순':'내림차순'):'정렬'}`);b.closest('th').setAttribute('aria-sort',selected?(sortDir>0?'ascending':'descending'):'none');});
}
function accountOptions(){const previous=$('account').value,sector=$('sector').value,accounts=[...new Set(DATA.filter(r=>!sector||r.sector===sector).map(r=>r.account))];$('account').innerHTML='<option value="">전체 회계</option>'+accounts.map(x=>`<option>${esc(x)}</option>`).join('');if(accounts.includes(previous))$('account').value=previous;}
function render(){
 const sector=$('sector').value,account=$('account').value,q=$('search').value.trim().toLowerCase();
 filtered=DATA.filter(r=>(!sector||r.sector===sector)&&(!account||r.account===account)&&(!q||`${r.program} ${r.category} ${r.account}`.toLowerCase().includes(q)));
 $('record-count').textContent=`${filtered.length} / ${DATA.length} 항목`;
 $('scope').textContent=`${sector||'전체 부문'} / ${account||'전체 회계'}${q?' / 검색: '+q:''} · 모든 차트와 표에 같은 필터 적용`;
 renderKpis(filtered);paired('sector-chart',group(filtered,'sector'));paired('account-chart',group(filtered,'account'));
 donut('donut-chart',group(filtered.filter(r=>r.y27>0),'sector'),true);donut('account-donut',group(filtered.filter(r=>r.y27>0),'account'));
 waterfall(filtered);bars('ranking-chart',filtered.filter(r=>r.y27>0),'y27',10);bars('delta-chart',filtered,'delta',10);bars('rate-chart',filtered.filter(r=>r.rate!==null),'rate',12);
 scatter(filtered);treemap(filtered);heatmap(filtered);renderTable();
}
$('sector').innerHTML+=[...new Set(DATA.map(r=>r.sector))].map(x=>`<option>${esc(x)}</option>`).join('');
accountOptions();
$('sector').addEventListener('change',()=>{accountOptions();render();});
['account','unit'].forEach(id=>$(id).addEventListener('change',render));
$('search').addEventListener('input',render);
$('reset').addEventListener('click',()=>{$('sector').value='';accountOptions();$('account').value='';$('search').value='';$('unit').value='10000';render();});
document.querySelectorAll('[data-sort]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.sort;sortDir=key===sortKey?-sortDir:typeof DATA[0][key]==='number'?-1:1;sortKey=key;renderTable();}));
$('download').addEventListener('click',()=>{
 const headers=['부문','회계구분','구분','프로그램명','2026년(억원)','2027년(억원)','증감(억원)','증감률(%)'];
 const escapeCsv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 const rows=sortedRows().map(r=>[r.sector,r.account,r.category,r.program,r.y26,r.y27,r.delta,r.rate===null?'':r.rate*100]);
 const blob=new Blob(['\uFEFF'+[headers,...rows].map(r=>r.map(escapeCsv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='국방예산_필터결과.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
function showTip(target,x,y){const t=$('tooltip');t.textContent=target.dataset.tip;t.style.display='block';t.style.left=Math.min(x+15,window.innerWidth-t.offsetWidth-12)+'px';t.style.top=Math.max(10,Math.min(y+14,window.innerHeight-t.offsetHeight-12))+'px';}
document.addEventListener('pointermove',e=>{const target=e.target.closest('[data-tip]');if(target)showTip(target,e.clientX,e.clientY);else $('tooltip').style.display='none';});
document.addEventListener('focusin',e=>{if(e.target.matches('[data-tip]')){const b=e.target.getBoundingClientRect();showTip(e.target,b.x,b.y);}});
document.addEventListener('focusout',()=>$('tooltip').style.display='none');
document.querySelectorAll('.rail-link').forEach(a=>a.addEventListener('click',()=>{document.querySelector('.rail-link.active')?.classList.remove('active');a.classList.add('active');}));
$('source').textContent=`출처: ${window.BUDGET_DATA.source} · 32개 세부 항목 · 금액 단위: 억 원 · 2027년은 정부안`;
render();

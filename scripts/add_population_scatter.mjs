import fs from 'node:fs';

const file = 'shrinking-busan/preview_202609.html';
let html = fs.readFileSync(file, 'utf8');
const didChangeData = JSON.parse(fs.readFileSync('shrinking-busan/data/derived/did_change_500m.geojson', 'utf8'));
const dongData = JSON.parse(fs.readFileSync('shrinking-busan/data/busan_hjd_20250101.geojson', 'utf8'));
const functionStats = JSON.parse(fs.readFileSync('shrinking-busan/data/derived/busan_dong_function_change.json', 'utf8'));
const start = '<!-- POPULATION_FUNCTION_SCATTER_START -->';
const end = '<!-- POPULATION_FUNCTION_SCATTER_END -->';
const section = `${start}
<section class="population-scatter-section" aria-labelledby="population-scatter-title">
  <header class="population-scatter-heading">
    <div><h2 id="population-scatter-title">2. 인구감소지역 정주·생활기능 변화 분석</h2>
    <p>정주인구 감소와 생활인구 변화는 어떻게 나타나는가?</p></div>
    <div class="scatter-legend"><span class="legend-retained"></span>유지 <span class="legend-dropped"></span>탈락 <span class="legend-new"></span>신규</div>
  </header>
  <div class="population-scatter-chart" id="population-scatter-chart" role="img" aria-label="부산시 500m 격자 전체를 점으로 표시한 정주인구 증감과 생활인구 변화 산점도"></div>
  <ul class="population-scatter-note">
    <li>점 1개는 500m 격자 1개. DID 변화 격자 총 754개(유지 682·탈락 27·신규 45)</li>
    <li>X축: 격자의 2015–2024년 인구 증감(명) · Y축: 격자 포함 행정동의 2023–2024년 생활인구 증감률</li>
    <li>생활인구 자료는 행정동 단위. 같은 행정동 내 격자에는 같은 값 반복 적용. 격자별 생활인구 관측값으로 해석 불가</li>
  </ul>
</section>
<style>
.population-scatter-section{box-sizing:border-box;width:100%;margin:16px 0 24px;padding:22px 24px 18px;background:#fff;border:1px solid #dfe7df;border-radius:14px;box-shadow:0 5px 18px #243b2d0a;color:#173b33}
.population-scatter-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:8px}
.population-scatter-heading h2{font-family:"NanumSquareNeo","Malgun Gothic",sans-serif;font-weight:800;font-size:clamp(22px,2vw,30px);margin:0 0 6px}
.population-scatter-heading p,.population-scatter-note{font-family:"KoPubWorldDotum","Malgun Gothic",sans-serif;color:#65796f;font-size:16px;line-height:1.6;margin:0}
.population-scatter-note{padding-left:22px;margin-top:8px}.population-scatter-note li{padding-left:2px;margin:3px 0}
.scatter-legend{white-space:nowrap;color:#51675e;font-size:14px;padding:7px 10px;border:1px solid #e2e9e2;border-radius:20px}
.legend-retained,.legend-dropped,.legend-new{display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 5px 0 9px}.legend-retained{background:#3d9c69}.legend-dropped{background:#dc725d}.legend-new{background:#4389c6}
.population-scatter-chart{width:100%;min-height:450px}.population-scatter-chart svg{display:block;width:100%;height:auto;min-height:420px}
.scatter-grid{stroke:#e6ece7;stroke-width:1}.scatter-zero{stroke:#8ea197;stroke-width:1.5;stroke-dasharray:5 5}.scatter-axis{stroke:#84978d;stroke-width:1.2}.scatter-label{fill:#345248;font-size:14px}.scatter-tick{fill:#718278;font-size:12px}.scatter-quadrant{fill:#87968e;font-size:13px}.scatter-point{stroke:#fff;stroke-width:2;cursor:default}.scatter-point-label{fill:#183d32;font-size:15px;font-weight:700;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}
@media(max-width:760px){.population-scatter-section{padding:16px 12px}.population-scatter-heading{display:block}.scatter-legend{display:inline-block;margin-top:8px}.population-scatter-chart{min-height:300px}.population-scatter-chart svg{min-height:320px}.scatter-label{font-size:12px}.scatter-point-label{font-size:12px}}
.did-section-heading h2,.shrinkage-heading h2,.population-scatter-heading h2{font-size:24px!important;line-height:1.3!important}
.did-section-heading p,.shrinkage-heading p,.population-scatter-heading p{font-family:"KoPubWorldDotum","Malgun Gothic",sans-serif!important;font-size:17.5px!important;line-height:1.5!important;color:#697d74!important;margin:4px 0 0!important}
.shrinkage-footnote{font-size:16px!important;line-height:1.6!important}
</style>
<script>
(()=>{
  const grids=@@DID_CHANGE_DATA@@.features;
  const dongs=@@DONG_DATA@@.features;
  const functionStats=@@FUNCTION_STATS@@;
  const root=document.getElementById('population-scatter-chart'); if(!root)return;
  const ringHasPoint=(ring,x,y)=>{let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside}return inside};
  const geometryHasPoint=(g,x,y)=>{const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];return polys.some(poly=>ringHasPoint(poly[0],x,y))};
  const bounds=f=>{let minX=180,minY=90,maxX=-180,maxY=-90;const visit=c=>{if(typeof c[0]==='number'){minX=Math.min(minX,c[0]);maxX=Math.max(maxX,c[0]);minY=Math.min(minY,c[1]);maxY=Math.max(maxY,c[1]);return}for(const child of c)visit(child)};visit(f.geometry.coordinates);return [minX,minY,maxX,maxY]};
  const dongIndex=dongs.map(feature=>({feature,bbox:bounds(feature)}));
  const centroid=f=>{const ring=f.geometry.type==='Polygon'?f.geometry.coordinates[0]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates[0][0]:[];let x=0,y=0;for(const p of ring){x+=p[0];y+=p[1]}return [x/ring.length,y/ring.length]};
  const statusColors={"유지":"#3d9c69","탈락":"#dc725d","신규":"#4389c6"};
  const points=grids.map(f=>{const [lon,lat]=centroid(f);const dong=dongIndex.find(({feature:d,bbox:b})=>lon>=b[0]&&lon<=b[2]&&lat>=b[1]&&lat<=b[3]&&geometryHasPoint(d.geometry,lon,lat))?.feature;const st=functionStats[String(dong?.properties?.adm_cd2||'')];const p=f.properties;return {status:p.status,x:Number(p.population_2024||0)-Number(p.population_2015||0),y:st?.livingChangePct,dong:dong?.properties?.adm_nm?.replace(/^부산광역시\s*/,'')||'자료 미수록',color:statusColors[p.status]||'#9aa6a0',p15:Number(p.population_2015||0),p24:Number(p.population_2024||0)}});
  const plotted=points;
  const W=1200,H=520,L=100,R=36,T=34,B=78,xmin=-5000,xmax=7000,ymin=-32,ymax=45;
  const X=v=>L+(v-xmin)/(xmax-xmin)*(W-L-R),Y=v=>T+(ymax-v)/(ymax-ymin)*(H-T-B);
  const xticks=[-4000,-2000,0,2000,4000,6000],yticks=[-20,-10,0,10,20,30,40];
  let s=\`<svg viewBox="0 0 \${W} \${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\`;
  for(const v of xticks){const x=X(v);s+=\`<line class="scatter-grid" x1="\${x}" y1="\${T}" x2="\${x}" y2="\${H-B}"/><text class="scatter-tick" x="\${x}" y="\${H-B+24}" text-anchor="middle">\${v.toLocaleString()}명</text>\`}
  for(const v of yticks){const y=Y(v);s+=\`<line class="scatter-grid" x1="\${L}" y1="\${y}" x2="\${W-R}" y2="\${y}"/><text class="scatter-tick" x="\${L-12}" y="\${y+4}" text-anchor="end">\${v}%</text>\`}
  s+=\`<line class="scatter-zero" x1="\${X(0)}" y1="\${T}" x2="\${X(0)}" y2="\${H-B}"/><line class="scatter-zero" x1="\${L}" y1="\${Y(0)}" x2="\${W-R}" y2="\${Y(0)}"/><line class="scatter-axis" x1="\${L}" y1="\${H-B}" x2="\${W-R}" y2="\${H-B}"/><line class="scatter-axis" x1="\${L}" y1="\${T}" x2="\${L}" y2="\${H-B}"/><text class="scatter-label" x="\${(L+W-R)/2}" y="\${H-18}" text-anchor="middle">500m 격자 인구 증감 (2015–2024, 명)</text><text class="scatter-label" transform="translate(24 \${(T+H-B)/2}) rotate(-90)" text-anchor="middle">행정동 생활인구 증감률 (2023–2024, %)</text><text class="scatter-quadrant" x="\${X(-4700)}" y="\${Y(42)}">생활인구 증가 · 정주인구 감소</text><text class="scatter-quadrant" x="\${X(120)}" y="\${Y(42)}">생활인구·정주인구 증가</text><text class="scatter-quadrant" x="\${X(-4700)}" y="\${Y(-22)}">생활인구·정주인구 감소</text><text class="scatter-quadrant" x="\${X(120)}" y="\${Y(-22)}">정주인구 증가 · 생활인구 감소</text>\`;
  for(const p of plotted){const x=X(Math.max(xmin,Math.min(xmax,p.x))),y=Y(Number.isFinite(p.y)?Math.max(-25,Math.min(ymax,p.y)):-29.5);s+=\`<circle class="scatter-point" cx="\${x}" cy="\${y}" r="3.8" fill="\${p.color}" fill-opacity=".62"><title>\${p.status} · \${p.dong} · 정주인구 2015년 \${p.p15.toLocaleString()}명 → 2024년 \${p.p24.toLocaleString()}명 (\${p.x.toLocaleString()}명) · 행정동 생활인구 변화 \${Number.isFinite(p.y)?p.y.toFixed(2)+'%':'자료 없음'}</title></circle>\`}
  s+=\`<text class="scatter-tick" x="\${W-R}" y="\${T+14}" text-anchor="end">\${plotted.length.toLocaleString()} / \${grids.length.toLocaleString()} 격자 표시</text>\`;
  s+='</svg>';root.innerHTML=s;
})();
</script>
${end}`;

if (html.includes(start)) {
  const a = html.indexOf(start), b = html.indexOf(end, a) + end.length;
  if (b < end.length) throw new Error('Population scatter section markers are incomplete');
  html = html.slice(0, a) + html.slice(b);
}
const mainClose=html.lastIndexOf('</main>');
if(mainClose<0)throw new Error('Could not find main dashboard frame for the scatter section');
const renderedSection=section
  .replace('@@DID_CHANGE_DATA@@',JSON.stringify(didChangeData))
  .replace('@@DONG_DATA@@',JSON.stringify(dongData))
  .replace('@@FUNCTION_STATS@@',JSON.stringify(functionStats));
const oldScatterStart=html.indexOf(start),oldScatterEnd=html.indexOf(end,oldScatterStart)+end.length;
if(oldScatterStart>=0&&oldScatterEnd>=end.length)html=html.slice(0,oldScatterStart)+html.slice(oldScatterEnd);
html=html.slice(0,mainClose)+renderedSection+'\n'+html.slice(mainClose);
const section2Start=html.indexOf('<!-- SHRINKAGE_DIAGNOSIS_START -->'),section2End=html.indexOf('<!-- SHRINKAGE_DIAGNOSIS_END -->',section2Start)+'<!-- SHRINKAGE_DIAGNOSIS_END -->'.length;
if(section2Start<0||section2End<'<!-- SHRINKAGE_DIAGNOSIS_END -->'.length)throw new Error('Could not find section 2 analysis block');
let section2=html.slice(section2Start,section2End);
section2=section2.replace(/<h2 id="shrinkage-diagnosis-title">[\s\S]*?<\/h2>(?:<p[^>]*>[\s\S]*?<\/p>)*/, '<h2 id="shrinkage-diagnosis-title">3. \uc778\uad6c\ubc00\uc9d1\uad6c\uc5ed(DID) \ud0c8\ub77d\uc9c0\uc5ed \ucd95\uc18c\uc591\uc0c1 \uc9c4\ub2e8</h2><p>DID \ud0c8\ub77d\uc9c0\uc5ed\uc740 \uc5b4\ub5a4 \ucd95\uc18c \ud2b9\uc131\uc744 \ubcf4\uc774\ub294\uac00?</p>');
html=html.slice(0,section2Start)+section2+html.slice(section2End);
const scatterStart=html.indexOf(start),scatterEnd=html.indexOf(end,scatterStart)+end.length;
const scatterBlock=html.slice(scatterStart,scatterEnd);
html=html.slice(0,scatterStart)+html.slice(scatterEnd);
const section2At=html.indexOf('<!-- SHRINKAGE_DIAGNOSIS_START -->');
html=html.slice(0,section2At)+scatterBlock+'\n'+html.slice(section2At);
fs.writeFileSync(file, html, 'utf8');

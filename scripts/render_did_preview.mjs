import fs from 'node:fs';

const pageFile='shrinking-busan/preview_202609.html';
const derived='shrinking-busan/data/derived/';
let html=fs.readFileSync(pageFile,'utf8');
const didIntro="<section class=\"did-intro\" aria-labelledby=\"did-intro-title\"><h2 id=\"did-intro-title\">0. DID(Densely Inhabited District)란?</h2><ul><li>DID는 일본에서 사용하는 도시지역 또는 도심의 지표로 활용되는 통계적 지역단위입니다.</li><li>인구밀도 4,000명/㎢ 이상인 인접 격자들이 일정 규모(5,000명 이상)를 이루는 지역을 말합니다.</li></ul></section>";
if(!html.includes('id="did-intro-title"'))html=html.replace('</header>', '</header>'+didIntro);
const rootEnv=fs.readFileSync('.env','utf8');
const cartoKeyLine=rootEnv.match(/^\s*CARTO_API_KEY\s*=\s*(.*?)\s*$/m);
const cartoKey=cartoKeyLine?.[1].replace(/^['"]|['"]$/g,'');
if(!cartoKey)throw new Error('CARTO_API_KEY is missing from the project .env file');
const cartoTileUrl=`https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`;
html=html.replace(/const tileUrl="[^"]+";/,`const tileUrl=${JSON.stringify(cartoTileUrl)};`);
html=html.replace(/const colors=\{[^;]+\};/,'const colors={"0.50 미만":"#b6d2a6","0.50–0.79":"#d0df9f","0.80–0.99":"#e6d681","1.00–1.49":"#efa778","1.50 이상":"#cb8171"};');
const did2015=JSON.parse(fs.readFileSync(`${derived}did_2015_500m.geojson`,'utf8'));
const did2024=JSON.parse(fs.readFileSync(`${derived}did_2024_500m.geojson`,'utf8'));
const didChange=JSON.parse(fs.readFileSync(`${derived}did_change_500m.geojson`,'utf8'));
const busanGrid=JSON.parse(fs.readFileSync(`${derived}busan_500m_grid.geojson`,'utf8'));
const dongChange=JSON.parse(fs.readFileSync(`${derived}busan_did_change_by_dong.geojson`,'utf8'));
const summary=JSON.parse(fs.readFileSync(`${derived}did_summary.json`,'utf8'));

const replacements=[
  ['<article class="panel map-panel"><div class="panel-heading"><h2>인구밀집구역 유지·탈락</h2></div><div class="placeholder">DID 유지 / 탈락 구역<small>2015년과 2025년 DID 산출 뒤 비교</small></div></article>',
   '<!-- DID_PANEL_CHANGE_START --><article class="panel map-panel"><div class="panel-heading"><h2>인구밀집구역(DID) 격자 변화</h2><small id="did-change-count"></small></div><div class="did-map"><div class="did-canvas" id="did-map-change"></div></div><div class="mini-map-note">유지·탈락·신규 500m 격자 비교</div></article><!-- DID_PANEL_CHANGE_END -->'],
  ['<article class="panel transition-panel"><div class="panel-heading"><h2>읍·면·동 변화 경로 지도</h2></div><div class="placeholder">변화 경로 지도<small>2015·2025 DID 산출 결과와 행정동 경계 연결 후 표출</small></div></article>',
   '<!-- DID_PANEL_DONG_START --><article class="panel transition-panel"><div class="panel-heading"><h2>행정동별 인구밀집구역(DID) 변화</h2></div><div class="route-map"><div class="route-canvas" id="did-map-dong"></div></div><div class="mini-map-note">2025년 행정동 경계 기준 집계</div></article><!-- DID_PANEL_DONG_END -->']
];
const markers=[['DID_PANEL_CHANGE_START','DID_PANEL_CHANGE_END','did-map-change'],['DID_PANEL_DONG_START','DID_PANEL_DONG_END','did-map-dong']];
for(let i=0;i<replacements.length;i++){
  const [oldText,newText]=replacements[i], [startMarker,endMarker,mapId]=markers[i];
  if(html.includes(`<!-- ${startMarker} -->`)){
    const start=html.indexOf(`<!-- ${startMarker} -->`),end=html.indexOf(`<!-- ${endMarker} -->`,start)+`<!-- ${endMarker} -->`.length;
    if(end<`<!-- ${endMarker} -->`.length)throw new Error(`Corrupt marker: ${startMarker}`);
    html=html.slice(0,start)+newText+html.slice(end);
  }else if(html.includes(oldText)) html=html.replace(oldText,newText);
  else if(html.includes(`id="${mapId}"`)){
    const at=html.indexOf(`id="${mapId}"`), start=html.lastIndexOf('<article',at), end=html.indexOf('</article>',at)+10;
    if(start<0||end<10)throw new Error(`Could not locate rendered panel: ${mapId}`);
    html=html.slice(0,start)+`<!-- ${startMarker} -->`+html.slice(start,end)+`<!-- ${endMarker} -->`+html.slice(end);
  }else throw new Error(`Expected DID panel not found: ${startMarker}`);
}
const didTableMarkup=`<div class="did-dong-table-wrap"><table class="did-dong-table"><thead><tr><th>구·군</th><th>2015 DID 격자</th><th>2024 DID 격자</th><th>유지 격자</th><th>탈락 격자</th><th>신규 격자</th></tr></thead><tbody id="did-dong-table-body"></tbody></table></div>`;
const dashboardSection=`<!-- DID_DASHBOARD_START --><section class="grid did-dashboard" aria-label="인구밀집구역 유지 및 탈락"><!-- DID_PANEL_CHANGE_START --><article class="panel did-overview-map map-panel"><div class="panel-heading"><h2>인구밀집구역(DID) 격자 변화</h2><small id="did-change-count"></small></div><div class="did-map"><div class="did-canvas" id="did-map-change"></div></div><div class="mini-map-note">2015년/2024년 · 유지·탈락·신규 500m 격자</div></article><!-- DID_PANEL_CHANGE_END --><div class="did-right-stack"><!-- DID_PANEL_DONG_START --><article class="panel transition-panel"><div class="panel-heading"><h2>행정동별 인구밀집구역(DID) 변화</h2></div><div class="route-map"><div class="route-canvas" id="did-map-dong"></div></div><div class="mini-map-note">2025년 행정동 경계 기준 집계</div></article><!-- DID_PANEL_DONG_END --><article class="panel did-summary-table"><div class="panel-heading"><h2>구·군별 DID 격자 총계</h2><small id="did-route-summary"></small></div>${didTableMarkup}</article></div></section><!-- DID_DASHBOARD_END -->`;
if(html.includes('<!-- DID_DASHBOARD_START -->')){const start=html.indexOf('<!-- DID_DASHBOARD_START -->'),end=html.indexOf('<!-- DID_DASHBOARD_END -->',start)+'<!-- DID_DASHBOARD_END -->'.length;html=html.slice(0,start)+dashboardSection+html.slice(end)}else{const start=html.indexOf('<section class="grid grid-top"'),end=html.indexOf('</section>',start)+10;if(start<0||end<10)throw new Error('Could not locate the original DID map section');html=html.slice(0,start)+dashboardSection+html.slice(end)}
const oldBottom=html.indexOf('<section class="grid grid-bottom"');if(oldBottom>=0){const bottomEnd=html.indexOf('</section>',oldBottom),routeStart=html.indexOf('<!-- DID_PANEL_DONG_START -->',oldBottom);if(routeStart>=0&&routeStart<bottomEnd){const routeEnd=html.indexOf('<!-- DID_PANEL_DONG_END -->',routeStart)+'<!-- DID_PANEL_DONG_END -->'.length;html=html.slice(0,routeStart)+html.slice(routeEnd)}}
const didStyles=`/* DID_LAYOUT_STYLE_START */
@font-face{font-family:"NanumSquareNeo";src:url("https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-dEb.woff2?v=20261101") format("woff2");font-weight:800;font-style:normal;font-display:swap}@font-face{font-family:"KoPubWorldDotum";src:url("https://cdn.jsdelivr.net/gh/projectnoonnu/2507-1@1.0/KoPubWorldDotumLight.woff2?v=20261101") format("woff2");font-weight:300;font-style:normal;font-display:swap}@font-face{font-family:"KoPubWorldDotum";src:url("https://cdn.jsdelivr.net/gh/projectnoonnu/2507-1@1.0/KoPubWorldDotumMedium.woff2?v=20261101") format("woff2");font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:"KoPubWorldDotum";src:url("https://cdn.jsdelivr.net/gh/projectnoonnu/2507-1@1.0/KoPubWorldDotumBold.woff2?v=20261101") format("woff2");font-weight:700;font-style:normal;font-display:swap}body{font-family:"KoPubWorldDotum","Malgun Gothic",sans-serif!important}h1,h2,h3{font-family:"NanumSquareNeo","Malgun Gothic",sans-serif!important;font-weight:800!important}.page-header>div>p,.did-intro li,.did-section-heading p{font-family:"KoPubWorldDotum","Malgun Gothic",sans-serif!important}
.did-dashboard{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(420px,.9fr);gap:14px;align-items:stretch;min-height:900px;margin-bottom:14px}
.did-dong-table .did-total-row{font-weight:750;background:#eef4ed;color:#173b33}
.did-summary-table .did-dong-table td:nth-child(n+2){text-align:right;color:inherit;font-weight:400}.did-summary-table .panel-heading{padding:10px 14px}.did-summary-table .did-detail-note{margin:3px 0}.did-summary-table .did-dong-table th,.did-summary-table .did-dong-table td{padding:3px 7px;font-size:11px;line-height:1.15}
.did-overview-map{height:auto;min-height:900px;display:flex;flex-direction:column}
.did-right-stack{display:grid;grid-template-rows:minmax(430px,1.05fr) minmax(400px,.95fr);gap:14px;min-height:900px}
.did-right-stack .transition-panel,.did-right-stack .did-summary-table{height:auto;min-height:0;display:flex;flex-direction:column}
.did-right-stack .route-map{flex:1;min-height:0}
.did-right-stack .did-dong-table-wrap{flex:1;min-height:300px;max-height:none}
.grid-bottom{grid-template-columns:1fr}
.grid-top{grid-template-columns:minmax(340px,1.15fr) minmax(0,1.3fr);align-items:stretch}
.year-map-stack{display:grid;grid-template-rows:repeat(2,minmax(425px,1fr));gap:14px;min-height:864px}
.year-map-stack .map-panel{height:425px;min-height:410px}
.grid-top>.map-panel:last-child{height:auto;min-height:864px}
.grid-middle .ratio-panel,.grid-middle .table-panel{min-height:820px}
.grid-middle .map-wrap{min-height:740px}
.did-map{position:relative;flex:1;min-height:0}.did-canvas{position:absolute;inset:0}.route-map{position:relative;flex:1;min-height:460px}.route-canvas{position:absolute;inset:0}.mini-map-note{padding:7px 11px;background:#f7faf7;border-top:1px solid #e8eee8;color:#687d71;font-size:10px}
.did-legend{background:#fff;color:#30483c;padding:7px 9px;border:1px solid #e0e8df;border-radius:6px;box-shadow:0 1px 7px #243b2d18;font:10px/1.45 system-ui,"Malgun Gothic",sans-serif}.did-legend-row{display:flex;align-items:center;gap:6px;white-space:nowrap}.did-legend-row i{display:inline-block;width:10px;height:10px;border-radius:2px;border:1px solid #ffffffaa}
.outside-gray-tiles{filter:grayscale(1)}
.map-district-label{color:#173b33;background:#ffffffd9;border:1px solid #324e43;border-radius:4px;padding:2px 5px;font:700 12px/1.15 system-ui,"Malgun Gothic",sans-serif;white-space:nowrap;box-shadow:0 1px 3px #14291e55;pointer-events:none}
.map-district-label,.dong-label{background:transparent;border:0;box-shadow:none;padding:0;opacity:.78;text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff}
.did-detail-section{margin-top:14px;padding:20px;background:#fff;border:1px solid #dfe7df;border-radius:13px;box-shadow:0 5px 20px #243b2d0a}.did-detail-section h2,.did-detail-section h3{margin:0;color:#1d4136}.did-detail-section h2{font-size:20px}.did-detail-section h3{font-size:15px}.did-detail-section p{margin:8px 0 0;color:#536d60;font-size:13px;line-height:1.65}.did-detail-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.did-detail-head small,.did-detail-note{color:#697d74;font-size:11px;line-height:1.5}.did-method-grid{display:grid;grid-template-columns:1fr 1.35fr;gap:12px;margin-bottom:14px}.did-method-card,.did-year-card{padding:15px;border:1px solid #e4ebe3;border-radius:9px;background:#f9fbf8}.did-method-card ul{margin:8px 0 0;padding-left:19px;color:#536d60;font-size:12px;line-height:1.75}.did-year-lists{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}.did-year-heading{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}.did-year-heading small{color:#697d74;font-size:11px}.did-dong-chips{display:flex;flex-wrap:wrap;gap:6px;max-height:170px;overflow:auto}.did-dong-chip{padding:4px 8px;border-radius:14px;background:#eaf1e8;color:#34584a;font-size:11px}.did-dong-table-wrap{max-height:460px;overflow:auto;border:1px solid #e4ebe3;border-radius:8px}.did-dong-table{width:100%;border-collapse:collapse;font-size:12px}.did-dong-table th,.did-dong-table td{padding:8px 9px;border-bottom:1px solid #e8eee8;text-align:right;white-space:nowrap}.did-dong-table th{position:sticky;top:0;background:#f2f6f1;color:#536d60;z-index:1}.did-dong-table th:first-child,.did-dong-table td:first-child{text-align:left}.did-dong-table td:nth-child(2){text-align:left;color:#356b50;font-weight:600}.did-detail-tools{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin:12px 0 8px}.did-detail-tools select{padding:7px 9px;border:1px solid #d9e4da;border-radius:7px;background:#fff;color:#263a34}
@media(max-width:950px){.did-dashboard{grid-template-columns:1fr;min-height:0}.did-overview-map{min-height:680px}.did-right-stack{grid-template-rows:440px 460px;min-height:914px}.grid-middle .ratio-panel,.grid-middle .table-panel{min-height:700px}.grid-middle .map-wrap{min-height:620px}}
@media(max-width:560px){.grid-top{grid-template-columns:1fr}.year-map-stack{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none;min-height:300px}.year-map-stack .map-panel{height:300px;min-height:280px}.grid-top>.map-panel:last-child{min-height:520px}.grid-middle .ratio-panel,.grid-middle .table-panel{min-height:620px}.grid-middle .map-wrap{min-height:540px}.route-map{min-height:400px}}
@media(max-width:760px){.did-method-grid,.did-year-lists{grid-template-columns:1fr}.did-detail-section{padding:14px}.did-detail-head,.did-year-heading{align-items:flex-start;flex-direction:column}}
/* DID_LAYOUT_STYLE_END */`;
if(html.includes('/* DID_LAYOUT_STYLE_START */')){
  const start=html.indexOf('/* DID_LAYOUT_STYLE_START */'),end=html.indexOf('/* DID_LAYOUT_STYLE_END */',start)+'/* DID_LAYOUT_STYLE_END */'.length;
  html=html.slice(0,start)+didStyles+html.slice(end);
}else html=html.replace('</style>',didStyles+'\n</style>');
const fontPreloads='<link rel="preload" href="https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareNeo/NanumSquareNeoTTF-dEb.woff2?v=20261101" as="font" type="font/woff2" crossorigin data-font-preload="nanum"><link rel="preload" href="https://cdn.jsdelivr.net/gh/projectnoonnu/2507-1@1.0/KoPubWorldDotumMedium.woff2?v=20261101" as="font" type="font/woff2" crossorigin data-font-preload="kopub">';
if(!html.includes('data-font-preload="nanum"'))html=html.replace('</head>',fontPreloads+'\n</head>');
const leafletScript='<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>';
const boundaryScript='<script src="https://unpkg.com/leaflet-boundary-canvas@1.0.0/src/BoundaryCanvas.js"></script>';
if(!html.includes('leaflet-boundary-canvas@1.0.0')) html=html.replace(leafletScript,leafletScript+'\n'+boundaryScript);
const scriptStart=html.indexOf('<script>')+8;
const mapInit=html.indexOf("const map=L.map('ratio-map'",scriptStart);
if(mapInit<0&&!html.includes('// DID_DATA_START')&&!html.includes('const did2015Geo='))throw new Error('Could not find current map initialization or an existing DID data block');
const tile=html.match(/const tileUrl=([^;]+);/);
if(!tile)throw new Error('Could not find V-World tileUrl');
const inject=`// DID_DATA_START
const did2015Geo=${JSON.stringify(did2015)};
const did2024Geo=${JSON.stringify(did2024)};
const didChangeGeo=${JSON.stringify(didChange)};
const busanGridGeo=${JSON.stringify(busanGrid)};
const dongChangeGeo=${JSON.stringify(dongChange)};
const didSummary=${JSON.stringify(summary)};
const didStatusColors={'유지':'#56a978','탈락':'#d96959','신규':'#4b8ec4'};
function didLegend(target,items){const control=L.control({position:'bottomleft'});control.onAdd=()=>{const box=L.DomUtil.create('div','did-legend');box.innerHTML=items.map(([label,color])=>'<div class="did-legend-row"><i style="background:'+color+'"></i><span>'+label+'</span></div>').join('');return box};control.addTo(target)}
const noDongLabelTileUrl=${tile[1]}.replace('/light_all/','/light_nolabels/');
function addBaseTiles(target,noDongNames=false){const options={maxZoom:19,attribution:'© OpenStreetMap contributors © CARTO'},url=noDongNames?noDongLabelTileUrl:${tile[1]};L.tileLayer(url,{...options,className:'outside-gray-tiles'}).addTo(target);L.TileLayer.boundaryCanvas(url,{...options,boundary:geo,crossOrigin:true}).addTo(target)}
function mapFrame(id,noDongNames=false,padding=[8,8]){const m=L.map(id,{zoomControl:false,scrollWheelZoom:true});addBaseTiles(m,noDongNames);m.fitBounds(L.geoJSON(geo).getBounds(),{padding});L.control.zoom({position:'topright'}).addTo(m);return m}
function addDongOutlines(target){L.geoJSON(geo,{style:{color:'#fff',weight:.2,opacity:.95,fillOpacity:0},interactive:false}).addTo(target)}
function addDistrictBoundaries(target){const edges=new Map(),districtPoints=new Map();const round=n=>Number(n).toFixed(6);for(const feature of geo.features){const name=feature.properties.sggnm;if(!name)continue;const layer=L.geoJSON(feature),bounds=layer.getBounds(),area=(bounds.getEast()-bounds.getWest())*(bounds.getNorth()-bounds.getSouth());const prev=districtPoints.get(name);if(!prev||area>prev.area)districtPoints.set(name,{area,center:bounds.getCenter()});const polys=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates:[];for(const polygon of polys){const ring=polygon[0]||[];for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i],ka=round(a[0])+','+round(a[1]),kb=round(b[0])+','+round(b[1]),key=ka<kb?ka+'|'+kb:kb+'|'+ka;const entry=edges.get(key)||{coords:[a,b],districts:new Set(),count:0};entry.districts.add(name);entry.count++;edges.set(key,entry)}}}const lines=[...edges.values()].filter(e=>e.districts.size>1||e.count===1).map(e=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:e.coords}}));const boundaryGeo={type:'FeatureCollection',features:lines};L.geoJSON(boundaryGeo,{style:{color:'#fff',weight:2,opacity:.95},interactive:false}).addTo(target);L.geoJSON(boundaryGeo,{style:{color:'#354c41',weight:1.1,opacity:1},interactive:false}).addTo(target);const labels=L.layerGroup();for(const [name,point] of districtPoints) L.marker(point.center,{interactive:false,keyboard:false,icon:L.divIcon({className:'map-district-label',html:escapeHtml(name),iconSize:null})}).addTo(labels);labels.addTo(target)}
function didTooltip(feature){const p=feature.properties;return '<b>'+escapeHtml(p.status)+' DID 격자</b><br>2015년 인구: '+Number(p.population_2015).toLocaleString()+'명<br>2024년 인구: '+Number(p.population_2024).toLocaleString()+'명'}
const didMapChange=mapFrame('did-map-change',false,[0,0]);L.geoJSON(busanGridGeo,{style:{color:'#fff',weight:.25,opacity:.6,fillColor:'#8a928d',fillOpacity:.22},onEachFeature:(f,l)=>l.bindTooltip('<b>DID 미포함 격자</b><br>2015년 인구: '+Number(f.properties.population_2015).toLocaleString()+'명<br>2024년 인구: '+Number(f.properties.population_2024).toLocaleString()+'명')}).addTo(didMapChange);L.geoJSON(didChangeGeo,{style:f=>({color:'#fff',weight:.45,fillColor:didStatusColors[f.properties.status],fillOpacity:.8}),onEachFeature:(f,l)=>{const p=f.properties;l.bindTooltip('<b>'+escapeHtml(p.status)+' DID 격자</b><br>2015년 인구: '+Number(p.population_2015).toLocaleString()+'명<br>2024년 인구: '+Number(p.population_2024).toLocaleString()+'명')}}).addTo(didMapChange);addDongOutlines(didMapChange);addDistrictBoundaries(didMapChange);didLegend(didMapChange,[['유지','#56a978'],['탈락','#d96959'],['신규','#4b8ec4']]);
const dongRouteColors={'DID 없음':'#eef0ec','유지':'#56a978','유지·일부탈락':'#efbd3b','유지·신규포함':'#95c95b','유지·일부변화':'#e89154','탈락':'#d96959','신규':'#4b8ec4'};
const didMapDong=mapFrame('did-map-dong',false,[0,0]);L.geoJSON(dongChangeGeo,{style:f=>({color:'#fff',weight:.7,fillColor:dongRouteColors[f.properties.route]||'#dce4df',fillOpacity:.8}),onEachFeature:(f,l)=>{const p=f.properties;l.bindTooltip('<b>'+escapeHtml(p.dong_name)+'</b><br>변화: '+escapeHtml(p.route)+'<br>2015 DID 격자: '+p.did2015+'<br>2024 DID 격자: '+p.did2024+'<br>유지: '+p.kept+' · 탈락: '+p.lost+' · 신규: '+p.gained)}}).addTo(didMapDong);addDistrictBoundaries(didMapDong);didLegend(didMapDong,[['유지','#56a978'],['일부 탈락','#efbd3b'],['탈락','#d96959'],['신규','#4b8ec4'],['DID 없음','#dce4df']]);
document.getElementById('did-change-count').textContent='유지 '+didSummary.retained_cells+' · 탈락 '+didSummary.dropped_cells+' · 신규 '+didSummary.new_cells;
document.getElementById('did-route-summary').textContent='부산 전체 · 2015 DID '+didSummary.did_2015.did_cell_count.toLocaleString()+' · 2024 DID '+didSummary.did_2024.did_cell_count.toLocaleString()+' · 유지 '+didSummary.retained_cells.toLocaleString()+' · 탈락 '+didSummary.dropped_cells.toLocaleString()+' · 신규 '+didSummary.new_cells.toLocaleString()+' 격자';
const didDongTable=document.getElementById('did-dong-table-body'),districtTotals=new Map();
for(const feature of dongChangeGeo.features){const p=feature.properties,district=(p.adm_nm.split(' ')[1]||'미분류');const row=districtTotals.get(district)||{district,did2015:0,did2024:0,kept:0,lost:0,gained:0};row.did2015+=Number(p.did2015||0);row.did2024+=Number(p.did2024||0);row.kept+=Number(p.kept||0);row.lost+=Number(p.lost||0);row.gained+=Number(p.gained||0);districtTotals.set(district,row)}
function renderDidDongTable(){const rows=[...districtTotals.values()].sort((a,b)=>a.district.localeCompare(b.district,'ko'));const rowHtml=r=>'<tr><td>'+escapeHtml(r.district)+'</td><td>'+r.did2015.toLocaleString()+'</td><td>'+r.did2024.toLocaleString()+'</td><td>'+r.kept.toLocaleString()+'</td><td>'+r.lost.toLocaleString()+'</td><td>'+r.gained.toLocaleString()+'</td></tr>';didDongTable.innerHTML=rows.map(rowHtml).join('')+'<tr class="did-total-row"><td>부산 전체</td><td>'+didSummary.did_2015.did_cell_count.toLocaleString()+'</td><td>'+didSummary.did_2024.did_cell_count.toLocaleString()+'</td><td>'+didSummary.retained_cells.toLocaleString()+'</td><td>'+didSummary.dropped_cells.toLocaleString()+'</td><td>'+didSummary.new_cells.toLocaleString()+'</td></tr>'}
renderDidDongTable();
// DID_DATA_END
`;
if(html.includes('// DID_DATA_START')){
  const start=html.indexOf('// DID_DATA_START'),end=html.indexOf('// DID_DATA_END',start)+'// DID_DATA_END'.length;
  html=html.slice(0,start)+inject.trim()+html.slice(end);
}else if(html.includes('const did2015Geo=')){
  const start=html.indexOf('const did2015Geo='),end=html.indexOf("const map=L.map('ratio-map'",start);
  if(end<0)throw new Error('Could not locate end of existing DID script block');
  html=html.slice(0,start)+inject.trim()+html.slice(end);
}else html=html.slice(0,mapInit)+inject+html.slice(mapInit);
html=html.replace("L.tileLayer(tileUrl,{maxZoom:19,attribution:'© V-World'}).addTo(map);",'addBaseTiles(map);');
html=html.replace(/for\(const \[name,bounds\] of Object\.entries\(districtBounds\)\)\{L\.marker\(bounds\.getCenter\(\),\{interactive:false,keyboard:false,icon:L\.divIcon\(\{className:'district-label',html:escapeHtml\(name\),iconSize:null\}\)\}\)\.addTo\(districtLabels\)\}/,'addDistrictBoundaries(map);');
html=html.replace("weight:.7,color:'#555',fillOpacity:.78","weight:.2,color:'#fff',fillOpacity:.84");
html=html.replace("weight:.4,color:'#fff',fillOpacity:.84","weight:.2,color:'#fff',fillOpacity:.84");
html=html.replace('map.fitBounds(layer.getBounds());','map.fitBounds(layer.getBounds(),{padding:[8,8]});');
html=html.replace("mapFrame('did-map-2015')","mapFrame('did-map-2015',true)");
html=html.replace("mapFrame('did-map-2024')","mapFrame('did-map-2024',true)");

// Add a shared heading above the three DID comparison panels.
const didSectionHeading="<div class=\"did-section-heading\"><div><h2>1. 2015/2024년 부산시 인구밀집구역(DID) 변화</h2><p>인구가 밀집되어 있던 지역 중 어디가 실제로 축소되고 있는가?</p></div><small id=\"did-change-count\"></small></div>";
const didDashboardStart=html.indexOf('<!-- DID_DASHBOARD_START -->');
const didDashboardEnd=html.indexOf('<!-- DID_DASHBOARD_END -->',didDashboardStart);
if(didDashboardStart>=0&&didDashboardEnd>didDashboardStart){let dashboard=html.slice(didDashboardStart,didDashboardEnd);dashboard=dashboard.replace(/<div class="panel-heading did-question-heading">[\s\S]*?<\/div>/,'');dashboard=dashboard.replace(/(<section class="grid did-dashboard"[^>]*>)/,'$1'+didSectionHeading);html=html.slice(0,didDashboardStart)+dashboard+html.slice(didDashboardEnd);}
const didSectionStyles=".did-section-heading{grid-column:1/-1;display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:0 2px 2px}.did-section-heading h2{font-size:clamp(19px,1.7vw,24px);letter-spacing:-.02em;margin:0;color:#1d4136}.did-section-heading p{margin:4px 0 0;color:#697d74;font-size:17.5px;line-height:1.45}.did-section-heading small{color:var(--muted);font-size:11px;white-space:nowrap;padding-top:3px}\n";
if(!html.includes('.did-section-heading{'))html=html.replace('</style>',didSectionStyles+'</style>');
html=html.replace('.did-section-heading p{margin:4px 0 0;color:#697d74;font-size:13px;line-height:1.45}','.did-section-heading p{margin:4px 0 0;color:#697d74;font-size:17.5px;line-height:1.45}');
const didIntroCompactStyles='.did-intro{padding-top:0}.did-intro ul{font-size:17.5px}@media(max-width:760px){.did-intro ul{font-size:16px}}\n';
if(!html.includes('.did-intro ul{font-size:17.5px}'))html=html.replace('</style>',didIntroCompactStyles+'</style>');
fs.writeFileSync(pageFile,html,'utf8');
console.log(`Inserted DID panels: 2015 ${did2015.features.length}, 2024 ${did2024.features.length}; transitions retained ${summary.retained_cells}, dropped ${summary.dropped_cells}, new ${summary.new_cells}.`);

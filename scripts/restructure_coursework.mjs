import fs from 'node:fs';

const file = 'shrinking-busan/preview_202609.html';
let html = fs.readFileSync(file, 'utf8');

const styleStart = '<!-- COURSEWORK_FLOW_STYLE_START -->';
const styleEnd = '<!-- COURSEWORK_FLOW_STYLE_END -->';
const styles = `${styleStart}
<style>
.coursework-section{box-sizing:border-box;width:100%;margin:14px 0;padding:22px 24px;background:#fff;border:1px solid #dfe7df;border-radius:14px;box-shadow:0 5px 18px #243b2d0a;color:#173b33}
.coursework-section-head{display:flex;align-items:flex-start;gap:13px;margin:0 0 14px}.coursework-step{flex:0 0 auto;display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#eaf3ec;color:#26825a;font-weight:800;font-size:15px}.coursework-section-head h2{margin:0;font-size:23px;line-height:1.35}.coursework-section-head p{margin:4px 0 0;color:#687c72;font-size:15px;line-height:1.55}
.coursework-question{padding:17px 19px;margin-bottom:14px;background:#f3f7f3;border-left:4px solid #40966b;border-radius:9px}.coursework-eyebrow{font-size:12px;font-weight:700;color:#478363;letter-spacing:.04em}.coursework-question p{margin:6px 0 0;font-size:19px;font-weight:700;line-height:1.55;color:#193e33}
.coursework-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.coursework-card{min-width:0;padding:15px 16px;border:1px solid #e0e9e1;border-radius:10px;background:#f9fbf9}.coursework-card h3{font-size:16px;margin:0 0 7px}.coursework-card p,.coursework-card li{font-size:14px;line-height:1.65;color:#50665b}.coursework-card p{margin:0}.coursework-card ul{margin:0;padding-left:19px}.coursework-methods{margin-top:14px}.coursework-table-wrap{overflow-x:auto;border:1px solid #e0e8e1;border-radius:10px}.coursework-table{width:100%;border-collapse:collapse;min-width:800px;font-size:13px}.coursework-table th,.coursework-table td{padding:10px 12px;border-bottom:1px solid #e5ebe5;text-align:left;vertical-align:top;line-height:1.55}.coursework-table th{background:#f1f6f1;color:#315c48;white-space:nowrap}.coursework-table tr:last-child td{border-bottom:0}.coursework-table td:first-child{font-weight:700;white-space:nowrap;color:#244b39}.coursework-source-note{margin:12px 0 0;color:#687c72;font-size:12px;line-height:1.65}.coursework-result-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.coursework-result{padding:16px;border:1px solid #e0e9e1;border-radius:10px;background:#f8faf8}.coursework-result strong{display:block;margin-bottom:7px;color:#2b7956;font-size:15px}.coursework-result p,.coursework-limit li{margin:0;color:#50665b;font-size:14px;line-height:1.7}.coursework-bottom-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px;margin-top:14px}.coursework-limit{padding:15px 17px;border-radius:10px;background:#f8faf8;border:1px solid #e0e9e1}.coursework-limit h3{font-size:16px;margin:0 0 7px}.coursework-limit ul{margin:0;padding-left:19px}.coursework-limit li+li{margin-top:5px}
.did-section-heading{margin:8px 0 12px}.did-section-titleline{display:flex;align-items:flex-start;gap:13px}.shrinkage-diagnosis,.population-scatter-section{scroll-margin-top:18px}
@media(max-width:900px){.coursework-grid,.coursework-result-grid{grid-template-columns:1fr 1fr}.coursework-bottom-grid{grid-template-columns:1fr}}
@media(max-width:620px){.coursework-section{padding:16px 13px}.coursework-section-head h2{font-size:20px}.coursework-question p{font-size:16px}.coursework-grid,.coursework-result-grid{grid-template-columns:1fr}}
</style>
${styleEnd}`;

if (html.includes(styleStart)) {
  const a = html.indexOf(styleStart), b = html.indexOf(styleEnd, a) + styleEnd.length;
  if (b < styleEnd.length) throw new Error('Coursework style markers are incomplete');
  html = html.slice(0, a) + styles + html.slice(b);
} else {
  const headEnd = html.indexOf('</head>');
  if (headEnd < 0) throw new Error('Could not find </head>');
  html = html.slice(0, headEnd) + styles + html.slice(headEnd);
}

const intro = html.match(/<section class="did-intro"[\s\S]*?<\/section>/);
if (intro) html = html.replace(intro[0], '');

const designStart = '<!-- COURSEWORK_DESIGN_START -->';
const designEnd = '<!-- COURSEWORK_DESIGN_END -->';
const design = `${designStart}
<section class="coursework-section" id="research-question" aria-labelledby="research-question-title">
  <div class="coursework-section-head"><span class="coursework-step">01</span><div><h2 id="research-question-title">연구 주제와 질문</h2><p>분석 대상·기간·공간 단위를 먼저 정리합니다.</p></div></div>
  <div class="coursework-question"><div class="coursework-eyebrow">연구 질문</div><p>2015–2024년 부산의 인구밀집구역(DID)은 어디서 유지·탈락·신규 형성되었는가? 인구감소 구·군의 정주인구 변화와 고용·생활인구 지표는 어떻게 다른가?</p></div>
  <div class="coursework-grid">
    <article class="coursework-card"><h3>분석 대상과 공간 단위</h3><p>부산광역시 전체를 대상으로 DID는 500m 격자, 기능 지표는 구·군, 생활인구 변화는 행정동 단위로 분석합니다. 비교 대상은 남구·북구·사상구·영도구와 부산 전체입니다.</p></article>
    <article class="coursework-card"><h3>분석 시점</h3><p>DID·정주인구 격자: 2015년과 2024년<br>주민등록인구·종사자: 2021년과 2024년<br>생활인구: 2023년과 2024년 변화 및 2024년 월별 수준</p></article>
    <article class="coursework-card"><h3>핵심 비교</h3><p>인구밀집구역의 공간적 유지·변화를 먼저 확인하고, 구·군별 인구·고용·생활인구 지표와 DID 변화 격자의 정주인구 변화를 함께 읽습니다.</p></article>
  </div>
</section>
<section class="coursework-section" id="indicator-design" aria-labelledby="indicator-design-title">
  <div class="coursework-section-head"><span class="coursework-step">02</span><div><h2 id="indicator-design-title">자료와 지표 설계</h2><p>자료의 시점과 공간 단위가 다르므로 지표별 해석 범위를 구분합니다.</p></div></div>
  <div class="coursework-grid">
    <article class="coursework-card"><h3>사용 자료</h3><ul><li>SGIS 2015·2024년 500m 격자 인구</li><li>부산광역시 2025년 행정동 경계</li><li>행정안전부 주민등록인구 2021·2024년 12월</li><li>읍면동별 산업대분류 종사자 2021·2024년</li><li>부산시 행정동별 시간 생활인구 2023·2024년</li><li>2024년 주민등록 전입·전출 자료</li></ul></article>
    <article class="coursework-card"><h3>DID 정의와 격자 전처리</h3><p>DID는 인구가 조밀한 격자가 이어져 이루는 통계적 도시지역입니다. 500m × 500m 격자에서 인구 1,000명 이상 셀을 고르고, 변을 공유하는 4방향 연결집단 중 총인구 5,000명 이상인 집단을 DID로 분류합니다. 대각선만 닿는 셀은 연결하지 않습니다.</p></article>
    <article class="coursework-card"><h3>공간 결합과 정리</h3><p>부산 행정동 경계와 교차하는 격자를 분석 대상으로 삼았습니다. 행정동별 집계는 셀 중심점이 포함되는 2025년 경계에 연결해 두 연도를 같은 경계 기준으로 비교합니다. 생활인구는 24시간 평균을 월별로 집계해 행정동·구군 단위로 계산합니다.</p></article>
  </div>
  <div class="coursework-methods">
    <div class="coursework-table-wrap"><table class="coursework-table"><thead><tr><th>지표</th><th>산출식과 분석 단위</th><th>값의 해석</th></tr></thead><tbody>
      <tr><td>DID 분류</td><td>500m 셀 인구 ≥ 1,000명; 4방향 연결집단 인구 합계 ≥ 5,000명. 격자 단위.</td><td>기준을 충족하는 연결 인구밀집구역. 셀 수와 해당 셀 인구를 연도별 비교합니다.</td></tr>
      <tr><td>① 정주인구 변화</td><td>((2024년 12월 인구 ÷ 2021년 12월 인구)^(1/3) − 1) × 100. 구·군별 연평균 변화율.</td><td>높을수록 증가 또는 감소 폭이 작습니다. 음수는 인구 감소를 뜻합니다.</td></tr>
      <tr><td>② 고용기반 변화</td><td>((2024년 종사자 ÷ 2021년 종사자)^(1/3) − 1) × 100. 구·군별 연평균 변화율.</td><td>높을수록 종사자 기반이 증가했거나 감소 폭이 작습니다.</td></tr>
      <tr><td>③ 체류인구 흡인력</td><td>2024년 월별 24시간 평균 생활인구의 연평균 ÷ 2024년 12월 주민등록인구 × 100. 구·군별.</td><td>100% 초과는 평균 생활인구가 등록인구보다 큼을 의미하며, 개인별 유입이나 원인을 직접 뜻하지 않습니다.</td></tr>
      <tr><td>④ 생활인구 지속성</td><td>2024년 생활인구가 가장 낮은 3개월의 평균 ÷ 12개월 연평균 × 100. 구·군별.</td><td>높을수록 계절적 저점에도 연평균 수준에 가깝게 유지됩니다.</td></tr>
      <tr><td>⑤ 구·군 간 이동 비율</td><td>부산 내 구·군 간 전입·전출 합계 ÷ 전체 전입·전출 합계 × 100. 구·군별.</td><td>높을수록 주민등록상 이동 중 구·군 간 이동의 비중이 큽니다. 일상생활 이동량 지표는 아닙니다.</td></tr>
    </tbody></table></div>
    <p class="coursework-source-note">자료 출처: 통계지리정보서비스(SGIS) 인구격자통계, 부산광역시 생활인구·행정동 경계, KOSIS 주민등록인구, 읍면동별 사업체·종사자 통계, 주민등록 전입·전출 자료. 분석에 사용한 각 지표의 기준연도는 위와 같습니다. 구·군 레이더의 0–100 점수는 네 구와 부산 전체 5개 비교대상 안에서 지표별로 표준화한 상대점수이며, 표의 원자료 값과 함께 해석합니다.</p>
  </div>
</section>
${designEnd}`;

if (html.includes(designStart)) {
  const a = html.indexOf(designStart), b = html.indexOf(designEnd, a) + designEnd.length;
  if (b < designEnd.length) throw new Error('Coursework design markers are incomplete');
  html = html.slice(0, a) + design + html.slice(b);
} else {
  const at = html.indexOf('<!-- DID_DASHBOARD_START -->');
  if (at < 0) throw new Error('Could not find DID dashboard');
  html = html.slice(0, at) + design + '\n' + html.slice(at);
}

const mapHeading = /<div class="did-section-heading"><div><h2>[\s\S]*?<\/h2><p>[\s\S]*?<\/p><\/div><small id="did-change-count"><\/small><\/div>/;
html = html.replace(mapHeading, '<div class="did-section-heading"><div class="did-section-titleline"><span class="coursework-step">03</span><div><h2>3. 인구밀집구역(DID)의 공간 분포와 변화</h2><p>2015–2024년 500m 격자에서 유지·탈락·신규 분포를 비교합니다.</p></div></div><small id="did-change-count"></small></div>');

const shrinkStart = '<!-- SHRINKAGE_DIAGNOSIS_START -->';
const shrinkEnd = '<!-- SHRINKAGE_DIAGNOSIS_END -->';
let shrinkA = html.indexOf(shrinkStart), shrinkB = html.indexOf(shrinkEnd, shrinkA) + shrinkEnd.length;
if (shrinkA < 0 || shrinkB < shrinkEnd.length) throw new Error('Could not find district indicator section');
let shrink = html.slice(shrinkA, shrinkB);
shrink = shrink.replace('3. 인구밀집구역(DID) 탈락지역 축소양상 진단', '4.1 구·군별 축소·생활기능 지표 비교');
shrink = shrink.replace('DID 탈락지역은 어떤 축소 특성을 보이는가?', '남구·북구·사상구·영도구를 부산 전체와 다섯 지표로 비교합니다.');
html = html.slice(0, shrinkA) + shrink + html.slice(shrinkB);

const scatterStart = '<!-- POPULATION_FUNCTION_SCATTER_START -->';
const scatterEnd = '<!-- POPULATION_FUNCTION_SCATTER_END -->';
let scatterA = html.indexOf(scatterStart), scatterB = html.indexOf(scatterEnd, scatterA) + scatterEnd.length;
if (scatterA < 0 || scatterB < scatterEnd.length) throw new Error('Could not find grid scatter section');
let scatter = html.slice(scatterA, scatterB);
scatter = scatter.replace('2. 인구감소지역 정주·생활기능 변화 분석', '4.2 격자별 정주인구 변화와 행정동 생활인구 변화');
scatter = scatter.replace('정주인구 감소와 생활인구 변화는 어떻게 나타나는가?', 'DID 변화 격자의 인구 증감과 격자가 속한 행정동의 생활인구 변화율을 함께 봅니다.');
scatter = scatter.replace(/<li>점 1개는[\s\S]*?<\/ul>/, '<li>점 하나는 DID 변화 500m 격자 1개이며 총 754개(유지 682·탈락 27·신규 45)</li><li>X축: 격자별 2015–2024년 인구 증감(명) · Y축: 소속 행정동의 2023–2024년 생활인구 증감률(%)</li><li>생활인구는 행정동 값이므로 같은 동의 격자에는 같은 값이 연결됩니다. 격자별 생활인구 측정치나 독립 표본으로 해석하지 않습니다.</li></ul>');
html = html.slice(0, scatterA) + html.slice(scatterB);

// Place the district comparison before the grid scatter to follow map → non-spatial charts.
shrinkA = html.indexOf(shrinkStart); shrinkB = html.indexOf(shrinkEnd, shrinkA) + shrinkEnd.length;
shrink = html.slice(shrinkA, shrinkB);
html = html.slice(0, shrinkA) + html.slice(shrinkB);
const scatterAt = html.indexOf(scatterStart);
const nonspatialStart = '<!-- COURSEWORK_NONSPATIAL_START -->';
const nonspatialEnd = '<!-- COURSEWORK_NONSPATIAL_END -->';
const nonspatial = `${nonspatialStart}<section class="coursework-section" aria-labelledby="nonspatial-title"><div class="coursework-section-head"><span class="coursework-step">04</span><div><h2 id="nonspatial-title">비공간 시각화와 구·군별 비교</h2><p>구·군 단위 지표 비교와 DID 변화 격자 산점도로 지역 간 차이를 해석합니다.</p></div></div></section>${nonspatialEnd}`;
if (html.includes(nonspatialStart)) {
  const a = html.indexOf(nonspatialStart), b = html.indexOf(nonspatialEnd, a) + nonspatialEnd.length;
  html = html.slice(0, a) + html.slice(b);
}
const mapEnd = html.indexOf('<!-- DID_DASHBOARD_END -->') + '<!-- DID_DASHBOARD_END -->'.length;
html = html.slice(0, mapEnd) + '\n' + nonspatial + '\n' + shrink + '\n' + scatter + '\n' + html.slice(mapEnd);

const findingsStart = '<!-- COURSEWORK_FINDINGS_START -->';
const findingsEnd = '<!-- COURSEWORK_FINDINGS_END -->';
const findings = `${findingsStart}
<section class="coursework-section" id="findings" aria-labelledby="findings-title">
  <div class="coursework-section-head"><span class="coursework-step">05</span><div><h2 id="findings-title">결과 해석과 한계</h2><p>지도와 지표를 함께 읽고, 자료가 말해 주지 않는 범위를 구분합니다.</p></div></div>
  <div class="coursework-result-grid">
    <article class="coursework-result"><strong>인구가 줄어도 DID 격자 수는 늘었습니다</strong><p>2015년 709개에서 2024년 727개로 18개(약 2.5%) 증가했습니다. 반면 DID 셀 인구 합계는 3,276,199명에서 3,094,069명으로 182,130명(약 5.6%) 감소했습니다. DID 셀 수 증가는 해당 구역의 총인구 증가와 같지 않습니다.</p></article>
    <article class="coursework-result"><strong>기존 DID의 대부분은 유지됐습니다</strong><p>유지 682개·탈락 27개·신규 45개입니다. 2015년 DID 709개 중 약 96.2%가 유지됐고, 2024년 DID 727개 중 신규 격자는 약 6.2%입니다. 지도에서는 유지 셀이 부산의 주요 인구밀집 생활권을 이루며 탈락·신규는 상대적으로 국지적으로 나타납니다.</p></article>
    <article class="coursework-result"><strong>네 구의 인구·고용·생활기능은 서로 다릅니다</strong><p>2021–2024년 정주인구는 네 구 모두 감소했고, 감소 폭은 영도구가 연평균 −2.12%로 가장 컸습니다. 종사자는 영도구만 연평균 +0.46%였고 나머지 세 구는 감소했습니다. 생활인구/등록인구 비율은 사상구 103.6%, 영도구 106.3%로 100%를 넘었습니다.</p></article>
  </div>
  <div class="coursework-bottom-grid">
    <article class="coursework-limit"><h3>지역 차이가 의미하는 것</h3><ul><li>인구감소는 모든 기능의 같은 속도 감소를 뜻하지 않습니다. 영도구는 등록인구가 감소했지만 종사자 수는 증가했고, 사상구·영도구의 평균 생활인구는 등록인구보다 많았습니다.</li><li>생활인구 지속성은 네 구 모두 약 97.6–98.4%로 비슷했습니다. 2024년 월별 생활인구의 저점도 연평균과 큰 차이가 없다는 뜻입니다.</li><li>구·군 간 주민등록 이동 비율은 사상구 46.2%로 네 구 중 가장 높고 북구는 36.5%로 가장 낮았습니다. 이는 주민등록상 이동 구성의 차이이며 일상 통근·방문 이동량의 차이는 아닙니다.</li></ul></article>
    <article class="coursework-limit"><h3>분석의 한계</h3><ul><li>시점이 서로 다릅니다: DID는 2015–2024년, 인구·종사자는 2021–2024년, 생활인구 변화는 2023–2024년입니다. 같은 기간의 동시 변화나 인과관계로 단정할 수 없습니다.</li><li>산점도의 생활인구 변화율은 행정동 단위 값이며, 같은 행정동에 속한 격자마다 반복 연결됩니다. 754개 점을 독립적인 격자별 생활인구 관측으로 보거나 상관관계의 표본 수로 해석할 수 없습니다.</li><li>산점도에서 행정동 연결이 안 되거나 생활인구 변화율이 없는 격자 15개는 실제 Y값이 없습니다. 격자 중심점과 2025년 행정동 경계 결합, 자료 범위에 따른 누락입니다.</li><li>행정동 집계에는 2025년 경계를 두 연도에 공통 적용했습니다. DID의 기준값·격자 크기와 구·군 레이더의 상대점수에 따라 결과가 달라질 수 있고, 네 구 비교만으로 부산 전체 모든 지역을 대표하지 않습니다.</li></ul></article>
  </div>
  <p class="coursework-source-note">산출값은 분류 기준과 행정구역 집계 방식에 따른 기술통계입니다. 도시 구조·토지이용·정책 변화가 관찰된 차이를 만들었다고 이 분석만으로 인과 설명할 수는 없습니다.</p>
</section>
${findingsEnd}`;
if (html.includes(findingsStart)) {
  const a = html.indexOf(findingsStart), b = html.indexOf(findingsEnd, a) + findingsEnd.length;
  if (b < findingsEnd.length) throw new Error('Coursework findings markers are incomplete');
  html = html.slice(0, a) + findings + html.slice(b);
} else {
  const at = html.lastIndexOf('</body>');
  if (at < 0) throw new Error('Could not find </body>');
  html = html.slice(0, at) + findings + '\n' + html.slice(at);
}

// Rendered chart scripts follow </main>; keep the written interpretation after those visuals.
const findingsA = html.indexOf(findingsStart), findingsB = html.indexOf(findingsEnd, findingsA) + findingsEnd.length;
const findingsBlock = html.slice(findingsA, findingsB);
html = html.slice(0, findingsA) + html.slice(findingsB);
const bodyClose = html.lastIndexOf('</body>');
if (bodyClose < 0) throw new Error('Could not find </body>');
html = html.slice(0, bodyClose) + findingsBlock + '\n' + html.slice(bodyClose);

// The older build had appended analysis sections after </html>; normalize the document boundary.
html = html.replace(/<\/main>/i, '').replace(/<\/body>/gi, '').replace(/<\/html>/gi, '');
const finalFindingsA = html.indexOf(findingsStart), finalFindingsB = html.indexOf(findingsEnd, finalFindingsA) + findingsEnd.length;
const finalFindings = html.slice(finalFindingsA, finalFindingsB);
html = html.slice(0, finalFindingsA) + html.slice(finalFindingsB);
html = html.trimEnd() + '\n' + finalFindings + '\n</main>\n</body></html>\n';

fs.writeFileSync(file, html, 'utf8');
console.log('Reorganized the page into research question, data and indicators, spatial results, non-spatial results, and interpretation/limitations.');

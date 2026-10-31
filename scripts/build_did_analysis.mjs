import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('shrinking-busan/data');
const outDir = path.join(dataDir, 'derived');
fs.mkdirSync(outDir, { recursive: true });
const decoder = new TextDecoder('euc-kr');
const dbfDecoder = new TextDecoder('utf-8');

// EPSG:5179 (Korea 2000 / Unified CS) <-> WGS84.
const a = 6378137;
const f = 1 / 298.257222101;
const e2 = f * (2 - f);
const ep2 = e2 / (1 - e2);
const k0 = 0.9996;
const lon0 = 127.5 * Math.PI / 180;
const lat0 = 38 * Math.PI / 180;
const x0 = 1000000;
const y0 = 2000000;
const e4 = e2 * e2;
const e6 = e4 * e2;
function meridionalArc(phi) {
  return a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi
    - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi)
    + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi)
    - (35 * e6 / 3072) * Math.sin(6 * phi));
}
const m0 = meridionalArc(lat0);
function forward([lon, lat]) {
  const phi = lat * Math.PI / 180;
  const lam = lon * Math.PI / 180;
  const sin = Math.sin(phi), cos = Math.cos(phi), tan = Math.tan(phi);
  const n = a / Math.sqrt(1 - e2 * sin * sin);
  const t = tan * tan, c = ep2 * cos * cos, aa = (lam - lon0) * cos;
  const xx = x0 + k0 * n * (aa + (1 - t + c) * aa ** 3 / 6
    + (5 - 18 * t + t * t + 72 * c - 58 * ep2) * aa ** 5 / 120);
  const yy = y0 + k0 * (meridionalArc(phi) - m0 + n * tan * (aa * aa / 2
    + (5 - t + 9 * c + 4 * c * c) * aa ** 4 / 24
    + (61 - 58 * t + t * t + 600 * c - 330 * ep2) * aa ** 6 / 720));
  return [xx, yy];
}
function inverse([x, y]) {
  const m = m0 + (y - y0) / k0;
  const mu = m / (a * (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256));
  const root = Math.sqrt(1 - e2);
  const e1 = (1 - root) / (1 + root);
  const e1_2 = e1 * e1, e1_3 = e1_2 * e1, e1_4 = e1_3 * e1;
  const phi1 = mu + (3 * e1 / 2 - 27 * e1_3 / 32) * Math.sin(2 * mu)
    + (21 * e1_2 / 16 - 55 * e1_4 / 32) * Math.sin(4 * mu)
    + (151 * e1_3 / 96) * Math.sin(6 * mu)
    + (1097 * e1_4 / 512) * Math.sin(8 * mu);
  const sin = Math.sin(phi1), cos = Math.cos(phi1), tan = Math.tan(phi1);
  const n1 = a / Math.sqrt(1 - e2 * sin * sin);
  const r1 = a * (1 - e2) / (1 - e2 * sin * sin) ** 1.5;
  const t1 = tan * tan, c1 = ep2 * cos * cos, d = (x - x0) / (n1 * k0);
  const phi = phi1 - (n1 * tan / r1) * (d * d / 2
    - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * ep2) * d ** 4 / 24
    + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * ep2 - 3 * c1 * c1) * d ** 6 / 720);
  const lam = lon0 + (d - (1 + 2 * t1 + c1) * d ** 3 / 6
    + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * ep2 + 24 * t1 * t1) * d ** 5 / 120) / cos;
  return [lam * 180 / Math.PI, phi * 180 / Math.PI];
}

function readDbf(file) {
  const b = fs.readFileSync(file);
  const count = b.readUInt32LE(4), headerLen = b.readUInt16LE(8), recordLen = b.readUInt16LE(10);
  const fields = [];
  for (let pos = 32; pos < headerLen - 1; pos += 32) {
    const d = b.subarray(pos, pos + 32);
    if (d[0] === 13) break;
    const zero = d.subarray(0, 11).indexOf(0);
    fields.push({ name: dbfDecoder.decode(d.subarray(0, zero < 0 ? 11 : zero)).trim(), length: d[16] });
  }
  const codeField = fields.findIndex(x => x.name === 'GRID_CD');
  if (codeField < 0) throw new Error(`GRID_CD is missing in ${file}`);
  const offsets = [];
  let offset = 1;
  for (const field of fields) { offsets.push(offset); offset += field.length; }
  const codes = [];
  for (let i = 0; i < count; i++) {
    const row = headerLen + i * recordLen;
    codes.push(dbfDecoder.decode(b.subarray(row + offsets[codeField], row + offsets[codeField] + fields[codeField].length)).replace(/\0/g, '').trim());
  }
  return codes;
}

function readShp(file) {
  const b = fs.readFileSync(file);
  const shapes = [];
  let pos = 100;
  while (pos + 8 <= b.length) {
    const words = b.readInt32BE(pos + 4);
    const bytes = words * 2;
    const start = pos + 8;
    if (bytes < 4 || start + bytes > b.length) throw new Error(`Bad SHP record in ${file}`);
    const type = b.readInt32LE(start);
    if (type === 5 || type === 15 || type === 25) {
      const partsN = b.readInt32LE(start + 36);
      const pointsN = b.readInt32LE(start + 40);
      const partsOffset = start + 44;
      const pointsOffset = partsOffset + partsN * 4;
      const starts = Array.from({ length: partsN }, (_, i) => b.readInt32LE(partsOffset + i * 4));
      starts.push(pointsN);
      const parts = [];
      for (let p = 0; p < partsN; p++) {
        const ring = [];
        for (let i = starts[p]; i < starts[p + 1]; i++) {
          const off = pointsOffset + i * 16;
          ring.push([b.readDoubleLE(off), b.readDoubleLE(off + 8)]);
        }
        parts.push(ring);
      }
      shapes.push(parts);
    } else if (type === 0) shapes.push(null);
    else throw new Error(`Unsupported SHP geometry type ${type} in ${file}`);
    pos = start + bytes;
  }
  return shapes;
}

const reqDirs = fs.readdirSync(dataDir).filter(x => x.startsWith('_census_reqdoc_') && fs.statSync(path.join(dataDir, x)).isDirectory());
function findYearDir(year) {
  return reqDirs.find(d => fs.readdirSync(path.join(dataDir, d)).some(f => f.startsWith(`${year}년_인구_`) && f.endsWith('_500M.csv')));
}
function readPopulation(year) {
  const dir = findYearDir(year);
  if (!dir) throw new Error(`${year} 500m population CSVs were not found`);
  const result = new Map();
  for (const file of fs.readdirSync(path.join(dataDir, dir)).filter(x => x.startsWith(`${year}년_인구_`) && x.endsWith('_500M.csv'))) {
    const text = decoder.decode(fs.readFileSync(path.join(dataDir, dir, file)));
    for (const line of text.split(/\r?\n/)) {
      if (!line) continue;
      const [baseYear, grid, stat, rawPop] = line.split(',');
      if (stat !== 'to_in_001') continue;
      const pop = Number(rawPop);
      if (Number.isFinite(pop)) result.set(grid.trim(), pop);
    }
  }
  return result;
}

function boundsOf(rings) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of rings) for (const [x, y] of ring) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}
function insideRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function pointInPolygon(point, rings) {
  if (!rings.length || !insideRing(point, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) if (insideRing(point, rings[i])) return false;
  return true;
}
function segmentHitsRect(a, b, r) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let t0 = 0, t1 = 1;
  const tests = [[-dx, a[0] - r.minX], [dx, r.maxX - a[0]], [-dy, a[1] - r.minY], [dy, r.maxY - a[1]]];
  for (const [p, q] of tests) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; t0 = Math.max(t0, t); }
    else { if (t < t0) return false; t1 = Math.min(t1, t); }
  }
  return true;
}
function rectIntersectsPolygon(r, rings) {
  const corners = [[r.minX,r.minY],[r.maxX,r.minY],[r.maxX,r.maxY],[r.minX,r.maxY]];
  if (corners.some(p => pointInPolygon(p, rings))) return true;
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i], q = ring[(i + 1) % ring.length];
      if (p[0] >= r.minX && p[0] <= r.maxX && p[1] >= r.minY && p[1] <= r.maxY) return true;
      if (segmentHitsRect(p, q, r)) return true;
    }
  }
  return false;
}

const admin = JSON.parse(fs.readFileSync(path.join(dataDir, 'busan_hjd_20250101.geojson'), 'utf8'));
const adminProjected = admin.features.map(feature => {
  const geom = feature.geometry;
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  const polygons = polys.map(poly => poly.map(ring => ring.map(forward)));
  return { feature, polygons, bounds: boundsOf(polygons.flat()) };
});
const busanBounds = boundsOf(adminProjected.flatMap(x => x.polygons).flat());

function loadGridCells(pop15, pop24) {
  const dirs = fs.readdirSync(dataDir).filter(x => x.startsWith('_grid_border_grid_2025_') && !x.endsWith('(1)') && fs.statSync(path.join(dataDir, x)).isDirectory());
  const usedZones = new Set(), all = [];
  for (const dir of dirs) {
    const folder = path.join(dataDir, dir);
    const shpName = fs.readdirSync(folder).find(x => /^grid_.+_500M\.shp$/.test(x));
    if (!shpName) continue;
    const zone = shpName.slice(5, -9);
    if (usedZones.has(zone)) continue;
    usedZones.add(zone);
    const codes = readDbf(path.join(folder, shpName.replace('.shp', '.dbf')));
    const shapes = readShp(path.join(folder, shpName));
    if (codes.length !== shapes.length) throw new Error(`SHP/DBF record mismatch for ${shpName}`);
    for (let i = 0; i < codes.length; i++) {
      const shape = shapes[i];
      if (!shape?.length) continue;
      const rect = boundsOf(shape);
      if (rect.maxX < busanBounds.minX || rect.minX > busanBounds.maxX || rect.maxY < busanBounds.minY || rect.minY > busanBounds.maxY) continue;
      const matchingAdmin = adminProjected.filter(x => x.bounds.maxX >= rect.minX && x.bounds.minX <= rect.maxX && x.bounds.maxY >= rect.minY && x.bounds.minY <= rect.maxY);
      if (!matchingAdmin.some(x => x.polygons.some(poly => rectIntersectsPolygon(rect, poly)))) continue;
      const code = codes[i];
      const rings = shape.map(ring => ring.map(inverse));
      const center = [(rect.minX + rect.maxX) / 2, (rect.minY + rect.maxY) / 2];
      all.push({ code, rings, rect, center, pop2015: pop15.get(code) ?? 0, pop2024: pop24.get(code) ?? 0 });
    }
  }
  return all;
}

function findDID(cells, year) {
  const popKey = `pop${year}`;
  const eligible = cells.filter(c => c[popKey] >= 1000);
  const anchorX = eligible[0]?.center[0] ?? 0, anchorY = eligible[0]?.center[1] ?? 0;
  const keyOf = c => `${Math.round((c.center[0] - anchorX) / 500)},${Math.round((c.center[1] - anchorY) / 500)}`;
  const byKey = new Map(eligible.map(c => [keyOf(c), c]));
  const seen = new Set(), did = new Set(), clusters = [];
  for (const cell of eligible) {
    const key = keyOf(cell);
    if (seen.has(key)) continue;
    const stack = [cell], group = [];
    seen.add(key);
    while (stack.length) {
      const current = stack.pop();
      group.push(current);
      const [gx, gy] = keyOf(current).split(',').map(Number);
      for (const nextKey of [`${gx-1},${gy}`,`${gx+1},${gy}`,`${gx},${gy-1}`,`${gx},${gy+1}`]) {
        const next = byKey.get(nextKey);
        if (next && !seen.has(nextKey)) { seen.add(nextKey); stack.push(next); }
      }
    }
    const sum = group.reduce((s, c) => s + c[popKey], 0);
    clusters.push({ cells: group, population: sum });
    if (sum >= 5000) for (const c of group) did.add(c.code);
  }
  return { did, eligibleCount: eligible.length, clusterCount: clusters.length, qualifyingClusterCount: clusters.filter(x => x.population >= 5000).length, population: [...did].reduce((s, code) => s + cells.find(c => c.code === code)[popKey], 0) };
}

function pointInAdmin(point) {
  for (const item of adminProjected) {
    const b = item.bounds;
    if (point[0] < b.minX || point[0] > b.maxX || point[1] < b.minY || point[1] > b.maxY) continue;
    if (item.polygons.some(poly => pointInPolygon(point, poly))) return item.feature;
  }
  return null;
}

const pop2015 = readPopulation(2015), pop2024 = readPopulation(2024);
const cells = loadGridCells(pop2015, pop2024);
const did2015 = findDID(cells, 2015), did2024 = findDID(cells, 2024);
const did15 = did2015.did, did24 = did2024.did;
const kept = new Set([...did15].filter(x => did24.has(x)));
const lost = new Set([...did15].filter(x => !did24.has(x)));
const gained = new Set([...did24].filter(x => !did15.has(x)));
const cellByCode = new Map(cells.map(c => [c.code, c]));
function featureFromCell(cell, status, year) {
  return {
    type: 'Feature',
    properties: { grid_cd: cell.code, population: cell[`pop${year}`], population_2015: cell.pop2015, population_2024: cell.pop2024, year, status },
    geometry: { type: 'Polygon', coordinates: [cell.rings[0]] }
  };
}
function makeGridCollection(codes, year, status) {
  return { type: 'FeatureCollection', features: [...codes].map(code => featureFromCell(cellByCode.get(code), status, year)) };
}
const transitionCodes = new Map();
for (const code of kept) transitionCodes.set(code, '유지');
for (const code of lost) transitionCodes.set(code, '탈락');
for (const code of gained) transitionCodes.set(code, '신규');
const transitionGeo = { type: 'FeatureCollection', features: [...transitionCodes].map(([code,status]) => featureFromCell(cellByCode.get(code), status, status === '탈락' ? 2015 : 2024)) };
const busanGridGeo = {
  type: 'FeatureCollection',
  features: cells.map(cell => ({
    type: 'Feature',
    properties: { grid_cd: cell.code, population_2015: cell.pop2015, population_2024: cell.pop2024 },
    geometry: { type: 'Polygon', coordinates: [cell.rings[0]] }
  }))
};

const dongStats = new Map(admin.features.map(f => [f.properties.adm_cd2, {
  adm_cd2: f.properties.adm_cd2, adm_nm: f.properties.adm_nm, dong_name: f.properties.dong_name,
  did2015: 0, did2024: 0, kept: 0, lost: 0, gained: 0
}]));
for (const cell of cells) {
  const dong = pointInAdmin(cell.center);
  if (!dong) continue;
  const row = dongStats.get(dong.properties.adm_cd2);
  if (did15.has(cell.code)) row.did2015++;
  if (did24.has(cell.code)) row.did2024++;
  if (kept.has(cell.code)) row.kept++;
  if (lost.has(cell.code)) row.lost++;
  if (gained.has(cell.code)) row.gained++;
}
for (const row of dongStats.values()) {
  if (!row.did2015 && !row.did2024) row.route = 'DID 없음';
  else if (!row.did2015) row.route = '신규';
  else if (!row.did2024) row.route = '탈락';
  else if (row.lost && row.gained) row.route = '유지·일부변화';
  else if (row.lost) row.route = '유지·일부탈락';
  else if (row.gained) row.route = '유지·신규포함';
  else row.route = '유지';
}
const routeColors = { 'DID 없음':'#dce4df','유지':'#8ec4a1','유지·일부탈락':'#e2b969','유지·신규포함':'#7fb5bb','유지·일부변화':'#d99a67','탈락':'#cf7667','신규':'#719fc7' };
const dongChangeGeo = {
  type: 'FeatureCollection',
  features: admin.features.map(f => {
    const row = dongStats.get(f.properties.adm_cd2);
    return { type:'Feature', properties:{...row, color:routeColors[row.route]}, geometry:f.geometry };
  })
};

const outputs = {
  did_2015_500m: makeGridCollection(did15, 2015, 'DID'),
  did_2024_500m: makeGridCollection(did24, 2024, 'DID'),
  did_change_500m: transitionGeo,
  busan_500m_grid: busanGridGeo,
  busan_did_change_by_dong: dongChangeGeo
};
for (const [name, value] of Object.entries(outputs)) fs.writeFileSync(path.join(outDir, `${name}.geojson`), JSON.stringify(value), 'utf8');

const summary = {
  method: '500m cells with population >= 1000; 4-neighbour edge-connected qualifying cells retained when component population >= 5000.',
  study_area: 'Busan cells whose grid rectangle intersects a Busan administrative-dong polygon; dong rollup uses cell centroid in 2025 dong boundaries.',
  grid_cells_intersecting_busan: cells.length,
  population_csv_cells_2015: pop2015.size,
  population_csv_cells_2024: pop2024.size,
  did_2015: { eligible_cell_count: did2015.eligibleCount, connected_components: did2015.clusterCount, components_meeting_5000: did2015.qualifyingClusterCount, did_cell_count: did15.size, population: did2015.population },
  did_2024: { eligible_cell_count: did2024.eligibleCount, connected_components: did2024.clusterCount, components_meeting_5000: did2024.qualifyingClusterCount, did_cell_count: did24.size, population: did2024.population },
  retained_cells: kept.size,
  dropped_cells: lost.size,
  new_cells: gained.size,
  route_counts_by_dong: Object.fromEntries([...dongStats.values()].reduce((m,r)=>m.set(r.route,(m.get(r.route)||0)+1),new Map())),
  output_features: Object.fromEntries(Object.entries(outputs).map(([k,v])=>[k,v.features.length]))
};
fs.writeFileSync(path.join(outDir, 'did_summary.json'), JSON.stringify(summary, null, 2), 'utf8');
console.log(JSON.stringify(summary, null, 2));

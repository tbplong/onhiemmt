// One-off: pulls real river/canal geometry from OpenStreetMap (Overpass) for rows in
// data/du_lieu_song_rach.csv and writes public/waterways.geojson. Data © OSM contributors, ODbL.
// Usage: npm run fetch-waterways
import { writeFile } from 'node:fs/promises';

// CSV `name` → regexes matched against OSM `name` tags. Only rows that are a whole river/canal;
// point rows (bridges, ports, a single station) and names OSM does not have stay as markers.
const WATERWAYS = {
  'Kênh Tàu Hủ – Bến Nghé': ['Tàu H[ủũu]', 'Bến Nghé'],
  'Kênh Nhiêu Lộc – Thị Nghè': ['Nhiêu Lộc', 'Thị Nghè'],
  'Kênh Tân Hóa – Lò Gốm': ['Tân H[óo]a', 'Lò Gốm'],
  'Kênh Đôi – Kênh Tẻ': ['^Kênh Đôi$', '^Kênh Tẻ$'],
  'Sông Sài Gòn': ['^Sông Sài Gòn$'],
  'Kênh Tham Lương – Bến Cát – Vàm Thuật': ['Tham Lương', 'Bến Cát', 'Vàm Thuật'],
  'Rạch Văn Thánh – Xuyên Tâm': ['Văn Thánh', 'Xuyên Tâm'],
  'Kênh Hàng Bàng': ['Hàng Bàng'],
  'Sông Chợ Đệm – Bến Lức': ['^Sông Chợ Đệm', '^Sông Bến Lức'],
  'Sông Cần Giuộc – Phước Kiểng': ['^Sông Cần Giuộc', 'Phước Kiểng'],
  'Sông Thị Tính': ['Thị Tính'],
  'Sông Bé': ['^Sông Bé$'],
  'Sông Thị Vải': ['^Sông Thị Vải$'],
  'Sông Dinh': ['^Sông Dinh$'],
  'Sông Ray': ['^Sông Ray$'],
  'Sông Lòng Tàu': ['Lòng Tàu'],
  'Sông Soài Rạp': ['Soài Rạp'],
};

// HCMC after the 2025 merger (incl. former Bình Dương and Bà Rịa – Vũng Tàu): S, W, N, E.
const BBOX = '10.3,106.3,11.55,107.6';
const ENDPOINT = 'https://overpass-api.de/api/interpreter';

const patterns = Object.values(WATERWAYS).flat();
const query = `[out:json][timeout:180];
way["waterway"~"^(river|canal|stream|drain|ditch)$"]["name"~"${patterns.join('|')}",i](${BBOX});
out geom;`;

const round = (n) => Math.round(n * 1e5) / 1e5;

async function main() {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    headers: { 'User-Agent': 'ban-do-moi-truong-tphcm/0.1 (one-off build script)' },
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}: ${await res.text()}`);
  const { elements } = await res.json();

  const matchers = Object.entries(WATERWAYS).map(([place, res]) => [
    place,
    res.map((r) => new RegExp(r, 'i')),
  ]);
  const features = [];
  const hits = Object.fromEntries(Object.keys(WATERWAYS).map((p) => [p, 0]));
  for (const way of elements) {
    const osmName = way.tags?.name ?? '';
    const match = matchers.find(([, res]) => res.some((r) => r.test(osmName)));
    if (!match || !way.geometry?.length) continue;
    hits[match[0]]++;
    features.push({
      type: 'Feature',
      properties: { place: match[0], osmName, osmId: way.id },
      geometry: {
        type: 'LineString',
        coordinates: way.geometry.map((p) => [round(p.lon), round(p.lat)]),
      },
    });
  }

  await writeFile(
    new URL('../public/waterways.geojson', import.meta.url),
    JSON.stringify({ type: 'FeatureCollection', features }),
  );
  console.table(hits);
  console.log(`${features.length} ways written to public/waterways.geojson`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

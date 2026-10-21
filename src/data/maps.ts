import { TerrainConfig, TerrainId } from '../types';

/**
 * Where the map pictures come from. Default is Enfumap (license/permission still unverified, see docs/phase3-report.md).
 * To use another host (for example your own copy of the tiles) set VITE_TILE_HOST at build time, no code change needed.
 */
const TILE_HOST: string = ((import.meta as any).env?.VITE_TILE_HOST || 'https://enfumap.com').replace(/\/+$/, '');

export const TERRAINS: Record<TerrainId, TerrainConfig> = {
  everon: {
    id: 'everon',
    name: 'Everon',
    worldSize: 12800,
    tileSize: 256,
    minZoom: 0,
    maxNativeZoom: 7,
    maxZoom: 8, // At most 1 level above maxNativeZoom (Section 2.2)
    version: 1790937841,
    defaultCenter: [6400, 6400],
    defaultWeapon: [4800, 7100], // Near Montignac
    defaultTarget: [5760, 7060], // Entre Deux
    layers: {
      topo: `${TILE_HOST}/tiles/everon/{z}/{x}/{y}.webp?v=1790937841`,
      sat: `${TILE_HOST}/tiles/everon/sat/{z}/{x}/{y}.webp?v=1791307910`,
      drawn: `${TILE_HOST}/tiles/everon/drawn/{z}/{x}/{y}.webp?v=1792004898`,
    },
    layerZoomLimits: {
      topo: { maxNativeZoom: 7, maxZoom: 8 },
      sat: { maxNativeZoom: 7, maxZoom: 8 },
      drawn: { maxNativeZoom: 6, maxZoom: 7 },
    },
    description: '12.8 x 12.8 km Atlantic island with rolling hills, dense pine forests, 18 historic towns, and tactical choke points.',
    tileHost: 'enfumap.com (Cloudflare CDN) — Unverified license/permission',
    attribution: '© Bohemia Interactive a.s. | Enfumap',
    // Section 4: ONLY the 35 verified locations from official Enfusion Map Maker data
    pois: [
      // Tier 1: Major Towns, Capitals, and Military Bases
      { name: 'Montignac', nameAr: 'مونتينياك', x: 4775.641, z: 7086.945, kind: 'capital', tier: 1 },
      { name: 'St Phillipe', nameAr: 'سان فيليب', x: 4500.872, z: 10776.053, kind: 'capital', tier: 1 },
      { name: 'St Pierre', nameAr: 'سان بيير', x: 9689.432, z: 1558.166, kind: 'town', tier: 1 },
      { name: 'Morton', nameAr: 'مورتون', x: 5137.254, z: 4009.941, kind: 'town', tier: 1 },
      { name: 'Meaux', nameAr: 'مو', x: 4517.52, z: 9467.668, kind: 'town', tier: 1 },
      { name: 'Provins', nameAr: 'بروفان', x: 5488.17, z: 6083.411, kind: 'town', tier: 1 },
      { name: 'Villeneuve', nameAr: 'فيلنوف', x: 2847.008, z: 6339.848, kind: 'town', tier: 1 },
      { name: 'Entre Deux', nameAr: 'أنتر دو', x: 5760.571, z: 7061.821, kind: 'town', tier: 1 },
      { name: 'Airport', nameAr: 'المطار', x: 4893.46, z: 11800.709, kind: 'military', tier: 1 },
      { name: 'Coastal Base Chotain', nameAr: 'قاعدة شوتان الساحلية', x: 7444.065, z: 6697.595, kind: 'military', tier: 1 },
      { name: 'Military Base Levie', nameAr: 'قاعدة ليفي العسكرية', x: 7476.739, z: 4301.884, kind: 'military', tier: 1 },
      { name: 'Military Hospital', nameAr: 'المستشفى العسكري', x: 3904.698, z: 8450.042, kind: 'military', tier: 1 },
      { name: 'Coastal Base Lamentin', nameAr: 'قاعدة لامنتان الساحلية', x: 1062.89, z: 6047.846, kind: 'military', tier: 1 },
      { name: 'Coastal Base Morton', nameAr: 'قاعدة مورتون الساحلية', x: 4956.796, z: 3875.627, kind: 'military', tier: 1 },

      // Tier 2: Villages, Secondary Settlements, and Major Landmarks
      { name: 'Tyrone', nameAr: 'تايرون', x: 4948.837, z: 9075.68, kind: 'village', tier: 2 },
      { name: 'Gravette', nameAr: 'غرافيت', x: 4128.282, z: 7792.364, kind: 'village', tier: 2 },
      { name: 'Figari', nameAr: 'فيغاري', x: 5256.366, z: 5341.263, kind: 'village', tier: 2 },
      { name: 'Chotain', nameAr: 'شوتان', x: 7087.74, z: 6011.904, kind: 'village', tier: 2 },
      { name: 'Levie', nameAr: 'ليفي', x: 7456.592, z: 4737.094, kind: 'town', tier: 2 },
      { name: 'Regina', nameAr: 'ريجينا', x: 7188.38, z: 2312.382, kind: 'village', tier: 2 },
      { name: 'Camurac', nameAr: 'كاموراك', x: 6594.162, z: 3116.684, kind: 'village', tier: 2 },
      { name: 'Durras', nameAr: 'دوراس', x: 8826.12, z: 2746.123, kind: 'village', tier: 2 },
      { name: 'Lamentin', nameAr: 'لامنتان', x: 1281.055, z: 5946.839, kind: 'town', tier: 2 },
      { name: 'Power Plant', nameAr: 'محطة الطاقة', x: 5826.642, z: 9786.735, kind: 'landmark', tier: 2 },
      { name: 'Andres Beacon', nameAr: 'منارة أندريس', x: 6843.832, z: 8191.218, kind: 'hill', tier: 2 },
      { name: 'Chotain Industrial', nameAr: 'منطقة شوتان الصناعية', x: 6455.525, z: 6487.396, kind: 'landmark', tier: 2 },
      { name: 'Quarry', nameAr: 'المحجر', x: 8786.965, z: 3913.078, kind: 'landmark', tier: 2 },
      { name: 'Sawmill', nameAr: 'المنشرة', x: 3114.358, z: 5221.5, kind: 'landmark', tier: 2 },

      // Tier 3: Smaller Features, Hills, Farms, Valleys, and Woods
      { name: 'Kermovan', nameAr: 'كيرموفان', x: 6359.376, z: 9668.684, kind: 'village', tier: 3 },
      { name: 'Farm', nameAr: 'المزرعة', x: 5009.537, z: 9964.422, kind: 'landmark', tier: 3 },
      { name: 'Gorey', nameAr: 'غوري', x: 4844.906, z: 8088.995, kind: 'village', tier: 3 },
      { name: 'Hillside', nameAr: 'سفح التل', x: 6918, z: 4450, kind: 'hill', tier: 3 },
      { name: 'Old Wood', nameAr: 'الغابة القديمة', x: 3293.234, z: 4488.741, kind: 'landmark', tier: 3 },
      { name: 'Morton Valley', nameAr: 'وادي مورتون', x: 4517.589, z: 4967.065, kind: 'landmark', tier: 3 },
      { name: 'Laruns', nameAr: 'لارون', x: 7429.288, z: 5318.843, kind: 'village', tier: 3 },
    ],
  },
  arland: {
    id: 'arland',
    name: 'Arland',
    worldSize: 4096,
    tileSize: 256,
    minZoom: 0,
    maxNativeZoom: 7,
    maxZoom: 8,
    version: 1790938027,
    defaultCenter: [2048, 2048],
    defaultWeapon: [2776, 1623], // Arleville area
    defaultTarget: [3166, 2800], // Beauregard area
    layers: {
      topo: `${TILE_HOST}/tiles/arland/{z}/{x}/{y}.webp?v=1790938027`,
      sat: `${TILE_HOST}/tiles/arland/sat/{z}/{x}/{y}.webp?v=1791308331`,
      drawn: `${TILE_HOST}/tiles/arland/drawn/{z}/{x}/{y}.webp?v=1792025896`,
    },
    layerZoomLimits: {
      topo: { maxNativeZoom: 7, maxZoom: 8 },
      sat: { maxNativeZoom: 5, maxZoom: 6 }, // Sat only exists up to zoom 5
      drawn: { maxNativeZoom: 6, maxZoom: 7 }, // Drawn only exists up to zoom 6
    },
    description: '4.1 x 4.1 km strategic island featuring intense small-unit combat, Arleville harbor, Beauregard settlement, and military radar stations.',
    tileHost: 'enfumap.com (Cloudflare CDN) — Unverified license/permission',
    attribution: '© Bohemia Interactive a.s. | Enfumap',
    // Section 4.2: No verified locations dataset exists; show no labels
    pois: [],
  },
  kolguyev: {
    id: 'kolguyev',
    name: 'Kolguyev',
    worldSize: 12800,
    tileSize: 256,
    minZoom: 0,
    maxNativeZoom: 7,
    maxZoom: 8,
    version: 1790938259,
    defaultCenter: [6400, 6400],
    defaultWeapon: [5100, 4800],
    defaultTarget: [6200, 5600],
    layers: {
      topo: `${TILE_HOST}/tiles/kolguyev/{z}/{x}/{y}.webp?v=1790938259`,
      sat: `${TILE_HOST}/tiles/kolguyev/sat/{z}/{x}/{y}.webp?v=1791309426`,
    },
    layerZoomLimits: {
      topo: { maxNativeZoom: 7, maxZoom: 8 },
      sat: { maxNativeZoom: 7, maxZoom: 8 },
      // drawn layer does not exist for Kolguyev
    },
    description: '12.8 x 12.8 km volcanic terrain with stark granite mountains, pine forests, geothermal hot springs, and hardened Soviet installations.',
    tileHost: 'enfumap.com (Cloudflare CDN) — Unverified license/permission',
    attribution: '© Bohemia Interactive a.s. | Enfumap',
    // Section 4.2: No verified locations dataset exists; show no labels
    pois: [],
  },
};

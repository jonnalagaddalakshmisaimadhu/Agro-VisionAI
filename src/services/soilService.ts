const DEFAULT_SOIL = 'mixed';
const BACKEND_ENDPOINT = '/api/predict-soil';
const DISTRICT_ENDPOINT = '/api/soil';
const NOMINATIM_ENDPOINT =
  'https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&addressdetails=1';

/**
 * Resolve soil type for a given latitude/longitude.
 * - Prefer backend ML endpoint.
 * - Fallback to a lightweight reverse geocode heuristic.
 * Always returns a safe soil string so the UI never breaks.
 */
export async function getSoilTypeForLocation(
  lat: number,
  lon: number
): Promise<string> {
  const backendSoil = await getBackendSoil(lat, lon);
  if (backendSoil) return backendSoil;

  const districtSoil = await getDistrictSoil(lat, lon);
  if (districtSoil) return districtSoil;

  const fallbackSoil = await getNominatimSoilGuess(lat, lon);
  if (fallbackSoil) return fallbackSoil;

  return DEFAULT_SOIL;
}

async function getBackendSoil(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(BACKEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon })
    });
    if (!res.ok) throw new Error(`Backend soil API ${res.status}`);

    const js = await res.json();
    const soil = normalizeSoil(js?.soil_type || js?.soilType);
    if (soil) return soil;
  } catch (err) {
    console.warn('Soil lookup via backend failed, will try fallback', err);
  }
  return null;
}

async function getDistrictSoil(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const res = await fetch(`${DISTRICT_ENDPOINT}?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`District soil API ${res.status}`);
    const js = await res.json();
    const soil = normalizeSoil(js?.soil_type || js?.soilType);
    if (soil) return soil;
  } catch (err) {
    console.warn('District soil lookup failed, will try nominatim', err);
  }
  return null;
}

async function getNominatimSoilGuess(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const res = await fetch(`${NOMINATIM_ENDPOINT}&lat=${lat}&lon=${lon}`, {
      headers: {
        // Nominatim requires a UA string
        'User-Agent': 'farm-iq-soil-lookup'
      }
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const js = await res.json();

    const texture = searchForTextureString(js);
    if (texture) return mapTextureToOption(texture);
  } catch (err) {
    console.warn('Nominatim fallback failed', err);
  }
  return null;
}

function searchForTextureString(obj: any): string | null {
  if (!obj) return null;
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (typeof cur === 'string') {
      if (looksLikeTexture(cur)) return cur;
    } else if (typeof cur === 'object') {
      for (const k in cur) {
        const v = cur[k];
        if (typeof v === 'string') {
          if (looksLikeTexture(v)) return v;
        } else if (typeof v === 'object') {
          stack.push(v);
        }
      }
    }
  }
  return null;
}

function looksLikeTexture(s: string) {
  const t = s.toLowerCase();
  return /sand|clay|loam|silt|peat|organic|black|red|alluvial/.test(t);
}

function mapTextureToOption(label: string) {
  const t = (label || '').toLowerCase();
  if (t.includes('loam')) return 'loamy';
  if (t.includes('sand')) return 'sandy';
  if (t.includes('clay')) return 'clay';
  if (t.includes('silt')) return 'silt';
  if (t.includes('black')) return 'black';
  if (t.includes('red')) return 'red';
  if (t.includes('alluvial')) return 'alluvial';
  return DEFAULT_SOIL;
}

function normalizeSoil(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.toLowerCase().trim();
  // direct matches
  const allowed = ['loamy', 'sandy', 'clay', 'silt', 'black', 'red', 'alluvial', 'mixed'];
  if (allowed.includes(t)) return t;

  // map common variants from datasets/models
  if (t.includes('loam')) return 'loamy';
  if (t.includes('clay')) return 'clay';
  if (t.includes('sand')) return 'sandy';
  if (t.includes('silt')) return 'silt';
  if (t.includes('alluvial')) return 'alluvial'; // includes coastal_alluvial
  if (t.includes('black')) return 'black';
  if (t.includes('red')) return 'red';
  if (t.includes('laterite')) return 'red';
  if (t.includes('peat') || t.includes('organic')) return 'mixed';

  return DEFAULT_SOIL;
}


export interface SoilNutrients {
  nitrogen: 'Low' | 'Medium' | 'High' | 'Good';
  phosphorus: 'Low' | 'Medium' | 'High' | 'Good';
  potassium: 'Low' | 'Medium' | 'High' | 'Good';
}

/**
 * Simulates soil nutrient levels based on location and soil type.
 * Uses a deterministic hash of coordinates to ensure consistency for the same location.
 */
export function getSoilNutrientsForLocation(lat: number, lon: number, soilType: string): SoilNutrients {
  // Simple deterministic hash
  const hash = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453);
  const val = hash - Math.floor(hash); // 0 to 1

  // Base values mapping (heuristic)
  // Low, Medium, High, Good
  const levels: ('Low' | 'Medium' | 'High' | 'Good')[] = ['Low', 'Medium', 'High', 'Good'];

  // Bias based on soil type
  let nIndex = 1; // Medium
  let pIndex = 1;
  let kIndex = 1;

  const st = soilType.toLowerCase();

  if (st.includes('black')) { nIndex = 1; pIndex = 0; kIndex = 2; } // Black soil: often low P, high K
  else if (st.includes('red')) { nIndex = 0; pIndex = 0; kIndex = 1; } // Red soil: typically poor
  else if (st.includes('alluvial') || st.includes('loam')) { nIndex = 2; pIndex = 2; kIndex = 2; } // Fertile
  else if (st.includes('sandy')) { nIndex = 0; pIndex = 1; kIndex = 1; } // Poor nutrient holding
  else if (st.includes('clay')) { nIndex = 1; pIndex = 1; kIndex = 2; }

  // Add random variation based on location hash
  // Use different parts of the decimal for N, P, K to vary them independently
  const nVar = Math.floor((val * 100) % 3) - 1; // -1, 0, 1
  const pVar = Math.floor((val * 1000) % 3) - 1;
  const kVar = Math.floor((val * 10000) % 3) - 1;

  nIndex = Math.max(0, Math.min(3, nIndex + nVar));
  pIndex = Math.max(0, Math.min(3, pIndex + pVar));
  kIndex = Math.max(0, Math.min(3, kIndex + kVar));

  return {
    nitrogen: levels[nIndex],
    phosphorus: levels[pIndex],
    potassium: levels[kIndex]
  };
}

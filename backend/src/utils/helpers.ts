export const fahrenheitToCelsius = (f: number) => (f - 32) * 5 / 9;
export const celsiusToFahrenheit = (c: number) => (c * 9 / 5) + 32;

/**
 * Decode a PostGIS EWKB hex string (POINT geography) into {lat, lon}.
 * EWKB layout (little-endian): 1 byte order + 4 type + 4 SRID + 8 X(lon) + 8 Y(lat)
 * Returns null if the string cannot be decoded.
 */
export function parseWkbPoint(hex: string | null | undefined): { lat: number; lon: number } | null {
  if (!hex || hex.length < 42) return null;
  try {
    const buf = Buffer.from(hex, 'hex');
    const byteOrder = buf.readUInt8(0); // 1 = little-endian
    if (byteOrder !== 1) return null;   // big-endian not handled in MVP
    const wkbType = buf.readUInt32LE(1);
    // Type 0x20000001 = POINT with SRID; plain 0x00000001 = POINT without SRID
    // Layout: 1 (order) + 4 (type) [+ 4 (SRID)] + 8 (X/lon) + 8 (Y/lat)
    const hasSrid = (wkbType & 0x20000000) !== 0;
    const offset = hasSrid ? 9 : 5; // 1+4+4=9 with SRID, 1+4=5 without
    if (buf.length < offset + 16) return null;
    const lon = buf.readDoubleLE(offset);
    const lat = buf.readDoubleLE(offset + 8);
    if (isNaN(lat) || isNaN(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}


/** Site coordinates used as fallback when PostGIS decode fails */
export const SITE_FALLBACK_COORDS: Record<string, { lat: number; lon: number }> = {
  'Hyderabad':  { lat: 17.448, lon: 78.347 },
  'Warangal':   { lat: 18.047, lon: 79.648 },
  'Nizamabad':  { lat: 18.672, lon: 78.098 },
  'Karimnagar': { lat: 18.438, lon: 79.128 },
};
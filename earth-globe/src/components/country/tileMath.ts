// Standard "slippy map" Web Mercator tile math (the same math every OSM /
// Google Maps / Mapbox raster tile client uses). No external mapping
// library needed for this — it's ~20 lines of well-established formulae.
//
// Tiles are 256x256px. At zoom z the whole world is 256 * 2^z px square.
export const TILE_SIZE = 256;

export function lonToWorldX(lon: number, zoom: number): number {
  const worldSize = TILE_SIZE * 2 ** zoom;
  return worldSize * ((lon + 180) / 360);
}

export function latToWorldY(lat: number, zoom: number): number {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const clampedLat = Math.max(Math.min(lat, 85.0511), -85.0511); // Mercator limit
  const rad = (clampedLat * Math.PI) / 180;
  const y = 0.5 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / (2 * Math.PI);
  return worldSize * y;
}

/** Normalized (0..1) latitude span used purely for zoom-fit calculations. */
export function latToNormY(lat: number): number {
  const clampedLat = Math.max(Math.min(lat, 85.0511), -85.0511);
  const rad = (clampedLat * Math.PI) / 180;
  return 0.5 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / (2 * Math.PI);
}

/**
 * Picks the largest zoom level (most detail) at which the given lon/lat
 * bounding box still fits inside a viewport of viewportWidth x
 * viewportHeight pixels. Handles countries that cross the antimeridian
 * (minLon > maxLon) by unwrapping the longitude span.
 */
export function fitZoom(
  bounds: { minLon: number; minLat: number; maxLon: number; maxLat: number },
  viewportWidth: number,
  viewportHeight: number,
  options?: { minZoom?: number; maxZoom?: number }
): number {
  const minZoom = options?.minZoom ?? 1;
  const maxZoom = options?.maxZoom ?? 12;

  const lonSpan =
    bounds.maxLon >= bounds.minLon
      ? bounds.maxLon - bounds.minLon
      : bounds.maxLon + 360 - bounds.minLon;

  const latNormSpan = Math.abs(
    latToNormY(bounds.minLat) - latToNormY(bounds.maxLat)
  );

  const safeLonSpan = Math.max(lonSpan, 0.02);
  const safeLatNormSpan = Math.max(latNormSpan, 0.0002);

  const zoomForLon = Math.log2((viewportWidth * 360) / (TILE_SIZE * safeLonSpan));
  const zoomForLat = Math.log2(viewportHeight / (TILE_SIZE * safeLatNormSpan));

  const zoom = Math.floor(Math.min(zoomForLon, zoomForLat));
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

import { useMemo, useState } from "react";

import { DashboardCard } from "./shared/DashboardCard";
import { theme } from "./shared/theme";
import { COUNTRY_GEO_TABLE } from "./countryGeoTable";
import { TILE_SIZE, fitZoom, lonToWorldX, latToWorldY, osmTileUrl, esriTileUrl } from "./tileMath";
import type { CountryEvent } from "./dashboardTypes";

const WIDTH = 560;
const HEIGHT = 340;

const SEVERITY_COLOR: Record<CountryEvent["severity"], string> = {
  critical: theme.colors.critical,
  important: theme.colors.important,
  notable: theme.colors.notable,
  minor: theme.colors.minor,
};

type Bounds = { minLon: number; minLat: number; maxLon: number; maxLat: number };

function expandBoundsWithPoints(
  bounds: Bounds,
  points: { lon: number; lat: number }[]
): Bounds {
  if (points.length === 0) return bounds;

  return points.reduce<Bounds>(
    (acc, p) => ({
      minLon: Math.min(acc.minLon, p.lon),
      maxLon: Math.max(acc.maxLon, p.lon),
      minLat: Math.min(acc.minLat, p.lat),
      maxLat: Math.max(acc.maxLat, p.lat),
    }),
    bounds
  );
}

export function CountryMap({
  countryCode,
  countryName,
  events,
  eventsLoading,
}: {
  countryCode: string;
  countryName: string;
  events: CountryEvent[];
  eventsLoading: boolean;
}) {
  const [tileAttempt, setTileAttempt] = useState<Record<string, number>>({});
  const [bothFailedCount, setBothFailedCount] = useState(0);

  const located = useMemo(
    () =>
      events.filter(
        (event): event is CountryEvent & { latitude: number; longitude: number } =>
          typeof event.latitude === "number" && typeof event.longitude === "number"
      ),
    [events]
  );

  const view = useMemo(() => {
    const tableRow = COUNTRY_GEO_TABLE[countryCode];
    const eventPoints = located.map((e) => ({ lon: e.longitude, lat: e.latitude }));

    let centerLon: number;
    let centerLat: number;
    let bounds: Bounds;

    if (tableRow) {
      const [minLon, minLat, maxLon, maxLat, centroidLon, centroidLat] = tableRow;
      centerLon = centroidLon;
      centerLat = centroidLat;
      bounds = expandBoundsWithPoints({ minLon, minLat, maxLon, maxLat }, eventPoints);
    } else if (eventPoints.length > 0) {
      // Country not in the table (rare — a handful of small/disputed
      // territories aren't in the source dataset). Frame on the events
      // themselves instead of failing outright.
      const lons = eventPoints.map((p) => p.lon);
      const lats = eventPoints.map((p) => p.lat);
      bounds = {
        minLon: Math.min(...lons) - 1,
        maxLon: Math.max(...lons) + 1,
        minLat: Math.min(...lats) - 1,
        maxLat: Math.max(...lats) + 1,
      };
      centerLon = (bounds.minLon + bounds.maxLon) / 2;
      centerLat = (bounds.minLat + bounds.maxLat) / 2;
    } else {
      return null;
    }

    const zoom = fitZoom(bounds, WIDTH, HEIGHT, { minZoom: 1, maxZoom: 11 });
    return { centerLon, centerLat, zoom };
  }, [countryCode, located]);

  const scene = useMemo(() => {
    if (!view) return null;

    const { centerLon, centerLat, zoom } = view;
    const numTiles = 2 ** zoom;
    const worldSize = TILE_SIZE * numTiles;

    const centerWorldX = lonToWorldX(centerLon, zoom);
    const centerWorldY = latToWorldY(centerLat, zoom);
    const topLeftX = centerWorldX - WIDTH / 2;
    const topLeftY = centerWorldY - HEIGHT / 2;

    const startTileX = Math.floor(topLeftX / TILE_SIZE);
    const endTileX = Math.floor((topLeftX + WIDTH) / TILE_SIZE);
    const startTileY = Math.max(0, Math.floor(topLeftY / TILE_SIZE));
    const endTileY = Math.min(
      numTiles - 1,
      Math.floor((topLeftY + HEIGHT) / TILE_SIZE)
    );

    const tiles: {
      key: string;
      left: number;
      top: number;
      primarySrc: string;
      fallbackSrc: string;
    }[] = [];

    for (let tx = startTileX; tx <= endTileX; tx++) {
      const wrappedX = ((tx % numTiles) + numTiles) % numTiles;
      for (let ty = startTileY; ty <= endTileY; ty++) {
        tiles.push({
          key: `${zoom}-${tx}-${ty}`,
          left: tx * TILE_SIZE - topLeftX,
          top: ty * TILE_SIZE - topLeftY,
          primarySrc: osmTileUrl(zoom, wrappedX, ty),
          fallbackSrc: esriTileUrl(zoom, wrappedX, ty),
        });
      }
    }

    const markers = located.map((event) => {
      let worldX = lonToWorldX(event.longitude, zoom);
      const worldY = latToWorldY(event.latitude, zoom);

      // Bring the marker into the same wrap "copy of the world" as the
      // viewport, in case the country/event sits right on the antimeridian.
      if (worldX - centerWorldX > worldSize / 2) worldX -= worldSize;
      if (centerWorldX - worldX > worldSize / 2) worldX += worldSize;

      return {
        event,
        x: worldX - topLeftX,
        y: worldY - topLeftY,
      };
    });

    return { tiles, markers };
  }, [view, located]);

  return (
    <DashboardCard title="Event Map">
      {eventsLoading && !scene && <p style={styles.muted}>Loading map…</p>}

      {!eventsLoading && !scene && (
        <p style={styles.muted}>
          No location data available yet for {countryName}.
        </p>
      )}

      {scene && (
        <>
          <div
            style={styles.mapFrame}
            role="img"
            aria-label={`Map of ${countryName} with recent event locations`}
          >
            {scene.tiles.map((tile) => {
              const attempt = tileAttempt[tile.key] ?? 0;
              if (attempt >= 2) {
                // Both providers failed for this tile — leave the dark
                // background visible instead of a broken-image icon.
                return null;
              }

              const src = attempt === 0 ? tile.primarySrc : tile.fallbackSrc;

              return (
                <img
                  key={`${tile.key}-${attempt}`}
                  src={src}
                  alt=""
                  loading="lazy"
                  onError={() => {
                    setTileAttempt((prev) => {
                      const next = (prev[tile.key] ?? 0) + 1;
                      if (next >= 2) {
                        setBothFailedCount((n) => n + 1);
                      }
                      return { ...prev, [tile.key]: next };
                    });
                  }}
                  style={{
                    position: "absolute",
                    left: tile.left,
                    top: tile.top,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                  }}
                />
              );
            })}

            {scene.markers.map(({ event, x, y }) => (
              <div
                key={event.id}
                title={`${event.title} — ${event.location ?? countryName}`}
                style={{
                  ...styles.marker,
                  left: x,
                  top: y,
                  background: SEVERITY_COLOR[event.severity],
                }}
              />
            ))}

            <span style={styles.attribution}>© OpenStreetMap contributors</span>
          </div>

          {bothFailedCount > 3 && (
            <div style={styles.diagnostic}>
              <p style={{ ...styles.muted, margin: 0 }}>
                No map tiles could load from either provider (OpenStreetMap
                or Esri). This is almost always one of two things in this
                project, not the map code itself:
              </p>
              <ul style={styles.diagnosticList}>
                <li>
                  A Content-Security-Policy meta tag or header restricting{" "}
                  <code>img-src</code> to your own domain — add{" "}
                  <code>tile.openstreetmap.org</code> and{" "}
                  <code>server.arcgisonline.com</code> to it.
                </li>
                <li>
                  A <code>{'<meta name="referrer" content="no-referrer">'}</code>{" "}
                  tag, or a browser/extension stripping referrers —
                  OpenStreetMap's tile server blocks referrer-less requests.
                </li>
              </ul>
              <p style={{ ...styles.muted, margin: 0 }}>
                Quickest check: open{" "}
                <code>https://tile.openstreetmap.org/1/0/0.png</code>{" "}
                directly in a new browser tab. If that alone fails to show
                an image, it's a network/browser block outside this app; if
                it works there but not here, it's the CSP/referrer case
                above.
              </p>
            </div>
          )}

          {located.length === 0 ? (
            <p style={styles.muted}>
              No geo-tagged events yet. Once the AI event pipeline attaches
              coordinates, markers will appear here automatically — no
              changes needed on this page.
            </p>
          ) : (
            <ul style={styles.legend}>
              {located.map((event) => (
                <li key={event.id} style={styles.legendItem}>
                  <span
                    style={{
                      ...styles.legendDot,
                      background: SEVERITY_COLOR[event.severity],
                    }}
                  />
                  <span>
                    {event.title}
                    {event.location ? ` · ${event.location}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </DashboardCard>
  );
}

const styles = {
  muted: { color: theme.colors.textMuted, fontSize: 13 },
  diagnostic: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 8,
    background: "rgba(255, 77, 79, 0.08)",
    border: `1px solid rgba(255, 77, 79, 0.35)`,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  diagnosticList: {
    margin: 0,
    paddingLeft: 18,
    color: theme.colors.textMuted,
    fontSize: 13,
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  mapFrame: {
    position: "relative" as const,
    width: WIDTH,
    maxWidth: "100%",
    height: HEIGHT,
    overflow: "hidden" as const,
    borderRadius: 10,
    border: `1px solid ${theme.colors.panelBorder}`,
    background: "#0b1a2b",
  },
  marker: {
    position: "absolute" as const,
    width: 12,
    height: 12,
    marginLeft: -6,
    marginTop: -6,
    borderRadius: "50%",
    border: "2px solid #06111f",
    boxShadow: "0 0 0 4px rgba(255,255,255,0.12)",
    cursor: "pointer",
  },
  attribution: {
    position: "absolute" as const,
    right: 6,
    bottom: 4,
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    background: "rgba(6,17,31,0.55)",
    padding: "1px 5px",
    borderRadius: 4,
  },
  legend: {
    listStyle: "none",
    margin: "14px 0 0",
    padding: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
};

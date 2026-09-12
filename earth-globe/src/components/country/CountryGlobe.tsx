import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { buildCountryBorders, loadCountries } from "../globe/CountryBorders";
import { lonLatToVector3 } from "../globe/coordinates";
import { DATA_URL, RADIUS } from "../globe/constants";
import { useGlobeScene } from "../globe/hooks/useGlobeScene";

import { DashboardCard } from "./shared/DashboardCard";
import { theme } from "./shared/theme";
import { COUNTRY_GEO_TABLE } from "./countryGeoTable";
import type { CountryEvent } from "./dashboardTypes";

// How close the camera is allowed to get on this focused view — closer
// than the main globe's MIN_ZOOM, since here we usually want to fill the
// frame with a single country rather than the whole earth.
const FOCUSED_MIN_DISTANCE = 2.55;
const FOCUSED_MAX_DISTANCE = 9;

const SEVERITY_COLOR: Record<CountryEvent["severity"], string> = {
  critical: theme.colors.critical,
  important: theme.colors.important,
  notable: theme.colors.notable,
  minor: theme.colors.minor,
};

type Status = "loading" | "ready" | "error";

/**
 * Angular size (in degrees) of the country's bounding box, used only to
 * pick a starting camera distance — bigger countries start further out,
 * small ones start zoomed in. Handles the antimeridian the same way the
 * table's comment documents (minLon > maxLon means wraparound).
 */
function boundsSpanDegrees(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number
): number {
  const lonSpan = maxLon >= minLon ? maxLon - minLon : maxLon + 360 - minLon;
  const latSpan = maxLat - minLat;
  return Math.max(lonSpan, latSpan);
}

export function CountryGlobe({
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
  const mountRef = useRef<HTMLDivElement>(null);
  const { globeRef, ready } = useGlobeScene(mountRef);
  const cleanupRef = useRef<(() => void) | null>(null);

  const [status, setStatus] = useState<Status>("loading");

  const located = useMemo(
    () =>
      events.filter(
        (event): event is CountryEvent & { latitude: number; longitude: number } =>
          typeof event.latitude === "number" && typeof event.longitude === "number"
      ),
    [events]
  );

  useEffect(() => {
    if (!ready) return;

    const globe = globeRef.current;
    if (!globe) return;

    let cancelled = false;
    setStatus("loading");

    // Loosen the main globe's zoom limits — this view is meant to get
    // much closer to a single country than the full-earth view ever does.
    globe.controls.minDistance = FOCUSED_MIN_DISTANCE;
    globe.controls.maxDistance = FOCUSED_MAX_DISTANCE;
    globe.controls.enablePan = false;

    loadCountries(DATA_URL)
      .then((countries) => {
        if (cancelled) return;

        const borderMaterial = new THREE.LineBasicMaterial({
          color: 0x3f6f9c,
          transparent: true,
          opacity: 0.32,
        });

        const bordersGroup = buildCountryBorders(countries, borderMaterial);
        globe.countryGroup.add(bordersGroup);

        const selectedIndex = countries.findIndex(
          (c) => String(c.id) === countryCode
        );

        // Make the selected country's outline stand out from the rest.
        bordersGroup.traverse((object) => {
          if (!(object instanceof THREE.LineLoop)) return;

          const index = object.userData.countryIndex as number;
          const material = object.material as THREE.LineBasicMaterial;

          if (index === selectedIndex) {
            material.color.set(0xffffff);
            material.opacity = 1;
          }
        });

        // Event markers, placed just above the globe surface.
        const markerGroup = new THREE.Group();

        located.forEach((event) => {
          const position = lonLatToVector3(
            event.longitude,
            event.latitude,
            RADIUS + 0.02
          );

          const color = new THREE.Color(SEVERITY_COLOR[event.severity]);

          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 16, 16),
            new THREE.MeshBasicMaterial({ color })
          );
          dot.position.copy(position);
          dot.userData.eventId = event.id;

          const halo = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 16, 16),
            new THREE.MeshBasicMaterial({
              color,
              transparent: true,
              opacity: 0.28,
            })
          );
          halo.position.copy(position);

          markerGroup.add(halo, dot);
        });

        globe.countryGroup.add(markerGroup);

        // Frame the camera on the country using the same precomputed
        // table CountryMap used — a true spherical centroid, so this
        // lines up exactly with where the borders are actually drawn.
        const tableRow = COUNTRY_GEO_TABLE[countryCode];

        let focusLon: number;
        let focusLat: number;
        let span: number;

        if (tableRow) {
          const [minLon, minLat, maxLon, maxLat, centroidLon, centroidLat] =
            tableRow;
          focusLon = centroidLon;
          focusLat = centroidLat;
          span = boundsSpanDegrees(minLon, minLat, maxLon, maxLat);
        } else if (located.length > 0) {
          // Country not in the table (a handful of small/disputed
          // territories) — frame on its events instead.
          focusLon = located[0].longitude;
          focusLat = located[0].latitude;
          span = 15;
        } else {
          focusLon = 0;
          focusLat = 15;
          span = 140;
        }

        const distance = Math.min(
          FOCUSED_MAX_DISTANCE,
          Math.max(FOCUSED_MIN_DISTANCE, 2.6 + span / 18)
        );

        const direction = lonLatToVector3(focusLon, focusLat, 1);
        globe.camera.position.copy(direction.multiplyScalar(distance));
        globe.camera.lookAt(0, 0, 0);
        globe.controls.target.set(0, 0, 0);
        globe.controls.update();

        setStatus("ready");

        cleanupRef.current = () => {
          globe.countryGroup.remove(bordersGroup);
          globe.countryGroup.remove(markerGroup);

          bordersGroup.traverse((object) => {
            if (object instanceof THREE.LineLoop) {
              object.geometry.dispose();
              (object.material as THREE.Material).dispose();
            }
          });

          markerGroup.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              (object.material as THREE.Material).dispose();
            }
          });
        };
      })
      .catch((error) => {
        console.error("CountryGlobe failed to load country geometry:", error);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [ready, globeRef, countryCode, located]);

  return (
    <DashboardCard title="Event Map">
      <div style={styles.frame}>
        <div ref={mountRef} style={styles.mount} />

        {status === "loading" && (
          <p style={styles.overlayText}>Loading interactive map…</p>
        )}

        {status === "error" && (
          <p style={styles.overlayText}>
            Couldn't load the map right now — try refreshing.
          </p>
        )}

        {status === "ready" && (
          <span style={styles.hint}>Drag to rotate · scroll to zoom</span>
        )}
      </div>

      {!eventsLoading && located.length === 0 && (
        <p style={styles.muted}>
          No geo-tagged events yet. Once the AI event pipeline attaches
          coordinates, markers will appear on the globe automatically — no
          changes needed on this page.
        </p>
      )}

      {located.length > 0 && (
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
    </DashboardCard>
  );
}

const styles = {
  frame: {
    position: "relative" as const,
    width: "100%",
    height: 420,
    borderRadius: 10,
    overflow: "hidden" as const,
    border: `1px solid ${theme.colors.panelBorder}`,
    background: "radial-gradient(circle at 50% 40%, #0d2036 0%, #050b14 100%)",
  },
  mount: {
    width: "100%",
    height: "100%",
  },
  overlayText: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: theme.colors.textMuted,
    fontSize: 13,
    margin: 0,
  },
  hint: {
    position: "absolute" as const,
    left: 10,
    bottom: 8,
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    background: "rgba(6,17,31,0.55)",
    padding: "2px 8px",
    borderRadius: 6,
    pointerEvents: "none" as const,
  },
  muted: { color: theme.colors.textMuted, fontSize: 13 },
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

import { useMemo } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";

import { DashboardCard } from "./shared/DashboardCard";
import { theme } from "./shared/theme";
import { useCountryGeometry } from "./useCountryGeometry";
import type { CountryEvent } from "./dashboardTypes";

const WIDTH = 560;
const HEIGHT = 340;
const PADDING = 28;

const SEVERITY_COLOR: Record<CountryEvent["severity"], string> = {
  critical: theme.colors.critical,
  important: theme.colors.important,
  notable: theme.colors.notable,
  minor: theme.colors.minor,
};

type Marker = { event: CountryEvent; x: number; y: number };

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
  const { countryFeature, loading, error } = useCountryGeometry(countryCode);

  const located = useMemo(
    () =>
      events.filter(
        (event) =>
          typeof event.latitude === "number" &&
          typeof event.longitude === "number"
      ),
    [events]
  );

  const scene = useMemo(() => {
    if (!countryFeature) return null;

    // Fit the projection to the country shape AND the event points
    // together, so a marker just offshore or across a border doesn't get
    // clipped out of view.
    const points: [number, number][] = located.map((event) => [
      event.longitude as number,
      event.latitude as number,
    ]);

    const fitCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        countryFeature as unknown as Feature<Geometry>,
        ...(points.length
          ? [
              {
                type: "Feature" as const,
                properties: {},
                geometry: {
                  type: "MultiPoint" as const,
                  coordinates: points,
                },
              },
            ]
          : []),
      ],
    };

    const projection = geoMercator().fitExtent(
      [
        [PADDING, PADDING],
        [WIDTH - PADDING, HEIGHT - PADDING],
      ],
      fitCollection
    );

    const pathGenerator = geoPath(projection);

    const markers: Marker[] = located.reduce<Marker[]>((acc, event) => {
      const coords = projection([
        event.longitude as number,
        event.latitude as number,
      ]);

      if (coords) acc.push({ event, x: coords[0], y: coords[1] });
      return acc;
    }, []);

    return {
      countryPath: pathGenerator(countryFeature) ?? "",
      markers,
    };
  }, [countryFeature, located]);

  return (
    <DashboardCard title="Event Map">
      {(loading || eventsLoading) && !scene && (
        <p style={styles.muted}>Loading map…</p>
      )}

      {!loading && error && (
        <p style={styles.muted}>
          Country boundary couldn't be loaded, so the map can't be drawn
          right now. Try again shortly.
        </p>
      )}

      {scene && (
        <>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={styles.svg}
            role="img"
            aria-label={`Map of ${countryName} with recent event locations`}
          >
            <path
              d={scene.countryPath}
              fill="rgba(142, 203, 255, 0.14)"
              stroke={theme.colors.accent}
              strokeWidth={1.25}
            />

            {scene.markers.map(({ event, x, y }) => (
              <g key={event.id} transform={`translate(${x}, ${y})`}>
                <circle
                  r={7}
                  fill={SEVERITY_COLOR[event.severity]}
                  fillOpacity={0.28}
                />
                <circle
                  r={4}
                  fill={SEVERITY_COLOR[event.severity]}
                  stroke="#06111f"
                  strokeWidth={1.25}
                >
                  <title>
                    {`${event.title} — ${event.location ?? countryName}`}
                  </title>
                </circle>
              </g>
            ))}
          </svg>

          {located.length === 0 ? (
            <p style={styles.muted}>
              No geo-tagged events yet. Once the AI event pipeline attaches
              coordinates from the gazetteer, markers will appear here
              automatically — no changes needed on this page.
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
  svg: {
    width: "100%",
    height: "auto",
    display: "block" as const,
    background: "rgba(6, 17, 31, 0.6)",
    borderRadius: 10,
    border: `1px solid ${theme.colors.panelBorder}`,
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

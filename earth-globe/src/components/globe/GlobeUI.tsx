import type { CSSProperties } from "react";
import type { CountryFeature } from "./types";

type Props = {
  loading: boolean;
  error: string | null;
  hovered: CountryFeature | null;
  tooltip: { x: number; y: number };
  countryCount: number;
};

export function GlobeUI(props: Props) {
  const { loading, error, hovered, tooltip, countryCount } = props;

  return (
    <>
      {/* ------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------ */}

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            INTERACTIVE EARTH
          </div>

          <h1 style={styles.title}>
            Explore the world
          </h1>

          <p style={styles.subtitle}>
            Drag to rotate · Scroll to zoom · Hover a
            country · Click to open its dashboard
          </p>
        </div>

        <div style={styles.searchHint}>
          Country boundaries · Natural Earth
        </div>
      </div>

      {/* ------------------------------------------------ */}
      {/* LOADING EARTH */}
      {/* ------------------------------------------------ */}

      {loading && (
        <div style={styles.loading}>
          <div style={styles.spinner} />

          Loading Earth data…
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* ERROR */}
      {/* ------------------------------------------------ */}

      {error && (
        <div style={styles.error}>
          <strong>
            Unable to load country boundaries.
          </strong>

          <span>{error}</span>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* COUNTRY HOVER TOOLTIP */}
      {/* ------------------------------------------------ */}

      {hovered && (
        <div
          style={{
            ...styles.tooltip,
            left: tooltip.x + 14,
            top: tooltip.y + 14,
          }}
        >
          {hovered.properties?.name ??
            "Unknown country"}
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* COUNTRY COUNT */}
      {/* ------------------------------------------------ */}

      <div style={styles.controls}>
        <span>◉</span>{" "}
        {countryCount || "—"} countries
      </div>
    </>
  );
}

/* ------------------------------------------------ */
/* STYLES */
/* ------------------------------------------------ */

const styles: Record<
  string,
  CSSProperties
> = {
  header: {
    position: "absolute",
    top: 28,
    left: 32,
    right: 32,

    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",

    pointerEvents: "none",
  },

  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.2em",
    fontWeight: 700,
    opacity: 0.55,
  },

  title: {
    margin: "6px 0 4px",
    fontSize: "clamp(30px, 4vw, 54px)",
    lineHeight: 1,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    margin: 0,
    fontSize: 13,
    opacity: 0.65,
  },

  searchHint: {
    marginTop: 4,
    padding: "9px 13px",

    border:
      "1px solid rgba(255,255,255,.12)",

    borderRadius: 999,

    background:
      "rgba(255,255,255,.055)",

    backdropFilter: "blur(12px)",

    fontSize: 12,
    opacity: 0.75,
  },

  loading: {
    position: "absolute",
    left: "50%",
    top: "50%",

    transform:
      "translate(-50%, -50%)",

    display: "flex",
    alignItems: "center",
    gap: 10,

    padding: "12px 16px",

    borderRadius: 999,

    background:
      "rgba(2,8,16,.78)",

    border:
      "1px solid rgba(255,255,255,.12)",

    backdropFilter: "blur(12px)",

    fontSize: 13,
  },

  spinner: {
    width: 12,
    height: 12,

    borderRadius: "50%",

    border:
      "2px solid rgba(255,255,255,.25)",

    borderTopColor: "#fff",

    animation:
      "spin 0.8s linear infinite",
  },

  error: {
    position: "absolute",

    left: 32,
    bottom: 28,

    display: "flex",
    flexDirection: "column",
    gap: 4,

    maxWidth: 420,

    padding: "14px 16px",

    borderRadius: 14,

    background:
      "rgba(100,20,20,.72)",

    border:
      "1px solid rgba(255,100,100,.2)",

    fontSize: 12,
  },

  tooltip: {
    position: "fixed",

    zIndex: 10,

    pointerEvents: "none",

    padding: "7px 10px",

    borderRadius: 8,

    background:
      "rgba(3,9,17,.88)",

    border:
      "1px solid rgba(255,255,255,.15)",

    boxShadow:
      "0 10px 30px rgba(0,0,0,.35)",

    backdropFilter: "blur(12px)",

    fontSize: 12,

    fontWeight: 650,

    whiteSpace: "nowrap",
  },

  controls: {
    position: "absolute",

    left: 32,
    bottom: 28,

    padding: "8px 12px",

    borderRadius: 999,

    background:
      "rgba(255,255,255,.055)",

    border:
      "1px solid rgba(255,255,255,.1)",

    backdropFilter: "blur(10px)",

    fontSize: 11,

    opacity: 0.65,
  },
};
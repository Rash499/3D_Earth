import type { CSSProperties } from "react";
import type { CountryFeature, CountryInfo } from "./types";

type Props = {
  loading: boolean;
  error: string | null;
  hovered: CountryFeature | null;
  selected: CountryFeature | null;
  details: CountryInfo | null;
  detailsLoading: boolean;
  tooltip: { x: number; y: number };
  countryCount: number;
  selectedName: string;
  onClose: () => void;
};

export function GlobeUI(props: Props) {
  const {
    loading,
    error,
    hovered,
    selected,
    details,
    detailsLoading,
    tooltip,
    countryCount,
    selectedName,
    onClose,
  } = props;

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
            country · Click for details
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
      {/* COUNTRY INFORMATION PANEL */}
      {/* ------------------------------------------------ */}

      {selected && (
        <aside style={styles.panel}>
          {/* CLOSE BUTTON */}

          <button
            style={styles.close}
            onClick={onClose}
            aria-label="Close country information"
          >
            ×
          </button>

          {/* LOADING COUNTRY */}

          {detailsLoading && (
            <div style={styles.detailsLoading}>
              <div style={styles.smallSpinner} />

              Loading country information…
            </div>
          )}

          {/* FLAG */}

          {!detailsLoading &&
            details?.flag && (
              <img
                src={details.flag}
                alt={`${details.name} flag`}
                style={styles.flag}
              />
            )}

          {/* COUNTRY LABEL */}

          <div style={styles.panelEyebrow}>
            COUNTRY
          </div>

          {/* COUNTRY NAME */}

          <h2 style={styles.countryName}>
            {details?.name ?? selectedName}
          </h2>

          {/* COUNTRY DETAILS */}

          {detailsLoading ? (
            <div style={styles.loadingMessage}>
              Fetching information from REST Countries…
            </div>
          ) : details ? (
            <div style={styles.details}>
              {/* CAPITAL */}

              <Detail
                label="Capital"
                value={
                  details.capital ?? "—"
                }
              />

              {/* POPULATION */}

              <Detail
                label="Population"
                value={
                  details.population !==
                  undefined
                    ? new Intl.NumberFormat().format(
                        details.population
                      )
                    : "—"
                }
              />

              {/* AREA */}

              <Detail
                label="Area"
                value={
                  details.area !==
                  undefined
                    ? `${new Intl.NumberFormat().format(
                        details.area
                      )} km²`
                    : "—"
                }
              />

              {/* REGION */}

              <Detail
                label="Region"
                value={
                  details.region ?? "—"
                }
              />

              {/* SUBREGION */}

              <Detail
                label="Subregion"
                value={
                  details.subregion ?? "—"
                }
              />

              {/* CURRENCY */}

              <Detail
                label="Currency"
                value={
                  details.currencies &&
                  details.currencies.length > 0
                    ? details.currencies.join(
                        ", "
                      )
                    : "—"
                }
              />

              {/* LANGUAGES */}

              <Detail
                label="Languages"
                value={
                  details.languages &&
                  details.languages.length > 0
                    ? details.languages.join(
                        ", "
                      )
                    : "—"
                }
              />

              {/* CONTINENT */}

              <Detail
                label="Continent"
                value={
                  details.continents &&
                  details.continents.length > 0
                    ? details.continents.join(
                        ", "
                      )
                    : "—"
                }
              />
            </div>
          ) : (
            <div style={styles.loadingMessage}>
              Unable to load country information.
            </div>
          )}

          {/* DATA SOURCE */}

          <p style={styles.panelNote}>
            Data loaded from REST Countries.
          </p>
        </aside>
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
/* DETAIL COMPONENT */
/* ------------------------------------------------ */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.detail}>
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
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

  /* -------------------------------------------- */
  /* COUNTRY PANEL */
  /* -------------------------------------------- */

  panel: {
    position: "absolute",

    top: 32,
    right: 32,

    width:
      "min(360px, calc(100vw - 64px))",

    maxHeight:
      "calc(100vh - 64px)",

    overflowY: "auto",

    padding: 22,

    borderRadius: 20,

    background:
      "rgba(4,12,22,.82)",

    border:
      "1px solid rgba(255,255,255,.13)",

    boxShadow:
      "0 24px 80px rgba(0,0,0,.4)",

    backdropFilter: "blur(18px)",
  },

  close: {
    position: "absolute",

    top: 12,
    right: 12,

    width: 30,
    height: 30,

    border: 0,

    borderRadius: "50%",

    background:
      "rgba(255,255,255,.08)",

    color: "#fff",

    cursor: "pointer",

    fontSize: 20,

    lineHeight: 1,
  },

  flag: {
    display: "block",

    width: 58,
    height: 38,

    objectFit: "cover",

    borderRadius: 7,

    marginBottom: 18,
  },

  panelEyebrow: {
    fontSize: 10,
    letterSpacing: "0.18em",
    opacity: 0.45,
  },

  countryName: {
    margin: "5px 0 20px",

    fontSize: 28,

    letterSpacing: "-0.03em",
  },

  details: {
    display: "grid",

    gap: 1,

    overflow: "hidden",

    borderRadius: 12,

    background:
      "rgba(255,255,255,.055)",
  },

  detail: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "flex-start",

    gap: 18,

    padding: "11px 13px",

    fontSize: 12,

    borderBottom:
      "1px solid rgba(255,255,255,.06)",
  },

  detailsLoading: {
    display: "flex",

    alignItems: "center",

    gap: 10,

    marginBottom: 18,

    padding: "10px 12px",

    borderRadius: 10,

    background:
      "rgba(255,255,255,.05)",

    fontSize: 12,

    opacity: 0.8,
  },

  smallSpinner: {
    width: 12,
    height: 12,

    flexShrink: 0,

    borderRadius: "50%",

    border:
      "2px solid rgba(255,255,255,.2)",

    borderTopColor: "#fff",

    animation:
      "spin 0.8s linear infinite",
  },

  loadingMessage: {
    padding: "14px",

    borderRadius: 12,

    background:
      "rgba(255,255,255,.04)",

    fontSize: 12,

    opacity: 0.65,
  },

  panelNote: {
    margin: "16px 0 0",

    fontSize: 11,

    lineHeight: 1.5,

    opacity: 0.5,
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
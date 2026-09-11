import { theme } from "./shared/theme";

export function CountryLanding({
  name,
  flag,
  capital,
  region,
  subregion,
  loading,
  onViewDetails,
  onBack,
}: {
  name: string;
  flag?: string;
  capital?: string;
  region?: string;
  subregion?: string;
  loading: boolean;
  onViewDetails: () => void;
  onBack: () => void;
}) {
  return (
    <div style={styles.page}>
      <button style={styles.back} onClick={onBack}>
        ← Back to Earth
      </button>

      <div style={styles.card}>
        {flag ? (
          <img src={flag} alt={`${name} flag`} style={styles.flag} />
        ) : (
          <div style={styles.flagPlaceholder} />
        )}

        <h1 style={styles.name}>{name}</h1>

        <p style={styles.meta}>
          {[region, subregion].filter(Boolean).join(" · ") ||
            (loading ? "Loading location…" : "Location unavailable")}
          {capital ? ` · Capital: ${capital}` : ""}
        </p>

        <p style={styles.blurb}>
          Open the full dashboard for demographics, government, economy,
          security, infrastructure, and a map of where recent events are
          happening on the ground.
        </p>

        <button style={styles.cta} onClick={onViewDetails}>
          View Country Details
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: "relative" as const,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 24,
    background:
      "radial-gradient(circle at 50% 0%, #102a49 0%, #06111f 45%, #02060c 100%)",
    color: theme.colors.text,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  back: {
    position: "absolute" as const,
    top: 24,
    left: 24,
    background: "transparent",
    border: `1px solid ${theme.colors.panelBorder}`,
    color: theme.colors.accent,
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13,
  },
  card: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    textAlign: "center" as const,
    gap: 10,
    maxWidth: 420,
    padding: "32px 28px",
    background: theme.colors.panel,
    border: `1px solid ${theme.colors.panelBorder}`,
    borderRadius: 16,
    backdropFilter: "blur(10px)",
  },
  flag: {
    width: 84,
    height: 60,
    objectFit: "cover" as const,
    borderRadius: 8,
    border: `1px solid ${theme.colors.panelBorder}`,
    marginBottom: 8,
  },
  flagPlaceholder: {
    width: 84,
    height: 60,
    borderRadius: 8,
    border: `1px dashed ${theme.colors.panelBorder}`,
    marginBottom: 8,
  },
  name: {
    margin: 0,
    fontSize: 26,
    letterSpacing: "0.02em",
  },
  meta: {
    margin: 0,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  blurb: {
    margin: "6px 0 4px",
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.colors.textMuted,
  },
  cta: {
    marginTop: 10,
    background: theme.colors.accent,
    color: "#06111f",
    border: "none",
    borderRadius: 10,
    padding: "12px 28px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

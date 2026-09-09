import { useNavigate } from "react-router-dom";

import type { CountryOverview } from "./dashboardTypes";
import { theme } from "./shared/theme";

export function CountryHeader({
  overview,
  code,
}: {
  overview: CountryOverview;
  code: string;
}) {
  const navigate = useNavigate();

  return (
    <header style={styles.wrap}>
      <button style={styles.back} onClick={() => navigate("/")}>
        ← Back to Earth
      </button>

      <div style={styles.identity}>
        {overview.flag && (
          <img
            src={overview.flag}
            alt={`${overview.name} flag`}
            style={styles.flag}
          />
        )}

        <div>
          <h1 style={styles.name}>{overview.name.toUpperCase()}</h1>

          {overview.officialName &&
            overview.officialName !== overview.name && (
              <p style={styles.official}>{overview.officialName}</p>
            )}

          <p style={styles.meta}>
            {[overview.region, overview.subregion]
              .filter(Boolean)
              .join(" · ") || "—"}
            {overview.capital ? ` · Capital: ${overview.capital}` : ""}
          </p>
        </div>
      </div>

      <span style={styles.code}>{code}</span>
    </header>
  );
}

const styles = {
  wrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    padding: "20px 32px",
    borderBottom: `1px solid ${theme.colors.panelBorder}`,
    flexWrap: "wrap" as const,
  },
  back: {
    background: "transparent",
    border: `1px solid ${theme.colors.panelBorder}`,
    color: theme.colors.accent,
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13,
  },
  identity: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flex: 1,
    minWidth: 240,
  },
  flag: {
    width: 56,
    height: 40,
    objectFit: "cover" as const,
    borderRadius: 6,
    border: `1px solid ${theme.colors.panelBorder}`,
  },
  name: {
    margin: 0,
    fontSize: 24,
    letterSpacing: "0.04em",
    color: theme.colors.text,
  },
  official: {
    margin: "2px 0 0",
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  meta: {
    margin: "6px 0 0",
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  code: {
    fontSize: 12,
    color: theme.colors.textMuted,
    border: `1px solid ${theme.colors.panelBorder}`,
    borderRadius: 6,
    padding: "4px 10px",
  },
};

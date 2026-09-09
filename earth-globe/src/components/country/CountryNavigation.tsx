import { theme } from "./shared/theme";

export const DASHBOARD_SECTIONS = [
  "overview",
  "geography",
  "demographics",
  "government",
  "economy",
  "security",
  "environment",
  "technology",
  "infrastructure",
  "events",
] as const;

export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number];

const LABELS: Record<DashboardSection, string> = {
  overview: "Overview",
  geography: "Geography",
  demographics: "Demographics",
  government: "Government",
  economy: "Economy",
  security: "Security",
  environment: "Environment",
  technology: "Technology",
  infrastructure: "Infrastructure",
  events: "Events",
};

export function CountryNavigation({
  active,
  onChange,
}: {
  active: DashboardSection;
  onChange: (section: DashboardSection) => void;
}) {
  return (
    <nav className="country-nav" style={styles.nav}>
      {/* Sidebar on desktop (>=900px), horizontal scrollable tabs on mobile. */}
      <style>{`
        @media (min-width: 900px) {
          .country-nav {
            flex-direction: column !important;
            overflow-x: visible !important;
            min-width: 200px;
            border-bottom: none !important;
            border-right: 1px solid ${theme.colors.panelBorder};
          }
        }
      `}</style>

      {DASHBOARD_SECTIONS.map((section) => (
        <button
          key={section}
          onClick={() => onChange(section)}
          style={{
            ...styles.item,
            ...(section === active ? styles.active : {}),
          }}
        >
          {LABELS[section]}
        </button>
      ))}
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    flexDirection: "row" as const,
    gap: 4,
    overflowX: "auto" as const,
    padding: "12px 16px",
    borderBottom: `1px solid ${theme.colors.panelBorder}`,
  },
  item: {
    flex: "0 0 auto" as const,
    textAlign: "left" as const,
    background: "transparent",
    border: "none",
    color: theme.colors.textMuted,
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    whiteSpace: "nowrap" as const,
  },
  active: {
    background: theme.colors.panel,
    color: theme.colors.text,
  },
};

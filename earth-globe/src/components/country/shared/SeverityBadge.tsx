import type { CountryEventSeverity } from "../dashboardTypes";
import { theme } from "./theme";

const SEVERITY_META: Record<
  CountryEventSeverity,
  { label: string; color: string }
> = {
  critical: { label: "Critical", color: theme.colors.critical },
  important: { label: "Important", color: theme.colors.important },
  notable: { label: "Notable", color: theme.colors.notable },
  minor: { label: "Minor", color: theme.colors.minor },
};

export function SeverityBadge({
  severity,
  importance,
}: {
  severity: CountryEventSeverity;
  importance: number;
}) {
  const meta = SEVERITY_META[severity];

  return (
    <span
      style={{
        ...styles.badge,
        color: meta.color,
        borderColor: meta.color,
      }}
    >
      ● {meta.label} — {importance}/10
    </span>
  );
}

const styles = {
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid",
    borderRadius: 999,
    padding: "2px 10px",
  },
};

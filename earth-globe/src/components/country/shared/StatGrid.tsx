import { theme } from "./theme";

export type Stat = { label: string; value: string };

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div style={styles.grid}>
      {stats.map((stat) => (
        <div key={stat.label}>
          <div style={styles.label}>{stat.label}</div>
          <div style={styles.value}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 16,
  },
  label: {
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: 600,
    color: theme.colors.text,
  },
};

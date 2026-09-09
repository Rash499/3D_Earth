import type { ReactNode } from "react";

import { theme } from "./theme";

export function DashboardCard({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section style={styles.card}>
      <header style={styles.header}>
        <h2 style={styles.title}>{title}</h2>
        {actions}
      </header>

      <div style={styles.body}>{children}</div>
    </section>
  );
}

const styles = {
  card: {
    background: theme.colors.panel,
    border: `1px solid ${theme.colors.panelBorder}`,
    borderRadius: 14,
    padding: "20px 24px",
    marginBottom: 20,
    backdropFilter: "blur(10px)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 13,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: theme.colors.accent,
    fontWeight: 600,
  },
  body: {
    color: theme.colors.text,
  },
};

import { DashboardCard } from "./shared/DashboardCard";
import { SeverityBadge } from "./shared/SeverityBadge";
import { theme } from "./shared/theme";
import type { CountryEvent } from "./dashboardTypes";

export function CountryEvents({
  events,
  loading,
}: {
  events: CountryEvent[];
  loading: boolean;
}) {
  return (
    <DashboardCard title="Latest Important Events">
      {loading && <p style={styles.muted}>Loading events…</p>}

      {!loading && events.length === 0 && (
        <p style={styles.muted}>
          No events recorded yet. This section will populate automatically
          once the AI news/event pipeline is connected.
        </p>
      )}

      <div style={styles.list}>
        {events.map((event) => (
          <article key={event.id} style={styles.event}>
            <SeverityBadge
              severity={event.severity}
              importance={event.importance}
            />

            <h3 style={styles.title}>{event.title}</h3>
            <p style={styles.summary}>{event.summary}</p>

            <p style={styles.meta}>
              {event.source}
              {event.sourceUrl && (
                <>
                  {" · "}
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    Source
                  </a>
                </>
              )}
              {" · "}
              {new Date(event.occurredAt).toLocaleDateString()}
            </p>
          </article>
        ))}
      </div>
    </DashboardCard>
  );
}

// Default export added alongside the named export so this component works
// regardless of which import style is used elsewhere in the codebase.
export default CountryEvents;

const styles = {
  muted: { color: theme.colors.textMuted, fontSize: 13 },
  list: { display: "flex", flexDirection: "column" as const, gap: 16 },
  event: {
    borderLeft: `2px solid ${theme.colors.panelBorder}`,
    paddingLeft: 14,
  },
  title: { margin: "8px 0 4px", fontSize: 15, color: theme.colors.text },
  summary: { margin: "0 0 6px", fontSize: 13, color: theme.colors.textMuted },
  meta: { margin: 0, fontSize: 11, color: theme.colors.textMuted },
  link: { color: theme.colors.accent },
};
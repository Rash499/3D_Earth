import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { CountryDemographics } from "../country/CountryDemographics";
import { CountryEconomy } from "../country/CountryEconomy";
import { CountryEnvironment } from "../country/CountryEnvironment";
import { CountryEvents } from "../country/CountryEvents";
import { CountryGeography } from "../country/CountryGeography";
import { CountryGovernment } from "../country/CountryGovernment";
import { CountryHeader } from "../country/CountryHeader";
import { CountryInfrastructure } from "../country/CountryInfrastructure";
import { CountryLanding } from "../country/CountryLanding";
import { CountryMap } from "../country/CountryMap";
import {
  CountryNavigation,
  type DashboardSection,
} from "../country/CountryNavigation";
import { CountryOverview } from "../country/CountryOverview";
import { CountrySecurity } from "../country/CountrySecurity";
import { CountryTechnology } from "../country/CountryTechnology";
import { getCountryEvents } from "../country/countryEventsServices";
import { loadCountryDashboard } from "../country/countryDashboardService";
import type {
  CountryDashboardData,
  CountryEvent,
} from "../country/dashboardTypes";
import { theme } from "../country/shared/theme";

export default function CountryDashboardPage() {
  const { countryCode } = useParams<{ countryCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Passed from the globe on click via navigate(path, { state }) — only a
  // display fallback, not required for the lookup itself.
  const nameHint = (location.state as { name?: string } | null)?.name;

  // Landing screen shown first (flag + "View Country Details" button);
  // the full dashboard below only renders once this is true.
  const [revealed, setRevealed] = useState(false);

  const [section, setSection] = useState<DashboardSection>("overview");
  const [data, setData] = useState<CountryDashboardData | null>(null);
  const [events, setEvents] = useState<CountryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!countryCode) return;

    const controller = new AbortController();

    setLoading(true);
    setError(null);
    setNotFound(false);
    setSection("overview");
    setRevealed(false);

    loadCountryDashboard(countryCode, nameHint, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        if (!result) {
          setNotFound(true);
          return;
        }

        setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Unable to load country information.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    setEventsLoading(true);

    getCountryEvents(countryCode)
      .then((result) => {
        if (!controller.signal.aborted) setEvents(result);
      })
      .finally(() => {
        if (!controller.signal.aborted) setEventsLoading(false);
      });

    return () => controller.abort();
  }, [countryCode, nameHint, retryToken]);

  if (!countryCode || notFound) {
    return (
      <CenteredState>
        <p style={styles.centeredText}>Country not found.</p>
        <button style={styles.button} onClick={() => navigate("/")}>
          Back to Earth
        </button>
      </CenteredState>
    );
  }

  if (!revealed) {
    return (
      <CountryLanding
        name={data?.overview.name ?? nameHint ?? "Selected Country"}
        flag={data?.overview.flag}
        capital={data?.overview.capital}
        region={data?.overview.region}
        subregion={data?.overview.subregion}
        loading={loading}
        onViewDetails={() => setRevealed(true)}
        onBack={() => navigate("/")}
      />
    );
  }

  if (loading) {
    return (
      <CenteredState>
        <p style={styles.centeredMuted}>Loading country information…</p>
      </CenteredState>
    );
  }

  if (error || !data) {
    return (
      <CenteredState>
        <p style={styles.centeredText}>
          {error ?? "Unable to load country information."}
        </p>
        <button
          style={styles.button}
          onClick={() => setRetryToken((token) => token + 1)}
        >
          Try Again
        </button>
      </CenteredState>
    );
  }

  return (
    <div style={styles.page}>
      <CountryHeader overview={data.overview} code={data.code} />

      <div className="dashboard-body" style={styles.body}>
        <style>{`
          @media (min-width: 900px) {
            .dashboard-body { flex-direction: row !important; }
          }
        `}</style>

        <CountryNavigation active={section} onChange={setSection} />

        <main style={styles.content}>
          {section === "overview" && <CountryOverview data={data.overview} />}
          {section === "map" && (
            <CountryMap
              countryCode={countryCode}
              countryName={data.overview.name}
              events={events}
              eventsLoading={eventsLoading}
            />
          )}
          {section === "geography" && (
            <CountryGeography data={data.geography} />
          )}
          {section === "demographics" && (
            <CountryDemographics data={data.demographics} />
          )}
          {section === "government" && <CountryGovernment />}
          {section === "economy" && (
            <CountryEconomy currencies={data.overview.currencies} />
          )}
          {section === "security" && <CountrySecurity />}
          {section === "environment" && <CountryEnvironment />}
          {section === "technology" && <CountryTechnology />}
          {section === "infrastructure" && <CountryInfrastructure />}
          {section === "events" && (
            <CountryEvents events={events} loading={eventsLoading} />
          )}
        </main>
      </div>
    </div>
  );
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return <div style={styles.centered}>{children}</div>;
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 50% 0%, #102a49 0%, #06111f 45%, #02060c 100%)",
    color: theme.colors.text,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  body: {
    display: "flex",
    flexDirection: "column" as const,
  },
  content: {
    flex: 1,
    padding: "24px 32px",
    maxWidth: 960,
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: theme.colors.background,
  },
  centeredText: { color: theme.colors.text, margin: 0 },
  centeredMuted: { color: theme.colors.textMuted, margin: 0 },
  button: {
    background: "transparent",
    border: `1px solid ${theme.colors.accent}`,
    color: theme.colors.accent,
    borderRadius: 8,
    padding: "8px 18px",
    cursor: "pointer",
  },
};

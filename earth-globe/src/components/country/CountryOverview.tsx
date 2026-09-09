import { DashboardCard } from "./shared/DashboardCard";
import { StatGrid } from "./shared/StatGrid";
import type { CountryOverview as CountryOverviewData } from "./dashboardTypes";

export function CountryOverview({ data }: { data: CountryOverviewData }) {
  return (
    <DashboardCard title="Overview">
      <StatGrid
        stats={[
          { label: "Official Name", value: data.officialName ?? "—" },
          { label: "Capital", value: data.capital ?? "—" },
          {
            label: "Region",
            value:
              [data.region, data.subregion].filter(Boolean).join(" / ") ||
              "—",
          },
          {
            label: "Population",
            value: data.population ? data.population.toLocaleString() : "—",
          },
          {
            label: "Area",
            value: data.area ? `${data.area.toLocaleString()} km²` : "—",
          },
          {
            label: "Currencies",
            value: data.currencies?.length ? data.currencies.join(", ") : "—",
          },
          {
            label: "Continents",
            value: data.continents?.length ? data.continents.join(", ") : "—",
          },
        ]}
      />
    </DashboardCard>
  );
}

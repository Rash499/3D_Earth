import { DashboardCard } from "./shared/DashboardCard";
import { StatGrid } from "./shared/StatGrid";
import { UnavailableNotice } from "./shared/UnavailableNotice";
import type { CountryDemographics as CountryDemographicsData } from "./dashboardTypes";

export function CountryDemographics({
  data,
}: {
  data: CountryDemographicsData;
}) {
  return (
    <DashboardCard title="Demographics">
      <StatGrid
        stats={[
          {
            label: "Population",
            value: data.population ? data.population.toLocaleString() : "—",
          },
          {
            label: "Population Density",
            value: data.populationDensity
              ? `${data.populationDensity} / km²`
              : "—",
          },
          {
            label: "Languages",
            value: data.languages?.length ? data.languages.join(", ") : "—",
          },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <UnavailableNotice reason="population growth rate is not provided by the REST Countries fields currently requested in CountryData.ts." />
      </div>
    </DashboardCard>
  );
}

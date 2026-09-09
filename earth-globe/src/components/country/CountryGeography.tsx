import { DashboardCard } from "./shared/DashboardCard";
import { StatGrid } from "./shared/StatGrid";
import { UnavailableNotice } from "./shared/UnavailableNotice";
import type { CountryGeography as CountryGeographyData } from "./dashboardTypes";

export function CountryGeography({ data }: { data: CountryGeographyData }) {
  return (
    <DashboardCard title="Geography">
      <StatGrid
        stats={[
          {
            label: "Area",
            value: data.area ? `${data.area.toLocaleString()} km²` : "—",
          },
          { label: "Region", value: data.region ?? "—" },
          { label: "Subregion", value: data.subregion ?? "—" },
          {
            label: "Continents",
            value: data.continents?.length ? data.continents.join(", ") : "—",
          },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <UnavailableNotice reason="coordinates, land borders, and landlocked status require requesting the `latlng`, `borders`, and `landlocked` response fields from the REST Countries API (currently not included in CountryData.ts)." />
      </div>
    </DashboardCard>
  );
}

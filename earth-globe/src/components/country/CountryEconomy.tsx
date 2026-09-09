import { DashboardCard } from "./shared/DashboardCard";
import { StatGrid } from "./shared/StatGrid";
import { UnavailableNotice } from "./shared/UnavailableNotice";

export function CountryEconomy({ currencies }: { currencies?: string[] }) {
  return (
    <DashboardCard title="Economy">
      <StatGrid
        stats={[
          {
            label: "Currencies",
            value: currencies?.length ? currencies.join(", ") : "—",
          },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <UnavailableNotice reason="GDP, inflation, unemployment, and trade data need a dedicated economic data source (e.g. World Bank API) that isn't connected yet." />
      </div>
    </DashboardCard>
  );
}

import { DashboardCard } from "./shared/DashboardCard";
import { UnavailableNotice } from "./shared/UnavailableNotice";

export function CountryGovernment() {
  return (
    <DashboardCard title="Government & Politics">
      <UnavailableNotice reason="government type, head of state, and political system data need a dedicated source (e.g. CIA World Factbook or a politics-focused API) that isn't connected yet." />
    </DashboardCard>
  );
}

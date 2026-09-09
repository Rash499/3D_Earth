import { DashboardCard } from "./shared/DashboardCard";
import { UnavailableNotice } from "./shared/UnavailableNotice";

export function CountrySecurity() {
  return (
    <DashboardCard title="Security">
      <UnavailableNotice reason="security incidents, conflicts, and border developments will populate here once the AI event-intelligence pipeline is connected." />
    </DashboardCard>
  );
}

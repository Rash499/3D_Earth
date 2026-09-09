import { DashboardCard } from "./shared/DashboardCard";
import { UnavailableNotice } from "./shared/UnavailableNotice";

export function CountryInfrastructure() {
  return (
    <DashboardCard title="Infrastructure">
      <UnavailableNotice reason="major infrastructure, transportation, and energy projects will populate here once the AI event-intelligence pipeline is connected." />
    </DashboardCard>
  );
}

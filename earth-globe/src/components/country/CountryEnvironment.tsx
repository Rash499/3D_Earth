import { DashboardCard } from "./shared/DashboardCard";
import { UnavailableNotice } from "./shared/UnavailableNotice";

export function CountryEnvironment() {
  return (
    <DashboardCard title="Environment">
      <UnavailableNotice reason="natural disasters, climate events, and environmental incidents will populate here once the AI event-intelligence pipeline is connected." />
    </DashboardCard>
  );
}

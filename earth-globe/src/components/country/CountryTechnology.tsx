import { DashboardCard } from "./shared/DashboardCard";
import { UnavailableNotice } from "./shared/UnavailableNotice";

export function CountryTechnology() {
  return (
    <DashboardCard title="Technology & Science">
      <UnavailableNotice reason="technology, science, and research developments will populate here once the AI event-intelligence pipeline is connected." />
    </DashboardCard>
  );
}

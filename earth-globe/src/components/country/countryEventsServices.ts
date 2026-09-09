import type { CountryEvent } from "./dashboardTypes";

/**
 * Placeholder for the future AI event-intelligence pipeline described in
 * the project's architecture (news ingestion -> AI extraction ->
 * classification -> importance scoring -> country association -> DB).
 *
 * Once that backend exists, replace the body of this function with a
 * real fetch (e.g. GET /api/events?country=<ccn3>) — the CountryEvent
 * shape stays the same, so no UI changes are needed in CountryEvents.tsx.
 *
 * countryCode is the same ccn3 numeric id used throughout the app.
 */
export async function getCountryEvents(
  countryCode: string
): Promise<CountryEvent[]> {
  // Simulated latency so loading states are actually exercised in dev.
  await new Promise((resolve) => setTimeout(resolve, 300));

  return MOCK_EVENTS[countryCode] ?? [];
}

// Sample data only — remove once the real event pipeline is connected.
const MOCK_EVENTS: Record<string, CountryEvent[]> = {
  "144": [
    {
      id: "mock-1",
      title: "Sample economic policy announcement",
      summary:
        "This is placeholder content. Replace getCountryEvents() with a real API call once the AI event pipeline is live.",
      category: "Economy",
      importance: 7,
      severity: "important",
      occurredAt: new Date().toISOString(),
      source: "Mock Source",
    },
  ],
};

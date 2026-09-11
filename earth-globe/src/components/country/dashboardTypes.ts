// Dashboard types are deliberately built ONLY from fields that
// CountryData.ts (REST Countries) actually returns today. Sections with
// no real data source (government, economy metrics, security,
// environment, technology, infrastructure) are rendered by components
// that show an "unavailable" notice instead of fabricated fields — see
// CountryGovernment.tsx, CountryEconomy.tsx, etc.

export type CountryOverview = {
  name: string;
  officialName?: string;
  capital?: string;
  region?: string;
  subregion?: string;
  population?: number;
  area?: number;
  flag?: string;
  currencies?: string[];
  continents?: string[];
};

export type CountryGeography = {
  area?: number;
  region?: string;
  subregion?: string;
  continents?: string[];
};

export type CountryDemographics = {
  population?: number;
  // Derived client-side from population / area — not a separate API field.
  populationDensity?: number;
  languages?: string[];
};

export type CountryDashboardData = {
  code: string;
  overview: CountryOverview;
  geography: CountryGeography;
  demographics: CountryDemographics;
};

export type CountryEventSeverity =
  | "critical"
  | "important"
  | "notable"
  | "minor";

// Shape for the future AI event-intelligence pipeline. getCountryEvents()
// currently returns mock data matching this shape — swapping in the real
// backend later won't require UI changes.
export type CountryEvent = {
  id: string;
  title: string;
  summary: string;
  category: string;
  importance: number; // 0-10
  severity: CountryEventSeverity;
  occurredAt: string; // ISO date string
  source: string;
  sourceUrl?: string;
  location?: string;
  // Populated by the AI event-extraction pipeline via the static
  // gazetteer (see project notes) — not every event will have a precise
  // coordinate, so the map treats these as optional.
  latitude?: number;
  longitude?: number;
};

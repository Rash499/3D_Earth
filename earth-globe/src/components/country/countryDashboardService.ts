import { loadCountryDetails } from "../globe/CountryData";
import type { CountryDashboardData } from "./dashboardTypes";

/**
 * Builds the dashboard's data shape from the existing CountryData.ts
 * lookup. No new API calls are introduced here — this only reshapes
 * the single CountryInfo response into the Overview / Geography /
 * Demographics sections, plus a client-derived population density.
 *
 * countryCode is expected to be the ccn3 numeric id already used by
 * CountryFeature.id / loadCountryDetails (e.g. "144" for Sri Lanka).
 * countryName is optional — it's only used as a display fallback and
 * for cache-key friendliness; the lookup itself works from code alone.
 */
export async function loadCountryDashboard(
  countryCode: string,
  countryName?: string,
  signal?: AbortSignal
): Promise<CountryDashboardData | null> {
  const info = await loadCountryDetails(
    countryName ?? countryCode,
    countryCode,
    signal
  );

  if (!info) {
    return null;
  }

  const populationDensity =
    info.population && info.area
      ? Math.round((info.population / info.area) * 10) / 10
      : undefined;

  return {
    code: countryCode,
    overview: {
      name: info.name,
      officialName: info.officialName,
      capital: info.capital,
      region: info.region,
      subregion: info.subregion,
      population: info.population,
      area: info.area,
      flag: info.flag,
      currencies: info.currencies,
      continents: info.continents,
    },
    geography: {
      area: info.area,
      region: info.region,
      subregion: info.subregion,
      continents: info.continents,
    },
    demographics: {
      population: info.population,
      populationDensity,
      languages: info.languages,
    },
  };
}

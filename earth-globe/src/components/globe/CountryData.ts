import type { CountryInfo } from "./types";

const API = "https://restcountries.com/v3.1/name/";

export async function loadCountryDetails(
  countryName: string,
  signal?: AbortSignal
): Promise<CountryInfo | null> {
  try {
    const response = await fetch(
      API +
        encodeURIComponent(countryName) +
        "?fields=name,capital,population,region,flags",
      { signal }
    );

    if (!response.ok) return null;

    const results = await response.json();
    const item = results?.[0];

    if (!item) return null;

    return {
      name: item.name?.common ?? countryName,
      capital: item.capital?.[0],
      population: item.population,
      region: item.region,
      flag: item.flags?.svg ?? item.flags?.png,
    };
  } catch {
    return null;
  }
}

import type { CountryInfo } from "./types";

const API = "https://api.restcountries.com/countries/v5";

// Read from .env.local (see note below) — never hardcode the key directly here.
const API_KEY = import.meta.env.VITE_REST_COUNTRIES_API_KEY as string;

// Fallback aliases for name-based lookup, used only if no numeric code is available.
const NAME_ALIASES: Record<string, string> = {
  "dem. rep. congo": "DR Congo",
  "congo": "Congo",
  "central african rep.": "Central African Republic",
  "s. sudan": "South Sudan",
  "bosnia and herz.": "Bosnia and Herzegovina",
  "eq. guinea": "Equatorial Guinea",
  "solomon is.": "Solomon Islands",
  "dominican rep.": "Dominican Republic",
  "w. sahara": "Western Sahara",
  "n. cyprus": "Northern Cyprus",
  "ivory coast": "Ivory Coast",
  "cote d'ivoire": "Ivory Coast",
  "united states of america": "United States",
};

function resolveCountryName(countryName: string): string {
  const alias = NAME_ALIASES[countryName.toLowerCase()];
  return alias ?? countryName;
}

type RestCountry = {
  names?: {
    common?: string;
    official?: string;
  };

  capitals?: {
    name?: string;
  }[];

  population?: number;

  area?: {
    kilometers?: number;
  };

  region?: string;
  subregion?: string;

  flag?: {
    svg?: string;
    png?: string;
    emoji?: string;
  };

  currencies?: {
    code?: string;
    name?: string;
    symbol?: string;
  }[];

  languages?: {
    name?: string;
  }[];

  continents?: string[];
};

type ApiResponse = {
  data?: {
    objects?: RestCountry[];
    _demo?: {
      message?: string;
    };
  };

  errors?: {
    message?: string;
  }[];
};

const countryCache = new Map<string, CountryInfo>();

function buildLookupUrl(countryName: string, countryCode?: string): string {
  const fields =
    "response_fields=names,capitals,population,area,region,subregion,flag,currencies,languages,continents";

  if (countryCode) {
    // Numeric ISO 3166-1 code (ccn3), e.g. "484" for Mexico, "840" for USA.
    // Zero-pad to 3 digits just in case the source only gives "84" etc.
    const padded = countryCode.padStart(3, "0");
    return `${API}/codes.ccn3/${padded}?${fields}`;
  }

  const resolvedName = resolveCountryName(countryName);
  return `${API}/names.common/${encodeURIComponent(resolvedName)}?${fields}`;
}

export async function loadCountryDetails(
  countryName: string,
  countryCode?: string,
  signal?: AbortSignal
): Promise<CountryInfo | null> {
  const cacheKey = countryCode
    ? `code:${countryCode}`
    : countryName.toLowerCase();

  const cached = countryCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  if (!API_KEY) {
    console.error(
      "Missing VITE_REST_COUNTRIES_API_KEY. Add it to .env.local and restart the dev server."
    );
    return null;
  }

  try {
    const url = buildLookupUrl(countryName, countryCode);

    console.log("REST Countries URL:", url);

    const response = await fetch(url, {
      signal,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log(
      "REST Countries status:",
      response.status
    );

    const rawText = await response.text();

    console.log(
      "REST Countries raw response:",
      rawText
    );

    if (!response.ok) {
      console.error(
        "REST Countries API error:",
        response.status,
        response.statusText
      );

      return null;
    }

    const result: ApiResponse =
      JSON.parse(rawText);

    if (result.errors?.length) {
      console.error(
        "REST Countries returned errors:",
        result.errors
      );

      return null;
    }

    const item =
      result.data?.objects?.[0];

    if (!item) {
      console.warn(
        "No country found for:",
        countryName,
        countryCode ? `(code: ${countryCode})` : ""
      );

      return null;
    }

    const countryInfo: CountryInfo = {
      name:
        item.names?.common ??
        countryName,

      officialName:
        item.names?.official,

      capital:
        item.capitals?.[0]?.name,

      population:
        item.population,

      area:
        item.area?.kilometers,

      region:
        item.region,

      subregion:
        item.subregion,

      flag:
        item.flag?.svg ??
        item.flag?.png,

      currencies:
        item.currencies
          ?.map(
            (currency) =>
              currency.name
          )
          .filter(
            (
              name
            ): name is string =>
              Boolean(name)
          ) ?? [],

      languages:
        item.languages
          ?.map(
            (language) =>
              language.name
          )
          .filter(
            (
              name
            ): name is string =>
              Boolean(name)
          ) ?? [],

      continents:
        item.continents ?? [],
    };

    console.log(
      "Country information:",
      countryInfo
    );

    countryCache.set(
      cacheKey,
      countryInfo
    );

    return countryInfo;
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      console.log(
        "Country request aborted."
      );

      return null;
    }

    console.error(
      "Failed to load country details:",
      error
    );

    return null;
  }
}
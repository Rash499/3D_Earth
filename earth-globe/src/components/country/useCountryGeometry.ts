import { useEffect, useState } from "react";

import { loadCountries } from "../globe/CountryBorders";
import { DATA_URL } from "../globe/constants";
import type { CountryFeature } from "../globe/types";

// Same topology the globe already loads for borders/click-detection, so
// country.id here lines up exactly with the ccn3 id used for routing
// (/country/:countryCode) and for the REST Countries lookup. Cached at
// module scope so navigating between country pages doesn't re-fetch it.
let cachedFeatures: CountryFeature[] | null = null;
let inFlight: Promise<CountryFeature[]> | null = null;

function fetchCountryFeatures(): Promise<CountryFeature[]> {
  if (cachedFeatures) return Promise.resolve(cachedFeatures);

  if (!inFlight) {
    inFlight = loadCountries(DATA_URL)
      .then((features) => {
        cachedFeatures = features;
        return features;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

export function useCountryGeometry(countryCode?: string) {
  const [countryFeature, setCountryFeature] = useState<CountryFeature | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryCode) {
      setCountryFeature(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCountryFeatures()
      .then((features) => {
        if (cancelled) return;

        const match =
          features.find((f) => String(f.id) === countryCode) ?? null;

        setCountryFeature(match);
        if (!match) setError("Country boundary not found.");
      })
      .catch((reason) => {
        if (cancelled) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Failed to load country boundary."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  return { countryFeature, loading, error };
}

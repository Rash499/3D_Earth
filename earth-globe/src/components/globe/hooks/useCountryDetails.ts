import { useEffect, useMemo, useState } from "react";

import { loadCountryDetails } from "../CountryData";
import type { CountryFeature, CountryInfo } from "../types";

/**
 * Fetches enriched country info whenever the selected country changes.
 * Clears details automatically when selection is cleared, and aborts
 * any in-flight request on unmount / re-selection.
 */
export function useCountryDetails(selected: CountryFeature | null) {
  const selectedName = useMemo(
    () => selected?.properties?.name ?? "",
    [selected]
  );

  const [details, setDetails] = useState<CountryInfo | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (!selectedName) {
      setDetails(null);
      return;
    }

    const controller = new AbortController();

    setDetails(null);
    setDetailsLoading(true);

    loadCountryDetails(
      selectedName,
      selected?.id != null ? String(selected.id) : undefined,
      controller.signal
    )
      .then((countryDetails) => {
        if (controller.signal.aborted) return;

        setDetails(countryDetails);
      })
      .catch((error) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Country details error:", error);

        setDetails(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDetailsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [selectedName, selected]);

  return { selectedName, details, detailsLoading };
}
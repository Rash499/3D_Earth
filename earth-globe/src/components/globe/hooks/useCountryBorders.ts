import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";

import { DATA_URL } from "../constants";
import { buildCountryBorders, loadCountries } from "../CountryBorders";
import { createGlobeScene } from "../GlobeScene";
import type { CountryFeature } from "../types";

/**
 * Loads the country GeoJSON, builds the border LineLoop meshes, and adds
 * them to the globe's countryGroup once the scene is ready.
 *
 * `ready` should come from useGlobeScene — we can't build borders until
 * globeRef.current exists.
 */
export function useCountryBorders(
  globeRef: RefObject<ReturnType<typeof createGlobeScene> | null>,
  ready: boolean
) {
  const countriesRef = useRef<CountryFeature[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !globeRef.current) return;

    let disposed = false;

    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x8ecbff,
      transparent: true,
      opacity: 0.72,
    });

    loadCountries(DATA_URL)
      .then((countries) => {
        if (disposed) return;

        countriesRef.current = countries;

        globeRef.current!.countryGroup.add(
          buildCountryBorders(countries, borderMaterial)
        );

        setLoading(false);
      })
      .catch((reason) => {
        if (disposed) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Failed to load countries."
        );

        setLoading(false);
      });

    return () => {
      disposed = true;
      borderMaterial.dispose();
    };
  }, [ready, globeRef]);

  return { countriesRef, loading, error };
}
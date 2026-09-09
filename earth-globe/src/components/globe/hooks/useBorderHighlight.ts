import { useEffect, type RefObject } from "react";
import * as THREE from "three";

import { createGlobeScene } from "../GlobeScene";
import type { CountryFeature } from "../types";

/**
 * Recolors/re-opacifies country border LineLoops whenever the hovered or
 * selected country changes. Reads countryIndex from each LineLoop's
 * userData (set in buildCountryBorders) to look up the matching country.
 */
export function useBorderHighlight(
  globeRef: RefObject<ReturnType<typeof createGlobeScene> | null>,
  countriesRef: RefObject<CountryFeature[]>,
  hovered: CountryFeature | null,
  selected: CountryFeature | null
) {
  useEffect(() => {
    const group = globeRef.current?.countryGroup;

    if (!group) return;

    group.traverse((object) => {
      if (!(object instanceof THREE.LineLoop)) return;

      const index = object.userData.countryIndex as number;

      const country = countriesRef.current[index];

      const active = country === hovered || country === selected;

      const material = object.material as THREE.LineBasicMaterial;

      material.color.set(active ? 0xffffff : 0x8ecbff);
      material.opacity = active ? 1 : 0.72;
    });
  }, [hovered, selected, globeRef, countriesRef]);
}
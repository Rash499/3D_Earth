import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";

import { findCountryAtPointer } from "../CountryDetection";
import { createGlobeScene } from "../GlobeScene";
import type { CountryFeature } from "../types";

/**
 * Wires up pointermove/click on the renderer's canvas to raycast against
 * country borders, tracking the currently hovered and selected country.
 *
 * Needs both the scene (`ready`) and the loaded country list to raycast
 * against, so it depends on both useGlobeScene and useCountryBorders.
 *
 * onCountryClick is optional so this hook still works standalone (e.g. in
 * tests or a future non-routed usage). It's read via a ref rather than
 * added to the effect's dependency array, so passing a new inline
 * function each render does NOT re-attach the pointer/click listeners.
 */
export function useCountryInteraction(
  globeRef: RefObject<ReturnType<typeof createGlobeScene> | null>,
  countriesRef: RefObject<CountryFeature[]>,
  ready: boolean,
  onCountryClick?: (country: CountryFeature) => void
) {
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const hoveredRef = useRef<CountryFeature | null>(null);
  const onCountryClickRef = useRef(onCountryClick);

  const [hovered, setHovered] = useState<CountryFeature | null>(null);
  const [selected, setSelected] = useState<CountryFeature | null>(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });

  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
  }, [onCountryClick]);

  useEffect(() => {
    const globe = globeRef.current;

    if (!ready || !globe) return;

    const onPointerMove = (event: PointerEvent) => {
      const country = findCountryAtPointer(
        event,
        globe.renderer,
        globe.camera,
        globe.globeGroup,
        globe.earthMesh,
        countriesRef.current,
        raycasterRef.current,
        pointerRef.current
      );

      hoveredRef.current = country;

      setHovered(country);

      setTooltip({
        x: event.clientX,
        y: event.clientY,
      });
    };

    const onClick = () => {
      const country = hoveredRef.current;

      if (!country) return;

      setSelected(country);

      onCountryClickRef.current?.(country);
    };

    const el = globe.renderer.domElement;

    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("click", onClick);

    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("click", onClick);
    };
  }, [ready, globeRef, countriesRef]);

  return { hovered, selected, setSelected, tooltip };
}
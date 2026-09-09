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
 */
export function useCountryInteraction(
  globeRef: RefObject<ReturnType<typeof createGlobeScene> | null>,
  countriesRef: RefObject<CountryFeature[]>,
  ready: boolean
) {
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const hoveredRef = useRef<CountryFeature | null>(null);

  const [hovered, setHovered] = useState<CountryFeature | null>(null);
  const [selected, setSelected] = useState<CountryFeature | null>(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });

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
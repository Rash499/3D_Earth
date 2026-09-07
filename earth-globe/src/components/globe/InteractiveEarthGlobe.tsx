import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { DATA_URL } from "./constants";
import { buildCountryBorders, loadCountries } from "./CountryBorders";
import { findCountryAtPointer } from "./CountryDetection";
import { loadCountryDetails } from "./CountryData";
import {
  createGlobeScene,
  disposeGlobe,
  resizeGlobe,
} from "./GlobeScene";
import { GlobeUI } from "./GlobeUI";
import type { CountryFeature, CountryInfo } from "./types";

export default function InteractiveEarthGlobe() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<ReturnType<typeof createGlobeScene> | null>(null);
  const countriesRef = useRef<CountryFeature[]>([]);
  const hoveredRef = useRef<CountryFeature | null>(null);

  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<CountryFeature | null>(null);
  const [selected, setSelected] = useState<CountryFeature | null>(null);
  const [details, setDetails] = useState<CountryInfo | null>(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });

  const selectedName = useMemo(
    () => selected?.properties?.name ?? "",
    [selected]
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let frame = 0;

    const globe = createGlobeScene(mount);
    globeRef.current = globe;

    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x8ecbff,
      transparent: true,
      opacity: 0.72,
    });

    loadCountries(DATA_URL)
      .then((countries) => {
        if (disposed) return;

        countriesRef.current = countries;

        globe.countryGroup.add(
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

    const onResize = () =>
      resizeGlobe(mount, globe.camera, globe.renderer);

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
      setTooltip({ x: event.clientX, y: event.clientY });
    };

    const onClick = () => {
      if (hoveredRef.current) {
        setSelected(hoveredRef.current);
      }
    };

    const animate = () => {
      if (disposed) return;

      frame = requestAnimationFrame(animate);
      globe.controls.update();
      globe.renderer.render(globe.scene, globe.camera);
    };

    window.addEventListener("resize", onResize);
    globe.renderer.domElement.addEventListener("pointermove", onPointerMove);
    globe.renderer.domElement.addEventListener("click", onClick);

    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);

      window.removeEventListener("resize", onResize);
      globe.renderer.domElement.removeEventListener("pointermove", onPointerMove);
      globe.renderer.domElement.removeEventListener("click", onClick);

      borderMaterial.dispose();
      disposeGlobe(globe);

      if (mount.contains(globe.renderer.domElement)) {
        mount.removeChild(globe.renderer.domElement);
      }

      globeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedName) {
      setDetails(null);
      return;
    }

    const controller = new AbortController();

    loadCountryDetails(
      selectedName,
      controller.signal
    ).then(setDetails);

    return () => controller.abort();
  }, [selectedName]);

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
  }, [hovered, selected]);

  return (
    <div style={styles.page}>
      <div ref={mountRef} style={styles.canvas} />

      <GlobeUI
        loading={loading}
        error={error}
        hovered={hovered}
        selected={selected}
        details={details}
        tooltip={tooltip}
        countryCount={countriesRef.current.length}
        selectedName={selectedName}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

const styles = {
  page: {
    position: "relative" as const,
    width: "100%",
    height: "100vh",
    minHeight: 600,
    overflow: "hidden" as const,
    background:
      "radial-gradient(circle at 50% 45%, #102a49 0%, #06111f 45%, #02060c 100%)",
    color: "#fff",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  canvas: {
    position: "absolute" as const,
    inset: 0,
  },
};

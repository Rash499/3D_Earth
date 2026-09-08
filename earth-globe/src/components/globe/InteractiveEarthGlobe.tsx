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
  const globeRef =
    useRef<ReturnType<typeof createGlobeScene> | null>(null);

  const countriesRef = useRef<CountryFeature[]>([]);
  const hoveredRef =
    useRef<CountryFeature | null>(null);

  const raycasterRef =
    useRef(new THREE.Raycaster());

  const pointerRef =
    useRef(new THREE.Vector2());

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [hovered, setHovered] =
    useState<CountryFeature | null>(null);

  const [selected, setSelected] =
    useState<CountryFeature | null>(null);

  const [details, setDetails] =
    useState<CountryInfo | null>(null);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [tooltip, setTooltip] =
    useState({ x: 0, y: 0 });

  const selectedName = useMemo(
    () => selected?.properties?.name ?? "",
    [selected]
  );

  // --------------------------------------------------
  // CREATE GLOBE
  // --------------------------------------------------

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) return;

    let disposed = false;
    let frame = 0;

    const globe = createGlobeScene(mount);

    globeRef.current = globe;

    const borderMaterial =
      new THREE.LineBasicMaterial({
        color: 0x8ecbff,
        transparent: true,
        opacity: 0.72,
      });

    // --------------------------------------------------
    // LOAD COUNTRIES
    // --------------------------------------------------

    loadCountries(DATA_URL)
      .then((countries) => {
        if (disposed) return;

        countriesRef.current = countries;

        globe.countryGroup.add(
          buildCountryBorders(
            countries,
            borderMaterial
          )
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

    // --------------------------------------------------
    // RESIZE
    // --------------------------------------------------

    const onResize = () => {
      resizeGlobe(
        mount,
        globe.camera,
        globe.renderer
      );
    };

    // --------------------------------------------------
    // POINTER MOVE / COUNTRY HOVER
    // --------------------------------------------------

    const onPointerMove = (
      event: PointerEvent
    ) => {
      const country =
        findCountryAtPointer(
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

    // --------------------------------------------------
    // COUNTRY CLICK
    // --------------------------------------------------

    const onClick = () => {
      const country =
        hoveredRef.current;

      if (!country) return;

      console.log(
        "Selected country:",
        country
      );

      console.log(
        "Country name:",
        country.properties?.name
      );

      console.log(
        "Country ID:",
        country.id
      );

      setSelected(country);
    };

    // --------------------------------------------------
    // ANIMATION
    // --------------------------------------------------

    const animate = () => {
      if (disposed) return;

      frame =
        requestAnimationFrame(animate);

      globe.controls.update();

      globe.renderer.render(
        globe.scene,
        globe.camera
      );
    };

    window.addEventListener(
      "resize",
      onResize
    );

    globe.renderer.domElement.addEventListener(
      "pointermove",
      onPointerMove
    );

    globe.renderer.domElement.addEventListener(
      "click",
      onClick
    );

    animate();

    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------

    return () => {
      disposed = true;

      cancelAnimationFrame(frame);

      window.removeEventListener(
        "resize",
        onResize
      );

      globe.renderer.domElement.removeEventListener(
        "pointermove",
        onPointerMove
      );

      globe.renderer.domElement.removeEventListener(
        "click",
        onClick
      );

      borderMaterial.dispose();

      disposeGlobe(globe);

      if (
        mount.contains(
          globe.renderer.domElement
        )
      ) {
        mount.removeChild(
          globe.renderer.domElement
        );
      }

      globeRef.current = null;
    };
  }, []);

  // --------------------------------------------------
  // LOAD COUNTRY INFORMATION
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedName) {
      setDetails(null);
      return;
    }

    const controller =
      new AbortController();

    setDetails(null);
    setDetailsLoading(true);

    console.log(
      "Fetching country:",
      selectedName,
      "code:",
      selected?.id
    );

    loadCountryDetails(
      selectedName,
      selected?.id != null ? String(selected.id) : undefined,
      controller.signal
    )
      .then((countryDetails) => {
        if (controller.signal.aborted) {
          return;
        }

        console.log(
          "Country API response:",
          countryDetails
        );

        setDetails(
          countryDetails
        );
      })
      .catch((error) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Country details error:",
          error
        );

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

  // --------------------------------------------------
  // COUNTRY BORDER HIGHLIGHT
  // --------------------------------------------------

  useEffect(() => {
    const group =
      globeRef.current?.countryGroup;

    if (!group) return;

    group.traverse((object) => {
      if (
        !(object instanceof THREE.LineLoop)
      ) {
        return;
      }

      const index =
        object.userData
          .countryIndex as number;

      const country =
        countriesRef.current[index];

      const active =
        country === hovered ||
        country === selected;

      const material =
        object.material as THREE.LineBasicMaterial;

      material.color.set(
        active
          ? 0xffffff
          : 0x8ecbff
      );

      material.opacity =
        active ? 1 : 0.72;
    });
  }, [hovered, selected]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div style={styles.page}>
      <div
        ref={mountRef}
        style={styles.canvas}
      />

      <GlobeUI
        loading={loading}
        error={error}
        hovered={hovered}
        selected={selected}
        details={details}
        detailsLoading={detailsLoading}
        tooltip={tooltip}
        countryCount={
          countriesRef.current.length
        }
        selectedName={selectedName}
        onClose={() => {
          setSelected(null);
          setDetails(null);
        }}
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
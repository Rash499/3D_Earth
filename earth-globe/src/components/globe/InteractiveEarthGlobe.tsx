import { useRef } from "react";
import { useNavigate } from "react-router-dom";

import { GlobeUI } from "./GlobeUI";
import { useBorderHighlight } from "./hooks/useBorderHighlight";
import { useCountryBorders } from "./hooks/useCountryBorders";
import { useCountryInteraction } from "./hooks/useCountryInteraction";
import { useGlobeScene } from "./hooks/useGlobeScene";
import type { CountryFeature } from "./types";

export default function InteractiveEarthGlobe() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Scene lifecycle: create/resize/animate/dispose the three.js globe.
  // UNCHANGED.
  const { globeRef, ready } = useGlobeScene(mountRef);

  // Country geometry: load GeoJSON, build + attach border lines.
  // UNCHANGED.
  const { countriesRef, loading, error } = useCountryBorders(
    globeRef,
    ready
  );

  // On click, navigate to the country's dashboard instead of showing
  // details inline. country.id is the ccn3 numeric code already used by
  // CountryData.ts, so no new identifier scheme is introduced.
  const handleCountryClick = (country: CountryFeature) => {
    if (country.id == null) {
      console.warn(
        "Clicked country has no id; cannot navigate to its dashboard.",
        country
      );
      return;
    }

    navigate(`/country/${country.id}`, {
      state: { name: country.properties?.name },
    });
  };

  // Pointer interaction: hover + click. Hover behavior and border
  // highlighting are UNCHANGED; click now navigates instead of opening
  // an in-page panel.
  const { hovered, selected, tooltip } = useCountryInteraction(
    globeRef,
    countriesRef,
    ready,
    handleCountryClick
  );

  // Keep border colors in sync with hover/selection state. UNCHANGED.
  useBorderHighlight(globeRef, countriesRef, hovered, selected);

  return (
    <div style={styles.page}>
      <div ref={mountRef} style={styles.canvas} />

      {/*
        NOTE: GlobeUI's `selected`/`details`/`detailsLoading`/`onClose`
        props are gone — that panel content now lives in
        CountryDashboardPage. If your GlobeUI.tsx still requires those
        props, either make them optional there or trim its selected-country
        panel, since the globe page no longer needs to render country
        details inline.
      */}
      <GlobeUI
        loading={loading}
        error={error}
        hovered={hovered}
        tooltip={tooltip}
        countryCount={countriesRef.current.length}
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
import { useRef } from "react";

import { GlobeUI } from "./GlobeUI";
import { useBorderHighlight } from "./hooks/useBorderHighlight";
import { useCountryBorders } from "./hooks/useCountryBorders";
import { useCountryDetails } from "./hooks/useCountryDetails";
import { useCountryInteraction } from "./hooks/useCountryInteraction";
import { useGlobeScene } from "./hooks/useGlobeScene";

export default function InteractiveEarthGlobe() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Scene lifecycle: create/resize/animate/dispose the three.js globe.
  const { globeRef, ready } = useGlobeScene(mountRef);

  // Country geometry: load GeoJSON, build + attach border lines.
  const { countriesRef, loading, error } = useCountryBorders(
    globeRef,
    ready
  );

  // Pointer interaction: hover + click -> selection.
  const { hovered, selected, setSelected, tooltip } =
    useCountryInteraction(globeRef, countriesRef, ready);

  // Enriched details for whichever country is currently selected.
  const { selectedName, details, detailsLoading } =
    useCountryDetails(selected);

  // Keep border colors in sync with hover/selection state.
  useBorderHighlight(globeRef, countriesRef, hovered, selected);

  return (
    <div style={styles.page}>
      <div ref={mountRef} style={styles.canvas} />

      <GlobeUI
        loading={loading}
        error={error}
        hovered={hovered}
        selected={selected}
        details={details}
        detailsLoading={detailsLoading}
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
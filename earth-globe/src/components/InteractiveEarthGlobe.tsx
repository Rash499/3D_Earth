import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";

type CountryFeature = Feature<Geometry, { name?: string; [key: string]: unknown }>;

type CountryInfo = {
  name: string;
  capital?: string;
  population?: number;
  region?: string;
  flag?: string;
};

const DATA_URL = "/countries-110m.json";
const TEXTURE_URL = "/earth.jpg"; // equirectangular Earth texture

/**
 * Expected public files:
 *   /countries-110m.json -> world-atlas countries-110m.json
 *   /earth.jpg           -> any equirectangular Earth texture
 *
 * To use a different dataset, change DATA_URL and the conversion in loadCountries().
 * To use another Earth texture, change TEXTURE_URL. The texture should be equirectangular.
 *
 * Install:
 *   npm i three topojson-client
 *   npm i d3-geo
 *   npm i -D @types/geojson @types/d3-geo
 */

const RADIUS = 2.25;
const BORDER_ALTITUDE = 0.012;

function lonLatToVector3(lon: number, lat: number, radius = RADIUS) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function getRings(country: CountryFeature): number[][][] {
  const geometry = country.geometry;
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    return geometry.coordinates as number[][][];
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as number[][][][]).flat();
  }

  return [];
}

function countryContains(country: CountryFeature, lon: number, lat: number) {
  // d3-geo performs spherical point-in-polygon testing and handles
  // MultiPolygons and antimeridian-crossing countries correctly.
  return geoContains(country as any, [lon, lat]);
}

function makeBorderLines(
  country: CountryFeature,
  material: THREE.LineBasicMaterial,
  countryIndex: number
) {
  const group = new THREE.Group();

  for (const ring of getRings(country)) {
    const points = ring.map(([lon, lat]) =>
      lonLatToVector3(lon, lat, RADIUS + BORDER_ALTITUDE)
    );
    if (points.length < 2) continue;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.LineLoop(geometry, material.clone());
    line.userData.countryIndex = countryIndex;
    group.add(line);
  }

  return group;
}

function buildBorderLines(
  countries: CountryFeature[],
  normalMaterial: THREE.LineBasicMaterial
) {
  const group = new THREE.Group();

  countries.forEach((country, index) => {
    group.add(makeBorderLines(country, normalMaterial, index));
  });

  return group;
}

async function loadCountries(): Promise<CountryFeature[]> {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error("Could not load country data.");

  const topo = await response.json();

  // world-atlas exposes a countries object. topojson-client converts it to GeoJSON.
  const geo = feature(topo, topo.objects.countries) as FeatureCollection;
  return geo.features as CountryFeature[];
}

async function loadCountryDetails(
  countryName: string,
  signal: AbortSignal
): Promise<CountryInfo | null> {
  try {
    const url =
      "https://restcountries.com/v3.1/name/" +
      encodeURIComponent(countryName) +
      "?fields=name,capital,population,region,flags";
    const response = await fetch(url, { signal });
    if (!response.ok) return null;

    const results = await response.json();
    const item = results?.[0];
    if (!item) return null;

    return {
      name: item.name?.common ?? countryName,
      capital: item.capital?.[0],
      population: item.population,
      region: item.region,
      flag: item.flags?.svg ?? item.flags?.png,
    };
  } catch {
    return null;
  }
}

export default function InteractiveEarthGlobe() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const countryGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const countriesRef = useRef<CountryFeature[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<CountryFeature | null>(null);
  const hoveredRef = useRef<CountryFeature | null>(null);
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
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 0.3, 7.1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.25;
    controls.maxDistance = 11;
    controls.rotateSpeed = 0.45;
    controls.zoomSpeed = 0.65;
    controlsRef.current = controls;

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    const ambient = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    const loader = new THREE.TextureLoader();
    loader.load(
      TEXTURE_URL,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const globe = new THREE.Mesh(
          new THREE.SphereGeometry(RADIUS, 96, 96),
          new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 8,
            specular: new THREE.Color(0x333333),
          })
        );
        globe.userData.isEarthGlobe = true;
        globeGroup.add(globe);
      },
      undefined,
      () => {
        // If no texture exists, retain a clean stylized globe instead of failing.
        const globe = new THREE.Mesh(
          new THREE.SphereGeometry(RADIUS, 96, 96),
          new THREE.MeshPhongMaterial({
            color: 0x183a63,
            shininess: 12,
          })
        );
        globe.userData.isEarthGlobe = true;
        globeGroup.add(globe);
      }
    );

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.025, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x66bfff,
        transparent: true,
        opacity: 0.055,
        side: THREE.BackSide,
      })
    );
    globeGroup.add(atmosphere);

    const starGeometry = new THREE.BufferGeometry();
    const starPositions: number[] = [];
    for (let i = 0; i < 900; i++) {
      const r = 35 + Math.random() * 25;
      const v = new THREE.Vector3().randomDirection().multiplyScalar(r);
      starPositions.push(v.x, v.y, v.z);
    }
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3)
    );
    scene.add(
      new THREE.Points(
        starGeometry,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.055,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.7,
        })
      )
    );

    const normalBorder = new THREE.LineBasicMaterial({
      color: 0x8ecbff,
      transparent: true,
      opacity: 0.72,
    });
    let borderGroup: THREE.Group | null = null;

    loadCountries()
      .then((countries) => {
        if (disposed) return;
        countriesRef.current = countries;

        borderGroup = buildBorderLines(countries, normalBorder);
        globeGroup.add(borderGroup);
        countryGroupRef.current = borderGroup;
        setLoading(false);
      })
      .catch((err) => {
        if (disposed) return;
        setError(err instanceof Error ? err.message : "Failed to load countries.");
        setLoading(false);
      });

    const resize = () => {
      if (!mount || !camera || !renderer) return;
      camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    const getCountryAtPointer = (event: PointerEvent) => {
      if (!mount || !countryGroupRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointerRef.current, camera);

      // Raycast the Earth sphere. This gives a stable geographic hit point
      // regardless of the country border line thickness.
      const globeMesh = globeGroup.children.find(
        (child) =>
          child instanceof THREE.Mesh &&
          child.userData.isEarthGlobe === true
      ) as THREE.Mesh | undefined;

      if (!globeMesh) return;

      const hits = raycasterRef.current.intersectObject(globeMesh, false);
      if (!hits.length) {
        setHovered(null);
        return;
      }

      const localPoint = globeGroup
        .worldToLocal(hits[0].point.clone())
        .normalize();

     const lat = THREE.MathUtils.radToDeg(
        Math.asin(localPoint.y)
        );

     let lon = THREE.MathUtils.radToDeg(
        Math.atan2(-localPoint.z, localPoint.x)
        );

     if (lon > 180) lon -= 360;
     if (lon < -180) lon += 360;

     const country = countriesRef.current.find((c) =>
        countryContains(c, lon, lat)
      );

      hoveredRef.current = country ?? null;
      setHovered(country ?? null);
      setTooltip({
        x: event.clientX,
        y: event.clientY,
      });
    };

    const pointerMove = (event: PointerEvent) => {
      getCountryAtPointer(event);
    };

    const click = () => {
      const country = hoveredRef.current;
      if (!country) return;
      setSelected(country);
    };

    const animate = () => {
      if (disposed) return;
      requestAnimationFrame(animate);
      controls.update();

      // Subtle idle rotation only when the user is not interacting.
      if (!controls.enabled) {
        globeGroup.rotation.y += 0.00065;
      }

      renderer.render(scene, camera);
    };

    window.addEventListener("resize", resize);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("click", click);
    animate();

    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("click", click);
      controls.dispose();
      renderer.dispose();
      starGeometry.dispose();
      normalBorder.dispose();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineLoop) {
          object.geometry?.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material?.dispose();
        }
      });

      mount.removeChild(renderer.domElement);
    };
  }, []);

  // Country details are lazy-loaded only after selection.
  useEffect(() => {
    if (!selectedName) {
      setDetails(null);
      return;
    }

    const controller = new AbortController();
    loadCountryDetails(selectedName, controller.signal).then(setDetails);
    return () => controller.abort();
  }, [selectedName]);

  // Highlight border materials without rebuilding geometry.
  useEffect(() => {
    const group = countryGroupRef.current;
    if (!group) return;

    group.traverse((object) => {
    if (!(object instanceof THREE.LineLoop)) return;

    const index = object.userData.countryIndex as number;
    const country = countriesRef.current[index];
    const isActive = country === hovered || country === selected;

    const material = object.material as THREE.LineBasicMaterial;
    material.color.set(isActive ? 0xffffff : 0x8ecbff);
    material.opacity = isActive ? 1 : 0.72;
  });
  }, [hovered, selected]);

  return (
    <div style={styles.page}>
      <div ref={mountRef} style={styles.canvas} />

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>INTERACTIVE EARTH</div>
          <h1 style={styles.title}>Explore the world</h1>
          <p style={styles.subtitle}>
            Drag to rotate · Scroll to zoom · Hover a country · Click for details
          </p>
        </div>

        <div style={styles.searchHint}>Country boundaries · Natural Earth</div>
      </div>

      {loading && (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          Loading Earth data…
        </div>
      )}

      {error && (
        <div style={styles.error}>
          <strong>Unable to load country boundaries.</strong>
          <span>{error}</span>
        </div>
      )}

      {hovered && (
        <div
          style={{
            ...styles.tooltip,
            left: tooltip.x + 14,
            top: tooltip.y + 14,
          }}
        >
          {hovered.properties?.name ?? `Country ${hovered.id ?? ""}`.trim()}
        </div>
      )}

      {selected && (
        <aside style={styles.panel}>
          <button style={styles.close} onClick={() => setSelected(null)}>
            ×
          </button>

          {details?.flag && (
            <img src={details.flag} alt="" style={styles.flag} />
          )}

          <div style={styles.panelEyebrow}>COUNTRY</div>
          <h2 style={styles.countryName}>
            {details?.name ?? selectedName}
          </h2>

          <div style={styles.details}>
            <Detail label="Capital" value={details?.capital ?? "—"} />
            <Detail
              label="Population"
              value={
                details?.population
                  ? new Intl.NumberFormat().format(details.population)
                  : "—"
              }
            />
            <Detail label="Region" value={details?.region ?? "—"} />
          </div>

          <p style={styles.panelNote}>
            Data loaded from REST Countries. You can replace this with your own
            bundled country metadata.
          </p>
        </aside>
      )}

      <div style={styles.controls}>
        <span>◉</span> {countriesRef.current.length || "—"} countries
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detail}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    position: "relative",
    width: "100%",
    height: "100vh",
    minHeight: 600,
    overflow: "hidden",
    background:
      "radial-gradient(circle at 50% 45%, #102a49 0%, #06111f 45%, #02060c 100%)",
    color: "#fff",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  canvas: {
    position: "absolute",
    inset: 0,
  },
  header: {
    position: "absolute",
    top: 28,
    left: 32,
    right: 32,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    pointerEvents: "none",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.2em",
    fontWeight: 700,
    opacity: 0.55,
  },
  title: {
    margin: "6px 0 4px",
    fontSize: "clamp(30px, 4vw, 54px)",
    lineHeight: 1,
    letterSpacing: "-0.04em",
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    opacity: 0.65,
  },
  searchHint: {
    marginTop: 4,
    padding: "9px 13px",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 999,
    background: "rgba(255,255,255,.055)",
    backdropFilter: "blur(12px)",
    fontSize: 12,
    opacity: 0.75,
  },
  loading: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderRadius: 999,
    background: "rgba(2,8,16,.78)",
    border: "1px solid rgba(255,255,255,.12)",
    backdropFilter: "blur(12px)",
    fontSize: 13,
  },
  spinner: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,.25)",
    borderTopColor: "#fff",
    animation: "spin 0.8s linear infinite",
  },
  error: {
    position: "absolute",
    left: 32,
    bottom: 28,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    maxWidth: 420,
    padding: "14px 16px",
    borderRadius: 14,
    background: "rgba(100,20,20,.72)",
    border: "1px solid rgba(255,100,100,.2)",
    fontSize: 12,
  },
  tooltip: {
    position: "fixed",
    zIndex: 10,
    pointerEvents: "none",
    padding: "7px 10px",
    borderRadius: 8,
    background: "rgba(3,9,17,.88)",
    border: "1px solid rgba(255,255,255,.15)",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    backdropFilter: "blur(12px)",
    fontSize: 12,
    fontWeight: 650,
    whiteSpace: "nowrap",
  },
  panel: {
    position: "absolute",
    top: 32,
    right: 32,
    width: "min(330px, calc(100vw - 64px))",
    padding: 22,
    borderRadius: 20,
    background: "rgba(4,12,22,.82)",
    border: "1px solid rgba(255,255,255,.13)",
    boxShadow: "0 24px 80px rgba(0,0,0,.4)",
    backdropFilter: "blur(18px)",
  },
  close: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    border: 0,
    borderRadius: "50%",
    background: "rgba(255,255,255,.08)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 20,
  },
  flag: {
    display: "block",
    width: 58,
    height: 38,
    objectFit: "cover",
    borderRadius: 7,
    marginBottom: 18,
  },
  panelEyebrow: {
    fontSize: 10,
    letterSpacing: "0.18em",
    opacity: 0.45,
    fontWeight: 700,
  },
  countryName: {
    margin: "5px 0 20px",
    fontSize: 28,
    letterSpacing: "-0.03em",
  },
  details: {
    display: "grid",
    gap: 1,
    overflow: "hidden",
    borderRadius: 12,
    background: "rgba(255,255,255,.055)",
  },
  detail: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    padding: "11px 13px",
    fontSize: 12,
    borderBottom: "1px solid rgba(255,255,255,.06)",
  },
  panelNote: {
    margin: "16px 0 0",
    fontSize: 11,
    lineHeight: 1.5,
    opacity: 0.5,
  },
  controls: {
    position: "absolute",
    left: 32,
    bottom: 28,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,.055)",
    border: "1px solid rgba(255,255,255,.1)",
    backdropFilter: "blur(10px)",
    fontSize: 11,
    opacity: 0.65,
  },
};

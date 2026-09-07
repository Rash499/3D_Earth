import * as THREE from "three";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { CountryFeature, TopoJSON } from "./types";
import { borderRadius, lonLatToVector3 } from "./coordinates";

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

export function buildCountryBorders(
  countries: CountryFeature[],
  material: THREE.LineBasicMaterial
) {
  const group = new THREE.Group();

  countries.forEach((country, countryIndex) => {
    const countryGroup = new THREE.Group();

    for (const ring of getRings(country)) {
      const points = ring.map(([lon, lat]) =>
        lonLatToVector3(lon, lat, borderRadius())
      );

      if (points.length < 2) continue;

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.LineLoop(geometry, material.clone());

      line.userData.countryIndex = countryIndex;
      countryGroup.add(line);
    }

    group.add(countryGroup);
  });

  return group;
}

export async function loadCountries(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load country data (${response.status}).`);
  }

  const topo = (await response.json()) as TopoJSON;

  if (!topo.objects?.countries) {
    throw new Error("TopoJSON does not contain objects.countries.");
  }

  const geo = feature(
    topo as never,
    topo.objects.countries as never
  ) as FeatureCollection<Geometry, { name?: string; [key: string]: unknown }>;

  return geo.features as CountryFeature[];
}

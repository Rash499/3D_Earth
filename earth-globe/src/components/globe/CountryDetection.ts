import * as THREE from "three";
import { geoContains } from "d3-geo";
import type { CountryFeature } from "./types";
import { vector3ToLonLat } from "./coordinates";

export function findCountryAtPointer(
  event: PointerEvent,
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  globeGroup: THREE.Group,
  earthMesh: THREE.Mesh,
  countries: CountryFeature[],
  raycaster: THREE.Raycaster,
  pointer: THREE.Vector2
) {
  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObject(earthMesh, false);
  if (!hits.length) return null;

  const localPoint = globeGroup
    .worldToLocal(hits[0].point.clone())
    .normalize();

  const { lon, lat } = vector3ToLonLat(localPoint);

  return (
    countries.find((country) =>
      geoContains(country as never, [lon, lat])
    ) ?? null
  );
}

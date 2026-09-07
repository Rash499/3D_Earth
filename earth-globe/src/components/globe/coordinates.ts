import * as THREE from "three";
import { RADIUS, BORDER_ALTITUDE } from "./constants";

export function lonLatToVector3(lon: number, lat: number, radius = RADIUS) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export function vector3ToLonLat(point: THREE.Vector3) {
  const p = point.clone().normalize();

  return {
    lat: THREE.MathUtils.radToDeg(
      Math.asin(THREE.MathUtils.clamp(p.y, -1, 1))
    ),
    lon: THREE.MathUtils.radToDeg(Math.atan2(-p.z, p.x)),
  };
}

export const borderRadius = () => RADIUS + BORDER_ALTITUDE;

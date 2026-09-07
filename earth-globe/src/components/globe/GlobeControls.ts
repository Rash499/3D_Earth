import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MIN_ZOOM, MAX_ZOOM } from "./constants";

export function createGlobeControls(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement
) {
  const controls = new OrbitControls(camera, canvas);

  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = MIN_ZOOM;
  controls.maxDistance = MAX_ZOOM;
  controls.rotateSpeed = 0.45;
  controls.zoomSpeed = 0.65;

  return controls;
}

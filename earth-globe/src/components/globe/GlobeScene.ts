import * as THREE from "three";
import { createGlobeControls } from "./GlobeControls";
import { RADIUS, TEXTURE_URL } from "./constants";

export type GlobeScene = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: ReturnType<typeof createGlobeControls>;
  globeGroup: THREE.Group;
  earthMesh: THREE.Mesh;
  countryGroup: THREE.Group;
};

export function createGlobeScene(mount: HTMLDivElement): GlobeScene {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    mount.clientWidth / Math.max(mount.clientHeight, 1),
    0.1,
    100
  );

  camera.position.set(0, 0.3, 7.1);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const controls = createGlobeControls(camera, renderer.domElement);
  const globeGroup = new THREE.Group();
  const countryGroup = new THREE.Group();

  scene.add(globeGroup);
  globeGroup.add(countryGroup);

  scene.add(new THREE.AmbientLight(0xffffff, 1.3));

  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(5, 3, 5);
  scene.add(sun);

  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 8,
    specular: new THREE.Color(0x333333),
  });

  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, 96, 96),
    earthMaterial
  );

  earthMesh.userData.isEarthGlobe = true;
  globeGroup.add(earthMesh);

  new THREE.TextureLoader().load(
    TEXTURE_URL,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
    },
    undefined,
    () => {
      earthMaterial.color.set(0x183a63);
    }
  );

  globeGroup.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.025, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x66bfff,
        transparent: true,
        opacity: 0.055,
        side: THREE.BackSide,
      })
    )
  );

  const starsGeometry = new THREE.BufferGeometry();
  const positions: number[] = [];

  for (let i = 0; i < 900; i++) {
    const r = 35 + Math.random() * 25;
    const v = new THREE.Vector3()
      .randomDirection()
      .multiplyScalar(r);

    positions.push(v.x, v.y, v.z);
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  scene.add(
    new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.055,
        transparent: true,
        opacity: 0.7,
      })
    )
  );

  return {
    scene,
    camera,
    renderer,
    controls,
    globeGroup,
    earthMesh,
    countryGroup,
  };
}

export function resizeGlobe(
  mount: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
) {
  camera.aspect =
    mount.clientWidth / Math.max(mount.clientHeight, 1);

  camera.updateProjectionMatrix();
  renderer.setSize(mount.clientWidth, mount.clientHeight);
}

export function disposeGlobe(globe: GlobeScene) {
  globe.controls.dispose();
  globe.renderer.dispose();

  globe.scene.traverse((object) => {
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.LineLoop ||
      object instanceof THREE.Points
    ) {
      object.geometry?.dispose();

      const material = object.material;

      if (Array.isArray(material)) {
        material.forEach((m) => m.dispose());
      } else {
        material?.dispose();
      }
    }
  });
}

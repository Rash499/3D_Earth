import { useEffect, useRef, useState, type RefObject } from "react";

import {
  createGlobeScene,
  disposeGlobe,
  resizeGlobe,
} from "../GlobeScene";

/**
 * Owns the three.js scene lifecycle for the globe:
 * creation, resize handling, the render loop, and disposal.
 *
 * Returns a ref to the scene object (renderer, camera, controls, groups, etc.)
 * plus a `ready` flag other hooks can wait on before touching the scene.
 */
export function useGlobeScene(
  mountRef: RefObject<HTMLDivElement | null>
) {
  const globeRef =
    useRef<ReturnType<typeof createGlobeScene> | null>(null);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) return;

    let disposed = false;
    let frame = 0;

    const globe = createGlobeScene(mount);

    globeRef.current = globe;
    setReady(true);

    const onResize = () => {
      resizeGlobe(mount, globe.camera, globe.renderer);
    };

    const animate = () => {
      if (disposed) return;

      frame = requestAnimationFrame(animate);

      globe.controls.update();

      globe.renderer.render(globe.scene, globe.camera);
    };

    window.addEventListener("resize", onResize);

    animate();

    return () => {
      disposed = true;

      cancelAnimationFrame(frame);

      window.removeEventListener("resize", onResize);

      disposeGlobe(globe);

      if (mount.contains(globe.renderer.domElement)) {
        mount.removeChild(globe.renderer.domElement);
      }

      globeRef.current = null;
      setReady(false);
    };
  }, [mountRef]);

  return { globeRef, ready };
}
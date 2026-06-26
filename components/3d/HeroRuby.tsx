"use client";

/**
 * HeroRuby — a single slowly-rotating 3D ruby for the landing page hero.
 * Rendered in its own small transparent Canvas.
 * Lazy-loaded via next/dynamic in page.tsx.
 */

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/models/object_ruby.glb");

function SpinningRuby({ targetSize }: { targetSize: number }) {
  const { scene } = useGLTF("/models/object_ruby.glb");
  const ref        = useRef<THREE.Group>(null);

  /* Normalise model to targetSize units in the scene */
  const cloned = useRef(scene.clone(true));
  const box    = new THREE.Box3().setFromObject(cloned.current);
  const ext    = new THREE.Vector3();
  box.getSize(ext);
  const maxDim = Math.max(ext.x, ext.y, ext.z);
  const scale  = maxDim > 0 ? targetSize / maxDim : 1;
  cloned.current.scale.setScalar(scale);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y  = t * 0.45;
    ref.current.rotation.x  = Math.sin(t * 0.28) * 0.18;
  });

  return (
    <group ref={ref}>
      <primitive object={cloned.current} />
    </group>
  );
}

interface Props {
  /** CSS pixel dimensions of the canvas square */
  px?: number;
}

export default function HeroRuby({ px = 160 }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ width: px, height: px, background: "transparent" }}
    >
      {/* Warm studio lighting — flatters the gem */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 5]}  intensity={1.8} color="#ffffff" />
      <pointLight       position={[0, 0, 4]}  intensity={1.6} color="#E63946" distance={12} />
      <pointLight       position={[-3, 3, 2]} intensity={0.8} color="#D4A373" distance={10} />

      <Suspense fallback={null}>
        <SpinningRuby targetSize={1.4} />
      </Suspense>
    </Canvas>
  );
}

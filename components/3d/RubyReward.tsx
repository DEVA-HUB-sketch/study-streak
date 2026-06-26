"use client";

/**
 * RubyReward — Full-screen transparent 3D overlay
 *
 * Listens for "study-streak:ruby-reward" custom DOM events.
 * Spawns N flying 3D ruby models (from the GLB at /models/object_ruby.glb)
 * that arc toward the ruby counter badge in the top navigation bar,
 * then fade out as the counter increments.
 *
 * Architecture:
 *   • Single R3F Canvas (transparent, pointer-events:none, fixed position)
 *   • OrthographicCamera with pixel-unit world space  ← 1 unit = 1 px
 *   • Each ruby is an independent Three.js object animated in useFrame
 *   • GLB is preloaded once and deep-cloned per instance (independent materials)
 *   • Lazy-loaded via next/dynamic — never included in initial bundle
 */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";
import { type RubyRewardPayload, RUBY_REWARD_EVENT } from "@/hooks/useRubyReward";

/* ── Constants ─────────────────────────────────────────────── */
const MODEL_PATH   = "/models/object_ruby.glb";
const TARGET_ID    = "ruby-counter";      // id on the ruby badge in DashboardLayout
const RUBY_SIZE    = 38;                  // target pixel size of each model
const ARC_HEIGHT   = 90;                  // peak of the upward arc (pixels)
const DURATION     = 1.35;               // seconds per ruby flight
const STAGGER      = 90;                  // ms between each ruby launch

/* Number of 3D models to spawn per reward amount */
function modelCount(amount: number): number {
  if (amount <= 10) return 3;
  if (amount <= 50) return 6;
  return 10;
}

/* Cubic ease-in-out */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/* ── GLB deep-clone utility ─────────────────────────────────── */
/** Clone scene + materials so each instance has independent opacity */
function deepCloneScene(scene: THREE.Object3D): THREE.Group {
  const clone = scene.clone(true) as THREE.Group;
  clone.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => {
        const mc = m.clone();
        mc.transparent = true;
        return mc;
      });
    } else if (mesh.material) {
      mesh.material = (mesh.material as THREE.Material).clone();
      (mesh.material as THREE.Material).transparent = true;
    }
  });
  return clone;
}

/* ── Per-ruby state ─────────────────────────────────────────── */
interface FlyingRuby {
  id:          string;
  startX:      number;   // screen px from left
  startY:      number;   // screen px from top
  delay:       number;   // ms stagger before launch
  born:        number;   // Date.now() when instance was added
  rotSpeed:    [number, number, number];
}

/* ── Convert screen px → orthographic world units ──────────── */
function screenToWorld(sx: number, sy: number, w: number, h: number): [number, number] {
  return [sx - w / 2, h / 2 - sy];
}

/* ── Preload the GLB (module-level, once) ───────────────────── */
useGLTF.preload(MODEL_PATH);

/* ── Single animated ruby instance ─────────────────────────── */
interface AnimatedRubyProps {
  ruby:       FlyingRuby;
  targetX:    number;       // screen px
  targetY:    number;       // screen px
  onDone:     (id: string) => void;
}

function AnimatedRuby({ ruby, targetX, targetY, onDone }: AnimatedRubyProps) {
  const gltf     = useGLTF(MODEL_PATH) as GLTF & { scene: THREE.Group };
  const groupRef = useRef<THREE.Group>(null);
  const cloned   = useRef<THREE.Group | null>(null);
  const done     = useRef(false);
  const { size } = useThree();

  /* Clone on mount (avoids shared material issues) */
  if (!cloned.current) {
    cloned.current = deepCloneScene(gltf.scene);
    /* Auto-scale: normalise the model to RUBY_SIZE pixels */
    const box    = new THREE.Box3().setFromObject(cloned.current);
    const extent = new THREE.Vector3();
    box.getSize(extent);
    const maxDim = Math.max(extent.x, extent.y, extent.z);
    const scale  = maxDim > 0 ? RUBY_SIZE / maxDim : 1;
    cloned.current.scale.setScalar(scale);
  }

  useFrame(() => {
    if (!groupRef.current || done.current) return;

    const elapsed = (Date.now() - ruby.born - ruby.delay) / 1000;
    if (elapsed < 0) return; // waiting for stagger delay

    const t     = Math.min(elapsed / DURATION, 1);
    const eased = easeInOutCubic(t);

    /* World-space positions */
    const [sx, sy] = screenToWorld(ruby.startX, ruby.startY, size.width, size.height);
    const [tx, ty] = screenToWorld(targetX, targetY, size.width, size.height);

    /* Arc trajectory: lerp + sine arc upward */
    groupRef.current.position.x = sx + (tx - sx) * eased;
    groupRef.current.position.y = sy + (ty - sy) * eased + Math.sin(t * Math.PI) * ARC_HEIGHT;
    groupRef.current.position.z = 0;

    /* Spin */
    groupRef.current.rotation.x += ruby.rotSpeed[0];
    groupRef.current.rotation.y += ruby.rotSpeed[1];
    groupRef.current.rotation.z += ruby.rotSpeed[2];

    /* Scale pulse: grow during arc, shrink at end */
    const pulse = 1 + Math.sin(t * Math.PI) * 0.35;
    groupRef.current.scale.setScalar(pulse);

    /* Opacity: full → fade out in last 20% */
    const opacity = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
    cloned.current!.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => { (m as THREE.MeshStandardMaterial).opacity = opacity; });
    });

    if (t >= 1 && !done.current) {
      done.current = true;
      onDone(ruby.id);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned.current} />
    </group>
  );
}

/* ── Scene root ─────────────────────────────────────────────── */
function RubyScene({
  rubies,
  targetX,
  targetY,
  onDone,
}: {
  rubies:  FlyingRuby[];
  targetX: number;
  targetY: number;
  onDone:  (id: string) => void;
}) {
  const { camera, size } = useThree();

  /* Keep OrthographicCamera bounds = window pixels at all times */
  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    camera.left   = -size.width  / 2;
    camera.right  =  size.width  / 2;
    camera.top    =  size.height / 2;
    camera.bottom = -size.height / 2;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return (
    <>
      {/* Warm studio lighting that flatters the ruby gem */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 0, 6]} intensity={1.5} color="#E63946" distance={200} />
      <pointLight position={[-4, 4, 4]} intensity={0.8} color="#D4A373" distance={200} />

      <Suspense fallback={null}>
        {rubies.map((ruby) => (
          <AnimatedRuby
            key={ruby.id}
            ruby={ruby}
            targetX={targetX}
            targetY={targetY}
            onDone={onDone}
          />
        ))}
      </Suspense>
    </>
  );
}

/* ── Helper: resolve counter position ───────────────────────── */
function getCounterPosition(): { x: number; y: number } {
  const el = document.getElementById(TARGET_ID);
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  /* Fallback: top-right of viewport */
  return { x: window.innerWidth - 100, y: 55 };
}

/* ── Helper: random spawn near screen centre ────────────────── */
function randomSpawn(): { x: number; y: number } {
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  return {
    x: cx + (Math.random() - 0.5) * 260,
    y: cy + (Math.random() - 0.5) * 220,
  };
}

/* ═══════════════════════════════════════════════════════════════
   RubyReward — exported default, mounted once in app/layout.tsx
   via next/dynamic with { ssr: false }
═══════════════════════════════════════════════════════════════ */
export default function RubyReward() {
  const [rubies,  setRubies]  = useState<FlyingRuby[]>([]);
  const [target,  setTarget]  = useState({ x: 0, y: 0 });

  /* Handle incoming reward events */
  const handleReward = useCallback((e: Event) => {
    const { amount } = (e as CustomEvent<RubyRewardPayload>).detail;
    const count    = modelCount(amount);
    const pos      = getCounterPosition();
    const now      = Date.now();

    setTarget(pos);
    setRubies((prev) => [
      ...prev,
      ...Array.from({ length: count }, (_, i) => {
        const spawn = randomSpawn();
        return {
          id:       `${now}-${i}`,
          startX:   spawn.x,
          startY:   spawn.y,
          delay:    i * STAGGER,
          born:     now,
          rotSpeed: [
            (Math.random() - 0.5) * 0.055,
            (Math.random() - 0.5) * 0.085,
            (Math.random() - 0.5) * 0.035,
          ] as [number, number, number],
        };
      }),
    ]);
  }, []);

  useEffect(() => {
    window.addEventListener(RUBY_REWARD_EVENT, handleReward);
    return () => window.removeEventListener(RUBY_REWARD_EVENT, handleReward);
  }, [handleReward]);

  /* Remove individual ruby when its animation finishes */
  const handleDone = useCallback((id: string) => {
    setRubies((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /* Don't mount the Canvas at all when idle → zero GPU cost */
  if (rubies.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        9998,
        pointerEvents: "none",
      }}
    >
      <Canvas
        orthographic
        camera={{ near: 0.1, far: 1000, position: [0, 0, 100] }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        resize={{ scroll: false }}
      >
        <RubyScene
          rubies={rubies}
          targetX={target.x}
          targetY={target.y}
          onDone={handleDone}
        />
      </Canvas>
    </div>
  );
}

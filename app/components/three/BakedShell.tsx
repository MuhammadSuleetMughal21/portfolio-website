"use client";

/**
 * The room shell modeled and light-baked in Blender (scripts/build_room.py),
 * exported to /public/models/room-baked.glb.
 *
 * Baked meshes render with MeshBasicMaterial so the Cycles bake shows as-is.
 * Meshes named EMIT_* are the LED strips; their materials animate from dark
 * to full glow shortly after `lightsOn` flips true, so the room "switches on"
 * when the intro title clears.
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

const URL = "/models/room-baked.glb?v=26";
useGLTF.preload(URL);

const STRIP = new THREE.Color("#ffc46a");
const DARK = new THREE.Color("#201a12");

export default function BakedShell({ lightsOn = true }: Readonly<{ lightsOn?: boolean }>) {
  const { scene } = useGLTF(URL);
  const t0 = useRef<number | null>(null);
  const { shell, stripMats } = useMemo(() => {
    const mats: THREE.MeshBasicMaterial[] = [];
    const root = scene.clone(true);
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const prev = o.material as THREE.MeshStandardMaterial;
      if (o.name.startsWith("EMIT_")) {
        const m = new THREE.MeshBasicMaterial({ color: DARK.clone(), toneMapped: false });
        o.material = m;
        mats.push(m);
      } else {
        const map = prev?.map ?? null;
        o.material = new THREE.MeshBasicMaterial({ map, color: map ? "#ffffff" : (prev?.color ?? "#888888") });
      }
      o.castShadow = false;
      o.receiveShadow = false;
    });
    return { shell: root, stripMats: mats };
  }, [scene]);

  useFrame(({ clock }) => {
    if (!lightsOn) { t0.current = null; return; }
    t0.current ??= clock.elapsedTime;
    const t = clock.elapsedTime - t0.current;
    const k = Math.min(1, Math.max(0, (t - 0.1) / 0.18));
    const e = k * k * (3 - 2 * k); // smoothstep
    for (const m of stripMats) m.color.copy(DARK).lerp(STRIP, e);
  });

  return <primitive object={shell} />;
}

"use client";

/**
 * Standalone preview of the PROJECTS workstation module at /workstation.
 * Orbit (drag), zoom (wheel) and pan (right-drag) around the desk from any
 * direction. A minimal backdrop (wall panels, window + sunset city, floating
 * bookshelf, tiled floor) frames the module like the reference still.
 */

import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, SoftShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import Workstation, { Diamond, AMBER } from "./Workstation";

function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

function useBackdropTextures() {
  return useMemo(() => {
    const tiles = tex(128, 128, (g) => {
      g.fillStyle = "#d9d0bf";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "#c2b7a4";
      g.lineWidth = 3;
      for (const v of [0, 64, 128]) {
        g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 128); g.stroke();
        g.beginPath(); g.moveTo(0, v); g.lineTo(128, v); g.stroke();
      }
    }, [10, 10]);
    const panels = tex(256, 256, (g) => {
      g.fillStyle = "#34353f";
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "#232430";
      g.lineWidth = 6;
      for (const v of [0, 128, 256]) {
        g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 256); g.stroke();
        g.beginPath(); g.moveTo(0, v); g.lineTo(256, v); g.stroke();
      }
    }, [3, 1.5]);
    const sky = tex(64, 256, (g) => {
      const grad = g.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, "#3f9ae0");
      grad.addColorStop(0.5, "#7ec4f2");
      grad.addColorStop(0.8, "#cfe9fb");
      grad.addColorStop(1, "#eef7fd");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 256);
    });
    const facade = (seed: number) =>
      tex(64, 128, (g) => {
        g.fillStyle = ["#b7b1a6", "#cfc8ba", "#a9a296"][seed % 3];
        g.fillRect(0, 0, 64, 128);
        let n = seed * 7;
        for (let y = 6; y < 122; y += 14)
          for (let x = 6; x < 58; x += 12) {
            n = (n * 9301 + 49297) % 233280;
            g.fillStyle = n / 233280 > 0.5 ? "#dfeefb" : "#4a627c";
            g.fillRect(x, y, 7, 9);
          }
      });
    return { tiles, panels, sky, facades: [facade(1), facade(2), facade(3)] };
  }, []);
}

function Palm({ pos, s = 1 }: Readonly<{ pos: [number, number, number]; s?: number }>) {
  const sway = useRef<THREE.Group>(null);
  useFrame(() => {
    if (sway.current) sway.current.rotation.z = Math.sin(performance.now() / 1000 * 0.8 + pos[0]) * 0.045;
  });
  return (
    <group ref={sway} position={pos} scale={s}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.06, 0.5 + i * 0.85, 0]} rotation={[0, 0, -0.07 * i]}>
          <cylinderGeometry args={[0.1 - i * 0.02, 0.13 - i * 0.02, 0.95, 7]} />
          <meshStandardMaterial color="#8a6a4a" />
        </mesh>
      ))}
      <group position={[0.16, 2.75, 0]}>
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.32, 0.12, Math.sin(a) * 0.32]}
              rotation={[Math.sin(a) * 1.3, -a, Math.cos(a) * 1.3]}
              scale={[1, 1, 0.45]}
            >
              <coneGeometry args={[0.085, 1.35, 5]} />
              <meshStandardMaterial color={["#2f6b44", "#28543a", "#35774c"][i % 3]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Backdrop() {
  const t = useBackdropTextures();
  const books = ["#c94f4f", "#4f74c9", "#4fc98a", "#e0b23f", "#9a5fd0", "#4fb9c9", "#d0685f", "#1f2a5a", "#c94fa0", "#5f8ad0", "#2d6b3a", "#efe7d6"];
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial map={t.tiles} roughness={0.9} />
      </mesh>
      {/* back wall with window opening */}
      {([
        [-3.2, 2.5, 4.2, 5],
        [4.8, 2.5, 5.2, 5],
        [0.6, 0.85, 3.4, 1.7],
        [0.6, 4.45, 3.4, 1.1],
      ] as const).map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, -4.2]} receiveShadow>
          <boxGeometry args={[w, h, 0.1]} />
          <meshStandardMaterial map={t.panels} />
        </mesh>
      ))}
      <mesh position={[-4.6, 2.5, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[9, 5, 0.1]} />
        <meshStandardMaterial map={t.panels} />
      </mesh>
      {/* window frame + mullions */}
      <group position={[0.6, 2.78, -4.18]}>
        {[1.12, -1.12].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[3.5, 0.08, 0.1]} />
            <meshStandardMaterial color="#111218" />
          </mesh>
        ))}
        {[-1.72, 1.72].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.08, 2.3, 0.1]} />
            <meshStandardMaterial color="#111218" />
          </mesh>
        ))}
        {[-1.14, 0, 1.14].map((x) => (
          <mesh key={x} position={[x, 0, 0.02]}>
            <boxGeometry args={[0.05, 2.2, 0.04]} />
            <meshStandardMaterial color="#111218" />
          </mesh>
        ))}
      </group>
      {/* city outside */}
      <mesh position={[0.6, 2.85, -10.5]}>
        <planeGeometry args={[16, 4.6]} />
        <meshBasicMaterial map={t.sky} />
      </mesh>
      {[
        { x: -2.6, w: 1.3, h: 2.2, z: -8.6, f: 0 },
        { x: -1.1, w: 0.95, h: 3.0, z: -7.6, f: 1 },
        { x: 0.2, w: 1.25, h: 2.0, z: -8.3, f: 2 },
        { x: 1.6, w: 0.85, h: 3.3, z: -7.9, f: 0 },
        { x: 2.8, w: 1.1, h: 2.5, z: -8.8, f: 1 },
      ].map((b) => (
        <mesh key={b.x} position={[b.x, b.h / 2 + 0.2, b.z]}>
          <boxGeometry args={[b.w, b.h, 0.8]} />
          <meshStandardMaterial map={t.facades[b.f]} />
        </mesh>
      ))}
      <mesh position={[1.4, 1.1, -6.8]}>
        <boxGeometry args={[4.5, 0.5, 1.2]} />
        <meshStandardMaterial color="#4c3148" />
      </mesh>
      <Palm pos={[-0.4, 0.1, -6.3]} s={0.85} />
      <Palm pos={[2.6, 0.2, -6.6]} s={0.7} />
      {/* floating bookshelf with amber under-glow */}
      <group position={[-4.52, 2.42, -2.1]}>
        <mesh position={[0.1, -0.14, 0]} castShadow>
          <boxGeometry args={[0.3, 0.05, 2.3]} />
          <meshStandardMaterial color="#2a2b33" />
        </mesh>
        <mesh position={[0.12, -0.17, 0]}>
          <boxGeometry args={[0.26, 0.012, 2.2]} />
          <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <pointLight position={[0.3, -0.35, 0]} color={AMBER} intensity={1.6} distance={2.2} decay={2} />
        {books.map((col, i) => (
          <mesh key={col} position={[0.1, 0.11 + (i % 3 === 0 ? 0.02 : 0), -0.95 + i * 0.17]} rotation={[i % 5 === 4 ? 0.14 : 0, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.48 - (i % 3) * 0.06, 0.1]} />
            <meshStandardMaterial color={col} roughness={0.8} />
          </mesh>
        ))}
      </group>
      <Diamond pos={[-0.3, 3.3, -3.7]} s={0.08} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={1.4} color="#e3e9f4" />
      <hemisphereLight args={["#bcd3ee", "#8a7f6e", 0.9]} />
      <directionalLight
        position={[2.0, 5.5, -7.0]}
        intensity={3.2}
        color="#fff0d8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0004}
      />
      <pointLight position={[3, 3, 4]} color="#6b76b8" intensity={2.4} distance={12} decay={2} />
      <pointLight position={[-1.15, 1.95, -1.5]} color="#5c6cff" intensity={1.0} distance={2.6} decay={2} />
    </>
  );
}

export default function WorkstationPreview() {
  return (
    <div className="fixed inset-0 bg-[#0a0a14]">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 38, position: [3.6, 3.1, 3.4] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#161a26"]} />
        <fog attach="fog" args={["#161a26", 12, 24]} />
        <SoftShadows size={14} samples={10} focus={0.55} />
        <Suspense fallback={null}>
          <Backdrop />
          <Workstation />
          <ContactShadows position={[0.4, 0.01, -1.4]} scale={10} blur={2.4} far={3} opacity={0.5} color="#05060a" />
          <Lights />
          <EffectComposer>
            <Bloom intensity={0.55} luminanceThreshold={0.85} luminanceSmoothing={0.3} mipmapBlur />
            <Vignette eskil={false} offset={0.2} darkness={0.7} />
          </EffectComposer>
        </Suspense>
        <OrbitControls
          target={[0.1, 1.3, -1.9]}
          minDistance={1.2}
          maxDistance={9}
          maxPolarAngle={Math.PI / 2 - 0.02}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
      <div className="pointer-events-none absolute left-6 top-6 font-mono text-[11px] uppercase tracking-[0.35em] text-white/60">
        Workstation module · drag to orbit · wheel to zoom
      </div>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox, ContactShadows, Html, useGLTF, useTexture, Clone } from "@react-three/drei";
import { experience } from "../../data";
import Workstation, { Diamond, PINK_HOT, AMBER } from "./Workstation";
import BakedShell from "./BakedShell";

export { PINK, PINK_HOT, AMBER } from "./Workstation";

const FONT = "/fonts/sora-700.woff";

/* ---- real CC0 models (Kenney furniture kit, public domain) ---- */
const MODEL = (f: string) => `/models/furniture/${f}.glb`;
const MODELS = [
  "pottedPlant", "plantSmall2", "laptop",
];
MODELS.forEach((f) => useGLTF.preload(MODEL(f)));

function Prop({
  file,
  position,
  rotation,
  scale = 1,
}: Readonly<{
  file: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}>) {
  const { scene } = useGLTF(MODEL(file));
  return (
    <Clone
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    />
  );
}

export type SectionId =
  | "intro"
  | "home"
  | "projects"
  | "experience"
  | "about"
  | "contact"
  | "music"
  | "talk";

// Phone sits yawed -0.35 on the desk; this is its "top" direction, used as the
// camera's up-vector during contact so the phone reads perfectly upright.
export const PHONE_UP: [number, number, number] = [-0.343, 0, 0.94];

export const POSES: Record<SectionId, { p: [number, number, number]; t: [number, number, number] }> = {
  // starts zoomed into the robot's face, then pulls back to home
  intro: { p: [0.492, 1.805, -2.25], t: [0.571, 1.8, -2.601] },
  home: { p: [4.3, 3.45, 3.4], t: [0.3, 1.4, -2.4] },
  // straight in front of the monitor — its on-screen OS fills the view
  projects: { p: [0.565, 1.8, -2.572], t: [0.301, 1.802, -1.393] },
  // the robot's face IS the chat/about screen
  talk: { p: [0.44, 1.8, -2.016], t: [0.571, 1.8, -2.601] },
  about: { p: [0.44, 1.8, -2.016], t: [0.571, 1.8, -2.601] },
  experience: { p: [3.3, 2.44, -2.75], t: [3.3, 2.47, -4.1] },
  contact: { p: [-0.21, 1.72, -0.968], t: [-0.22, 1.075, -1.02] },
  music: { p: [2.8, 1.42, -3.03], t: [2.8, 1.36, -3.46] },
};

/* experience badges (3 jobs + degree + freelance) */
const JOB_POINTS = [
  ["Shipped 12 cross-platform apps across travel, health, logistics & AI.", "Led end-to-end App Store & Google Play delivery."],
  ["Built health & e-commerce apps with React Native and Redux.", "Node, Express & MongoDB REST backends."],
  ["Cross-platform React Native apps in an agile team.", "Firebase Auth, Firestore and MobX state."],
];
export const BADGES = [
  ...experience.map((e, i) => ({
    company: e.company,
    color: ["#d04f5f", "#2e8f66", "#4f74c9"][i],
    role: e.role,
    period: e.period,
    points: JOB_POINTS[i] ?? [],
  })),
  {
    company: "SSUET",
    color: "#9a5fd0",
    role: "B.E. Software Engineering",
    period: "2020 – 2024",
    points: ["Sir Syed University of Engineering & Technology, Karachi."],
  },
  {
    company: "Freelance",
    color: "#2fa8b8",
    role: "App Store & Play Delivery",
    period: "Ongoing",
    points: ["End-to-end builds, store publishing and release updates for clients."],
  },
];

const PEG_X = 3.95;
export function badgePose(i: number): { p: [number, number, number]; t: [number, number, number] } {
  const x = PEG_X + (-1.0 + i * 0.5);
  return { p: [x, 2.5, -2.55], t: [x, 2.6, -4.1] };
}

/* ================= procedural textures ================= */

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
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

function useTextures() {
  return useMemo(() => {
    // dark herringbone parquet, like the reference's dusk floor
    const parquet = canvasTex(256, 256, (g) => {
      g.fillStyle = "#23242e";
      g.fillRect(0, 0, 256, 256);
      const tones = ["#2b2c38", "#30313e", "#272833", "#343544"];
      for (let r = 0; r < 8; r++) {
        for (let i = 0; i < 8; i++) {
          g.save();
          g.translate(i * 32, r * 32 + (i % 2 ? 16 : 0));
          g.rotate(((i % 2 ? 45 : -45) * Math.PI) / 180);
          g.fillStyle = tones[(i + r) % tones.length];
          g.fillRect(-26, -7, 52, 14);
          g.restore();
        }
      }
    }, [5, 4]);

    // linear amber gradient that falls straight down the wall under the shelf
    const shelfWash = canvasTex(64, 128, (g) => {
      const lg = g.createLinearGradient(0, 0, 0, 128);
      lg.addColorStop(0, "rgba(255,196,106,0.72)");
      lg.addColorStop(0.35, "rgba(255,196,106,0.3)");
      lg.addColorStop(1, "rgba(255,196,106,0)");
      g.fillStyle = lg;
      g.fillRect(0, 0, 64, 128);
      // soften the side edges so the wash has no hard vertical borders
      const lr = g.createLinearGradient(0, 0, 64, 0);
      lr.addColorStop(0, "rgba(0,0,0,1)");
      lr.addColorStop(0.18, "rgba(0,0,0,0)");
      lr.addColorStop(0.82, "rgba(0,0,0,0)");
      lr.addColorStop(1, "rgba(0,0,0,1)");
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = lr;
      g.fillRect(0, 0, 64, 128);
    });

    // soft white halo hugging the pegboard: a blurred rounded rectangle, so the
    // glow follows the board's shape instead of blobbing in the middle
    const halo = canvasTex(512, 320, (g) => {
      // board footprint on the 4.6x3.1 plane: 367x191 px centered
      g.shadowColor = "rgba(240,244,255,0.85)";
      g.shadowBlur = 42;
      g.fillStyle = "rgba(240,244,255,0.9)";
      for (let i = 0; i < 2; i++) {
        g.beginPath();
        g.roundRect(72, 64, 368, 192, 12);
        g.fill();
      }
      // carve the board's own footprint back out so the glow is a rim, not a wash
      g.shadowBlur = 0;
      g.globalCompositeOperation = "destination-out";
      g.beginPath();
      g.roundRect(82, 74, 348, 172, 10);
      g.fill();
    });

    // tiny pixel-art trinket icons for the pegboard
    const icon = (draw: (g: CanvasRenderingContext2D) => void) =>
      canvasTex(16, 16, (g) => {
        g.clearRect(0, 0, 16, 16);
        draw(g);
      });
    const icons = [
      icon((g) => { g.fillStyle = "#ff5c96"; g.fillRect(4, 4, 8, 2); g.fillRect(3, 5, 10, 2); g.fillRect(5, 7, 6, 2); g.fillRect(6, 9, 4, 1); g.fillRect(7, 10, 2, 1); }),
      icon((g) => { g.fillStyle = "#ffd166"; g.fillRect(7, 2, 2, 3); g.fillRect(3, 5, 10, 2); g.fillRect(6, 7, 4, 2); g.fillRect(5, 9, 2, 2); g.fillRect(9, 9, 2, 2); }),
      icon((g) => { g.fillStyle = "#58d6b4"; g.fillRect(7, 3, 2, 10); g.fillRect(4, 6, 3, 2); g.fillRect(4, 4, 1, 3); g.fillRect(9, 7, 3, 2); g.fillRect(11, 5, 1, 3); g.fillStyle = "#b5651d"; g.fillRect(6, 13, 4, 1); }),
      icon((g) => { g.fillStyle = "#e8e6f0"; g.fillRect(5, 3, 6, 8); g.fillRect(4, 4, 8, 6); g.fillRect(4, 11, 2, 2); g.fillRect(7, 11, 2, 2); g.fillRect(10, 11, 2, 2); g.fillStyle = "#1d1f2c"; g.fillRect(6, 6, 1, 2); g.fillRect(9, 6, 1, 2); }),
      icon((g) => { g.fillStyle = "#6ec6ff"; g.fillRect(3, 6, 10, 4); g.fillRect(2, 7, 1, 2); g.fillRect(13, 7, 1, 2); g.fillStyle = "#1d1f2c"; g.fillRect(4, 7, 2, 1); g.fillRect(5, 6, 1, 3); g.fillStyle = "#ff5c96"; g.fillRect(10, 7, 1, 1); g.fillRect(11, 8, 1, 1); }),
      icon((g) => { g.fillStyle = "#b08aff"; g.fillRect(9, 3, 1, 7); g.fillRect(10, 3, 3, 2); g.fillRect(7, 9, 3, 3); }),
    ];

    // KARACHI pixel tag
    const tag = canvasTex(96, 32, (g) => {
      g.fillStyle = "#2fa8b8";
      g.fillRect(0, 0, 96, 32);
      g.fillStyle = "#0f3f47";
      g.fillRect(0, 26, 96, 6);
      g.fillStyle = "#eefcff";
      g.font = "bold 11px monospace";
      g.textAlign = "center";
      g.fillText("KARACHI", 48, 18);
    });

    // big light rug with a double border line
    const rug = canvasTex(512, 384, (g) => {
      g.fillStyle = "#8f8b81";
      g.fillRect(0, 0, 512, 384);
      g.strokeStyle = "#767167";
      g.lineWidth = 6;
      g.strokeRect(18, 18, 476, 348);
      g.lineWidth = 3;
      g.strokeRect(34, 34, 444, 316);
      let n = 7;
      for (let i = 0; i < 1200; i++) {
        n = (n * 9301 + 49297) % 233280;
        const rx = (n / 233280) * 512;
        n = (n * 9301 + 49297) % 233280;
        const ry = (n / 233280) * 384;
        g.fillStyle = `rgba(0,0,0,${0.02 + (n % 100) / 3000})`;
        g.fillRect(rx, ry, 2, 2);
      }
    });

    // wall panels with seams
    const panels = canvasTex(256, 256, (g) => {
      g.fillStyle = "#565966";
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "#41434f";
      g.lineWidth = 5;
      for (const v of [0, 128, 256]) {
        g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 256); g.stroke();
        g.beginPath(); g.moveTo(0, v); g.lineTo(256, v); g.stroke();
      }
      g.fillStyle = "rgba(255,255,255,0.06)";
      g.fillRect(0, 0, 256, 6);
    }, [2, 1.2]);

    // pegboard perforation
    const peg = canvasTex(128, 128, (g) => {
      g.fillStyle = "#1e2029";
      g.fillRect(0, 0, 128, 128);
      g.fillStyle = "#12131a";
      for (let y = 8; y < 128; y += 16)
        for (let x = 8; x < 128; x += 16) {
          g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill();
        }
    }, [6, 3]);

    // cabinet wood grain
    const wood = canvasTex(128, 128, (g) => {
      g.fillStyle = "#23242e";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "#2d2f3b";
      g.lineWidth = 3;
      for (let x = 4; x < 128; x += 11) {
        g.beginPath();
        g.moveTo(x, 0);
        g.bezierCurveTo(x + 6, 40, x - 6, 90, x, 128);
        g.stroke();
      }
    }, [2, 1]);

    // daytime building facade: light concrete, glassy windows, a few lit
    const facade = (seed: number) =>
      canvasTex(64, 128, (g) => {
        g.fillStyle = ["#b7b1a6", "#cfc8ba", "#a9a296"][seed % 3];
        g.fillRect(0, 0, 64, 128);
        let n = seed * 7;
        for (let y = 6; y < 122; y += 14)
          for (let x = 6; x < 58; x += 12) {
            n = (n * 9301 + 49297) % 233280;
            const lit = n / 233280 > 0.55;
            g.fillStyle = lit ? (n % 2 ? "#dfeefb" : "#f4fafe") : "#4a627c";
            g.fillRect(x, y, 7, 9);
          }
      });

    // warm sun pool from window
    const pool = canvasTex(128, 128, (g) => {
      const r = g.createRadialGradient(64, 64, 8, 64, 64, 62);
      r.addColorStop(0, "rgba(255,244,214,0.6)");
      r.addColorStop(1, "rgba(255,244,214,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, 128, 128);
    });

    // framed art comes from real public-domain paintings in /public/art

    return { parquet, rug, halo, shelfWash, icons, tag, panels, peg, wood, facades: [facade(1), facade(2), facade(3)], pool };
  }, []);
}

/* ================= helpers ================= */

function Mat({ color, emissive, ei = 0, map, ...rest }: { color?: string; emissive?: string; ei?: number; map?: THREE.Texture;[k: string]: unknown }) {
  return (
    <meshStandardMaterial
      color={color}
      map={map}
      emissive={emissive ?? "#000000"}
      emissiveIntensity={ei}
      roughness={0.85}
      metalness={0.05}
      {...rest}
    />
  );
}

function Hotspot({ pos, onClick }: Readonly<{ pos: [number, number, number]; onClick: () => void }>) {
  const ring = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = performance.now() / 1000;
    const s = 1 + Math.sin(t * 2.4) * 0.18;
    ring.current?.scale.setScalar(s);
  });
  return (
    <group
      position={pos}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <group ref={ring}>
        <mesh>
          <ringGeometry args={[0.055, 0.07, 24]} />
          <meshBasicMaterial color={PINK_HOT} transparent opacity={0.9} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.02, 12]} />
          <meshBasicMaterial color={PINK_HOT} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* generous invisible hit area */}
      <mesh visible={false}>
        <sphereGeometry args={[0.22, 8, 8]} />
      </mesh>
    </group>
  );
}

/* ================= furniture ================= */

function Barcode({ y }: Readonly<{ y: number }>) {
  const widths = [3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 2, 3, 1];
  let x = -0.15;
  return (
    <group position={[0, y, 0.013]}>
      {widths.map((w, i) => {
        const bw = w * 0.0065;
        const el = (
          <mesh key={i} position={[x + bw / 2, 0, 0]}>
            <boxGeometry args={[bw, 0.055, 0.004]} />
            <Mat color="#15161d" />
          </mesh>
        );
        x += bw + 0.0065;
        return el;
      })}
    </group>
  );
}

function Badge({
  b,
  i,
  active,
  flipped,
  onClick,
}: Readonly<{
  b: (typeof BADGES)[number];
  i: number;
  active: boolean;
  flipped: boolean;
  onClick: () => void;
}>) {
  const card = useRef<THREE.Group>(null);
  const initials = b.company.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  useFrame((_, dt) => {
    if (!card.current) return;
    card.current.rotation.y = THREE.MathUtils.damp(card.current.rotation.y, active && flipped ? Math.PI : 0, 6, dt);
    const s = THREE.MathUtils.damp(card.current.scale.x, active ? 1.07 : 1, 6, dt);
    card.current.scale.setScalar(s);
  });
  const sway = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = performance.now() / 1000;
    if (sway.current) sway.current.rotation.z = Math.sin(t * 1.1 + i * 1.7) * 0.045;
  });
  const x = -1.0 + i * 0.5;
  return (
    <group position={[x, 0.3, 0.06]} scale={0.72}>
      <group ref={sway} position={[0, 0.58, 0]}>
      <group position={[0, -0.58, 0]}>
      {/* lanyard */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.045, 0.6, 0.016]} />
        <Mat color={b.color} />
      </mesh>
      <mesh position={[0, -0.05, 0.004]}>
        <boxGeometry args={[0.07, 0.05, 0.022]} />
        <Mat color="#7a7d8a" />
      </mesh>
      {/* flipping card */}
      <group
        ref={card}
        position={[0, -0.52, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        {/* front */}
        <group>
          <RoundedBox args={[0.6, 0.84, 0.02]} radius={0.02} castShadow>
            <Mat color="#f0ede7" />
          </RoundedBox>
          <mesh position={[0, 0.345, 0.013]}>
            <boxGeometry args={[0.14, 0.028, 0.01]} />
            <Mat color="#c9c6bf" />
          </mesh>
          <mesh position={[0, 0.25, 0.012]}>
            <boxGeometry args={[0.6, 0.17, 0.012]} />
            <Mat color={b.color} />
          </mesh>
          <Text font={FONT} fontSize={0.052} color="#ffffff" position={[0, 0.25, 0.022]} anchorX="center" anchorY="middle" maxWidth={0.56}>
            {b.company}
          </Text>
          <mesh position={[0, 0.06, 0.013]}>
            <circleGeometry args={[0.085, 20]} />
            <Mat color="#d8d5cf" />
          </mesh>
          <Text font={FONT} fontSize={0.05} color="#6b6e7a" position={[0, 0.06, 0.02]} anchorX="center" anchorY="middle">
            {initials}
          </Text>
          <Text font={FONT} fontSize={0.042} color="#1a1b22" position={[0, -0.095, 0.013]} anchorX="center" anchorY="middle" maxWidth={0.54} textAlign="center" lineHeight={1.15}>
            {b.role}
          </Text>
          <Text font={FONT} fontSize={0.03} color="#6b6e7a" letterSpacing={0.08} position={[0, -0.205, 0.013]} anchorX="center" anchorY="middle">
            {b.period.toUpperCase()}
          </Text>
          <Barcode y={-0.285} />
          <Text font={FONT} fontSize={0.026} color="#9a9da8" letterSpacing={0.12} position={[0, -0.365, 0.013]} anchorX="center" anchorY="middle">
            CLICK TO FLIP
          </Text>
        </group>
        {/* back */}
        <group rotation={[0, Math.PI, 0]}>
          <RoundedBox args={[0.6, 0.84, 0.018]} radius={0.02}>
            <Mat color="#eceae4" />
          </RoundedBox>
          <mesh position={[0, 0.37, 0.011]}>
            <boxGeometry args={[0.6, 0.1, 0.012]} />
            <Mat color={b.color} />
          </mesh>
          <Text font={FONT} fontSize={0.035} color="#ffffff" position={[0, 0.37, 0.02]} anchorX="center" anchorY="middle">
            {b.company.toUpperCase()}
          </Text>
          <Text font={FONT} fontSize={0.035} color="#2a2b33" position={[-0.26, 0.26, 0.012]} anchorX="left" anchorY="top" maxWidth={0.52} lineHeight={1.4} textAlign="left">
            {b.points.map((p) => `— ${p}`).join("\n")}
          </Text>
          <Text font={FONT} fontSize={0.026} color="#9a9da8" letterSpacing={0.12} position={[0, -0.36, 0.012]} anchorX="center" anchorY="middle">
            CLICK TO FLIP
          </Text>
        </group>
      </group>
      </group>
      </group>
    </group>
  );
}

function Cat() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = performance.now() / 1000;
    if (g.current) g.current.scale.y = 1 + Math.sin(t * 1.3) * 0.03; // slow breathing
  });
  const fur = "#f2efe8";
  const fur2 = "#dcd7cb";
  return (
    <group position={[-3.55, 0.36, 0.55]} rotation={[0, 0.6, 0]}>
      <group ref={g}>
        {/* curled body: a flattened ring, like a cat loafed in a circle */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.78]} castShadow>
          <torusGeometry args={[0.13, 0.082, 10, 20]} />
          <Mat color={fur} />
        </mesh>
        {/* haunch bump */}
        <mesh position={[-0.1, 0.035, 0.06]} scale={[1.15, 0.75, 1]}>
          <sphereGeometry args={[0.095, 12, 10]} />
          <Mat color={fur} />
        </mesh>
        {/* gray saddle patch */}
        <mesh position={[-0.02, 0.055, -0.04]} scale={[1.2, 0.5, 0.9]}>
          <sphereGeometry args={[0.085, 12, 10]} />
          <Mat color={fur2} />
        </mesh>
        {/* head resting on the ring, tucked */}
        <group position={[0.15, 0.05, 0.1]} rotation={[0.15, -0.5, -0.12]}>
          <mesh scale={[1, 0.85, 0.95]} castShadow>
            <sphereGeometry args={[0.082, 12, 10]} />
            <Mat color={fur} />
          </mesh>
          {/* muzzle */}
          <mesh position={[0.02, -0.02, 0.07]} scale={[1, 0.7, 0.8]}>
            <sphereGeometry args={[0.038, 10, 8]} />
            <Mat color="#fbf9f4" />
          </mesh>
          {/* closed eyes: tiny dark slits */}
          {[-0.032, 0.035].map((x) => (
            <mesh key={x} position={[x, 0.012, 0.072]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.022, 0.0045, 0.004]} />
              <Mat color="#3a3b40" />
            </mesh>
          ))}
          {/* pink nose */}
          <mesh position={[0.002, -0.012, 0.102]}>
            <sphereGeometry args={[0.0075, 6, 6]} />
            <Mat color="#e8a0b4" />
          </mesh>
          {/* ears with pink inners */}
          {[-0.045, 0.045].map((x) => (
            <group key={x} position={[x, 0.072, 0.01]} rotation={[0, 0, x < 0 ? 0.32 : -0.32]}>
              <mesh>
                <coneGeometry args={[0.026, 0.05, 4]} />
                <Mat color={fur2} />
              </mesh>
              <mesh position={[0, 0.004, 0.012]} scale={0.55}>
                <coneGeometry args={[0.026, 0.05, 4]} />
                <Mat color="#e8a0b4" />
              </mesh>
            </group>
          ))}
        </group>
        {/* tail curled around the body to the chin */}
        <mesh position={[0.05, 0.005, 0.15]} rotation={[-Math.PI / 2, 0, 1.0]} scale={[1, 1, 0.6]}>
          <torusGeometry args={[0.1, 0.028, 8, 16, 4.0]} />
          <Mat color={fur2} />
        </mesh>
        <mesh position={[-0.04, 0.012, 0.21]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <Mat color={fur2} />
        </mesh>
      </group>
    </group>
  );
}


function Pegboard({
  tex,
  halo,
  icons,
  tag,
  active,
  flipped,
  onBadge,
  onHover,
}: Readonly<{ tex: THREE.Texture; halo: THREE.Texture; icons: THREE.Texture[]; tag: THREE.Texture; active: number; flipped: boolean; onBadge: (i: number) => void; onHover?: (on: boolean) => void }>) {
  const [hover, setHover] = useState(false);
  return (
    <group
      position={[PEG_X, 2.72, -4.14]}
      onPointerOver={() => { setHover(true); onHover?.(true); }}
      onPointerOut={() => { setHover(false); onHover?.(false); }}
    >

      {hover && (
        <Html position={[0, -1.15, 0.3]} center zIndexRange={[20, 0]} pointerEvents="none" style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-white/25 bg-[#10121f]/95 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/90 shadow-[0_0_18px_rgba(255,143,184,0.25)] backdrop-blur">
            Experience →
          </div>
        </Html>
      )}
      {/* soft white halo glow around the board */}
      {/* sits just in front of the board face (the wall would depth-cull it behind);
          the texture's carved center keeps the board itself clear */}
      <mesh position={[0, 0, 0.03]} raycast={() => null}>
        <planeGeometry args={[4.6, 3.1]} />
        <meshBasicMaterial map={halo} color="#ffffff" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[3.3, 1.85, 0.05]} />
        <Mat map={tex} color="#ffffff" />
      </mesh>
      {/* J-hooks along the top row */}
      {[-1.45, -0.95, -0.45, 0.05, 0.55, 1.05, 1.45].map((hx) => (
        <group key={`hook-${hx}`} position={[hx, 0.78, 0.05]}>
          <mesh rotation={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.09, 6]} />
            <Mat color="#8c8e99" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.05, 0.03]}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <Mat color="#8c8e99" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* KARACHI pixel tag up top */}
      <mesh position={[0.15, 0.62, 0.045]} rotation={[0, 0, -0.04]}>
        <planeGeometry args={[0.42, 0.14]} />
        <meshBasicMaterial map={tag} />
      </mesh>
      {BADGES.map((b, i) => (
        <Badge key={b.company} b={b} i={i} active={active === i} flipped={flipped} onClick={() => onBadge(i)} />
      ))}
      {/* pixel trinket icons scattered on the right half */}
      {icons.map((ic, i) => (
        <mesh key={`icon-${i}`} position={[0.55 + (i % 3) * 0.38, 0.45 - Math.floor(i / 3) * 0.42, 0.045]} rotation={[0, 0, (i % 2 ? -1 : 1) * 0.06]}>
          <planeGeometry args={[0.16, 0.16]} />
          <meshBasicMaterial map={ic} transparent />
        </mesh>
      ))}
      {/* horseshoe trinket */}
      <mesh position={[1.35, -0.45, 0.05]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.09, 0.02, 8, 18, 4.4]} />
        <Mat color="#c9a24f" metalness={0.6} roughness={0.35} />
      </mesh>
      <group position={[1.52, -0.3, 0.05]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, -i * 0.05, 0]} rotation={[0.2, 0, 0]}>
            <torusGeometry args={[0.09, 0.012, 6, 16]} />
            <Mat color="#3c3e4a" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Cabinet({ wood, onMusic, speakerScreen, musicScreen, lightsOn = true, onHover }: Readonly<{ wood: THREE.Texture; onMusic: () => void; speakerScreen: React.ReactNode; musicScreen: React.ReactNode; lightsOn?: boolean; onHover?: (on: boolean) => void }>) {
  const [hover, setHover] = useState(false);
  const ringMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const ringLight = useRef<THREE.PointLight>(null);
  const t0 = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!lightsOn) { t0.current = null; }
    else t0.current ??= clock.elapsedTime;
    const t = t0.current === null ? 0 : clock.elapsedTime - t0.current;
    const k = Math.min(1, Math.max(0, (t - 1.7) / 0.22));
    const e = k * k * (3 - 2 * k);
    ringMats.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = ([2.8, 3.4, 2.8, 2.2][i] ?? 1) * e;
    });
    if (ringLight.current) ringLight.current.intensity = 1.4 * e;
  });
  return (
    <group position={[3.3, 0, -3.65]}>
      <RoundedBox args={[2.0, 0.9, 0.78]} radius={0.04} position={[0, 0.47, 0]} castShadow>
        <Mat map={wood} color="#ffffff" />
      </RoundedBox>
      {/* gold handles */}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.41]}>
          <boxGeometry args={[0.02, 0.26, 0.02]} />
          <meshStandardMaterial color="#c9a24f" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {/* speaker with pink ring + mini screen — click for music */}
      <group
        position={[-0.5, 1.2, 0]}
        onClick={(e) => { e.stopPropagation(); onMusic(); }}
        onPointerOver={() => { setHover(true); onHover?.(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); onHover?.(false); document.body.style.cursor = "auto"; }}
      >
        {hover && !musicScreen && (
          <Html position={[0, 0.55, 0.22]} center zIndexRange={[20, 0]} pointerEvents="none" style={{ pointerEvents: "none" }}>
            <div className="whitespace-nowrap rounded-full border border-white/25 bg-[#10121f]/95 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/90 shadow-[0_0_18px_rgba(255,143,184,0.25)] backdrop-blur">
              Now playing →
            </div>
          </Html>
        )}
        <RoundedBox args={[0.48, 0.7, 0.38]} radius={0.035} position={[0, 0.07, 0]} castShadow>
          <Mat color="#14151c" roughness={0.6} />
        </RoundedBox>
        {/* big target rings filling the face, glowing out from a dark cone */}
        <mesh position={[0, -0.02, 0.2]}>
          <circleGeometry args={[0.21, 24]} />
          <Mat color="#0a0b10" />
        </mesh>
        <mesh position={[0, -0.02, 0.205]}>
          <circleGeometry args={[0.035, 16]} />
          <meshStandardMaterial ref={(m) => { ringMats.current[0] = m; }} color={PINK_HOT} emissive={PINK_HOT} emissiveIntensity={0} toneMapped={false} />
        </mesh>
        {[[0.085, 0.011, 1], [0.145, 0.009, 0.85], [0.2, 0.0075, 0.65]].map(([r, tube, op], ri) => (
          <mesh key={ri} position={[0, -0.02, 0.202]}>
            <torusGeometry args={[r, tube, 10, 48]} />
            <meshStandardMaterial ref={(m) => { ringMats.current[ri + 1] = m; }} color={PINK_HOT} emissive={PINK_HOT} emissiveIntensity={0} transparent opacity={op} toneMapped={false} />
          </mesh>
        ))}
        <pointLight ref={ringLight} position={[0, -0.02, 0.4]} color={PINK_HOT} intensity={0} distance={1.6} decay={2} />
        {!musicScreen && (
          <Html transform position={[0, 0.32, 0.196]} distanceFactor={400 / 440} zIndexRange={[12, 0]} style={{ pointerEvents: "none" }}>
            <div style={{ width: 140, height: 54 }} className="overflow-hidden rounded-[4px] bg-black">
              {speakerScreen}
            </div>
          </Html>
        )}
        {/* big now-playing card floating over the speaker while the music view is open */}
        {musicScreen && (
          <Html transform position={[0, 0.16, 0.26]} distanceFactor={400 / 1400} zIndexRange={[14, 0]} style={{ pointerEvents: "auto" }}>
            <div style={{ width: 560, height: 220 }} className="overflow-hidden rounded-[18px]">
              {musicScreen}
            </div>
          </Html>
        )}
      </group>
      {/* dj console */}
      <group position={[0.45, 0.98, 0.02]}>
        <RoundedBox args={[0.85, 0.08, 0.5]} radius={0.02} castShadow>
          <Mat color="#101117" />
        </RoundedBox>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[-0.3 + (i % 3) * 0.3, 0.05, i < 3 ? -0.12 : 0.1]}>
            <cylinderGeometry args={[0.035, 0.035, 0.025, 10]} />
            <Mat color={i % 2 ? "#3c3e4a" : "#575a68"} />
          </mesh>
        ))}
        {[0, 1].map((i) => (
          <mesh key={i} position={[0.32, 0.05, -0.12 + i * 0.22]}>
            <boxGeometry args={[0.04, 0.02, 0.1]} />
            <meshStandardMaterial color={i ? AMBER : PINK_HOT} emissive={i ? AMBER : PINK_HOT} emissiveIntensity={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Palm({ pos, s = 1 }: Readonly<{ pos: [number, number, number]; s?: number }>) {
  const sway = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = performance.now() / 1000;
    if (sway.current) sway.current.rotation.z = Math.sin(t * 0.8 + pos[0]) * 0.04;
  });
  return (
    <group ref={sway} position={pos} scale={s}>
      {/* leaning segmented trunk */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[i * 0.06, 0.38 + i * 0.68, 0]} rotation={[0, 0, -0.06 * i]} castShadow>
          <cylinderGeometry args={[0.085 - i * 0.012, 0.105 - i * 0.012, 0.72, 7]} />
          <Mat color="#9a7752" />
        </mesh>
      ))}
      {/* crown of long drooping blade fronds */}
      <group position={[0.22, 3.0, 0]}>
        <mesh>
          <sphereGeometry args={[0.1, 8, 6]} />
          <Mat color="#2e6342" />
        </mesh>
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2;
          const droop = -0.42 - (i % 3) * 0.14;
          return (
            <group key={i} rotation={[0, -a, 0]}>
              <group rotation={[0, 0, droop]}>
                <mesh position={[0.46, 0.1, 0]} rotation={[0, 0, -0.3]} scale={[1, 0.14, 0.2]} castShadow>
                  <sphereGeometry args={[0.5, 10, 8]} />
                  <Mat color={["#3f8457", "#35744b", "#498f60"][i % 3]} />
                </mesh>
                <mesh position={[0.85, -0.06, 0]} rotation={[0, 0, -0.55]} scale={[0.55, 0.08, 0.12]}>
                  <sphereGeometry args={[0.5, 8, 6]} />
                  <Mat color="#2e6342" />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function CityOutside({ facades }: Readonly<{ facades: THREE.Texture[] }>) {
  const sky = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#3f9ae0");
    grad.addColorStop(0.5, "#7ec4f2");
    grad.addColorStop(0.8, "#cfe9fb");
    grad.addColorStop(1, "#eef7fd");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const blds = [
    { x: -2.6, w: 1.3, h: 2.2, z: -8.6, f: 0 },
    { x: -1.1, w: 0.95, h: 3.0, z: -7.6, f: 1 },
    { x: 0.2, w: 1.25, h: 2.0, z: -8.3, f: 2 },
    { x: 1.6, w: 0.85, h: 3.3, z: -7.9, f: 0 },
    { x: 2.8, w: 1.1, h: 2.5, z: -8.8, f: 1 },
    { x: 4.0, w: 1.0, h: 1.9, z: -8.0, f: 2 },
  ];
  return (
    <group>
      <mesh position={[0.6, 2.85, -10.5]}>
        <planeGeometry args={[16, 4.6]} />
        <meshBasicMaterial map={sky} />
      </mesh>
      {/* high white sun with a soft haze */}
      <mesh position={[1.7, 3.4, -10.2]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#fffbe8" toneMapped={false} />
      </mesh>
      <mesh position={[1.7, 3.4, -10.21]}>
        <circleGeometry args={[1.1, 24]} />
        <meshBasicMaterial color="#fff3cf" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {blds.map((b) => (
        <mesh key={b.x} position={[b.x, b.h / 2 + 0.2, b.z]}>
          <boxGeometry args={[b.w, b.h, 0.8]} />
          <meshStandardMaterial map={facades[b.f]} />
        </mesh>
      ))}
      {/* low rooftop in front */}
      <mesh position={[1.4, 1.1, -6.8]}>
        <boxGeometry args={[4.5, 0.5, 1.2]} />
        <Mat color="#9a9183" />
      </mesh>
      <Palm pos={[-0.4, 0.1, -6.3]} s={0.85} />
      <Palm pos={[2.6, 0.2, -6.6]} s={0.7} />
      <Cars />
      {/* city seen through the RIGHT-wall window */}
      <mesh position={[11.5, 2.6, 1.0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 4.4]} />
        <meshBasicMaterial map={sky} />
      </mesh>
      {([
        [8.6, 1.1, 2.6, -0.6, 0],
        [9.4, 1.35, 3.2, 1.2, 1],
        [8.2, 0.95, 2.0, 2.6, 2],
      ] as const).map(([x, w, h, z, f]) => (
        <mesh key={`r-${z}`} position={[x, h / 2 + 0.2, z]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[w, h, 0.8]} />
          <meshStandardMaterial map={facades[f]} />
        </mesh>
      ))}
      <Palm pos={[7.8, 0.1, 0.2]} s={0.75} />
    </group>
  );
}

/* little stylized cars sliding along the street outside */
function Cars() {
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = performance.now() / 1000;
    if (a.current) a.current.position.x = -6 + ((t * 1.1) % 12);
    if (b.current) b.current.position.x = 6 - ((t * 0.8 + 4) % 12);
  });
  const car = (color: string, z: number) => (
    <>
      <mesh position={[0, 0.14, z]} castShadow>
        <boxGeometry args={[0.52, 0.16, 0.24]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0.02, 0.27, z]}>
        <boxGeometry args={[0.26, 0.11, 0.2]} />
        <meshStandardMaterial color="#1d1f2c" roughness={0.4} />
      </mesh>
      <mesh position={[0.27, 0.16, z]}>
        <boxGeometry args={[0.02, 0.05, 0.16]} />
        <meshStandardMaterial color="#ffe2ae" emissive="#ffe2ae" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
    </>
  );
  return (
    <group>
      <group ref={a}>{car("#c75e74", -6.1)}</group>
      <group ref={b} rotation={[0, Math.PI, 0]}>{car("#4f74c9", 6.35)}</group>
    </group>
  );
}

/* ================= room root ================= */

export default function Room({
  onNavigate,
  expActive,
  expFlipped,
  onBadge,
  hotspots,
  phoneInteractive,
  monitorInteractive,
  monitorScreen,
  phoneScreen,
  speakerScreen,
  musicScreen,
  faceScreen,
  lightsOn = true,
}: Readonly<{
  onNavigate: (s: SectionId) => void;
  expActive: number;
  expFlipped: boolean;
  onBadge: (i: number) => void;
  hotspots: boolean;
  phoneInteractive: boolean;
  monitorInteractive: boolean;
  monitorScreen: React.ReactNode;
  phoneScreen: React.ReactNode;
  speakerScreen: React.ReactNode;
  musicScreen: React.ReactNode;
  faceScreen: React.ReactNode;
  lightsOn?: boolean;
}>) {
  const tex = useTextures();
  // real public-domain landscape paintings (Bierstadt) for the wall frames
  const arts = useTexture(["/art/art1.jpg", "/art/art2.jpg", "/art/art3.jpg"], (loaded) => {
    for (const t of loaded) t.colorSpace = THREE.SRGBColorSpace;
  });
  const hover = (on: boolean) => (document.body.style.cursor = on ? "pointer" : "auto");
  const [pegHot, setPegHot] = useState(false);
  const [spkHot, setSpkHot] = useState(false);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const poolMat = useRef<THREE.MeshBasicMaterial>(null);
  const pendantGlow = useRef<THREE.MeshStandardMaterial>(null);
  const pendantLight = useRef<THREE.PointLight>(null);
  const shelfGlow = useRef<THREE.MeshBasicMaterial>(null);
  const deskSpill = useRef<THREE.MeshBasicMaterial>(null);
  const onT0 = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!lightsOn) { onT0.current = null; }
    else onT0.current ??= clock.elapsedTime;
    const t = onT0.current === null ? 0 : clock.elapsedTime - onT0.current;
    const ramp = (delay: number, dur = 0.22) => {
      const k = Math.min(1, Math.max(0, (t - delay) / dur));
      return k * k * (3 - 2 * k);
    };
    if (shelfGlow.current) shelfGlow.current.opacity = 0.55 * ramp(0.15);
    if (deskSpill.current) deskSpill.current.opacity = 0.4 * ramp(0.15);
    if (pendantGlow.current) pendantGlow.current.emissiveIntensity = 0.05 + 1.35 * ramp(0.5);
    if (pendantLight.current) pendantLight.current.intensity = 2.2 * ramp(0.5);
    if (sunRef.current) sunRef.current.intensity = 0.4 + 3.4 * ramp(0.9, 0.35);
    if (poolMat.current) poolMat.current.opacity = 0.52 * ramp(0.9, 0.35);
  });

  return (
    <group>
      {/* dark herringbone floor + big bordered rug (walls/ceiling/trims baked) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.005, -0.5]} receiveShadow>
        <planeGeometry args={[13, 11]} />
        <meshStandardMaterial map={tex.parquet} roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.3, 0.015, -1.2]}>
        <planeGeometry args={[7.2, 5.4]} />
        <meshStandardMaterial map={tex.rug} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.7, 0.022, -2.6]}>
        <planeGeometry args={[4.6, 3.2]} />
        <meshBasicMaterial ref={poolMat} map={tex.pool} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* warm LED spill pooling on the floor around the desk base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.55, 0.028, -1.55]}>
        <planeGeometry args={[5.4, 3.6]} />
        <meshBasicMaterial ref={deskSpill} map={tex.pool} color={AMBER} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>




      <mesh position={[0.6, 2.78, -4.16]}>
        <planeGeometry args={[3.4, 2.2]} />
        <meshStandardMaterial color="#cfe4f5" transparent opacity={0.06} depthWrite={false} roughness={0.1} metalness={0.4} />
      </mesh>

      <CityOutside facades={tex.facades} />

      {/* gallery cluster of pixel-art scenery frames */}
      {([
        [-4.43, 3.72, -3.25, 0, 0.92, 0.68],
        [-4.43, 3.62, -2.3, 1, 0.66, 0.5],
        [-4.43, 2.98, -2.52, 2, 0.5, 0.4],
      ] as const).map(([x, y, z, i, w, h]) => (
        <group key={`${z}-${i}`} position={[x, y, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[w, h, 0.04]} />
            <Mat color="#0e0f14" />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[w - 0.1, h - 0.1]} />
            <meshBasicMaterial map={arts[i]} />
          </mesh>
        </group>
      ))}


      {/* bookshelf (ABOUT) with under-glow */}
      <group
        onClick={(e) => { e.stopPropagation(); onNavigate("about"); }}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
      >
        <group position={[-4.52, 2.42, -2.1]}>
          <mesh visible={false}>
            <boxGeometry args={[0.5, 0.9, 2.4]} />
          </mesh>
          {/* amber light falling straight down the wall from under the shelf */}
          <mesh position={[0.075, -0.6, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[2.3, 0.85]} />
            <meshBasicMaterial ref={shelfGlow} map={tex.shelfWash} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          {/* potted plant (real CC0 model) */}
          <Prop file="plantSmall2" position={[0.08, -0.115, 1.0]} scale={1.1} />
        </group>
      </group>

      {/* desk cluster — the PROJECTS workstation module */}
      <BakedShell lightsOn={lightsOn} />
      <Workstation
        showDesk={false}
        lightsOn={lightsOn}
        monitorInteractive={monitorInteractive}
        monitorScreen={monitorScreen}
        phoneScreen={phoneScreen}
        faceScreen={faceScreen}
        onMonitor={() => onNavigate("projects")}
        onRobot={() => onNavigate("about")}
        phoneInteractive={phoneInteractive}
        onPhone={() => onNavigate("contact")}
      />

      {/* big white dome pendant hanging over the desk */}
      <group position={[0.1, 0, -1.7]}>
        <mesh position={[0, 4.15, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.7, 6]} />
          <Mat color="#111218" />
        </mesh>
        <mesh position={[0, 3.3, 0]} castShadow>
          <sphereGeometry args={[0.52, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e8e6e2" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 3.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.45, 24]} />
          <meshStandardMaterial ref={pendantGlow} color="#fff1d8" emissive="#fff1d8" emissiveIntensity={0.05} side={THREE.DoubleSide} />
        </mesh>
        <pointLight ref={pendantLight} position={[0, 3.05, 0]} color="#ffe9c8" intensity={0} distance={4.5} decay={2} />
      </group>

      {/* pegboard (EXPERIENCE) */}
      <group
        onClick={(e) => { e.stopPropagation(); onNavigate("experience"); }}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
      >
        <Pegboard tex={tex.peg} halo={tex.halo} icons={tex.icons} tag={tex.tag} active={expActive} flipped={expFlipped} onBadge={onBadge} onHover={setPegHot} />
      </group>

      <Cabinet wood={tex.wood} onMusic={() => onNavigate("music")} speakerScreen={speakerScreen} musicScreen={musicScreen} lightsOn={lightsOn} onHover={setSpkHot} />

      {/* the cat, asleep on the pink pouf (bean bag beside it) */}
      <Cat />

      {/* real CC0 props: big plant, cabinet laptop, little desk plant by the phone */}
      <Prop file="pottedPlant" position={[4.3, 0.465, 0.0]} scale={2.0} />
      <Prop file="laptop" position={[3.28, 0.92, -3.45]} rotation={[0, 0.18, 0]} scale={1.3} />
      <Prop file="plantSmall2" position={[0.3, 1.04, -1.0]} scale={1.0} />

      {/* floating diamonds */}
      <Diamond pos={[3.95, 3.82, -3.95]} s={0.1} hot={pegHot} />
      <Diamond pos={[2.8, 1.95, -3.65]} s={0.07} hot={spkHot} />

      {/* hotspot markers (home view only) */}
      {hotspots && (
        <>
          <Hotspot pos={[2.45, 2.0, -4.05]} onClick={() => onNavigate("experience")} />
          <Hotspot pos={[0.29, 2.2, -1.33]} onClick={() => onNavigate("projects")} />
        </>
      )}

      {/* soft ground shadows */}
      <ContactShadows position={[0.4, 0.01, -1.4]} scale={11} blur={2.6} far={3.4} opacity={0.55} resolution={512} color="#05060a" />

      {/* lighting — bright day: strong sky ambience + warm sun through the window */}
      <ambientLight intensity={1.5} color="#dfe6f2" />
      <hemisphereLight args={["#bcd3ee", "#8a7f6e", 0.95]} />
      <directionalLight
        ref={sunRef}
        position={[2.0, 4.6, -6.5]}
        intensity={0.4}
        color="#ffedc8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-bias={-0.0004}
      />
      <pointLight position={[-0.55, 1.5, -1.0]} color={AMBER} intensity={1.3} distance={3.6} decay={2} />
      <pointLight position={[-1.15, 1.95, -1.5]} color="#5c6cff" intensity={1.2} distance={2.6} decay={2} />
      <pointLight position={[3.45, 2.7, -3.3]} color="#cdd5ff" intensity={1.5} distance={3.4} decay={2} />
      <pointLight position={[3.0, 3.0, 4.0]} color="#c7d2ea" intensity={2.4} distance={12} decay={2} />
    </group>
  );
}

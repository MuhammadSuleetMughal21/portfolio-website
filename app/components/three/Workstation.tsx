"use client";

/**
 * Workstation — the "PROJECTS" desk module.
 *
 * A self-contained, procedurally built Three.js group that reproduces the
 * reference still: glowing desk, angled monitor reading PROJECTS, the boxy
 * robot typing on a white mechanical keyboard, pink desk lamp, phone, mouse,
 * notebook, sticky note and the floating pink diamonds.
 *
 * World positions match the ones Experience3D's camera POSES were derived
 * from, so the module can be dropped into Room at the origin unchanged.
 * Every screen (monitor / phone / robot face) is optional: when a React node
 * is passed it is mapped onto the object via drei <Html transform>, otherwise
 * the object renders its "idle" look from the reference image.
 */

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox, Html } from "@react-three/drei";

export const PINK = "#ff8fb8";
export const PINK_HOT = "#ff5c96";
export const PINK_FACE = "#ffb3c7";
export const AMBER = "#ffb257";
export const RIM = "#ffc46a";
const FONT = "/fonts/sora-700.woff";

const WHITE = "#d8d9de";
const INK = "#171821";
const NAVY = "#12132a";

/* ---------------------------------------------------------------- helpers */

function Mat({
  color,
  emissive,
  ei = 0,
  ...rest
}: {
  color?: string;
  emissive?: string;
  ei?: number;
  [k: string]: unknown;
}) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive ?? "#000000"}
      emissiveIntensity={ei}
      roughness={0.85}
      metalness={0.05}
      {...rest}
    />
  );
}

const cursor = (on: boolean) => {
  document.body.style.cursor = on ? "pointer" : "auto";
};

/** Elongated pink octahedron hanging point-down, bobbing like a pendant on a string.
 *  While its object is hovered (`hot`) it swells, spins faster and burns brighter —
 *  the reference's hover cue. */
export function Diamond({ pos, s = 0.09, hot = false }: Readonly<{ pos: [number, number, number]; s?: number; hot?: boolean }>) {
  const g = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const k = useRef(0);
  const phase = pos[0] * 3.7 + pos[2] * 1.3;
  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    if (!g.current) return;
    k.current = THREE.MathUtils.damp(k.current, hot ? 1 : 0, 9, dt);
    const swell = 1 + k.current * 0.45;
    g.current.scale.setScalar(swell);
    g.current.position.y = pos[1] + Math.sin(t * 1.9 + phase) * 0.06 + k.current * 0.03;
    g.current.rotation.y = t * (0.8 + k.current * 2.4) + phase;
    g.current.rotation.z = Math.sin(t * 1.1 + phase) * 0.05;
    if (mat.current) mat.current.emissiveIntensity = 2.2 + k.current * 1.8;
  });
  return (
    <group ref={g} position={pos}>
      <mesh scale={[s, s * 1.6, s]} raycast={() => null}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial ref={mat} color={PINK_HOT} emissive={PINK_HOT} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Thin pink rim that lights up along an object's own edges while hovered. */
export function EdgeLight({
  w,
  h,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = "#ff8fb8",
}: Readonly<{ w: number; h: number; position?: [number, number, number]; rotation?: [number, number, number]; color?: string }>) {
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame(() => {
    const t = performance.now() / 1000;
    const e = 1.25 + Math.sin(t * 2.4) * 0.35;
    mats.current.forEach((m) => { if (m) m.emissiveIntensity = e; });
  });
  const T = 0.013;
  const strips: [number, number, number, number][] = [
    [0, h / 2, w + T, T],
    [0, -h / 2, w + T, T],
    [w / 2, 0, T, h + T],
    [-w / 2, 0, T, h + T],
  ];
  return (
    <group position={position} rotation={rotation}>
      {strips.map(([x, y, sw, sh], i) => (
        <mesh key={i} position={[x, y, 0]} raycast={() => null}>
          <boxGeometry args={[sw, sh, 0.01]} />
          <meshStandardMaterial
            ref={(m) => { mats.current[i] = m; }}
            color={color}
            emissive={color}
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Soft radial glow BEHIND an object, like a backlight rimming its silhouette.
 * The color breathes slowly between pink and blue while visible.
 */
export function BackGlow({
  w = 2,
  h = 2,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  subtle = false,
}: Readonly<{ w?: number; h?: number; position?: [number, number, number]; rotation?: [number, number, number]; subtle?: boolean }>) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(128, 128, 20, 128, 128, 126);
    r.addColorStop(0, "rgba(255,255,255,0.95)");
    r.addColorStop(0.45, "rgba(255,255,255,0.4)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  const pink = useMemo(() => new THREE.Color("#ff8fb8"), []);
  const blue = useMemo(() => new THREE.Color("#8fb0ff"), []);
  useFrame(() => {
    const t = performance.now() / 1000;
    if (!mat.current) return;
    mat.current.opacity = (subtle ? 0.5 : 0.7) + Math.sin(t * 2.0) * 0.12;
    mat.current.color.copy(pink).lerp(blue, (Math.sin(t * 0.8) + 1) / 2);
  });
  return (
    <mesh position={position} rotation={rotation} raycast={() => null}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={mat} map={tex} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ------------------------------------------------------------------- desk */

export function Desk() {
  const rim = [
    [0, 0.86, 3.52, 0],
    [0, -0.86, 3.52, 0],
    [1.76, 0, 1.72, Math.PI / 2],
    [-1.76, 0, 1.72, Math.PI / 2],
  ] as const;
  return (
    <group position={[-0.55, 0, -1.75]}>
      {/* pedestal — lighter grey, gets brighter towards the floor like the render */}
      <RoundedBox args={[3.3, 0.9, 1.56]} radius={0.1} position={[0, 0.47, 0]} castShadow receiveShadow>
        <Mat color="#4b4c59" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[3.32, 0.3, 1.58]} radius={0.1} position={[0, 0.17, 0]}>
        <Mat color="#5c5d6b" roughness={0.9} />
      </RoundedBox>
      {/* top slab — near black with soft rounded corners */}
      <RoundedBox args={[3.56, 0.1, 1.76]} radius={0.05} position={[0, 0.99, 0]} castShadow receiveShadow>
        <Mat color="#101118" roughness={0.6} metalness={0.1} />
      </RoundedBox>
      {/* leather desk mat */}
      <RoundedBox args={[2.75, 0.02, 1.34]} radius={0.03} position={[0.1, 1.045, 0.02]} receiveShadow>
        <Mat color="#3a2a20" roughness={0.98} />
      </RoundedBox>
      {/* continuous amber LED rim under the slab */}
      {rim.map(([x, z, len, ry], i) => (
        <mesh key={i} position={[x, 0.935, z]} rotation={[0, ry, 0]}>
          <boxGeometry args={[len, 0.035, 0.03]} />
          <meshStandardMaterial color={RIM} emissive={RIM} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}
      {/* warm wash the rim throws onto the pedestal */}
      <pointLight position={[0, 0.9, 1.1]} color={RIM} intensity={1.2} distance={2.2} decay={2} />
      <pointLight position={[0, 0.9, -1.1]} color={RIM} intensity={0.7} distance={1.8} decay={2} />
      <pointLight position={[1.8, 0.9, 0]} color={RIM} intensity={0.7} distance={1.8} decay={2} />
      <pointLight position={[-1.8, 0.9, 0]} color={RIM} intensity={0.7} distance={1.8} decay={2} />
    </group>
  );
}

/* ---------------------------------------------------------------- monitor */

export function Monitor({
  screen,
  onClick,
  // like the reference video: the SCREEN faces the robot, the visitor sees
  // the back shell with a pink PROJECTS label on it
  position = [0.285, 1.06, -1.323],
  rotation = [0, Math.PI - 0.22, 0],
  panelRef,
  interactive = false,
  onHover,
}: Readonly<{
  screen?: React.ReactNode;
  onClick?: () => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** DOM screen receives pointer events only while the projects view is open. */
  interactive?: boolean;
  /** Receives the panel mesh, used as an occluder for other DOM screens. */
  panelRef?: React.RefObject<THREE.Mesh>;
  onHover?: (on: boolean) => void;
}>) {
  const tilt = -0.05;
  const root = useRef<THREE.Group>(null);
  const dom = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const toCam = useMemo(() => new THREE.Vector3(), []);
  const origin = useMemo(() => new THREE.Vector3(), []);
  // The DOM screen is drawn over the canvas no matter what is in front of it,
  // so hide it whenever the camera looks at the back of the panel.
  useFrame(({ camera }) => {
    if (!root.current || !dom.current) return;
    root.current.getWorldPosition(origin);
    normal.set(0, 0, 1).applyQuaternion(root.current.getWorldQuaternion(new THREE.Quaternion()));
    toCam.copy(camera.position).sub(origin);
    const facing = normal.dot(toCam) > 0;
    const v = facing ? "visible" : "hidden";
    if (dom.current.style.visibility !== v) dom.current.style.visibility = v;
  });
  return (
    <group
      ref={root}
      position={position}
      rotation={rotation}
      onClick={onClick && ((e) => { e.stopPropagation(); onClick(); })}
      onPointerOver={onClick && (() => { setHover(true); cursor(true); onHover?.(true); })}
      onPointerOut={onClick && (() => { setHover(false); cursor(false); onHover?.(false); })}
    >
      {hover && (
        <Html position={[0, 0.74, -0.1]} center zIndexRange={[20, 0]} pointerEvents="none" style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-white/25 bg-[#10121f]/95 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/90 shadow-[0_0_18px_rgba(255,143,184,0.25)] backdrop-blur">
            Open projects →
          </div>
        </Html>
      )}
      {/* flat rounded foot with a lighter lip */}
      <RoundedBox args={[0.62, 0.035, 0.3]} radius={0.015} position={[0, 0.02, 0.02]} castShadow>
        <Mat color={NAVY} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[0.56, 0.012, 0.24]} radius={0.006} position={[0, 0.042, 0.02]}>
        <Mat color="#3b3d66" roughness={0.5} />
      </RoundedBox>
      {/* neck */}
      <mesh position={[0, 0.28, -0.03]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.5, 0.035]} />
        <Mat color={NAVY} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* panel */}
      <RoundedBox ref={panelRef} args={[1.46, 0.86, 0.05]} radius={0.03} position={[0, 0.74, 0.03]} rotation={[tilt, 0, 0]} castShadow>
        <Mat color="#0d0e1a" roughness={0.45} metalness={0.15} />
      </RoundedBox>
      {/* back of the panel: raised spine, vent slits, small logo plate */}
      <RoundedBox args={[0.9, 0.5, 0.03]} radius={0.02} position={[0, 0.72, -0.01]} rotation={[tilt, 0, 0]}>
        <Mat color="#15172c" roughness={0.5} metalness={0.15} />
      </RoundedBox>
      {[-0.12, -0.06, 0, 0.06, 0.12].map((dy) => (
        <mesh key={dy} position={[0, 0.9 + dy, -0.028]} rotation={[tilt, 0, 0]}>
          <boxGeometry args={[0.5, 0.012, 0.006]} />
          <Mat color="#0a0b16" />
        </mesh>
      ))}
      <mesh position={[0, 0.56, -0.028]} rotation={[tilt, 0, 0]}>
        <circleGeometry args={[0.04, 20]} />
        <meshStandardMaterial color={PINK_HOT} emissive={PINK_HOT} emissiveIntensity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* pink PROJECTS label on the back shell, facing the visitor */}
      <Text
        font={FONT}
        fontSize={0.13}
        letterSpacing={0.24}
        color="#ff9ec4"
        position={[0, 0.74, -0.037]}
        rotation={[tilt, Math.PI, 0]}
        anchorX="center"
        anchorY="middle"
      >
        PROJECTS
        <meshBasicMaterial color="#ff9ec4" toneMapped={false} />
      </Text>
      {/* glass */}
      <mesh position={[0, 0.74, 0.058]} rotation={[tilt, 0, 0]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshStandardMaterial color="#161735" emissive="#1b1d4a" emissiveIntensity={0.9} roughness={1} metalness={0} />
      </mesh>
      {screen ? (
        <Html
          transform
          position={[0, 0.742, 0.072]}
          rotation={[tilt, 0, 0]}
          distanceFactor={400 / 470}
          zIndexRange={[12, 0]}
          pointerEvents={interactive ? "auto" : "none"}
          style={{ pointerEvents: interactive ? "auto" : "none" }}
        >
          <div
            ref={dom}
            style={{ width: 660, height: 378, backfaceVisibility: "hidden" }}
            className="overflow-hidden rounded-[8px] bg-[#0b0c1a] shadow-[0_0_40px_rgba(43,56,117,0.5)]"
          >
            {screen}
          </div>
        </Html>
      ) : (
        <Text
          font={FONT}
          fontSize={0.13}
          letterSpacing={0.22}
          color="#ff9ec4"
          position={[0, 0.76, 0.064]}
          rotation={[tilt, 0, 0]}
          anchorX="center"
          anchorY="middle"
        >
          PROJECTS
          <meshStandardMaterial color="#ff9ec4" emissive="#ff9ec4" emissiveIntensity={0.9} toneMapped={false} />
        </Text>
      )}
      <pointLight position={[0, 0.75, 0.55]} color="#5c6cff" intensity={1.4} distance={2.2} decay={2} />
    </group>
  );
}

/* --------------------------------------------------------------- keyboard */

/** White mechanical keyboard, individual keycaps, 5 rows with a spacebar. */
export function Keyboard({
  position = [0.499, 1.07, -2.279],
  rotation = [0, -0.22, 0],
}: Readonly<{ position?: [number, number, number]; rotation?: [number, number, number] }>) {
  const keys = useMemo(() => {
    const out: { x: number; z: number; w: number }[] = [];
    const pitch = 0.047;
    const size = 0.04;
    const rows = 5;
    const cols = 14;
    const x0 = -((cols - 1) * pitch) / 2;
    const z0 = -((rows - 1) * pitch) / 2;
    for (let r = 0; r < rows; r++) {
      const z = z0 + r * pitch;
      if (r < rows - 1) {
        for (let c = 0; c < cols; c++) out.push({ x: x0 + c * pitch + (r % 2 ? pitch * 0.25 : 0), z, w: size });
        continue;
      }
      // bottom row: 3 modifiers, spacebar, 3 modifiers
      for (let c = 0; c < 3; c++) out.push({ x: x0 + c * pitch, z, w: size });
      out.push({ x: 0, z, w: pitch * 6.4 });
      for (let c = cols - 3; c < cols; c++) out.push({ x: x0 + c * pitch, z, w: size });
    }
    return out;
  }, []);
  return (
    <group position={position} rotation={rotation}>
      {/* back edge raised on a riser, like the reference's tilted deck */}
      <group rotation={[-0.055, 0, 0]}>
        <RoundedBox args={[0.78, 0.055, 0.34]} radius={0.022} position={[0, 0.027, 0]} castShadow receiveShadow>
          <Mat color="#d9d2c0" roughness={0.7} />
        </RoundedBox>
        {/* dark front skirt so the deck reads chunky */}
        <mesh position={[0, 0.016, 0.168]}>
          <boxGeometry args={[0.74, 0.022, 0.012]} />
          <Mat color="#8f897a" roughness={0.8} />
        </mesh>
        {keys.map((k, i) => {
          // flat matte caps; two plain amber accents on the right like the reference
          let cap = "#f2ecdf";
          if (i === 40 || i === 41) cap = "#f0a860";
          else if (i % 7 === 3) cap = "#e7e0cf";
          return (
            <mesh key={i} position={[k.x, 0.066, k.z]} castShadow>
              <boxGeometry args={[k.w, 0.034, 0.041]} />
              <Mat color={cap} roughness={0.55} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** Cream rounded mouse with a button seam and dark scroll wheel, like the reference. */
export function Mouse({
  position = [0.883, 1.07, -2.07],
  rotation = [0, -0.35, 0],
}: Readonly<{ position?: [number, number, number]; rotation?: [number, number, number] }>) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.032, 0]} scale={[0.6, 0.46, 1.18]} castShadow>
        <sphereGeometry args={[0.085, 20, 16]} />
        <Mat color="#ece6d7" roughness={0.5} />
      </mesh>
      {/* button seam across the front half */}
      <mesh position={[0, 0.052, -0.045]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.095, 0.003, 0.003]} />
        <Mat color="#b6b0a0" />
      </mesh>
      <mesh position={[0, 0.066, -0.035]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.014, 12]} />
        <Mat color="#2b2c36" />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ phone */

export function Phone({
  screen,
  onOpen,
  // back-side up beside the LCD; pressing it flips it over and opens contact
  position = [-0.22, 1.075, -1.02],
  rotation = [0, Math.PI - 0.35, 0],
  occlude,
  interactive = false,
  flipped = false,
  onHover,
}: Readonly<{
  screen?: React.ReactNode;
  onOpen?: () => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** DOM screen receives pointer events only while the contact view is open. */
  interactive?: boolean;
  /** False: back (camera island) up. True: flipped over, screen up. */
  flipped?: boolean;
  /** Meshes that hide the DOM screen when they sit between it and the camera. */
  occlude?: React.RefObject<THREE.Object3D>[];
  onHover?: (on: boolean) => void;
}>) {
  const [hover, setHover] = useState(false);
  const flipG = useRef<THREE.Group>(null);
  // painted iPhone-style back: titanium sheen + square camera island + lenses
  const backTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const g = c.getContext("2d")!;
    const body = g.createLinearGradient(0, 0, 256, 512);
    body.addColorStop(0, "#b9bbc4");
    body.addColorStop(0.5, "#a3a5af");
    body.addColorStop(1, "#8f919b");
    g.fillStyle = body;
    g.fillRect(0, 0, 256, 512);
    // soft vertical sheen
    const sheen = g.createLinearGradient(0, 0, 256, 0);
    sheen.addColorStop(0, "rgba(255,255,255,0)");
    sheen.addColorStop(0.3, "rgba(255,255,255,0.18)");
    sheen.addColorStop(0.5, "rgba(255,255,255,0)");
    g.fillStyle = sheen;
    g.fillRect(0, 0, 256, 512);
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    };
    // camera island: rounded square, top-left, with drop shadow
    g.save();
    g.shadowColor = "rgba(0,0,0,0.35)";
    g.shadowBlur = 10;
    g.shadowOffsetY = 4;
    const ig = g.createLinearGradient(18, 18, 138, 138);
    ig.addColorStop(0, "#9ea0aa");
    ig.addColorStop(1, "#7e808a");
    g.fillStyle = ig;
    rr(16, 16, 124, 124, 30);
    g.fill();
    g.restore();
    // three big lenses in the classic triangle
    const lens = (x: number, y: number) => {
      const ring = g.createRadialGradient(x, y, 10, x, y, 24);
      ring.addColorStop(0, "#1a1b22");
      ring.addColorStop(0.72, "#2c2d36");
      ring.addColorStop(0.82, "#babcc6");
      ring.addColorStop(1, "#6e707a");
      g.fillStyle = ring;
      g.beginPath(); g.arc(x, y, 24, 0, 7); g.fill();
      const glass = g.createRadialGradient(x - 5, y - 6, 2, x, y, 15);
      glass.addColorStop(0, "#5a6d96");
      glass.addColorStop(0.45, "#232b45");
      glass.addColorStop(1, "#0c0d16");
      g.fillStyle = glass;
      g.beginPath(); g.arc(x, y, 15, 0, 7); g.fill();
      g.fillStyle = "rgba(255,255,255,0.75)";
      g.beginPath(); g.arc(x - 6, y - 7, 3, 0, 7); g.fill();
      g.fillStyle = "rgba(160,190,255,0.35)";
      g.beginPath(); g.arc(x + 5, y + 6, 4, 0, 7); g.fill();
    };
    lens(50, 50);
    lens(50, 106);
    lens(106, 78);
    // flash + mic
    const fl = g.createRadialGradient(118, 36, 1, 118, 36, 9);
    fl.addColorStop(0, "#fff7dd");
    fl.addColorStop(1, "#c9b98a");
    g.fillStyle = fl;
    g.beginPath(); g.arc(118, 36, 8, 0, 7); g.fill();
    g.fillStyle = "#30323c";
    g.beginPath(); g.arc(118, 118, 4, 0, 7); g.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  useFrame((_, dt) => {
    if (!flipG.current) return;
    flipG.current.rotation.z = THREE.MathUtils.damp(flipG.current.rotation.z, flipped ? 0 : Math.PI, 6, dt);
    // small hop while turning over so it never clips the desk
    const p = 1 - flipG.current.rotation.z / Math.PI;
    flipG.current.position.y = Math.sin(Math.min(1, Math.max(0, p)) * Math.PI) * 0.09;
  });
  return (
    <group position={position} rotation={rotation}>
      {hover && onOpen && (
        <Html position={[0, 0.22, 0]} center zIndexRange={[20, 0]} pointerEvents="none" style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-white/25 bg-[#10121f]/95 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/90 shadow-[0_0_18px_rgba(255,143,184,0.25)] backdrop-blur">
            Contact →
          </div>
        </Html>
      )}
      {/* everything inside flips around the phone's long axis */}
      <group ref={flipG} rotation={[0, 0, Math.PI]}>
        <RoundedBox
          args={[0.24, 0.02, 0.5]}
          radius={0.014}
          castShadow
          onClick={onOpen && ((e) => { e.stopPropagation(); onOpen(); })}
          onPointerOver={onOpen && (() => { setHover(true); cursor(true); onHover?.(true); })}
          onPointerOut={onOpen && (() => { setHover(false); cursor(false); onHover?.(false); })}
        >
          <meshStandardMaterial color="#b4b6bf" metalness={0.6} roughness={0.3} />
        </RoundedBox>
        {/* back face: a painted iPhone back — square 3-lens island, realistic lenses */}
        <mesh position={[0, -0.0104, 0]} rotation={[Math.PI / 2, 0, Math.PI]}>
          <planeGeometry args={[0.228, 0.488]} />
          <meshStandardMaterial map={backTex} metalness={0.3} roughness={0.42} />
        </mesh>
        <mesh position={[0.05, -0.0115, 0.15]} rotation={[Math.PI / 2, 0, 0.3]}>
          <planeGeometry args={[0.07, 0.07]} />
          <meshStandardMaterial color="#ff9ec4" emissive="#ff9ec4" emissiveIntensity={0.25} />
        </mesh>
        {/* front face: the live lock screen, shown once the flip reveals it */}
        {flipped && (
          <Html
            transform
            position={[0, 0.011, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            distanceFactor={0.52}
            zIndexRange={[12, 0]}
            occlude={occlude}
            pointerEvents={interactive ? "auto" : "none"}
            style={{ pointerEvents: interactive ? "auto" : "none" }}
          >
            <div style={{ width: 172, height: 372 }} className="overflow-hidden rounded-[26px] bg-black">
              {screen}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------- lamp */

/** Black articulated desk lamp with a pink shade, pointing down over the desk. */
export function Lamp({
  position = [-1.95, 1.08, -2.1],
  lightsOn = true,
}: Readonly<{ position?: [number, number, number]; lightsOn?: boolean }>) {
  const arm = "#23242c";
  const pink = "#e05a93";
  const glowMat = useRef<THREE.MeshStandardMaterial>(null);
  const shadeMat = useRef<THREE.MeshStandardMaterial>(null);
  const poolMat = useRef<THREE.MeshBasicMaterial>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const t0 = useRef<number | null>(null);
  // the spotlight's aim point on the desk
  const aim = useMemo(() => new THREE.Object3D(), []);
  // soft radial gradient for the pool of light the lamp throws on the desk
  const poolTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    r.addColorStop(0, "rgba(255,221,185,0.85)");
    r.addColorStop(0.45, "rgba(255,205,165,0.38)");
    r.addColorStop(1, "rgba(255,205,165,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useFrame(({ clock }) => {
    if (!lightsOn) { t0.current = null; }
    else t0.current ??= clock.elapsedTime;
    const t = t0.current === null ? 0 : clock.elapsedTime - t0.current;
    const k = Math.min(1, Math.max(0, (t - 1.3) / 0.22));
    const e = k * k * (3 - 2 * k);
    // tiny warm flicker right after ignition, then steady
    const flick = 1 + (e > 0 && e < 1 ? Math.sin(t * 60) * 0.12 : 0);
    if (glowMat.current) glowMat.current.emissiveIntensity = 1.5 * e * flick;
    if (shadeMat.current) shadeMat.current.emissiveIntensity = 0.35 * e;
    if (poolMat.current) poolMat.current.opacity = 0.75 * e;
    if (spot.current) spot.current.intensity = 9 * e * flick;
  });
  return (
    <group position={position}>
      {/* weighted base with a cap and a little switch */}
      <mesh castShadow>
        <cylinderGeometry args={[0.125, 0.15, 0.04, 20]} />
        <meshStandardMaterial color={pink} roughness={0.45} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.028, 0]}>
        <cylinderGeometry args={[0.05, 0.065, 0.025, 14]} />
        <Mat color={arm} roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0.09, 0.032, 0.05]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <Mat color="#0f1014" />
      </mesh>
      {/* spring coils at the foot of the arm */}
      {[0.06, 0.085, 0.11].map((y) => (
        <mesh key={y} position={[0.013, y, 0.004]} rotation={[0.12, 0, -0.18]}>
          <torusGeometry args={[0.028, 0.006, 8, 16]} />
          <Mat color="#3a3b45" metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
      {/* lower arm */}
      <mesh position={[0.07, 0.42, 0.015]} rotation={[0.04, 0, -0.18]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.78, 10]} />
        <Mat color={arm} roughness={0.4} metalness={0.45} />
      </mesh>
      {/* elbow joint with side screws */}
      <mesh position={[0.14, 0.8, 0.03]}>
        <sphereGeometry args={[0.036, 12, 12]} />
        <Mat color={arm} roughness={0.4} metalness={0.45} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[0.14 + sx * 0.037, 0.8, 0.03]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.014, 0.012, 10]} />
          <Mat color="#8c8e99" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* upper arm reaching over the desk */}
      <mesh position={[0.3, 0.86, 0.06]} rotation={[0.12, 0, -1.25]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.42, 10]} />
        <Mat color={arm} roughness={0.4} metalness={0.45} />
      </mesh>
      {/* head joint */}
      <mesh position={[0.49, 0.9, 0.09]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <Mat color={arm} roughness={0.4} metalness={0.45} />
      </mesh>
      {/* pink dome shade, open mouth aimed down at the desk */}
      <group position={[0.52, 0.82, 0.1]} rotation={[0.4, 0, 0.42]}>
        <mesh castShadow>
          <sphereGeometry args={[0.165, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial ref={shadeMat} color={pink} emissive="#ff9ec4" emissiveIntensity={0} side={THREE.DoubleSide} roughness={0.55} metalness={0.1} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.162, 0.011, 10, 28]} />
          <meshStandardMaterial color="#c2457a" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* glowing inner face + visible bulb */}
        <mesh position={[0, -0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.152, 24]} />
          <meshStandardMaterial ref={glowMat} color="#ffe7f1" emissive="#ffe7f1" emissiveIntensity={0} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#fff4d8" emissive="#ffeec2" emissiveIntensity={0.9} />
        </mesh>
      </group>
      {/* focused warm spotlight falling straight onto the desk */}
      <primitive object={aim} position={[0.62, -0.3, 0.19]} />
      <spotLight
        ref={spot}
        target={aim}
        position={[0.52, 0.76, 0.1]}
        color="#ffc9a0"
        intensity={0}
        angle={0.58}
        penumbra={0.9}
        distance={3}
        decay={2}
      />
      {/* warm pool of light on the desk surface, fading out naturally */}
      <mesh position={[0.6, -0.028, 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 28]} />
        <meshBasicMaterial ref={poolMat} map={poolTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ robot */

/** Static toothed gear disc, axis along X — the reference robot's head-side tread pods.
 *  It does NOT rotate: the reference robot's gears never move. */
function SideGear({ position, r = 0.07, phase = 0 }: Readonly<{ position: [number, number, number]; r?: number; phase?: number }>) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, 0.055, 20]} />
        <Mat color="#1d1e26" roughness={0.6} metalness={0.25} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 + phase;
        return (
          <mesh key={i} position={[Math.cos(a) * (r + 0.012), 0, Math.sin(a) * (r + 0.012)]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.03, 0.055, 0.026]} />
            <Mat color="#1d1e26" roughness={0.6} metalness={0.25} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.008, 14]} />
        <Mat color="#565866" roughness={0.4} metalness={0.4} />
      </mesh>
    </group>
  );
}

function Cable() {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      // from the back of the torso, down onto the desk top (robot local y 0 = desk)
      new THREE.Vector3(0.05, 0.3, -0.15),
      new THREE.Vector3(0.14, 0.16, -0.3),
      new THREE.Vector3(0.22, 0.02, -0.34),
      new THREE.Vector3(0.32, 0.0, -0.3),
      new THREE.Vector3(0.42, 0.0, -0.16),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.012, 7, false);
  }, []);
  return (
    <mesh geometry={geo} castShadow>
      <Mat color="#0f1015" roughness={0.6} />
    </mesh>
  );
}

export function Robot({
  onTalk,
  faceScreen,
  position = [0.62, 0.9, -2.82],
  rotation = [0, -0.22, 0],
  onHover,
}: Readonly<{
  onTalk?: () => void;
  faceScreen?: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  onHover?: (on: boolean) => void;
}>) {
  const g = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const face = useRef<THREE.Group>(null);
  const talk = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const hasUI = !!faceScreen;
  const baseY = position[1];

  useFrame(() => {
    const t = performance.now() / 1000;
    // the reference robot sits perfectly still — only hands and eyes move
    if (g.current) g.current.position.y = baseY;
    // hands tap the keys: small alternating drops of each wrist
    if (armL.current) armL.current.position.y = 0.215 + (Math.sin(t * 9) > 0.25 ? -0.016 : 0);
    if (armR.current) armR.current.position.y = 0.215 + (Math.cos(t * 9 + 1.1) > 0.25 ? -0.016 : 0);
    if (eyes.current) eyes.current.scale.y = Math.sin(t * 1.1) > 0.97 ? 0.15 : 1; // blink
    const talking = !!onTalk && !hasUI && Math.floor(t / 4) % 3 === 2;
    if (face.current) face.current.visible = !hasUI && !talking;
    if (talk.current) talk.current.visible = talking;
  });

  return (
    <group
      ref={g}
      position={position}
      scale={1.15}
      rotation={rotation}
      onClick={onTalk && ((e) => { e.stopPropagation(); onTalk(); })}
      onPointerOver={onTalk && (() => { setHover(true); cursor(true); onHover?.(true); })}
      onPointerOut={onTalk && (() => { setHover(false); cursor(false); onHover?.(false); })}
    >
      {hasUI && (
        <Html transform position={[0, 0.78, 0.23]} distanceFactor={0.3636} zIndexRange={[13, 0]} style={{ pointerEvents: "auto" }}>
          <div style={{ width: 440, height: 336 }} className="overflow-hidden rounded-[16px] bg-[#ffb3c7]">
            {faceScreen}
          </div>
        </Html>
      )}
      {hover && (
        <Html position={[0.55, 0.55, 0]} center zIndexRange={[20, 0]} pointerEvents="none" style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-white/25 bg-[#10121f]/95 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/90 shadow-[0_0_18px_rgba(255,143,184,0.25)] backdrop-blur">
            Talk to him →
          </div>
        </Html>
      )}

      {/* pelvis — connects the torso to the chair seat */}
      <mesh position={[0, 0.0, 0]} castShadow>
        <boxGeometry args={[0.3, 0.16, 0.24]} />
        <Mat color={INK} />
      </mesh>
      {/* torso — short cream body: seam line, rivet dots, little pink patch */}
      <RoundedBox args={[0.46, 0.36, 0.3]} radius={0.06} position={[0, 0.3, 0]} castShadow>
        <Mat color="#f2efe7" roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.3, 0.152]}>
        <boxGeometry args={[0.38, 0.01, 0.01]} />
        <Mat color="#d6d1c4" />
      </mesh>
      {[-0.14, 0, 0.14].map((x) => (
        <mesh key={x} position={[x, 0.37, 0.153]}>
          <cylinderGeometry args={[0.01, 0.01, 0.01, 8]} />
          <Mat color="#b9b4a6" metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0.13, 0.21, 0.155]}>
        <boxGeometry args={[0.05, 0.05, 0.01]} />
        <Mat color={PINK} />
      </mesh>
      {/* power cable trailing off the back */}
      <Cable />

      {/* short dark neck */}
      <mesh position={[0, 0.51, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 10]} />
        <Mat color={INK} />
      </mesh>

      {/* head — BIG dark retro-TV box, the robot is mostly head like the reference */}
      <RoundedBox args={[0.58, 0.46, 0.42]} radius={0.08} position={[0, 0.8, 0]} castShadow>
        <Mat color="#22232d" roughness={0.55} />
      </RoundedBox>
      {/* thin wide cream tray-cap overhanging on all sides */}
      <RoundedBox args={[0.78, 0.035, 0.56]} radius={0.015} position={[0, 1.045, 0]} castShadow>
        <Mat color="#efe9dc" roughness={0.6} />
      </RoundedBox>
      {/* static gear-tread pods flanking the head */}
      {([-1, 1] as const).map((s) => (
        <group key={`pod-${s}`}>
          <SideGear position={[s * 0.315, 0.9, -0.02]} r={0.062} phase={0.2} />
          <SideGear position={[s * 0.315, 0.78, -0.02]} r={0.072} phase={0.5} />
          <SideGear position={[s * 0.315, 0.65, -0.02]} r={0.062} phase={0.05} />
        </group>
      ))}
      {/* pink face screen fills most of the front, thin bezel */}
      <RoundedBox args={[0.48, 0.32, 0.02]} radius={0.05} position={[0, 0.78, 0.21]}>
        <meshStandardMaterial color={PINK_FACE} emissive={PINK} emissiveIntensity={0.55} />
      </RoundedBox>
      <group ref={face}>
        <group ref={eyes} position={[0, 0.815, 0.225]}>
          {[-0.105, 0.105].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.09, 0.09, 0.01]} />
              <Mat color={NAVY} />
            </mesh>
          ))}
        </group>
        {/* mouth: the reference's wide flat bar */}
        <RoundedBox args={[0.12, 0.024, 0.01]} radius={0.01} position={[0, 0.705, 0.225]}>
          <Mat color={NAVY} />
        </RoundedBox>
      </group>
      <group ref={talk} visible={false}>
        <Text font={FONT} fontSize={0.08} color={INK} position={[0, 0.78, 0.226]} anchorX="center" anchorY="middle" letterSpacing={0.05}>
          TALK?
        </Text>
      </group>
      {/* antennae: two long thin rods rising off the cap, splayed, tiny ball tips */}
      {([[-0.16, 0.14], [0.1, -0.2]] as const).map(([x, tilt]) => (
        <group key={x}>
          <mesh position={[x, 1.2, 0]} rotation={[0, 0, tilt]}>
            <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
            <Mat color="#2a2b33" />
          </mesh>
          <mesh position={[x - Math.sin(tilt) * 0.16, 1.2 + Math.cos(tilt) * 0.155, 0]}>
            <sphereGeometry args={[0.015, 10, 10]} />
            <meshStandardMaterial color="#2b2c36" emissive={PINK_HOT} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      {/* two dial knobs on the back of the head (visible from the home camera) */}
      {[0.86, 0.73].map((y) => (
        <group key={`dial-${y}`} position={[-0.05, y, -0.215]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.046, 0.046, 0.022, 16]} />
            <Mat color="#43454f" roughness={0.5} metalness={0.25} />
          </mesh>
          <mesh position={[0, 0.018, -0.013]}>
            <boxGeometry args={[0.008, 0.03, 0.006]} />
            <Mat color="#1a1b22" />
          </mesh>
        </group>
      ))}

      {/* arms: tubular segments — shoulder ball → upper arm → elbow → forearm,
          hands spread on the keycaps like the reference */}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <mesh position={[s * 0.25, 0.4, 0]} castShadow>
            <sphereGeometry args={[0.055, 12, 12]} />
            <Mat color={INK} />
          </mesh>
          {/* upper arm: round tube running down and forward to the elbow */}
          <mesh position={[s * 0.225, 0.29, 0.1]} rotation={[0.78, 0, s * 0.16]} castShadow>
            <cylinderGeometry args={[0.034, 0.039, 0.28, 12]} />
            <Mat color={WHITE} roughness={0.65} />
          </mesh>
          <mesh position={[s * 0.2, 0.19, 0.2]}>
            <sphereGeometry args={[0.046, 10, 10]} />
            <Mat color={INK} />
          </mesh>
          {/* forearm: round tube, nearly horizontal toward the keyboard */}
          <mesh position={[s * 0.165, 0.205, 0.32]} rotation={[Math.PI / 2 - 0.1, s * -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.029, 0.033, 0.27, 12]} />
            <Mat color={WHITE} roughness={0.65} />
          </mesh>
          {/* wrist + hand resting on the keys, fingers spread over the caps */}
          <group ref={s < 0 ? armL : armR} position={[s * 0.13, 0.215, 0.44]}>
            <mesh position={[0, 0.004, -0.04]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <Mat color={INK} />
            </mesh>
            <mesh castShadow>
              <boxGeometry args={[0.09, 0.03, 0.08]} />
              <Mat color={WHITE} roughness={0.6} />
            </mesh>
            {[-0.03, -0.01, 0.01, 0.03].map((fx) => (
              <mesh key={fx} position={[fx, -0.008, 0.052]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[0.016, 0.015, 0.055]} />
                <Mat color={WHITE} roughness={0.6} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ chair */

/** Office chair behind the desk — the robot visibly sits on it. */
export function Chair({
  position = [0.62, 0, -2.84],
  rotation = [0, -0.22, 0],
}: Readonly<{ position?: [number, number, number]; rotation?: [number, number, number] }>) {
  const dark = "#1c1d25";
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.34, 0.06, 18]} />
        <Mat color={dark} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.72, 10]} />
        <Mat color="#30323e" roughness={0.45} metalness={0.4} />
      </mesh>
      <RoundedBox args={[0.62, 0.09, 0.58]} radius={0.035} position={[0, 0.78, 0]} castShadow>
        <Mat color={dark} roughness={0.8} />
      </RoundedBox>
      {/* backrest, slightly reclined */}
      <group position={[0, 1.18, -0.3]} rotation={[-0.12, 0, 0]}>
        <RoundedBox args={[0.56, 0.68, 0.07]} radius={0.03} castShadow>
          <Mat color={dark} roughness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0, 0.038]}>
          <boxGeometry args={[0.4, 0.5, 0.01]} />
          <Mat color="#262834" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.3, 0.02]}>
          <boxGeometry args={[0.56, 0.03, 0.03]} />
          <meshStandardMaterial color={PINK_HOT} emissive={PINK_HOT} emissiveIntensity={0.5} />
        </mesh>
      </group>
      <mesh position={[0, 0.88, -0.28]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.36, 8]} />
        <Mat color="#30323e" metalness={0.4} roughness={0.45} />
      </mesh>
    </group>
  );
}

/* --------------------------------------------------------- small props */

export function Notebook({ position = [-1.45, 1.065, -2.2] }: Readonly<{ position?: [number, number, number] }>) {
  return (
    <group position={position} rotation={[0, 0.3, 0]}>
      <RoundedBox args={[0.3, 0.025, 0.4]} radius={0.01} castShadow>
        <Mat color="#2b2d38" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.26, 0.36]} />
        <Mat color="#343644" />
      </mesh>
      <mesh position={[0.2, 0.01, 0.05]} rotation={[0, 0.6, Math.PI / 2]}>
        <cylinderGeometry args={[0.009, 0.009, 0.24, 6]} />
        <Mat color="#1d1e26" />
      </mesh>
    </group>
  );
}

export function StickyNote({ position = [-0.75, 1.06, -1.35] }: Readonly<{ position?: [number, number, number] }>) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0.3]}>
      <planeGeometry args={[0.14, 0.14]} />
      <meshStandardMaterial color="#f0dd62" emissive="#f0dd62" emissiveIntensity={0.25} />
    </mesh>
  );
}

/* ---------------------------------------------------------------- module */

export type WorkstationProps = Readonly<{
  /** Live DOM for the monitor; when omitted it reads "PROJECTS". */
  monitorScreen?: React.ReactNode;
  /** Live DOM for the phone; when omitted the phone lies face-down. */
  phoneScreen?: React.ReactNode;
  /** Live DOM for the robot's face; when omitted it shows eyes + smile. */
  faceScreen?: React.ReactNode;
  onMonitor?: () => void;
  onRobot?: () => void;
  onPhone?: () => void;
  /** Phone links clickable + flipped over (only while contact is open). */
  phoneInteractive?: boolean;
  /** Monitor OS clickable (only while the projects section is open). */
  monitorInteractive?: boolean;
  /** Hide the procedural desk when a baked room shell provides it. */
  showDesk?: boolean;
  /** False while the intro title is up; the lamp ignites when it flips true. */
  lightsOn?: boolean;
  /** Floating pink diamonds (lamp, mouse). Defaults to on. */
  diamonds?: boolean;
}>;

export default function Workstation({
  monitorScreen,
  phoneScreen,
  faceScreen,
  onMonitor,
  onRobot,
  onPhone,
  phoneInteractive = false,
  monitorInteractive = false,
  showDesk = true,
  lightsOn = true,
  diamonds = true,
}: WorkstationProps) {
  const panel = useRef<THREE.Mesh>(null!);
  const [hot, setHot] = useState<"monitor" | "robot" | "phone" | null>(null);
  const mark = (which: "monitor" | "robot" | "phone") => (on: boolean) =>
    setHot((h) => (on ? which : h === which ? null : h));
  return (
    <group name="workstation">
      {showDesk && <Desk />}
      <Monitor screen={monitorScreen} onClick={onMonitor} panelRef={panel} interactive={monitorInteractive} onHover={mark("monitor")} />
      <Keyboard />
      <Mouse />
      <Robot onTalk={onRobot} faceScreen={faceScreen} onHover={mark("robot")} />
      <Chair />
      <Phone screen={phoneScreen} onOpen={onPhone} occlude={[panel]} interactive={phoneInteractive} flipped={phoneInteractive} onHover={mark("phone")} />
      <Notebook />
      <StickyNote />
      {/* extra desk clutter from the reference: sticky, envelope, pencil */}
      <mesh position={[-0.5, 1.062, -2.1]} rotation={[-Math.PI / 2, 0, -0.2]}>
        <planeGeometry args={[0.13, 0.13]} />
        <meshStandardMaterial color="#f0dd62" emissive="#f0dd62" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[-0.95, 1.062, -1.9]} rotation={[-Math.PI / 2, 0, 0.25]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial color="#e9e6df" roughness={0.9} />
      </mesh>
      <mesh position={[-0.68, 1.07, -1.74]} rotation={[0, 0.5, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.2, 6]} />
        <Mat color="#c9a24f" />
      </mesh>
      <Lamp lightsOn={lightsOn} />
      {diamonds && (
        <>
          {/* markers float only over the clickable things */}
          <Diamond pos={[0.285, 2.16, -1.32]} s={0.07} hot={hot === "monitor"} />
          <Diamond pos={[0.62, 2.48, -2.82]} s={0.07} hot={hot === "robot"} />
          <Diamond pos={[-0.22, 1.33, -1.02]} s={0.05} hot={hot === "phone"} />
        </>
      )}
    </group>
  );
}

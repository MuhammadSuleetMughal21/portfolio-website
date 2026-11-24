"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { easing } from "maath";
import { SoftShadows } from "@react-three/drei";
import {
  Apple,
  Smartphone,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Mail,
  Globe,
  Phone as PhoneIcon,
  MessageCircle,
  Camera,
  Download,
  Send,
} from "lucide-react";
import Room, { POSES, BADGES, badgePose, PHONE_UP, type SectionId } from "./Room";
import { Github, Linkedin } from "../BrandIcons";
import { projects, profile, skills, type Project } from "../../data";
import { ambient } from "./audio";

const BORDERS = ["#ff9d5c", "#ff8fb8", "#58d6b4", "#9d8bff", "#ffd166", "#6ec6ff", "#ff8fb8", "#58d6b4", "#ff9d5c"];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const short = (s: string) => slug(s).split("-")[0];

function storeHref(p: Project, platform: "iOS" | "Android") {
  if (platform === "iOS")
    return p.appStore || `https://apps.apple.com/us/search?term=${encodeURIComponent(p.name)}`;
  return p.playStore || `https://play.google.com/store/search?q=${encodeURIComponent(p.name)}&c=apps`;
}

function useClock() {
  const [now, setNow] = useState({ hm: "", date: "" });
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      setNow({ hm, date: `${days[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}` });
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/* ---------------- camera ---------------- */

type Drag = {
  yaw: number; pitch: number; tyaw: number; tpitch: number;
  down: boolean; lx: number; ly: number; vx: number; vy: number; moved: number;
};
type Pose = { p: [number, number, number]; t: [number, number, number] };

function CameraRig({ pose, free, phoneUp, drag }: Readonly<{ pose: Pose; free: boolean; phoneUp: boolean; drag: React.MutableRefObject<Drag> }>) {
  const { camera } = useThree();
  const pos = useMemo(() => new THREE.Vector3(...POSES.intro.p), []);
  const tgt = useMemo(() => new THREE.Vector3(...POSES.intro.t), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    easing.damp3(pos, pose.p, 0.6, dt);
    easing.damp3(tgt, pose.t, 0.6, dt);
    // roll the camera to the phone's orientation during contact so it reads upright
    easing.damp3(up, phoneUp ? PHONE_UP : [0, 1, 0], 0.5, dt);
    camera.up.copy(up).normalize();
    camera.position.copy(pos);

    const d = drag.current;
    d.yaw = THREE.MathUtils.damp(d.yaw, d.tyaw, 5, dt);
    d.pitch = THREE.MathUtils.damp(d.pitch, d.tpitch, 5, dt);
    const freedom = free ? 1 : 0.08;
    const yaw = (d.yaw + state.pointer.x * 0.06) * freedom;
    const pitch = (d.pitch + state.pointer.y * 0.04) * freedom;

    dir.copy(tgt).sub(pos);
    dir.applyAxisAngle(THREE.Object3D.DEFAULT_UP, -yaw);
    const right = new THREE.Vector3().crossVectors(dir, THREE.Object3D.DEFAULT_UP).normalize();
    dir.applyAxisAngle(right, -pitch);
    look.copy(pos).add(dir);
    camera.lookAt(look);
  });
  return null;
}

/* ---------------- on-monitor: OS desktop ---------------- */

function WinChrome({ title }: Readonly<{ title: string }>) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 bg-[#141528] px-2 py-1">
      <span className="truncate font-mono text-[8px] uppercase tracking-widest text-white/70">{title}</span>
      <span className="flex shrink-0 items-center gap-1.5 font-mono text-[9px] text-white/35">
        <span>−</span><span>□</span><span>×</span>
      </span>
    </div>
  );
}

function DesktopOS({ clock }: Readonly<{ clock: { hm: string; date: string } }>) {
  const [tab, setTab] = useState(0);
  const p = projects[Math.max(0, tab)];
  const border = BORDERS[Math.max(0, tab) % BORDERS.length];
  return (
    <div className="flex h-full w-full flex-col bg-[#0b0c1a] text-white">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#11121f] px-2 py-1 font-mono text-[8px]">
        <div className="no-scrollbar flex min-w-0 items-center gap-0.5 overflow-x-auto">
          <button onClick={() => setTab(-1)} className={`shrink-0 rounded px-1.5 py-0.5 ${tab === -1 ? "bg-[#ff8fb8] font-bold text-[#3d0d22]" : "text-white/45"}`}>
            0 all
          </button>
          {projects.map((pr, k) => (
            <button key={pr.name} onClick={() => setTab(k)} className={`shrink-0 rounded px-1.5 py-0.5 ${tab === k ? "bg-[#ff8fb8] font-bold text-[#3d0d22]" : "text-white/45 hover:text-white/85"}`}>
              {k + 1} {short(pr.name)}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-white/55">{clock.date} {clock.hm}</span>
        <span className="hidden shrink-0 gap-1.5 text-white/40 sm:flex"><span>⌁</span><span>♪</span><span>PKT</span></span>
      </div>

      {tab === -1 ? (
        <div className="no-scrollbar grid flex-1 content-start gap-1.5 overflow-y-auto p-2" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <div className="rounded border border-white/10 bg-[#0d0e1a] p-2 font-mono text-[8px] leading-relaxed">
            <p className="text-white/50">suleet@desk ~ % fetch</p>
            <p className="mt-0.5 text-[#ff8fb8]">▌▌ suleet@desk</p>
            <p><span className="text-[#58d6b4]">role</span> <span className="text-white/80">Mobile App Engineer</span></p>
            <p><span className="text-[#58d6b4]">based</span> <span className="text-white/80">Karachi, Pakistan</span></p>
            <p><span className="text-[#58d6b4]">builds</span> <span className="text-white/80">React Native, MERN</span></p>
            <p><span className="text-[#58d6b4]">projects</span> <span className="text-white/80">{projects.length}, click one</span></p>
            <p className="mt-0.5 tracking-widest"><span className="text-[#ff5c96]">■</span><span className="text-[#ffb257]">■</span><span className="text-[#58d6b4]">■</span><span className="text-[#6ec6ff]">■</span><span className="text-[#b08aff]">■</span></p>
          </div>
          {projects.map((pr, k) => (
            <button key={pr.name} onClick={() => setTab(k)} className="rounded border border-white/10 bg-[#11121f] p-2 text-left hover:border-[#ff8fb8]/60">
              <p className="font-mono text-[7px] text-[#ff8fb8]">{String(k + 1).padStart(2, "0")} · {pr.category}</p>
              <p className="mt-0.5 font-display text-[10px] font-bold leading-tight">{pr.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[8px] text-white/50">{pr.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 p-1.5">
          <div className="flex min-h-0 flex-col overflow-hidden rounded border bg-[#0d0e1a]" style={{ borderColor: border }}>
            <WinChrome title={p.name} />
            <div className="no-scrollbar flex-1 overflow-y-auto p-2">
              <h3 className="font-display text-sm font-bold">{p.name}</h3>
              <p className="mt-0.5 text-[9px] leading-snug text-white/65">{p.description}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.screens?.[0] ?? "/dummy/app-1.svg"} alt="" className="mt-1.5 h-24 w-full rounded border border-white/10 object-cover object-top" />
              <p className="mt-1 font-mono text-[7px] text-white/35">placeholder screens — real captures drop in via data.ts</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {p.platforms.includes("iOS") && (
                  <a href={storeHref(p, "iOS")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-white/15 px-1.5 py-1 font-mono text-[7px] uppercase tracking-wider hover:border-[#ff8fb8] hover:text-[#ff8fb8]">
                    <Apple size={8} /> App Store
                  </a>
                )}
                {p.platforms.includes("Android") && (
                  <a href={storeHref(p, "Android")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-white/15 px-1.5 py-1 font-mono text-[7px] uppercase tracking-wider hover:border-[#ff8fb8] hover:text-[#ff8fb8]">
                    <Smartphone size={8} /> Play
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden rounded border border-white/15 bg-[#090a12]">
            <WinChrome title={`terminal · ~/apps/${slug(p.name)}`} />
            <div className="no-scrollbar flex-1 overflow-y-auto p-2 font-mono text-[8.5px] leading-relaxed">
              <p><span className="text-white/35">$ </span><span className="text-[#ff8fb8]">glow README.md</span></p>
              <p className="mt-1.5 font-bold text-[#ff8fb8]">## Why I built it</p>
              <p className="text-white/65">{p.description} Built {p.year}, shipped to production.</p>
              <p className="mt-1.5 font-bold text-[#ff8fb8]">## What it does</p>
              {p.features.map((f) => (
                <p key={f} className="text-white/65">· {f}</p>
              ))}
              <p className="mt-1.5 font-bold text-[#ff8fb8]">## How it&apos;s built</p>
              <p className="text-white/65">{p.tags.join(" · ")} — released on {p.platforms.join(" + ")}.</p>
              <p className="mt-1.5 text-white/35">$ <span className="animate-pulse">▍</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- on-monitor: chat with the robot ---------------- */

function botReply(q: string): string {
  const s = q.toLowerCase();
  if (/project|app|work|portfolio/.test(s))
    return "He's shipped 9 production apps — ITER Travel Planner, FitFindAI, GasUp, Sylenze and more. Open 01 PROJECTS on my screen to browse them.";
  if (/experience|job|tafsol|career/.test(s))
    return "Right now he's at Tafsol Technologies shipping cross-platform apps. Before that: Decotechs and Moziky. Flip the badges in 02 EXPERIENCE.";
  if (/skill|stack|react|tech/.test(s))
    return "React Native, React, Redux, Firebase, Node, Express, MongoDB — the full mobile + MERN stack. Check the poster in 03 ABOUT.";
  if (/contact|email|hire|reach|cv|resume/.test(s))
    return `Email him at ${profile.email} — or tap 04 CONTACT and his phone will light up.`;
  if (/hi|hello|hey|salam/.test(s))
    return "Salam! I'm his desk robot. Ask me about his apps, experience, skills, or how to reach him.";
  if (/you|robot|who/.test(s))
    return "I'm the studio robot — I type the boring parts so he can design the fun parts. Beep.";
  return "Beep-boop. Try asking about his 'apps', 'experience', 'skills' or 'contact'.";
}

function FaceChat({ initialTab }: Readonly<{ initialTab: "chat" | "about" }>) {
  const [tab, setTab] = useState<"chat" | "about">(initialTab);
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: "Hey, I'm Suleet's AI — the one that doesn't sleep. Ask me anything about him, and if you want the real Suleet, check his phone." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMsgs((m) => [...m, { me: true, text: q }]);
    ambient.blip();
    setTimeout(() => setMsgs((m) => [...m, { me: false, text: botReply(q) }]), 650);
  };

  const dark = "#1a1b22";
  return (
    <div className="flex h-full w-full flex-col px-4 pb-3 pt-2" style={{ color: dark }}>
      {/* the robot's eyes stay on screen */}
      <div className="flex justify-center gap-7 pt-1">
        <span className="h-7 w-3.5 rounded-[3px]" style={{ background: dark }} />
        <span className="h-7 w-3.5 rounded-[3px]" style={{ background: dark }} />
      </div>
      {/* tabs */}
      <div className="mt-2 flex justify-center gap-2">
        <button
          onClick={() => setTab("chat")}
          className={`rounded-full px-4 py-1 font-mono text-[10px] font-bold tracking-widest ${tab === "chat" ? "bg-[#1a1b22] text-[#ffb3c7]" : "border border-[#1a1b22]/60"}`}
        >
          CHAT
        </button>
        <button
          onClick={() => setTab("about")}
          className={`rounded-full px-4 py-1 font-mono text-[10px] font-bold tracking-widest ${tab === "about" ? "bg-[#1a1b22] text-[#ffb3c7]" : "border border-[#1a1b22]/60"}`}
        >
          ABOUT
        </button>
      </div>

      {tab === "chat" ? (
        <>
          <div className="no-scrollbar mt-2 flex flex-1 flex-col justify-end space-y-1.5 overflow-y-auto">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[88%] rounded-xl px-2.5 py-1.5 text-[11px] leading-snug ${m.me ? "bg-[#1a1b22] text-[#ffd3e0]" : "bg-[#ffd9e4]"}`}>
                  {m.text}
                </p>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="mt-2 flex gap-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message"
              className="min-w-0 flex-1 rounded-md border-2 border-[#1a1b22] bg-[#141528] px-2.5 py-1.5 font-sans text-[11px] text-white outline-none placeholder:text-white/45"
            />
            <button onClick={send} className="rounded-md bg-[#f6f3ec] px-3.5 font-display text-[11px] font-bold active:scale-95" style={{ color: dark }}>
              Send
            </button>
          </div>
        </>
      ) : (
        <div className="no-scrollbar mt-2 flex-1 overflow-y-auto pr-1">
          <p className="font-display text-[13px] font-bold">Muhammad Suleet</p>
          <p className="mt-1 text-[10px] leading-relaxed opacity-90">{profile.summary}</p>
          <div className="mt-2 space-y-1 font-mono text-[9px]">
            {skills.slice(0, 6).map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-2">
                <span className="truncate">{s.name}</span>
                <span className="shrink-0 tracking-[1.5px]">
                  {"▰".repeat(Math.round(s.level / 12))}
                  <span className="opacity-25">{"▱".repeat(8 - Math.round(s.level / 12))}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-widest opacity-60">
            B.E. Software Engineering · SSUET · Karachi
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------- on-phone: lock screen ---------------- */

function PhoneScreen({ clock, live }: Readonly<{ clock: { hm: string; date: string }; live: boolean }>) {
  const A = live ? "a" : "div";
  return (
    <div className="no-scrollbar flex h-full w-full flex-col overflow-y-auto bg-[#07070e] px-3 pb-3 pt-1.5 text-white">
      <div className="flex items-center justify-between font-mono text-[6px] text-white/45">
        <span>{clock.hm}</span>
        <span className="h-1.5 w-8 rounded-full bg-black ring-1 ring-white/15" />
        <span>▰ ⌁ ▮</span>
      </div>
      <p className="mt-2 text-center font-mono text-[26px] font-bold tracking-[0.1em]" style={{ textShadow: "0 0 10px rgba(255,143,184,0.4)" }}>
        {clock.hm}
      </p>
      <p className="text-center font-mono text-[6px] tracking-[0.2em] text-white/50">
        <span className="text-[#ff5c96]">●</span> {clock.date} · KARACHI
      </p>
      <p className="mt-2 text-center font-mono text-[10px]">{profile.name}</p>
      <p className="text-center font-mono text-[6px] text-white/45">Mobile App Developer · Karachi</p>
      <A {...(live ? { href: `mailto:${profile.email}` } : {})} className="mt-2 block rounded-lg bg-white/[0.07] p-1.5">
        <span className="flex items-center gap-1 font-mono text-[6px] text-white/55"><Mail size={6} /> email</span>
        <span className="mt-0.5 block break-all font-mono text-[7px] text-white/90">{profile.email}</span>
      </A>
      <div className="mt-1 grid grid-cols-2 gap-1">
        <A {...(live ? { href: profile.github, target: "_blank", rel: "noopener noreferrer" } : {})} className="rounded-lg bg-white/[0.07] p-1.5">
          <span className="flex items-center gap-1 font-mono text-[6px] text-white/55"><Github size={6} /> github</span>
          <span className="mt-0.5 block truncate font-mono text-[7px] text-white/90">SuleetMughal21</span>
        </A>
        <A {...(live ? { href: profile.linkedin, target: "_blank", rel: "noopener noreferrer" } : {})} className="rounded-lg bg-white/[0.07] p-1.5">
          <span className="flex items-center gap-1 font-mono text-[6px] text-white/55"><Linkedin size={6} /> linkedin</span>
          <span className="mt-0.5 block truncate font-mono text-[7px] text-white/90">suleet-mughal</span>
        </A>
      </div>
      <A {...(live ? { href: `tel:${profile.phone.replace(/\s/g, "")}` } : {})} className="mt-1 block rounded-lg bg-white/[0.07] p-1.5">
        <span className="flex items-center gap-1 font-mono text-[6px] text-white/55"><PhoneIcon size={6} /> phone</span>
        <span className="mt-0.5 block font-mono text-[7px] text-white/90">{profile.phone}</span>
      </A>
      <A
        {...(live ? { href: `mailto:${profile.email}?subject=${encodeURIComponent("CV request — " + profile.name)}` } : {})}
        className="mt-1 flex items-center justify-between rounded-lg bg-[#ff9cc0] p-1.5 text-[#3d0d22]"
      >
        <span>
          <span className="block font-mono text-[7px] font-bold">cv.pdf</span>
          <span className="block font-mono text-[6px] opacity-75">Request my resume</span>
        </span>
        <span className="grid h-4 w-4 place-items-center rounded-full bg-[#3d0d22] text-[#ff9cc0]"><Download size={7} /></span>
      </A>
      <div className="mt-auto flex justify-center gap-3 pt-2 text-white/40">
        <PhoneIcon size={8} /><MessageCircle size={8} /><Globe size={8} /><Camera size={8} />
      </div>
      <div className="mx-auto mt-1 h-0.5 w-10 rounded-full bg-white/25" />
    </div>
  );
}

/* ---------------- on-speaker + on-wall ---------------- */

function SpeakerNow({ muted }: Readonly<{ muted: boolean }>) {
  return (
    <div className="flex h-full w-full items-center gap-1.5 bg-[#0a0b08] px-1.5 text-white">
      <div className="flex h-6 items-end gap-[2px]">
        {[3, 5, 4, 6, 3].map((h, i) => (
          <span key={i} className={`w-[3px] rounded-sm bg-[#35e07c] ${muted ? "" : "animate-pulse"}`} style={{ height: muted ? 3 : h * 3, animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
      <div className="min-w-0">
        <p className="truncate font-mono text-[8px] font-bold text-white/90">Ambient Pad — A minor</p>
        <p className="font-mono text-[6px] text-[#35e07c]">{muted ? "PAUSED · tap speaker" : "PLAYING · WebAudio"}</p>
      </div>
    </div>
  );
}

function NowPlayingCard({ muted }: Readonly<{ muted: boolean }>) {
  return (
    <div className="flex h-full w-full items-center gap-5 border border-white/10 bg-[#0d0e16]/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
      <div className="grid h-[170px] w-[170px] shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#2b1a4a] via-[#7a3f68] to-[#ffb257]">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-black/40 font-display text-2xl font-bold text-white">
          ♪
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[#35e07c]">
          {muted ? "Paused · tap to resume" : "Playing · live synth"}
        </p>
        <p className="mt-2 font-display text-[30px] font-bold leading-tight text-white">Ambient Pad — Room Mix</p>
        <p className="mt-1 text-[17px] text-white/60">Muhammad Suleet · WebAudio engine</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="font-mono text-[12px] text-[#ff8fb8] underline underline-offset-4">Built into this room</span>
          <span className="text-white/50">🔊</span>
          <span className="relative h-[5px] w-28 rounded bg-white/15">
            <span className="absolute left-0 top-0 h-full w-1/3 rounded bg-white/70" />
            <span className="absolute left-1/3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* fades the whole frame's exposure: dim behind the title, bright afterwards */
function Exposure({ target }: Readonly<{ target: number }>) {
  useFrame((state, dt) => {
    state.gl.toneMappingExposure = THREE.MathUtils.damp(state.gl.toneMappingExposure, target, 1.8, dt);
  });
  return null;
}

/* a pink ring that follows the mouse; swells whenever something is hoverable */
function CursorRing() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = -100;
    let y = -100;
    const mm = (e: MouseEvent) => { x = e.clientX; y = e.clientY; };
    window.addEventListener("mousemove", mm);
    let raf = 0;
    const loop = () => {
      const hov = document.body.style.cursor === "pointer";
      el.style.transform = "translate(" + (x - 14) + "px," + (y - 14) + "px) scale(" + (hov ? 1.6 : 1) + ")";
      el.style.borderColor = hov ? "rgba(255,92,150,0.9)" : "rgba(255,143,184,0.55)";
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", mm); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-[70] hidden h-7 w-7 rounded-full border transition-[border-color] duration-150 sm:block"
      style={{ transform: "translate(-100px,-100px)" }}
    >
      <span className="absolute left-1/2 top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff8fb8]" />
    </div>
  );
}

/* ---------------- root ---------------- */

const NAV: { id: SectionId; label: string }[] = [
  { id: "projects", label: "PROJECTS" },
  { id: "experience", label: "EXPERIENCE" },
  { id: "about", label: "ABOUT" },
  { id: "contact", label: "CONTACT" },
];

export default function Experience3D({
  sound,
  onFlat,
}: Readonly<{ sound: boolean; onFlat: () => void }>) {
  const [section, setSection] = useState<SectionId>("intro");
  const [muted, setMuted] = useState(!sound);
  const [showTitle, setShowTitle] = useState(true);
  const [expIdx, setExpIdx] = useState(0);
  const [expFlipped, setExpFlipped] = useState(false);
  const drag = useRef<Drag>({ yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, down: false, lx: 0, ly: 0, vx: 0, vy: 0, moved: 0 });
  const clock = useClock();

  useEffect(() => {
    const t = setTimeout(() => setSection("home"), 1150);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setShowTitle(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const pose: Pose = useMemo(() => {
    if (section === "experience") return badgePose(expIdx);
    return POSES[section];
  }, [section, expIdx]);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    if (!next) ambient.start();
    ambient.setMuted(next);
  };

  const navigate = (s: SectionId) => {
    if (drag.current.moved > 8) return; // it was a drag, not a click
    ambient.blip();
    setShowTitle(false);
    if (s === "experience") setExpFlipped(false);
    if (s === "music" && section === "music") { toggleSound(); return; }
    setSection(s);
    try {
      history.replaceState(null, "", s === "home" ? window.location.pathname : `#${s}`);
    } catch { /* ignore */ }
  };

  const onBadge = (i: number) => {
    if (drag.current.moved > 8) return;
    ambient.blip();
    if (section !== "experience") {
      setExpIdx(i);
      setExpFlipped(false);
      navigate("experience");
    } else if (i === expIdx) {
      setExpFlipped((f) => !f);
    } else {
      setExpIdx(i);
      setExpFlipped(false);
    }
  };

  const onDown = (e: React.PointerEvent) => {
    const d = drag.current;
    d.down = true; d.lx = e.clientX; d.ly = e.clientY; d.vx = 0; d.vy = 0; d.moved = 0;
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.lx;
    const dy = e.clientY - d.ly;
    d.moved += Math.abs(dx) + Math.abs(dy);
    if (section !== "home") { d.lx = e.clientX; d.ly = e.clientY; return; }
    d.tyaw = THREE.MathUtils.clamp(d.tyaw + dx * 0.0032, -0.9, 0.9);
    d.tpitch = THREE.MathUtils.clamp(d.tpitch + dy * 0.0022, -0.38, 0.38);
    d.vx = dx; d.vy = dy; d.lx = e.clientX; d.ly = e.clientY;
  };
  const onUp = () => {
    const d = drag.current;
    if (d.down && section === "home") {
      d.tyaw = THREE.MathUtils.clamp(d.tyaw + d.vx * 0.02, -0.9, 0.9);
      d.tpitch = THREE.MathUtils.clamp(d.tpitch + d.vy * 0.012, -0.38, 0.38);
    }
    d.down = false;
  };

  const hudVisible = section !== "intro";

  /* in-scene screen contents */
  const faceScreen =
    section === "talk" || section === "about" ? (
      <FaceChat key={section} initialTab={section === "about" ? "about" : "chat"} />
    ) : null;

  const monitorScreen =
    section === "projects" ? (
      <DesktopOS clock={clock} />
    ) : (
      <button
        onClick={() => navigate("projects")}
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#161b3a] to-[#0d1026] text-white"
      >
        <span className="font-display text-4xl font-bold tracking-[0.35em] text-[#ff8fb8]" style={{ textShadow: "0 0 24px rgba(255,143,184,0.5)" }}>
          PROJECTS
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">{clock.date} · {clock.hm} · click to open</span>
      </button>
    );

  return (
    <div
      className="fixed inset-0 touch-none select-none bg-[#0a0a14] text-white"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <Canvas shadows camera={{ fov: 42, position: POSES.intro.p }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <color attach="background" args={["#0b0c16"]} />
        <fog attach="fog" args={["#0b0c16", 18, 40]} />
        <SoftShadows size={14} samples={10} focus={0.55} />
        <Exposure target={(section === "home" || section === "intro") && showTitle ? 0.8 : 1.5} />
        <CameraRig pose={pose} free={section === "home"} phoneUp={section === "contact"} drag={drag} />
        <Suspense fallback={null}>
        <Room
          lightsOn={!((section === "home" || section === "intro") && showTitle)}
          onNavigate={navigate}
          expActive={expIdx}
          expFlipped={expFlipped}
          onBadge={onBadge}
          hotspots={section === "home"}
          phoneInteractive={section === "contact"}
          monitorInteractive={section === "projects"}
          monitorScreen={monitorScreen}
          phoneScreen={<PhoneScreen clock={clock} live={section === "contact"} />}
          speakerScreen={<SpeakerNow muted={muted} />}
          musicScreen={section === "music" ? <NowPlayingCard muted={muted} /> : null}
          faceScreen={faceScreen}
        />
        </Suspense>
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.5} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette darkness={0.42} offset={0.22} />
        </EffectComposer>
      </Canvas>

      {/* dim veil behind the big title — the room is untouchable until it clears */}
      <div
        className={`fixed inset-0 z-10 bg-[#05060c]/55 transition-opacity duration-1000 ${
          (section === "home" || section === "intro") && showTitle ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* chromatic big title */}
      <div
        className={`pointer-events-none fixed inset-x-0 top-[28%] z-20 flex justify-center px-4 transition-all duration-1000 ${
          (section === "home" || section === "intro") && showTitle ? "opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <h1
          className="animate-title-smear text-center font-display text-[clamp(2.4rem,8vw,6.5rem)] font-bold uppercase leading-none tracking-tight text-[#f2ede4]"
          style={{ textShadow: "3px 0 0 rgba(255,60,120,0.45), -3px 0 0 rgba(80,210,255,0.35)" }}
        >
          Muhammad Suleet
        </h1>
      </div>
      <div
        className={`pointer-events-none fixed inset-x-0 top-[28%] z-20 mt-[clamp(3rem,9vw,7.5rem)] flex justify-center transition-all delay-150 duration-1000 ${
          (section === "home" || section === "intro") && showTitle ? "opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <p className="animate-sub-rise font-mono text-[clamp(0.8rem,1.6vw,1.15rem)] tracking-wide text-white/85">
          I build apps that ship.<span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-[#ff8fb8]" />
        </p>
      </div>

      {/* identity bottom-left */}
      <div className={`pointer-events-none fixed bottom-5 left-5 z-20 transition-opacity duration-700 sm:bottom-7 sm:left-8 ${hudVisible ? "opacity-100" : "opacity-0"}`}>
        <p className="font-display text-sm font-bold uppercase tracking-wider text-white/90">{profile.name}</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-[#ff8fb8]">
          ● Mobile App Developer · {profile.location.split(",")[0]}
        </p>
      </div>

      {/* top-right controls */}
      <CursorRing />
      <div className={`fixed right-5 top-5 z-30 flex items-center gap-2 transition-opacity duration-700 ${hudVisible ? "opacity-100" : "opacity-0"}`}>
        <button onClick={toggleSound} aria-label="Toggle sound"
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-[#0d0d1f]/80 backdrop-blur transition-colors hover:border-white/40 active:scale-90">
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <button onClick={onFlat}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#0d0d1f]/80 px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-colors hover:border-white/40 active:scale-95">
          <LayoutTemplate size={13} /> Flat
        </button>
      </div>

      {/* back to the room */}
      <button
        onClick={() => navigate("home")}
        className={`fixed left-5 top-5 z-30 rounded-xl border border-white/15 bg-[#0d0d1f]/80 px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest backdrop-blur transition-all hover:border-[#ff8fb8] hover:text-[#ff8fb8] active:scale-95 ${
          section === "home" || section === "intro" ? "pointer-events-none -translate-y-2 opacity-0" : "opacity-100"
        }`}
      >
        ◀ Back to the room
      </button>

      {/* drag hint */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center transition-opacity duration-500 ${
          section === "home" && !showTitle ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0d1f]/80 px-5 py-3 backdrop-blur">
          <span className="font-mono text-white/40">‹</span>
          <span className="relative block h-5 w-3.5 rounded-full border border-white/50">
            <span className="absolute left-1/2 top-1 h-1.5 w-[3px] -translate-x-1/2 animate-bounce rounded-full bg-[#ff8fb8]" />
          </span>
          <span className="font-mono text-white/40">›</span>
          <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/70">Drag to look around</span>
        </div>
      </div>

      {/* experience pager */}
      <div
        className={`fixed inset-x-0 bottom-[4.6rem] z-30 flex justify-center gap-2 transition-opacity duration-500 ${
          section === "experience" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          onClick={() => { setExpFlipped(false); setExpIdx((i) => Math.max(0, i - 1)); ambient.blip(); }}
          aria-label="Previous badge"
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-[#0d0d1f]/85 backdrop-blur hover:border-[#ff8fb8] active:scale-90"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="grid min-w-[5.5rem] place-items-center rounded-xl border border-white/15 bg-[#0d0d1f]/85 px-4 font-mono text-[11px] tracking-[0.2em] text-white/80 backdrop-blur">
          {String(expIdx + 1).padStart(2, "0")} / {String(BADGES.length).padStart(2, "0")}
        </span>
        <button
          onClick={() => { setExpFlipped(false); setExpIdx((i) => Math.min(BADGES.length - 1, i + 1)); ambient.blip(); }}
          aria-label="Next badge"
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-[#0d0d1f]/85 backdrop-blur hover:border-[#ff8fb8] active:scale-90"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* bottom nav pill */}
      <nav className={`fixed inset-x-0 bottom-5 z-30 flex justify-center px-3 transition-opacity duration-700 ${hudVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#0d0d1f]/85 px-2 py-1.5 backdrop-blur">
          {NAV.map((n, k) => {
            const active = section === n.id || (n.id === "about" && section === "talk");
            return (
            <button
              key={n.id}
              onClick={() => navigate(active ? "home" : n.id)}
              className={`shrink-0 rounded-xl px-3.5 py-2 font-mono text-[11px] tracking-[0.2em] transition-colors ${
                active ? "bg-[#ff9cc0] font-bold text-[#3d0d22]" : "text-white/60 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,143,184,0.9)]"
              }`}
            >
              <span className={`mr-1.5 ${active ? "text-[#3d0d22]/70" : "text-[#ff8fb8]/70"}`}>0{k + 1}</span>
              {n.label}
            </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

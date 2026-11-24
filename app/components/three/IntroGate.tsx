"use client";

/**
 * Intro loader styled after the reference site: a terminal "training" an AI
 * model of the room — animated loss curve, epoch log, step counter and a
 * dotted progress bar — then the enter buttons.
 */

import { useEffect, useMemo, useRef, useState } from "react";

const EPOCHS = [
  { loss: "1.541", acc: "0.59" },
  { loss: "0.896", acc: "0.74" },
  { loss: "0.532", acc: "0.83" },
  { loss: "0.348", acc: "0.89" },
  { loss: "0.243", acc: "0.92" },
  { loss: "0.174", acc: "0.94" },
];
const TOTAL_MS = 6200;
const STEPS = 6000;

export default function IntroGate({
  capable,
  onEnter,
}: Readonly<{
  capable: boolean | null;
  onEnter: (withSound: boolean) => void;
}>) {
  const [p, setP] = useState(0); // 0..1
  const [leaving, setLeaving] = useState(false);
  const start = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      start.current ??= now;
      const v = Math.min(1, (now - start.current) / TOTAL_MS);
      setP(v);
      if (v < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const done = p >= 1;
  const epochsShown = Math.floor(p * (EPOCHS.length + 1));
  const step = Math.min(STEPS, Math.round(p * STEPS));
  const loss = (2.59 * Math.pow(1 - p, 1.6) + 0.174 * p).toFixed(3);
  const tokS = done ? "0.0" : (10.5 + Math.sin(p * 31) * 3.2).toFixed(1);
  const gpu = done ? 0 : Math.round(88 + Math.sin(p * 23) * 8);
  const phase = p < 0.08 ? "BOOTING" : done ? "CONVERGED" : "TRAINING";
  const cells = 34;
  const filled = Math.round(p * cells);

  // loss curve polyline: drops fast, long flat tail, gentle wobble like a real run
  const pts = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i <= 72; i++) {
      const x = i / 72;
      const base = 16 + 100 * (1 - Math.pow(1 - x, 1.9));
      const wobble = Math.sin(x * 9.2) * 3.2 * (1 - x) + Math.sin(x * 23) * 1.1 * (1 - x);
      out.push([x * 720, base + wobble]);
    }
    return out;
  }, []);
  const shown = pts.slice(0, Math.max(2, Math.ceil(p * pts.length)));

  const enter = (withSound: boolean) => {
    setLeaving(true);
    setTimeout(() => onEnter(withSound), 450);
  };

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center bg-[#0c0d15] px-6 transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* faint CRT scanlines across the whole screen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 1px, transparent 1px, transparent 3px)" }}
      />
      <div className="relative w-full max-w-[700px] font-mono text-[12px] leading-relaxed text-white/80 sm:text-[13px]">
        <p>
          <span className="text-white/40">$</span> python train.py{" "}
          <span className="text-white/60">--model</span> <span className="text-[#ff8fb8]">suleet-1</span>{" "}
          <span className="text-white/60">--data</span> ./room
        </p>

        {/* loss curve: full-width with faint gridlines and a white endpoint */}
        <svg viewBox="0 0 720 150" preserveAspectRatio="none" className="mt-5 h-[118px] w-full">
          {[30, 62, 94, 126].map((gy) => (
            <line key={gy} x1="0" y1={gy} x2="720" y2={gy} stroke="rgba(255,255,255,0.055)" strokeWidth="1" />
          ))}
          <polyline
            points={shown.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
            fill="none"
            stroke="#f6a2c3"
            strokeWidth="2.5"
            style={{ filter: "drop-shadow(0 0 4px rgba(246,162,195,0.45))" }}
          />
          <circle cx={shown[shown.length - 1][0]} cy={shown[shown.length - 1][1]} r="3.5" fill="#ffffff" />
        </svg>
        <div className="mt-2 flex justify-between text-[11px] tracking-[0.08em] text-white/45 sm:text-[12px]">
          <span>loss</span>
          <span className="text-white/75">{loss}</span>
        </div>

        {/* epoch log */}
        <div className="mt-5 min-h-[10em] leading-[1.85]">
          {epochsShown > 0 && (
            <p>
              <span className="text-white/35">[</span>
              <span className="whitespace-pre text-[#4ade80]">  OK  </span>
              <span className="text-white/35">]</span>
              <span className="whitespace-pre">  </span>
              <span className="text-white/65">dataset: the room, the desk, his apps (14 shards)</span>
            </p>
          )}
          {EPOCHS.slice(0, Math.max(0, epochsShown - 1)).map((e, i, arr) => (
            <p key={e.loss}>
              <span className="text-white/35">[</span>
              <span className="whitespace-pre text-[#4ade80]">  OK  </span>
              <span className="text-white/35">]</span>
              <span className="whitespace-pre">  </span>
              epoch {i + 1}/6 loss {e.loss} acc {e.acc} val ✓
              {!done && i === arr.length - 1 && (
                <span className="ml-2 inline-block h-[1em] w-[0.5em] translate-y-[0.2em] animate-pulse bg-[#ff8fb8]" />
              )}
            </p>
          ))}
          {done && (
            <p>
              <span className="text-white/35">[</span>
              <span className="whitespace-pre text-[#ff8fb8]"> RUN  </span>
              <span className="text-white/35">]</span>
              <span className="whitespace-pre">  </span>
              deploying suleet-1 to his screen
              <span className="ml-2 inline-block h-[1em] w-[0.5em] translate-y-[0.2em] animate-pulse bg-[#ff8fb8]" />
            </p>
          )}
        </div>

        <p className="mt-4 tracking-[0.06em] text-white/40">
          step {step}/{STEPS} · {tokS}k tok/s · gpu {gpu}%
        </p>

        {/* phase + square progress bar */}
        <div className="mt-5 flex items-center justify-between">
          <span className={`text-[11px] font-bold tracking-[0.35em] ${done ? "text-[#ff8fb8]" : "text-[#ff8fb8]/85"}`}>
            {phase}
          </span>
          <span className="text-[11px] tracking-[0.12em] text-white/65">{Math.round(p * 100)}%</span>
        </div>
        <div className="mt-2.5 flex justify-between">
          {Array.from({ length: cells }).map((_, i) => (
            <span
              key={i}
              className={`h-[11px] w-[11px] rounded-[2px] ${i < filled ? "bg-[#f6a2c3] shadow-[0_0_7px_rgba(246,162,195,0.5)]" : "bg-white/[0.08]"}`}
            />
          ))}
        </div>

        {/* enter buttons */}
        <div
          className={`mt-7 grid grid-cols-1 gap-3.5 transition-opacity duration-700 sm:grid-cols-2 ${
            done ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {capable !== false ? (
            <>
              <button
                onClick={() => enter(true)}
                className="rounded-2xl border-2 border-[#f78ab2] bg-[#f6a8c6] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[#3d0d22] transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                Enter with sound
              </button>
              <button
                onClick={() => enter(false)}
                className="rounded-2xl border-2 border-[#ff8fb8]/75 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white shadow-[0_0_14px_rgba(255,143,184,0.12)] transition-colors hover:border-[#ff8fb8] active:scale-95"
              >
                Enter without
              </button>
            </>
          ) : (
            <button
              onClick={() => enter(false)}
              className="rounded-2xl border-2 border-[#f78ab2] bg-[#f6a8c6] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[#3d0d22] sm:col-span-2"
            >
              Enter · flat version
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

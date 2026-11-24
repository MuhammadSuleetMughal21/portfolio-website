"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import IntroGate from "./IntroGate";
import FlatSite from "./FlatSite";
import { ambient } from "./audio";

const Experience3D = dynamic(() => import("./Experience3D"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-[#070a14]">
      <p className="font-mono text-xs uppercase tracking-[0.4em] text-white/40">
        Loading experience…
      </p>
    </div>
  ),
});

function detectCapable(): boolean {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return false;
    if (window.innerWidth < 768) return false;
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function PortfolioApp() {
  const [mode, setMode] = useState<"gate" | "three" | "flat">("gate");
  const [capable, setCapable] = useState<boolean | null>(null);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    setCapable(detectCapable());
  }, []);

  const enter = (withSound: boolean) => {
    if (capable) {
      setSound(withSound);
      if (withSound) ambient.start();
      setMode("three");
    } else {
      setMode("flat");
    }
  };

  if (mode === "gate") return <IntroGate capable={capable} onEnter={enter} />;
  if (mode === "three")
    return (
      <Experience3D
        sound={sound}
        onFlat={() => {
          ambient.setMuted(true);
          setMode("flat");
        }}
      />
    );
  return <FlatSite />;
}

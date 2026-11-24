"use client";

import { useRef } from "react";

export default function GlowCard({
  children,
  className = "",
  contentClassName = "",
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}>) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`glow-card transition-[transform,border-color] duration-300 hover:-translate-y-1 active:scale-[0.98] ${className}`}
    >
      <div className={`glow-content ${contentClassName}`}>{children}</div>
    </div>
  );
}

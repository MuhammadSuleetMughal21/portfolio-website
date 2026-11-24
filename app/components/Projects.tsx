"use client";

import { useEffect, useRef } from "react";
import { Apple, Smartphone, MoveRight, CheckCircle2 } from "lucide-react";
import { projects, type Project } from "../data";
import SectionHeading from "./SectionHeading";
import GlowCard from "./GlowCard";
import PhoneMockup from "./PhoneMockup";

function storeHref(p: Project, platform: "iOS" | "Android") {
  if (platform === "iOS") {
    return (
      p.appStore ||
      `https://apps.apple.com/us/search?term=${encodeURIComponent(p.name)}`
    );
  }
  return (
    p.playStore ||
    `https://play.google.com/store/search?q=${encodeURIComponent(p.name)}&c=apps`
  );
}

function StoreButton({
  href,
  icon: Icon,
  label,
}: Readonly<{ href: string; icon: typeof Apple; label: string }>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-fg transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand active:scale-95"
    >
      <Icon size={15} /> {label}
    </a>
  );
}

const DUMMY_SCREENS = [
  "/dummy/app-1.svg",
  "/dummy/app-2.svg",
  "/dummy/app-3.svg",
];

function Showcase({ p, index }: Readonly<{ p: Project; index: number }>) {
  const screens = p.screens ?? DUMMY_SCREENS;
  return (
    <GlowCard
      className="h-full w-[88vw] max-w-[960px] shrink-0 overflow-hidden rounded-3xl border border-border bg-surface"
      contentClassName="grid h-full md:grid-cols-2"
    >
      {/* Left — fanned phone mockups */}
      <div className="group/phones relative flex min-h-[320px] items-center justify-center overflow-hidden border-b border-border bg-bg-soft p-6 md:border-b-0 md:border-r">
        <span className="absolute left-5 top-5 font-display text-sm font-semibold tracking-widest text-fg-muted">
          {p.year}
        </span>
        <div className="relative flex h-[300px] w-full items-center justify-center">
          <div className="absolute z-0 -translate-x-[42%] translate-y-4 -rotate-[12deg] transition-transform duration-500 group-hover/phones:-translate-x-[58%] group-hover/phones:-rotate-[16deg]">
            <PhoneMockup src={screens[1]} alt={`${p.name} screen`} accent={p.accent} seed={index + 1} />
          </div>
          <div className="absolute z-0 translate-x-[42%] translate-y-4 rotate-[12deg] transition-transform duration-500 group-hover/phones:translate-x-[58%] group-hover/phones:rotate-[16deg]">
            <PhoneMockup src={screens[2]} alt={`${p.name} screen`} accent={p.accent} seed={index + 2} />
          </div>
          <div className="relative z-10 transition-transform duration-500 group-hover/phones:-translate-y-2">
            <PhoneMockup src={screens[0]} alt={`${p.name} screen`} accent={p.accent} seed={index} />
          </div>
        </div>
      </div>

      {/* Right — details */}
      <div className="flex flex-col justify-center gap-5 p-7 sm:p-9">
        <span className="inline-flex w-fit items-center rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
          {p.category}
        </span>
        <h3 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {p.name}
        </h3>
        <p className="text-base leading-relaxed text-fg-muted">{p.description}</p>
        <ul className="space-y-2.5">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <p className="font-mono text-xs uppercase tracking-wider text-fg-muted">
          {p.tags.join("  ·  ")}
        </p>
        <div className="mt-1 flex flex-wrap gap-3">
          {p.platforms.includes("iOS") && (
            <StoreButton href={storeHref(p, "iOS")} icon={Apple} label="App Store" />
          )}
          {p.platforms.includes("Android") && (
            <StoreButton
              href={storeHref(p, "Android")}
              icon={Smartphone}
              label="Google Play"
            />
          )}
        </div>
      </div>
    </GlowCard>
  );
}

export default function Projects() {
  const triggerRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const count = projects.length;
    const strip = stripRef.current;
    const outer = outerRef.current;
    const track = trackRef.current;

    // Highlight the active app via direct DOM — no React re-render while scrolling.
    const setActive = (i: number) => {
      const items = strip?.querySelectorAll<HTMLElement>("[data-app]");
      items?.forEach((el, idx) => {
        el.classList.toggle("text-brand", idx === i);
        el.classList.toggle("text-fg-muted/50", idx !== i);
      });
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 768px)").matches;

    // Mobile / reduced-motion: native horizontal swipe.
    if (reduce || !desktop) {
      const onScroll = () => {
        if (!outer) return;
        const max = outer.scrollWidth - outer.clientWidth;
        const prog = max > 0 ? outer.scrollLeft / max : 0;
        setActive(Math.round(prog * (count - 1)));
      };
      outer?.addEventListener("scroll", onScroll, { passive: true });
      return () => outer?.removeEventListener("scroll", onScroll);
    }

    // Desktop: pin + translate the track with a GPU transform (smooth, no flicker).
    let mounted = true;
    let st: { kill: () => void } | null = null;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!mounted || !outer || !track || !triggerRef.current || !pinRef.current)
        return;
      gsap.registerPlugin(ScrollTrigger);
      const maxX = () => Math.max(0, track.scrollWidth - outer.clientWidth);
      const tween = gsap.to(track, {
        x: () => -maxX(),
        ease: "none",
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: () => "+=" + maxX(),
          pin: pinRef.current,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) =>
            setActive(Math.round(self.progress * (count - 1))),
        },
      });
      st = tween.scrollTrigger ?? null;
      ScrollTrigger.refresh();
    })();

    return () => {
      mounted = false;
      st?.kill();
    };
  }, []);

  return (
    <section ref={triggerRef} id="projects" className="relative bg-bg-soft">
      <div
        ref={pinRef}
        className="flex flex-col justify-center overflow-hidden py-20 md:h-screen md:py-0"
      >
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div
            data-animate
            className="flex flex-wrap items-end justify-between gap-6"
          >
            <SectionHeading
              eyebrow="Apps"
              title="Apps I've shipped to production"
              subtitle="Scroll to move through every live iOS and Android product."
            />
            <p className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted">
              Scroll to explore
              <MoveRight size={16} className="text-brand" />
            </p>
          </div>
        </div>

        <div
          ref={outerRef}
          className="no-scrollbar mt-8 overflow-x-auto overflow-y-hidden md:overflow-hidden"
        >
          <div
            ref={trackRef}
            className="flex w-max gap-6 px-5 pb-3 [will-change:transform] sm:px-8 lg:px-[max(2rem,calc((100vw-72rem)/2))]"
          >
            {projects.map((p, i) => (
              <Showcase key={p.name} p={p} index={i} />
            ))}
            <div aria-hidden className="w-2 shrink-0 sm:w-8" />
          </div>
        </div>

        {/* Bottom app index */}
        <div className="mx-auto mt-6 w-full max-w-6xl px-5 sm:px-8">
          <div
            ref={stripRef}
            className="no-scrollbar flex items-center gap-4 overflow-x-auto border-t border-border pt-4"
          >
            <span className="shrink-0 font-mono text-xs font-semibold tracking-widest text-fg-muted">
              {projects.length} APPS
            </span>
            {projects.map((p, i) => (
              <span
                key={p.name}
                data-app
                className={`shrink-0 font-mono text-xs tracking-wide transition-colors ${
                  i === 0 ? "text-brand" : "text-fg-muted/50"
                }`}
              >
                {String(i + 1).padStart(2, "0")} {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

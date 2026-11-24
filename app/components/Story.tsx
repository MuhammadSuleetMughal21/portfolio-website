"use client";

import { useEffect, useRef } from "react";
import SectionHeading from "./SectionHeading";

const milestones = [
  {
    year: "2022",
    tag: "FOUNDATION",
    title: "Learning the craft",
    body: "Studying Software Engineering at Sir Syed University and falling for JavaScript — building first apps and learning how real software is shipped.",
  },
  {
    year: "2023",
    tag: "FIRST REAL CODE",
    title: "First production apps",
    body: "Joined Moziky as an Associate Software Engineer — shipping cross-platform React Native apps with Firebase Auth, Firestore and MobX inside an agile team.",
  },
  {
    year: "2024",
    tag: "PROVEN",
    title: "Full-stack & mobile",
    body: "At Decotechs, built health and e-commerce apps end to end — React Native front ends with Redux, plus Node, Express and MongoDB APIs, released to both stores.",
  },
  {
    year: "2025",
    tag: "MOMENTUM",
    title: "Shipping at scale",
    body: "Mobile Developer at Tafsol Technologies — 15+ production apps and AI features like chatbots, voice-to-text and virtual try-on, owned from first commit to store release.",
  },
];

export default function Story() {
  const triggerRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    if (reduce || !desktop) return;

    let mounted = true;
    let st: { kill: () => void } | null = null;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!mounted) return;
      gsap.registerPlugin(ScrollTrigger);
      const trigger = triggerRef.current;
      const pin = pinRef.current;
      const outer = outerRef.current;
      const track = trackRef.current;
      if (!trigger || !pin || !outer || !track) return;
      const maxX = () => Math.max(0, track.scrollWidth - outer.clientWidth);
      const tween = gsap.to(track, {
        x: () => -maxX(),
        ease: "none",
        scrollTrigger: {
          trigger,
          start: "top top",
          end: () => "+=" + maxX(),
          pin,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
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
    <section ref={triggerRef} id="story" className="relative">
      <div
        ref={pinRef}
        className="flex flex-col justify-center overflow-hidden py-20 md:h-screen md:py-0"
      >
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div data-animate>
            <SectionHeading
              eyebrow="The journey"
              title="The story so far"
              subtitle="Three years from first lines of code to shipping production apps for real users."
            />
          </div>
        </div>

        <div
          ref={outerRef}
          className="no-scrollbar mt-10 overflow-x-auto overflow-y-hidden md:overflow-hidden"
        >
          <div
            ref={trackRef}
            className="flex w-max gap-6 px-5 pb-3 [will-change:transform] sm:px-8 lg:px-[max(2rem,calc((100vw-72rem)/2))]"
          >
            {milestones.map((m) => (
              <div
                key={m.year}
                className="relative flex w-[82vw] max-w-[520px] shrink-0 flex-col justify-between rounded-3xl border border-border bg-surface p-8 sm:p-10"
              >
                <div>
                  <p className="font-display text-7xl font-bold leading-none outline-heading sm:text-8xl">
                    {m.year}
                  </p>
                  <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-brand">
                    {m.tag}
                  </p>
                </div>
                <div className="mt-10">
                  <h3 className="font-display text-2xl font-bold">{m.title}</h3>
                  <p className="mt-3 leading-relaxed text-fg-muted">{m.body}</p>
                </div>
              </div>
            ))}
            <div aria-hidden className="w-2 shrink-0 sm:w-8" />
          </div>
        </div>
      </div>
    </section>
  );
}

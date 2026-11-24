"use client";

import { useEffect } from "react";
import "locomotive-scroll/locomotive-scroll.css";

type Loco = {
  scrollTo: (t: HTMLElement, o?: Record<string, unknown>) => void;
  destroy: () => void;
};

export default function SmoothScroll({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let loco: Loco | null = null;
    let mounted = true;
    let cleanup: (() => void) | null = null;

    // Smooth anchor navigation.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      if (!a) return;
      const hash = a.getAttribute("href");
      if (!hash || hash === "#") return;
      const dest = document.querySelector(hash);
      if (!dest) return;
      e.preventDefault();
      if (loco) loco.scrollTo(dest as HTMLElement, { offset: -80, duration: 1.1 });
      else
        (dest as HTMLElement).scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
        });
    };
    document.addEventListener("click", onClick);

    (async () => {
      if (reduce) return;

      const [{ default: LocomotiveScroll }, { gsap }, { ScrollTrigger }] =
        await Promise.all([
          import("locomotive-scroll"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
      if (!mounted) return;

      gsap.registerPlugin(ScrollTrigger);

      // Drive Lenis from GSAP's ticker so smooth-scroll, ScrollTrigger and the
      // pinned horizontal sections all advance on the SAME animation frame.
      // Running them on separate RAFs is what makes pinned scroll flicker.
      gsap.ticker.lagSmoothing(0);
      loco = new LocomotiveScroll({
        lenisOptions: { lerp: 0.1, wheelMultiplier: 1, smoothWheel: true },
        scrollCallback: () => ScrollTrigger.update(),
        initCustomTicker: (render: (time: number) => void) =>
          gsap.ticker.add(render),
        destroyCustomTicker: (render: (time: number) => void) =>
          gsap.ticker.remove(render),
      }) as unknown as Loco;

      const ctx = gsap.context(() => {
        // 1) Staggered reveal for individual items as they enter the viewport.
        const items = gsap.utils.toArray<HTMLElement>("[data-animate]");
        gsap.set(items, { opacity: 0, y: 64 });
        ScrollTrigger.batch(items, {
          start: "top 86%",
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.12,
              overwrite: true,
            }),
        });

        // 2) Scroll-scrubbed parallax on solid (non-blurred) elements.
        gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
          const speed = Number(el.dataset.speed || "0");
          gsap.to(el, {
            yPercent: speed,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        });

        // 3) Count-up numbers.
        gsap.utils.toArray<HTMLElement>("[data-counter]").forEach((el) => {
          const target = Number(el.dataset.counter || "0");
          const suffix = el.dataset.suffix || "";
          const obj = { v: 0 };
          ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            once: true,
            onEnter: () =>
              gsap.to(obj, {
                v: target,
                duration: 1.6,
                ease: "power2.out",
                onUpdate: () => {
                  el.textContent = Math.round(obj.v) + suffix;
                },
              }),
          });
        });

        // 4) Top scroll-progress bar.
        const bar = document.querySelector<HTMLElement>("#scroll-progress");
        if (bar) {
          gsap.fromTo(
            bar,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              transformOrigin: "left center",
              scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
            }
          );
        }
      });

      ScrollTrigger.refresh();

      cleanup = () => {
        ctx.revert();
        ScrollTrigger.getAll().forEach((s) => s.kill());
      };
    })();

    return () => {
      mounted = false;
      document.removeEventListener("click", onClick);
      cleanup?.();
      loco?.destroy();
    };
  }, []);

  return <>{children}</>;
}

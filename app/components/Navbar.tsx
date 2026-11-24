"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { profile } from "../data";

const links = [
  { href: "#story", label: "Story" },
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-fg transition-[transform,color,border-color] hover:border-brand hover:text-brand active:scale-90"
    >
      {mounted && dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-border bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-bold text-white">
            MS
          </span>
          <span className="hidden sm:inline">{profile.name.split(" ")[1]}</span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href={`mailto:${profile.email}`}
            className="hidden rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:-translate-y-0.5 active:scale-95 sm:inline-block"
          >
            Hire Me
          </a>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-fg lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <div
        id="scroll-progress"
        className="h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500"
      />

      {open && (
        <div className="border-t border-border bg-bg/95 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-5 py-3 sm:px-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-fg-muted hover:bg-bg-soft hover:text-fg"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

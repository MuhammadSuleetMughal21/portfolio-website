/* eslint-disable @next/next/no-img-element */
import { ArrowRight } from "lucide-react";
import { profile } from "../data";

const stack = [
  { label: "React Native", abbr: "RN" },
  { label: "React.js", abbr: "R" },
  { label: "Node.js", abbr: "N" },
  { label: "Firebase", abbr: "FB" },
  { label: "MongoDB", abbr: "DB" },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Striped background with a tech-stack column per stripe */}
      <div aria-hidden className="absolute inset-0 flex">
        {stack.map((s, i) => {
          const light = i % 2 === 1;
          return (
            <div
              key={s.label}
              className={`group/stripe relative flex-1 transition-[flex-grow] duration-500 ease-out hover:flex-[1.6] ${
                light ? "bg-stripe-b" : "bg-stripe-a"
              }`}
            >
              <div className="absolute inset-x-0 bottom-[14%] flex flex-col items-center gap-4">
                <span
                  className={`grid h-16 w-16 place-items-center rounded-2xl font-display text-xl font-bold transition-transform duration-500 group-hover/stripe:scale-110 ${
                    light
                      ? "bg-stripe-a text-stripe-b"
                      : "bg-stripe-b text-stripe-a"
                  }`}
                >
                  {s.abbr}
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-widest sm:text-xs ${
                    light ? "text-stripe-a/70" : "text-stripe-b/70"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating name card (chat bubble) */}
      <div className="relative z-10 mx-auto w-full max-w-xl px-5">
        <div className="animate-fade-up relative mx-auto w-fit max-w-full rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-black/5">
          <span className="absolute -right-2 -top-2 grid h-7 min-w-7 place-items-center rounded-full bg-emerald-500 px-2 text-xs font-bold text-white shadow-lg">
            1+
          </span>
          <div className="flex items-center gap-4">
            <img
              src="/dummy/avatar.svg"
              alt="Muhammad Suleet"
              className="h-14 w-14 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="font-display text-lg font-bold text-zinc-900">
                {profile.name}
              </p>
              <p className="truncate text-sm text-zinc-500">
                Mobile App Developer &amp; React Native Expert
              </p>
            </div>
          </div>
          {/* bubble tail */}
          <div className="absolute -bottom-2 left-12 h-4 w-4 rotate-45 bg-white" />
        </div>

        <div className="animate-fade-up mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="#projects"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 font-semibold text-white shadow-xl shadow-brand/30 transition-transform hover:-translate-y-0.5 active:scale-95 sm:w-auto"
          >
            View My Work
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-7 py-3.5 font-semibold text-white ring-1 ring-white/10 transition-transform hover:-translate-y-0.5 active:scale-95 sm:w-auto"
          >
            Get In Touch
          </a>
        </div>
      </div>
    </section>
  );
}

"use client";

import { skills } from "../data";
import SectionHeading from "./SectionHeading";
import { useInView } from "./useInView";

export default function Skills() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section id="skills" className="bg-bg-soft py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div data-animate>
          <SectionHeading
            eyebrow="Skills"
            title="The stack I build with every day"
            subtitle="Years of shipping real apps have made these second nature."
          />
        </div>

        <div
          ref={ref}
          className="mt-14 grid gap-x-12 gap-y-7 sm:grid-cols-2"
        >
          {skills.map((skill, i) => (
            <div key={skill.name} data-animate>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-medium text-fg">{skill.name}</span>
                <span className="font-display text-sm font-semibold tabular-nums text-brand">
                  {skill.level}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-1000 ease-out"
                  style={{
                    width: inView ? `${skill.level}%` : "0%",
                    transitionDelay: `${i * 90}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

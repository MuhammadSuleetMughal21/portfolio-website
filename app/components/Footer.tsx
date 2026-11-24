import { Mail } from "lucide-react";
import { Github, Linkedin } from "./BrandIcons";
import { profile } from "../data";

const navLinks = [
  { href: "#story", label: "Story" },
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-8 sm:flex-row sm:justify-between sm:px-8">
        {/* Left — links */}
        <nav className="flex gap-6">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Center — copyright */}
        <p className="text-sm text-fg-muted">
          © 2026 {profile.name}. All rights reserved.
        </p>

        {/* Right — socials */}
        <div className="flex gap-4 text-fg-muted">
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="transition-colors hover:text-brand"
          >
            <Github size={19} />
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="transition-colors hover:text-brand"
          >
            <Linkedin size={19} />
          </a>
          <a
            href={`mailto:${profile.email}`}
            aria-label="Email"
            className="transition-colors hover:text-brand"
          >
            <Mail size={19} />
          </a>
        </div>
      </div>
    </footer>
  );
}

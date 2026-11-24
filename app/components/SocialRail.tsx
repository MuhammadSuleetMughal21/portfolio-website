import { Mail, MessageCircle } from "lucide-react";
import { Github, Linkedin } from "./BrandIcons";
import { profile } from "../data";

const items = [
  { href: profile.github, label: "GitHub", Icon: Github, external: true },
  { href: profile.linkedin, label: "LinkedIn", Icon: Linkedin, external: true },
  { href: `mailto:${profile.email}`, label: "Email", Icon: Mail, external: false },
  { href: "#projects", label: "Work", Icon: MessageCircle, external: false },
];

export default function SocialRail() {
  return (
    <div className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 sm:block">
      <div className="flex flex-col items-center gap-1 rounded-full border border-border bg-surface/80 p-1.5 shadow-xl backdrop-blur">
        {items.map(({ href, label, Icon, external }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="grid h-9 w-9 place-items-center rounded-full text-fg-muted transition-colors hover:bg-brand-soft hover:text-brand active:scale-90"
          >
            <Icon size={17} />
          </a>
        ))}
      </div>
    </div>
  );
}

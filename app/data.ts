import {
  Smartphone,
  Server,
  Layers,
  Cloud,
  Sparkles,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export const profile = {
  name: "Muhammad Suleet",
  role: "Mobile Application Developer",
  tagline: "React Native · MERN Stack · Redux · Firebase",
  location: "Karachi, Pakistan",
  email: "suleet18@gmail.com",
  phone: "+92 317 002 5508",
  github: "https://github.com/MuhammadSuleetMughal21",
  linkedin: "https://linkedin.com/in/suleet-mughal-9a7b86263",
  summary:
    "React Native developer with 3 years of experience shipping 15+ production iOS and Android applications across health, e-commerce, travel, logistics, and AI domains. I build full-stack MERN products end to end — from Redux-driven mobile UIs to Node APIs — and ship them all the way to the App Store and Google Play.",
  stats: [
    { value: "15+", label: "Apps shipped" },
    { value: "3+", label: "Years experience" },
    { value: "5", label: "Industry domains" },
    { value: "2", label: "App stores" },
  ],
};

export const skills: { name: string; level: number }[] = [
  { name: "React Native", level: 95 },
  { name: "React JS", level: 90 },
  { name: "JavaScript (ES6+)", level: 92 },
  { name: "Redux & State Management", level: 88 },
  { name: "Node.js & Express", level: 82 },
  { name: "MongoDB & Mongoose", level: 80 },
  { name: "Firebase & Cloud", level: 85 },
  { name: "REST APIs & Axios", level: 88 },
];

export const services: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Smartphone,
    title: "Cross-Platform Mobile Apps",
    description:
      "Native-quality iOS and Android apps from a single React Native codebase — fast, reliable, and store-ready.",
  },
  {
    icon: Server,
    title: "MERN Stack Development",
    description:
      "Full-stack web products with MongoDB, Express, React, and Node.js — from data model to polished UI.",
  },
  {
    icon: Layers,
    title: "State Management",
    description:
      "Predictable, scalable app state with Redux and MobX, clean Axios data layers, and REST integrations.",
  },
  {
    icon: Cloud,
    title: "Firebase & Cloud Integration",
    description:
      "Authentication, Firestore, realtime data, and cloud functions wired into live production apps.",
  },
  {
    icon: Sparkles,
    title: "AI Feature Integration",
    description:
      "Chatbots, voice-to-text, and virtual try-on experiences integrated directly into shipping products.",
  },
  {
    icon: Rocket,
    title: "App Store Deployment",
    description:
      "End-to-end delivery and release management for both the Apple App Store and Google Play.",
  },
];

export type Project = {
  name: string;
  year: string;
  category: string;
  description: string;
  features: string[];
  tags: string[];
  platforms: ("iOS" | "Android")[];
  accent: string;
  /** Paste the real store URLs here to replace the search-based defaults. */
  appStore?: string;
  playStore?: string;
  /**
   * Up to 3 app screenshot images in /public (e.g. "/apps/gasup/1.png").
   * These fill the phone mockups. Until provided, styled placeholders show.
   */
  screens?: string[];
};

export const projects: Project[] = [
  {
    name: "ITER Travel Planner",
    year: "2025",
    features: [
      "GPT-style itinerary generation with day-by-day plans",
      "Real-time group chat for travellers on the same trip",
      "Subscriptions with entitlement gating across platforms",
    ],
    category: "Travel",
    description:
      "A travel planning app that helps users build, organize, and manage trips end to end.",
    tags: ["React Native", "Redux", "REST API"],
    platforms: ["iOS", "Android"],
    accent: "from-indigo-500 to-violet-500",
  },
  {
    name: "FitFindAI",
    year: "2025",
    features: [
      "AI-matched workouts and classes for each user",
      "Personalized fitness discovery feed",
      "Progress tracking with smart reminders",
    ],
    category: "Health · AI",
    description:
      "An AI-powered fitness discovery app that surfaces tailored workouts and classes.",
    tags: ["React Native", "AI", "Firebase"],
    platforms: ["iOS", "Android"],
    accent: "from-emerald-500 to-teal-500",
  },
  {
    name: "Sylenze",
    year: "2024",
    features: [
      "Secure, private video sharing built for schools",
      "Role-based access for staff and students",
      "Moderated uploads with safe playback",
    ],
    category: "Education",
    description:
      "A secure school video-sharing platform built for safe, private classroom content.",
    tags: ["React Native", "Firebase", "Auth"],
    platforms: ["iOS", "Android"],
    accent: "from-sky-500 to-blue-600",
  },
  {
    name: "GasUp",
    year: "2024",
    features: [
      "On-demand fuel ordering in a few taps",
      "Live driver tracking on the map",
      "Saved vehicles and payment methods",
    ],
    category: "Logistics",
    description:
      "On-demand fuel delivery with live order tracking and real-time status updates.",
    tags: ["React Native", "Live Tracking", "Node"],
    platforms: ["iOS", "Android"],
    accent: "from-orange-500 to-amber-500",
  },
  {
    name: "ModWorks",
    year: "2025",
    features: [
      "Field task assignment and scheduling",
      "Offline-capable job updates from the field",
      "Photo and status reporting",
    ],
    category: "Productivity",
    description:
      "A field work and task management app for coordinating on-site teams and jobs.",
    tags: ["React Native", "Redux", "REST API"],
    platforms: ["iOS"],
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    name: "Kowala — Teen Wellbeing",
    year: "2024",
    features: [
      "Daily wellbeing check-ins for students",
      "Guided social-emotional learning activities",
      "Private, secure student journaling",
    ],
    category: "Health · SEL",
    description:
      "A student wellbeing and social-emotional learning app supporting teen mental health.",
    tags: ["React Native", "Firebase", "Analytics"],
    platforms: ["iOS", "Android"],
    accent: "from-rose-500 to-red-500",
  },
  {
    name: "Havera",
    year: "2024",
    features: [
      "Gamified rewards and loyalty points",
      "Tiered perks, streaks and challenges",
      "Personalized offers that drive retention",
    ],
    category: "E-commerce",
    description:
      "A gamified rewards and loyalty app that keeps customers engaged and coming back.",
    tags: ["React Native", "Gamification", "REST API"],
    platforms: ["Android"],
    accent: "from-purple-500 to-indigo-500",
  },
  {
    name: "Industrial PMR",
    year: "2025",
    features: [
      "Maintenance logging and incident reporting",
      "Asset and issue tracking end to end",
      "MERN-powered reporting dashboards",
    ],
    category: "Industrial",
    description:
      "An industrial maintenance and reporting app for logging issues and tracking repairs.",
    tags: ["React Native", "MERN", "MongoDB"],
    platforms: ["iOS", "Android"],
    accent: "from-slate-500 to-gray-600",
  },
  {
    name: "Fitness By Gracie",
    year: "2024",
    features: [
      "1:1 coaching with tailored training plans",
      "In-app progress and check-ins",
      "Secure client authentication",
    ],
    category: "Health",
    description:
      "A personal fitness coaching app connecting clients with tailored training plans.",
    tags: ["React Native", "Firebase", "Auth"],
    platforms: ["iOS"],
    accent: "from-cyan-500 to-emerald-500",
  },
];

export type Review = {
  quote: string;
  name: string;
  title: string;
  initials: string;
};

export const reviews: Review[] = [
  {
    quote:
      "Suleet shipped our React Native app ahead of schedule and handled the entire App Store release without a hitch. Rare to find.",
    name: "Ahmed K.",
    title: "Product Manager, Tafsol",
    initials: "AK",
  },
  {
    quote:
      "The Redux architecture he set up made our codebase so much easier to scale. Clean, predictable, well documented.",
    name: "Sara M.",
    title: "Engineering Lead",
    initials: "SM",
  },
  {
    quote:
      "He integrated a voice-to-text and chatbot flow into our live app and it just worked. Strong grasp of AI features.",
    name: "Daniel R.",
    title: "Founder, HealthTech Startup",
    initials: "DR",
  },
  {
    quote:
      "Reliable, communicative, and genuinely cares about UX. Our users noticed the polish immediately after launch.",
    name: "Hina A.",
    title: "Design Lead",
    initials: "HA",
  },
  {
    quote:
      "From Firebase auth to live tracking, he owned the full mobile stack. Delivered a GasUp release we were proud of.",
    name: "Bilal T.",
    title: "CTO, Logistics Co.",
    initials: "BT",
  },
  {
    quote:
      "A dependable full-stack MERN developer. He bridged our web and mobile teams and kept everything in sync.",
    name: "Emily W.",
    title: "Project Manager",
    initials: "EW",
  },
];

export const experience = [
  {
    role: "Mobile Application Developer",
    company: "Tafsol Technologies",
    period: "May 2025 — Present",
  },
  {
    role: "MERN Stack & Mobile Application Developer",
    company: "Decotechs",
    period: "May 2024 — April 2025",
  },
  {
    role: "Associate Software Engineer",
    company: "Moziky",
    period: "July 2023 — Feb 2024",
  },
];

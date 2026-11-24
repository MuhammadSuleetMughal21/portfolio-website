"use client";

import SmoothScroll from "../SmoothScroll";
import Navbar from "../Navbar";
import SocialRail from "../SocialRail";
import Hero from "../Hero";
import Story from "../Story";
import Projects from "../Projects";
import Experience from "../Experience";
import Skills from "../Skills";
import Footer from "../Footer";

export default function FlatSite() {
  return (
    <SmoothScroll>
      <Navbar />
      <SocialRail />
      <main>
        <Hero />
        <Story />
        <Projects />
        <Experience />
        <Skills />
      </main>
      <Footer />
    </SmoothScroll>
  );
}

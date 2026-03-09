"use client";

import React from "react";
import HomeTheaterHero from "@/components/sections/HomeTheaterHero";
import About from "@/components/sections/About";
import HomeTheaterSection from "@/components/home-theater/HomeTheaterSection";
import { InteriorSection } from "@/components/interior-design/InteriorSection";
import ServicesSlider from "@/components/sections/Services";
import HomeProjects from "@/components/sections/HomeProjects";
import { TestimonialsSection } from "@/components/Testimonials";

import { TeamSection } from "@/components/sections/TeamSection";
import { Separator } from "@/components/ui/separator";
import BrandLogos from "@/components/sections/BrandLogos2";
import WhatsappIcon from "@/components/WhatsappIcon";
import Navbar from "@/components/Navbar";

const Page = () => {
  return (
    <div className="">
      <Navbar />

      <header>
        <HomeTheaterHero />
      </header>

      <main>
        <About />
        <HomeTheaterSection />
        <HomeProjects />
        <InteriorSection />
        <ServicesSlider />
        <TestimonialsSection />
        <WhatsappIcon />
        <TeamSection />
        <Separator />
        <BrandLogos />
      </main>

      <footer>{/*<Footer />*/}</footer>
    </div>
  );
};

export default Page;

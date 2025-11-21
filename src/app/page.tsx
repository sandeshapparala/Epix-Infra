"use client";

import React from "react";
import HeroSlider from "@/components/sections/Hero";
import About from "@/components/sections/About";
import HomeTheaterSection from "@/components/home-theater/HomeTheaterSection";
import { InteriorSection } from "@/components/interior-design/InteriorSection";
import ServicesSlider from "@/components/sections/Services";
import HomeProjects from "@/components/sections/HomeProjects";
import { TestimonialsSection } from "@/components/Testimonials";

import {TeamSection} from "@/components/sections/TeamSection";
import {Separator} from "@/components/ui/separator";
import BrandLogos from "@/components/sections/BrandLogos2";
import WhatsappIcon from "@/components/WhatsappIcon";

const Page = () => {

  return (
<div className="">
  <header>
    <HeroSlider />
  </header>

  <main>
    <About />
    <HomeTheaterSection />
    <HomeProjects />
    <InteriorSection />
    <ServicesSlider />
    <TestimonialsSection />
    <WhatsappIcon />
    <TeamSection/>
    <Separator/>
    <BrandLogos/>
  </main>

  <footer>
    {/*<Footer />*/}
  </footer>
</div>
  );
};

export default Page;
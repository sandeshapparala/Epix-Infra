"use client";

import React, { useState } from "react";
import HeroSlider from "@/components/sections/Hero";
import About from "@/components/sections/About";
import HomeTheaterSection from "@/components/home-theater/HomeTheaterSection";
import { InteriorSection } from "@/components/interior-design/InteriorSection";
import ServicesSlider from "@/components/sections/Services";
import { TestimonialsSection } from "@/components/Testimonials";
import WhatsappIcon from "@/components/WhatsappIcon";
import { Preloader } from "@/components/Preloader";
import {TeamSection} from "@/components/sections/TeamSection";
import {Separator} from "@/components/ui/separator";
import BrandLogos from "@/components/sections/BrandLogos2";

const Page = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="">
      {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
      {!isLoading && (
        <>
          {/* Header Section */}
          <header>
            <HeroSlider />
          </header>

          {/* Main Content Section */}
          <main>
            <About />
            <HomeTheaterSection />
            <InteriorSection />
            <ServicesSlider />
            <TestimonialsSection />
            <WhatsappIcon />
            <TeamSection/>
            <Separator/>
            <BrandLogos/>
          </main>

          {/* Footer Section */}
          <footer>
            {/*<Footer />*/}
          </footer>
        </>
      )}
    </div>
  );
};

export default Page;
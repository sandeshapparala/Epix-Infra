import React from "react";
import HeroSlider from "@/components/sections/Hero";
import About from "@/components/sections/About";
import HomeTheaterSection from "@/components/home-theater/HomeTheaterSection";
import { InteriorSection } from "@/components/interior-design/InteriorSection";
import ServicesSlider from "@/components/sections/Services";
import { TestimonialsSection } from "@/components/Testimonials";
import WhatsappIcon from "@/components/WhatsappIcon";
import Footer from "@/components/Footer";
// import TeamSection from "@/components/sections/TeamSection";

const Page = () => {
  return (
    <div className="">
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
        {/* <TeamSection /> */}
      </main>

      {/* Footer Section */}
      <footer>
        <Footer />
      </footer>
    </div>
  );
};

export default Page;

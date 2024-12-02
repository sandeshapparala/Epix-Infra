import React from 'react'
import HeroSlider from "@/components/sections/Hero";
import About from "@/components/sections/About";
import HomeTheaterSection from "@/components/home-theater/HomeTheaterSection";
import {InteriorSection} from "@/components/interior-design/InteriorSection";
import ServicesSlider from "@/components/sections/Services";
import  {TestimonialsSection} from "@/components/Testimonials";
import WhatsappIcon from "@/components/WhatsappIcon";
// import TeamSection from "@/components/sections/TeamSection";


const Page = () => {
  return (
      <div className={""}>

        <HeroSlider />
          <About/>
          <HomeTheaterSection/>
          <InteriorSection/>
          <ServicesSlider/>
          <TestimonialsSection/>
          {/*<TeamSection/>*/}
          <WhatsappIcon/>

      </div>
  )
}
export default Page

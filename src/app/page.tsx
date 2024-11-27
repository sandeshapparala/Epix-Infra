import React from 'react'
import HeroSlider from "@/components/sections/Hero";
import BrandLogos from "@/components/BrandLogos";
import {ServicesSection} from "@/components/sections/services";
import About from "@/components/sections/About";

const Page = () => {
  return (
      <div className={""}>

        <HeroSlider />
          <About/>
          <BrandLogos/>
          <ServicesSection/>
      </div>
  )
}
export default Page

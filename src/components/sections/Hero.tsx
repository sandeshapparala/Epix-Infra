"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import Link from "next/link";
import Overlay from "@/components/ui/Overlay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

// Import images
import home_theater from "@/images/Home_theater.jpg";
import electric1 from "@/images/electric1.jpg";
import interior from "@/images/interior.jpg";
import lighting from "@/images/lighting.jpg";
import luxary from "@/images/luxary.jpg";

const HeroSlider = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const slides = [
    {
      image: home_theater,
      title: "Cinematic visuals and surround sound, right at home.",
      link: "/news/first-phase-of-six-senses-residences-project-in-thailand-completes/",
      category: "Experience Immersive Entertainment",
    },
    {
      image: interior,
      title: "Modern interiors designed for style and comfort.",
      link: "/news/a-major-winery-extension-legacy-of-bodegas-faustino-opens/",
      category: "Crafting Spaces That Inspire",
    },
    {
      image: electric1,
      title: "Reliable solutions for all your electrical needs.",
      link: "/news/foster-plus-partners-completes-restoration-of-iconic-transamerica-pyramid-center/",
      category: "Powering Precision, Ensuring Safety",
    },
    {
      image: lighting,
      title: "Innovative lighting to highlight your vision.",
      link: "/news/foster-plus-partners-completes-alibaba-s-new-shanghai-offices/",
      category: "Lighting That Elevates Design",
    },
    {
      image: luxary,
      title: "Gadigal and Barangaroo stations welcome Sydney customers",
      link: "/news/gadigal-and-barangaroo-stations-welcome-sydney-customers/",
      category: "News",
    },
  ];

  const textVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="relative w-full h-screen">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade" // Fade effect
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        pagination={{ clickable: true }}
        className="w-full h-full"
        navigation={{
          nextEl: ".custom-next",
          prevEl: ".custom-prev",
        }}
        onSlideChange={(swiper) => setActiveSlideIndex(swiper.realIndex)} // Update active slide index
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-full">
              {/* Background Image */}
              <Image
                src={slide.image}
                alt={slide.title}
                layout="fill"
                objectFit="cover"
                className="w-full h-full"
              />

              {/* Overlay */}
              <Overlay />

              {/* Text Content */}
              <div className="absolute inset-0 flex flex-col items-center text-white z-10 mt-[31%]">
                {activeSlideIndex === index && (
                  <motion.div
                    className="flex flex-col items-center"
                    initial="hidden"
                    animate="visible"
                    variants={textVariants}
                    key={slide.title}
                  >
                    <span className="text-xs md:text-sm lg:text-lg uppercase">
                      {slide.category}
                    </span>

                    <Link href={slide.link} className="block mt-2 text-center">
                      <h2 className="text-6xl font-semibold lg:max-w-6xl leading-tight">
                        {slide.title}
                      </h2>
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}

        {/* Custom Navigation Buttons */}
        <div className="custom-prev absolute top-1/2 left-4 transform -translate-y-1/2 z-20">
          <ChevronLeft
            size={32}
            className="text-white hover:text-gray-300 transition-colors"
          />
        </div>
        <div className="custom-next absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
          <ChevronRight
            size={32}
            className="text-white hover:text-gray-300 transition-colors"
          />
        </div>
      </Swiper>
    </section>
  );
};

export default HeroSlider;

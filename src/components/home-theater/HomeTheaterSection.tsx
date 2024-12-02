"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import HomeTheaterFeature from "./HomeTheaterFeature";
import { features } from "./features-data";
// import {Swiper, SwiperSlide} from "swiper/react";
// import {Autoplay, Navigation} from "swiper/modules";
import BrandLogos from "@/components/BrandLogos";

export default function HomeTheaterSection() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  return (
    <section className="bg-white py-16 overflow-hidden">
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="container mx-auto px-4 sm:px-6 lg:px-20"
      >
        <div className="text-center mb-12">
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-4xl font-bold text-stone-950 mb-6"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
            }}
          >
            Epix Cinema Spaces
          </motion.h2>
          <motion.div 
            className="w-24 h-1 bg-accent mx-auto mb-6"
            variants={{
              hidden: { width: 0 },
              visible: { width: 96, transition: { duration: 0.8, delay: 0.3 } }
            }}
          />
        </div>

        {/* Titles Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-12">
          <motion.div
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 }
            }}
            className="text-left"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
              Experience Cinema <br />
              <span className="text-accent">Like Never Before</span>
            </h3>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0 }
            }}
            className="text-left lg:text-right"
          >
            <p className="text-lg text-gray-600">
              Transform your space into a state-of-the-art home theater with our premium solutions
              and expert installation services.
            </p>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* Features List */}
          <motion.div className="space-y-3" variants={containerVariants}>
            {features.map((feature) => (
              <motion.div key={feature.id} variants={containerVariants}>
                <HomeTheaterFeature
                  title={feature.title}
                  description={feature.description}
                  isActive={activeFeature === feature.id}
                  onHover={() => setActiveFeature(feature.id)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Image Section */}
          <div>
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-2xl">
              <AnimatePresence mode="wait">
                {features.map((feature) => (
                    feature.id === activeFeature && (
                        <motion.div
                            key={feature.id}
                            className="absolute inset-0"
                            initial={{opacity: 0, scale: 1.1}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.9}}
                            transition={{duration: 0.5}}
                        >
                          <div
                              className="w-full h-full bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${feature.image})`,
                              }}
                          >
                            {/*<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"/>*/}
                          </div>
                        </motion.div>
                    )
                ))}
              </AnimatePresence>
            </div>


              <BrandLogos/>



          </div>
        </div>
      </motion.div>
    </section>
  );
}
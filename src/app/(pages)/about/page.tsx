"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import "swiper/css";
import "swiper/css/navigation";
import {TestimonialsSection} from "@/components/Testimonials";
import {TeamSection} from "@/components/sections/TeamSection";

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
    const mainRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mainRef.current && textRef.current) {
            gsap.fromTo(
                mainRef.current,
                { opacity: 0, x: -50 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 1,
                    scrollTrigger: {
                        trigger: mainRef.current,
                        start: "top center",
                        end: "bottom center",
                    },
                }
            );

            gsap.fromTo(
                textRef.current,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    scrollTrigger: {
                        trigger: textRef.current,
                        start: "top center",
                        end: "bottom center",
                    },
                }
            );
        }
    }, []);

    return (
        <div id="about" className="bg-white py-20 max-md:py-10 max-md:pb-4">
            <div className="container mx-auto lg:px-20 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        ref={mainRef}
                        className="relative"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{duration: 0.5}}
                    >
                        <div className="relative w-full h-[480px] max-md:h-[280px]">
                            <Image
                                src="/Images/theater.webp"
                                alt="Modern interior"
                                className="w-full h-full object-cover rounded-lg"
                                layout="fill"
                            />
                            <div
                                className="absolute top-[15%] -right-12 w-72 h-80 z-10 max-md:-right-3 max-md:top-[80%] max-md:h-32 max-md:w-48">
                                <Swiper
                                    modules={[Navigation, Autoplay]}
                                    autoplay={{
                                        delay: 3000,
                                        disableOnInteraction: false,
                                    }}
                                    loop={true}
                                    className="w-full h-full rounded-lg shadow-xl"
                                >
                                    <SwiperSlide>
                                        <Image
                                            src="/Images/about/interior1.jpg"
                                            alt="Interior 1"
                                            className="object-cover"
                                            layout="fill"
                                        />
                                    </SwiperSlide>
                                    <SwiperSlide>
                                        <Image
                                            src="/Images/about/interior2.jpg"
                                            alt="Interior 2"
                                            className="object-cover"
                                            layout="fill"
                                        />
                                    </SwiperSlide>
                                    <SwiperSlide>
                                        <Image
                                            src="/Images/about/interior3.jpg"
                                            alt="Interior 3"
                                            className="object-cover"
                                            layout="fill"
                                        />
                                    </SwiperSlide>
                                </Swiper>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        ref={textRef}
                        className="lg:pl-12"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{duration: 0.5, delay: 0.2}}
                    >
                        <h3 className="text-lg font-medium text-accent mb-4">About Us</h3>
                        <h2 className="text-4xl font-bold mb-6">
                            Since we started work in 2018
                        </h2>
                        <div className="space-y-4 text-gray-600">
                            <p>
                                At Epix Infra, we redefine living spaces by blending innovation
                                with expertise to deliver immersive experiences that exceed
                                expectations. With a legacy of 5 years, we specialize in
                                crafting personalized solutions, from state-of-the-art home
                                theaters to meticulously designed interiors.
                            </p>
                            <p>
                                Our mission is to transform your vision into reality by creating
                                spaces that reflect your lifestyle and aspirations. Each project
                                is a testament to our commitment to unparalleled craftsmanship,
                                quality, and client satisfaction.
                            </p>
                            <p>
                                Choose Epix Infra for a journey beyond the ordinary—a seamless
                                blend of innovation, artistry, and a personalized approach that
                                turns your space into a masterpiece.
                            </p>
                        </div>

                    </motion.div>
                </div>
                <div className="mt-12 space-y-6 mx-12">
                    <h3 className="text-xl font-semibold text-accent">Why Choose Epix Infra?</h3>
                    <p>
                        Choose Epix Infra for a transformative experience where
                        innovation meets expertise. With a 5-year legacy, we deliver
                        comprehensive solutions, showcasing unparalleled craftsmanship
                        and a personalized approach to bring your vision to life. Trust
                        Epix Infra for proven expertise and a commitment to excellence
                        that sets us apart in redefining living spaces.
                    </p>
                    <h3 className="text-xl font-semibold text-accent">Our Mission</h3>
                    <p>
                        Our mission extends beyond construction—it’s about creating
                        immersive experiences. Epix Infra is driven by the desire to
                        craft personalized havens that reflect individual lifestyles.
                        From innovative home theaters to meticulous interior designs,
                        each project is a testament to our commitment to quality and
                        client satisfaction. Choose Epix Infra for a living experience
                        that transcends the ordinary, where your space becomes a canvas
                        for innovation, craftsmanship, and the pursuit of excellence.
                    </p>
                </div>
                <TeamSection/>
                <TestimonialsSection/>
            </div>
        </div>
    );
}

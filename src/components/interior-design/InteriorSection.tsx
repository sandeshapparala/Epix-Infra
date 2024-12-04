
"use client";

import { motion } from "framer-motion";
import { CategoryCard } from "./CategoryCard";
import {Swiper, SwiperSlide} from "swiper/react";
import {Autoplay, Navigation} from "swiper/modules";
// import  Lottie  from "lottie-react";
// import animationData from "@/Images/Interior-animation.json";

const categories = [
    {
        title: "Modular Kitchens",
        images: [
            "/Images/interior/kitchen1.jpg",
            "/Images/interior/kitchen2.jpg",
            "/Images/interior/kitchen3.jpg",

        ],
    },
    {
        title: "Luxury Wardrobes",
        images: [
            "/Images/interior/wardrobe1.jpg",
            "/Images/interior/wardrobe3.jpg",

        ],
    },
    {
        title: "Living Room Spaces",
        images: [
            "/Images/interior/living_room1.jpg",
            "/Images/interior/living_room2.jpg",
            "/Images/interior/living_room3.jpg",

        ],
    },
    {
        title: "Comfortable Beds",
        images: [
            "/Images/interior/bed1.jpg",
            "/Images/interior/bed2.jpg",
            "/Images/interior/bed3.jpg",

        ],
    },
    {
        title: "Home Bar",
        images: [
            "/Images/bar/bar1.jpg",
            "/Images/bar/bar2.jpg",
            "/Images/bar/bar3.jpg",

        ],
    },
    {
        title: "Dining Room",
        images: [
            "/Images/dining/dining1.jpg",
            "/Images/dining/dining2.jpg",
            "/Images/dining/dining3.jpg",
        ],
    },
];

export function InteriorSection() {
    return (
        <section className="py-20 max-md:py-10 max-md:pt-4 max-md:-mt-14 bg-gradient-to-b from-background to-secondary/20">

            <div className="container mx-auto lg:px-20 px-4">
                <div className="text-center mb-12">
                    <motion.h2
                        className="text-3xl sm:text-4xl md:text-4xl font-bold text-stone-950 mb-6"
                        variants={{
                            hidden: {opacity: 0, y: 20},
                            visible: {opacity: 1, y: 0, transition: {duration: 0.6}}
                        }}
                    >
                        Epix Interior Excellence
                    </motion.h2>
                    <motion.div
                        className="w-24 h-1 bg-accent mx-auto mb-6"
                        variants={{
                            hidden: {width: 0},
                            visible: {width: 96, transition: {duration: 0.8, delay: 0.3}}
                        }}
                    />
                </div>
                {/* Titles Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-12">
                    <motion.div
                        variants={{
                            hidden: {opacity: 0, x: -20},
                            visible: {opacity: 1, x: 0}
                        }}
                        className="text-left"
                    >
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
                            Shaping Dreams into <br/>
                            <span className="text-accent">Living Reality</span>
                            {/*<Lottie animationData={animationData} className="w-24 h-24"/>*/}
                        </h3>
                    </motion.div>

                    <motion.div
                        variants={{
                            hidden: {opacity: 0, x: 20},
                            visible: {opacity: 1, x: 0}
                        }}
                        className="text-left lg:text-right"
                    >
                        <p className="text-lg text-gray-600">
                            Discover our range of premium interior design services, where every detail is crafted to perfection. From contemporary kitchens to luxurious living spaces, we transform your vision into reality.
                        </p>
                    </motion.div>
                </div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6">
    {categories.map((category, index) => (
        <CategoryCard key={category.title} {...category} index={index}/>
    ))}
</div>
<div className="hidden lg:block">
    <Swiper
        modules={[Navigation, Autoplay]}
    slidesPerView={4}
    spaceBetween={20}
    loop={true}
    autoplay={{
        delay: 2000,
        disableOnInteraction: false,
    }}
    // navigation={true}
    className="w-full"
>
    {categories.map((category, index) => (
        <SwiperSlide key={category.title}>
            <CategoryCard {...category} index={index}/>
        </SwiperSlide>
    ))}
</Swiper>
</div>
            </div>
        </section>
    );
}
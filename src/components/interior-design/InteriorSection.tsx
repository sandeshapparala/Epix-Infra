"use client";

import { motion } from "framer-motion";
import { CategoryCard } from "./CategoryCard";
// import  Lottie  from "lottie-react";
// import animationData from "@/Images/Interior-animation.json";

const categories = [
    {
        title: "Modern Kitchen Design",
        images: [
            "https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1200",
            "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?q=80&w=1200",
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200",
            "https://images.unsplash.com/photo-1556909190-10f666f3ab7d?q=80&w=1200"
        ],
    },
    {
        title: "Luxury Wardrobes",
        images: [
            "https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=1200",
            "https://images.unsplash.com/photo-1551515300-2d3b7bb80920?q=80&w=1200",
            "https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=1200",
            "https://images.unsplash.com/photo-1556020685-ae41abfc9365?q=80&w=1200"
        ],
    },
    {
        title: "Living Room Spaces",
        images: [
            "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200",
            "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1200",
            "https://images.unsplash.com/photo-1618219740975-d40978bb7378?q=80&w=1200",
            "https://images.unsplash.com/photo-1618219944342-824e40a13285?q=80&w=1200"
        ],
    },
    {
        title: "Bathroom Elegance",
        images: [
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1200",
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1200",
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1200",
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1200"
        ],
    },
];

export function InteriorSection() {
    return (
        <section className="py-20 bg-gradient-to-b from-background to-secondary/20">

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
                            Experience Cinema <br/>
                            <span className="text-accent">Like Never Before</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category, index) => (
                        <CategoryCard key={category.title} {...category} index={index}/>
                    ))}
                </div>
            </div>
        </section>
    );
}
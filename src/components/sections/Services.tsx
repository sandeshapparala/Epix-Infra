'use client';

import React from 'react';
import { motion } from 'framer-motion';

const services = [
    {
        title: 'Home Theatre Installation',
        description: 'Design and installation of cutting-edge home theatre systems with premium brands and state-of-the-art technologies.',
        icon: '🎥',
    },
    {
        title: 'Interior Design and Renovation',
        description: 'Tailored interior design services and comprehensive renovation solutions for modern and aesthetic spaces.',
        icon: '🏠',
    },
    {
        title: 'Construction Services',
        description: 'Full-scale construction services with expertise in structural design, foundation work, and building.',
        icon: '🔨',
    },
    {
        title: 'Elevation Works',
        description: 'Architectural elevation designs to enhance aesthetic appeal with innovative concepts.',
        icon: '🏢',
    },
    {
        title: 'Furniture Design and Installation',
        description: 'Custom furniture designs with quality craftsmanship to complement your interior style.',
        icon: '🛋️',
    },
    {
        title: 'Electrical & Lighting Works',
        description: 'Comprehensive electrical services with smart home integration and safety-centric approaches.',
        icon: '💡',
    },
    {
        title: 'Product Décor',
        description: 'Curated selection of premium décor items to enhance your living spaces.',
        icon: '🎀',
    },
    {
        title: 'UPVC Windows and Doors',
        description: 'Expert installation of energy-efficient UPVC windows and doors tailored to your architecture.',
        icon: '🚪',
    },
];

const ServicesHorizontalScroll = () => {
    return (
        <section className="py-12 bg-gray-50 relative overflow-hidden">
            <div className="container mx-auto px-6">
                <motion.h2
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-bold text-center text-gray-800 mb-8"
                >
                    Services Offered by Epix Infra
                </motion.h2>

                <div className="relative w-full overflow-hidden">
                    <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: ['0%', '-100%'] }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        className="flex space-x-6"
                    >
                        {[...services, ...services].map((service, index) => (
                            <div
                                key={index}
                                className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center text-center w-80 flex-shrink-0 transform transition-transform duration-500 hover:scale-105"
                            >
                                <div className="text-5xl">{service.icon}</div>
                                <h3 className="text-xl font-semibold mt-4">{service.title}</h3>
                                <p className="text-gray-600 mt-2">{service.description}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ServicesHorizontalScroll;

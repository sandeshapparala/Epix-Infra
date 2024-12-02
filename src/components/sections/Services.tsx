"use client";

import { motion } from "framer-motion";
import {MobileServices} from "@/components/services/mobile-services";
import {DesktopServices} from "@/components/services/desktop-services";


export default function Services() {
    return (
        <section className="py-20 bg-black">
            <div className="container mx-auto lg:px-20 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
          <span className="text-orange-500 text-sm font-semibold tracking-wider uppercase">
            What We Offer
          </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
                        Our Services
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Transform your space with our comprehensive range of professional services,
                        combining innovation with expertise to deliver exceptional results.
                    </p>
                </motion.div>

                <MobileServices />
                <DesktopServices />
            </div>
        </section>
    );
}
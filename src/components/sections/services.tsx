"use client";

import { motion } from "framer-motion";
import { Monitor, Home, Lightbulb, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const services = [
    {
        icon: <Monitor className="w-8 h-8" />,
        title: "Home Theater",
        description: "Experience cinema-quality entertainment in the comfort of your home with our custom theater solutions.",
        href: "/services/home-theater",
    },
    {
        icon: <Home className="w-8 h-8" />,
        title: "Interior Design",
        description: "Transform your space with our expert interior design services that blend aesthetics with functionality.",
        href: "/services/interior-design",
    },
    {
        icon: <Lightbulb className="w-8 h-8" />,
        title: "Lighting Solutions",
        description: "Illuminate your space with smart, energy-efficient lighting systems designed for ambiance and utility.",
        href: "/services/lighting",
    },
    {
        icon: <Wrench className="w-8 h-8" />,
        title: "Electrical Expertise",
        description: "Professional electrical services ensuring safety and efficiency in every installation.",
        href: "/services/electrical",
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
        },
    },
};

export function ServicesSection() {
    return (
        <section className="py-24 bg-background">
            <div className="container px-4 mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Comprehensive solutions for modern living spaces, combining technology, design, and functionality.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {services.map((service) => (
                        <motion.div
                            key={service.title}
                            variants={itemVariants}
                            className="group relative p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
                        >
                            <div className="mb-4 text-primary">{service.icon}</div>
                            <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                            <p className="text-muted-foreground mb-4">{service.description}</p>
                            <Link href={service.href}>
                                <Button variant="link" className="p-0">
                                    Learn More →
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
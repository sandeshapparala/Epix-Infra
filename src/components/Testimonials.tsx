"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { motion } from "framer-motion";

interface Testimonial {
    name: string;
    company?: string;
    feedback: string;
    rating?: number;
}

export function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTestimonials() {
            try {
                const testimonialRef = collection(db, "feedback");
                const q = query(testimonialRef, orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);

                const fetchedTestimonials = querySnapshot.docs.map(doc => ({
                    name: doc.data().name,
                    company: doc.data().company,
                    feedback: doc.data().feedback,
                    rating: doc.data().rating,
                }));

                setTestimonials(fetchedTestimonials);
            } catch (error) {
                console.error("Error fetching testimonials:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchTestimonials();
    }, []);

    if (loading) {
        return (
            <div className="h-[40vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
        );
    }

    if (testimonials.length === 0) {
        return null;
    }

    const displayTestimonials = testimonials.length < 3
        ? [...testimonials, ...testimonials, ...testimonials].slice(0, 6)
        : testimonials;

    return (
        <section className="relative overflow-hidden py-20">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black"></div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative mx-auto max-w-7xl px-6 lg:px-8"
            >
                <div className="mx-auto max-w-2xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            What Our Clients Say
                        </h2>
                        <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
                            Discover why clients trust and recommend our services
                        </p>
                    </motion.div>
                </div>
                <div className="relative mt-16">
                    <InfiniteMovingCards
                        items={displayTestimonials}
                        direction="left"
                        speed="slow"
                    />
                </div>
            </motion.div>
        </section>
    );
}
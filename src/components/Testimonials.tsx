"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
    name: string;
    company?: string;
    feedback: string;
    rating?: number;
}

export function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gridCurrentIndex, setGridCurrentIndex] = useState(0);

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

    // Auto-play functionality
    useEffect(() => {
        if (testimonials.length === 0) return;
        
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 4000);

        return () => clearInterval(timer);
    }, [testimonials.length]);

    // Auto-play functionality for grid
    useEffect(() => {
        if (testimonials.length <= 1) return;
        
        const timer = setInterval(() => {
            setGridCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 6000); // Slower than main carousel

        return () => clearInterval(timer);
    }, [testimonials.length]);

    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const goToTestimonial = (index: number) => {
        setCurrentIndex(index);
    };

    const nextGridPage = () => {
        setGridCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevGridPage = () => {
        setGridCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    if (loading) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (testimonials.length === 0) {
        return null;
    }

    return (
        <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto max-w-6xl px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl font-light text-gray-800 dark:text-gray-100 mb-4">
                        Client Testimonials
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        What our clients say about our work
                    </p>
                </motion.div>

                {/* Main Testimonial */}
                <div className="relative max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            {/* Rating */}
                            {testimonials[currentIndex]?.rating && (
                                <div className="flex items-center justify-center gap-1 mb-8">
                                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                            )}

                            {/* Feedback */}
                            <blockquote className="text-xl md:text-2xl font-light text-gray-800 dark:text-gray-100 leading-relaxed mb-8 max-w-3xl mx-auto">
                                &ldquo;{testimonials[currentIndex]?.feedback}&rdquo;
                            </blockquote>

                            {/* Author */}
                            <div>
                                <div className="text-lg font-medium text-gray-800 dark:text-gray-100">
                                    {testimonials[currentIndex]?.name}
                                </div>
                                {testimonials[currentIndex]?.company && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {testimonials[currentIndex].company}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    {testimonials.length > 1 && (
                        <>
                            <button
                                onClick={prevTestimonial}
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            
                            <button
                                onClick={nextTestimonial}
                                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>

                {/* Indicators */}
                {testimonials.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToTestimonial(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index === currentIndex
                                        ? "bg-amber-500 w-8"
                                        : "bg-gray-300 dark:bg-gray-600"
                                }`}
                            />
                        ))}
                    </div>
                )}                {/* All testimonials grid */}
                {testimonials.length > 1 && (
                    <div className="mt-20">
                        <div
                            className="relative"
                        >
                            {/* Grid Carousel */}
                            <div className="overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Get 3 testimonials starting from gridCurrentIndex */}
                                    {Array.from({ length: 3 }).map((_, index) => {
                                        const testimonialIndex = (gridCurrentIndex + index) % testimonials.length;
                                        const testimonial = testimonials[testimonialIndex];
                                        
                                        return (
                                            <div
                                                key={`${gridCurrentIndex}-${index}`}
                                                className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer"
                                                onClick={() => goToTestimonial(testimonialIndex)}
                                            >
                                                {/* Mini rating */}
                                                {testimonial?.rating && (
                                                    <div className="flex items-center gap-1 mb-4">
                                                        {[...Array(testimonial.rating)].map((_, i) => (
                                                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* Mini feedback */}
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-4">
                                                    &ldquo;{testimonial?.feedback}&rdquo;
                                                </p>
                                                
                                                {/* Mini author */}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                                        {testimonial?.name}
                                                    </div>
                                                    {testimonial?.company && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {testimonial.company}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Grid Navigation */}
                            {testimonials.length > 1 && (
                                <>
                                    <button
                                        onClick={prevGridPage}
                                        className="absolute -left-16 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors bg-white dark:bg-gray-800 rounded-full shadow-md z-10"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    
                                    <button
                                        onClick={nextGridPage}
                                        className="absolute -right-16 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors bg-white dark:bg-gray-800 rounded-full shadow-md z-10"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
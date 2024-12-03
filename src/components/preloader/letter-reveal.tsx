"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LetterRevealProps {
    text: string;
    delay?: number;
}

export const LetterReveal = ({ text, delay = 0 }: LetterRevealProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    const letterVariants = {
        hidden: { y: 100, opacity: 0 },
        visible: (i: number) => ({
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: [0.6, 0.01, 0.05, 0.95], // Fixed the invalid easing value
                delay: i * 0.1,
            },
        }),
    };

    return (
        <div className="flex overflow-hidden">
            {text.split("").map((letter, index) => (
                <motion.span
                    key={index}
                    custom={index}
                    variants={letterVariants}
                    initial="hidden"
                    animate={isVisible ? "visible" : "hidden"}
                    className="text-6xl md:text-8xl font-bold text-primary inline-block"
                >
                    {letter === " " ? "\u00A0" : letter}
                </motion.span>
            ))}
        </div>
    );
};
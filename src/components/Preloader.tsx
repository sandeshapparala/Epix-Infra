"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { SplitText } from "@/components/preloader/SplitText";
import { cn } from "@/lib/utils";

interface PreloaderProps {
    onComplete?: () => void;
}

export const Preloader = ({ onComplete }: PreloaderProps) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                setIsLoading(false);
                onComplete?.();
            },
        });

        tl.to(".progress-bar", {
            width: "100%",
            duration: 0.75, // Reduced duration
            ease: "power2.inOut",
        });

        return () => {
            tl.kill();
        };
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{
                opacity: 0,
                transition: {
                    duration: 0.4, // Reduced duration
                    ease: [0.6, 0.01, 0.05, 0.95],
                    delay: 0.1, // Reduced delay
                },
            }}
            className={cn(
                "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background",
                "transition-opacity duration-1000",
                !isLoading && "pointer-events-none"
            )}
        >
            <div className="relative flex flex-col items-center gap-8">
                <SplitText
                    text="EPIX INFRA"
                    className="text-center"
                    charClassName="text-6xl md:text-8xl font-bold text-primary"
                    split={true}
                />
                <div className="w-48 h-1 bg-muted overflow-hidden rounded-full">
                    <div className="progress-bar h-full w-0 bg-primary rounded-full" />
                </div>
            </div>
        </motion.div>
    );
};
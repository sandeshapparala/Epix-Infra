"use client";

import { motion } from "framer-motion";
import {containerVariants, letterVariants} from "@/components/preloader/Varients";

interface SplitTextProps {
    text: string;
    className?: string;
    charClassName?: string;
    delay?: number;
    split?: boolean;
}

export const SplitText = ({
                              text,
                              className = "",
                              charClassName = "",
                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              delay = 0,
                              split = false,
                          }: SplitTextProps) => {
    const words = split ? text.split(" ") : [text];

    return (
        <motion.div
            className={`flex items-center justify-center gap-4 perspective-1000 ${className}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {words.map((word, wordIndex) => (
                <motion.div
                    key={wordIndex}
                    className="flex overflow-hidden"
                >
                    {word.split("").map((char, index) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const isLeft = split ? wordIndex === 0 : index < text.length / 2;
                        const globalIndex = wordIndex === 0 ? index : index + words[0].length + 1;

                        return (
                            <motion.span
                                key={index}
                                variants={letterVariants}
                                custom={globalIndex}
                                className={`inline-block transform-style-3d ${charClassName}`}
                                style={{
                                    originX: 0.5,
                                    originY: 0.5,
                                    backfaceVisibility: "hidden",
                                }}
                            >
                                {char}
                            </motion.span>
                        );
                    })}
                </motion.div>
            ))}
        </motion.div>
    );
};
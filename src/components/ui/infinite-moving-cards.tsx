"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export const InfiniteMovingCards = ({
                                      items,
                                      direction = "left",
                                      speed = "fast",
                                      pauseOnHover = true,
                                      className,
                                    }: {
  items: {
    name: string;
    feedback: string;
    company?: string;
    rating?: number;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    addAnimation();
  }, []);

  const speedMap = {
    fast: "5s",
    normal: "40s",
    slow: "60s",
  };

  function addAnimation() {
    if (scrollerRef.current && items.length > 0) {
      setStart(true);
    }
  }

  return (
      <div
          ref={containerRef}
          className={cn(
              "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
              className
          )}
      >
        <div
            ref={scrollerRef}
            className={cn(
                "flex min-w-full gap-6 py-4",
                start && "animate-scroll",
                pauseOnHover && "hover:[animation-play-state:paused]"
            )}
            style={
              {
                "--animation-duration": speedMap[speed],
              } as React.CSSProperties
            }
        >
          {[...items, ...items].map((item, idx) => (
              <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative w-[350px] flex-shrink-0 rounded-2xl bg-white px-8 py-6 shadow-lg dark:bg-gray-900/90 dark:shadow-gray-800/30"
                  style={{ transform: direction === "right" ? "scaleX(-1)" : undefined }}
              >
                <blockquote className="relative">
                  <div className="text-sm leading-[1.7] text-gray-700 dark:text-gray-300 font-normal">
                    &#34;{item.feedback}&#34;
                  </div>
                  <footer className="mt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-base font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                        {item.company && (
                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {item.company}
                            </div>
                        )}
                      </div>
                      {item.rating && (
                          <div className="flex items-center gap-0.5">
                            {[...Array(item.rating)].map((_, i) => (
                                <Star
                                    key={i}
                                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                />
                            ))}
                          </div>
                      )}
                    </div>
                  </footer>
                </blockquote>
              </motion.div>
          ))}
        </div>
      </div>
  );
};
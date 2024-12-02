"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface HomeTheaterFeatureProps {
  title: string;
  description: string;
  isActive: boolean;
  onHover: () => void;
}

export default function HomeTheaterFeature({
  title,
  description,
  isActive,
  onHover,
}: HomeTheaterFeatureProps) {
  return (
    <motion.div
      onMouseEnter={onHover}
      className={`group p-5 border-l-4 rounded-r-lg backdrop-blur-sm ${
        isActive 
          ? "border-orange-500 bg-orange-500/10" 
          : "border-gray-800 hover:border-orange-500/50 bg-gray-100"
      } transition-all duration-300`}
      whileHover={{ x: 10, backgroundColor: "rgba(251, 146, 60, 0.15)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${
          isActive ? "text-orange-500" : "text-gray-700"
        } group-hover:text-orange-500 transition-colors`}>
          {title}
        </h3>
        <ChevronRight className={`w-5 h-5 ${
          isActive ? "text-orange-500" : "text-gray-600"
        } group-hover:text-orange-500 transition-colors`} />
      </div>
      <p className="text-sm text-gray-400 mt-2 leading-relaxed">{description}</p>
    </motion.div>
  );
}
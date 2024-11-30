"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ImageSlider } from "./ImageSlider";

interface CategoryCardProps {
    title: string;
    images: string[];
    index: number;
}

export function CategoryCard({ title, images, index }: CategoryCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <Card className="overflow-hidden group cursor-pointer">
                <CardContent className="p-0 relative">
                    <ImageSlider images={images} title={title} />
                </CardContent>
            </Card>
        </motion.div>
    );
}
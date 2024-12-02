"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { ServiceItem } from "./types";

interface ServiceCardProps {
    service: ServiceItem;
    index: number;
    className?: string;
}

export function ServiceCard({ service, index, className }: ServiceCardProps) {
    return (
        <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
                initial: { opacity: 0, y: 50 },
                animate: { opacity: 1, y: 0, transition: { delay: index * 0.1 } }
            }}
            className={className}
        >
            <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 h-full">
                <CardHeader>
                    <div className="mb-4">{service.icon}</div>
                    <CardTitle className="text-xl text-white">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="text-gray-400">
                        {service.description}
                    </CardDescription>
                </CardContent>
            </Card>
        </motion.div>
    );
}
"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Twitter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const teamMembers = [
    {
        name: "Sarah Anderson",
        role: "Lead Developer",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=400&auto=format&fit=crop",
        social: {
            twitter: "https://twitter.com/sarahanderson",
            github: "https://github.com/sarahanderson",
            linkedin: "https://linkedin.com/in/sarahanderson",
        },
    },
    {
        name: "Michael Chen",
        role: "UI/UX Designer",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&auto=format&fit=crop",
        social: {
            twitter: "https://twitter.com/michaelchen",
            github: "https://github.com/michaelchen",
            linkedin: "https://linkedin.com/in/michaelchen",
        },
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.3,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut",
        },
    },
};

const socialIconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.2 },
};

export default function TeamSection() {
    return (
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
            <div className="container mx-auto px-4">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-6xl mx-auto"
                >
                    <motion.div
                        variants={itemVariants}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
                        <p className="text-lg text-gray-600">The talented people behind our success</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                        {teamMembers.map((member, index) => (
                            <motion.div
                                key={member.name}
                                variants={itemVariants}
                                whileHover={{ y: -5 }}
                                className="flex justify-center"
                            >
                                <Card className="relative overflow-hidden w-full max-w-md">
                                    <div className="p-8">
                                        <div className="flex flex-col items-center">
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                                                    <AvatarImage src={member.image} alt={member.name} />
                                                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                            </motion.div>
                                            <h3 className="mt-6 text-2xl font-semibold text-gray-900">{member.name}</h3>
                                            <p className="mt-2 text-gray-600">{member.role}</p>

                                            <div className="mt-6 flex space-x-4">
                                                <motion.a
                                                    href={member.social.twitter}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variants={socialIconVariants}
                                                    whileHover="hover"
                                                    className="text-gray-600 hover:text-blue-400"
                                                >
                                                    <Twitter className="w-5 h-5" />
                                                </motion.a>
                                                <motion.a
                                                    href={member.social.github}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variants={socialIconVariants}
                                                    whileHover="hover"
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    <Github className="w-5 h-5" />
                                                </motion.a>
                                                <motion.a
                                                    href={member.social.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variants={socialIconVariants}
                                                    whileHover="hover"
                                                    className="text-gray-600 hover:text-blue-600"
                                                >
                                                    <Linkedin className="w-5 h-5" />
                                                </motion.a>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
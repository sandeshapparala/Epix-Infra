"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface TeamMember {
    name: string;
    role: string;
    phone: string;
    image: string;
}

const teamMembers: TeamMember[] = [
    {
        name: "Gavarrraju Eswar Sai",
        role: "Founder & CEO",
        phone: "7386440344",
        image: "/Images/esw.jpg",
    },
    {
        name: "Kandula Jaya Prakash",
        role: "Technical Director", 
        phone: "9032069013",
        image: "/Images/jprakash.jpg",
    },
    {
        name: "Nandu A",
        role: "Interior Design Specialist",
        phone: "",
        image: "/Images/nandu.jpg",
    },
    {
        name: "Sudinesh Reddy",
        role: "Project Manager",
        phone: "",
        image: "/Images/sreddy.jpg",
    },
];

export function TeamSection() {
    return (
        <section className="py-20 bg-white">
            <div className="mx-auto max-w-6xl px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Meet Our Team
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Our experienced professionals are dedicated to bringing your vision to life
                    </p>
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {teamMembers.map((member, index) => (
                        <div
                            key={index}
                            className="text-center"
                        >
                            <div className="relative mb-4 mx-auto w-32 h-32">
                                <Image
                                    src={member.image}
                                    alt={member.name}
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {member.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                                {member.role}
                            </p>
                            {member.phone && (
                                <p className="text-gray-500 text-sm">
                                    {member.phone}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mt-20"
                >
                    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 md:p-12">
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            Ready to Start Your Project?
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                            Connect with our team of experts and let&apos;s bring your vision to life
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-primary to-accent text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Get In Touch
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
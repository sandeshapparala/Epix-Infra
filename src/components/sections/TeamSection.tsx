"use client";



import {TeamMemberCard} from "@/components/team/team-card";
import {ContactCard} from "@/components/team/contact-card";

const teamMembers = [
    {
        name: "Gavarrraju Eswar Sai",
        role: "7386440344",
        image: "/Images/esw.jpg",
        initials: "SJ"
    },
    {
        name: "Kandula Jaya Prakash",
        role: "9032069013",
        image: "/Images/jprakash.jpg",
        initials: "MC"
    }
];

const contactInfo = {
    email: "hello@epixinfra.com",
    phone: "+91 7386440344"
};

export function TeamSection() {
    return (
        <section className="py-16 px-4 md:px-6 lg:px-8 bg-background">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    Our Team
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {teamMembers.map((member, index) => (
                        <TeamMemberCard key={index} {...member} />
                    ))}
                    <ContactCard
                        email={contactInfo.email}
                        phone={contactInfo.phone}
                    />
                </div>
            </div>
        </section>
    );
}
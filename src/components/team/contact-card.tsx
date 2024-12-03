"use client";

import { Mail, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ContactInfo {
    email: string;
    phone: string;
}

export function ContactCard({ email, phone }: ContactInfo) {
    return (
        <Card className="group p-6 flex flex-col justify-center space-y-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h3 className="text-xl font-semibold mb-4 transition-colors duration-300 group-hover:text-primary">
                Contact Us
            </h3>

            <div className="flex items-center space-x-3 group/item transition-all duration-300 hover:translate-x-1">
                <Mail className="w-5 h-5 text-muted-foreground transition-colors duration-300 group-hover/item:text-primary" />
                <a
                    href={`mailto:${email}`}
                    className="transition-colors duration-300 group-hover/item:text-primary"
                >
                    {email}
                </a>
            </div>

            <div className="flex items-center space-x-3 group/item transition-all duration-300 hover:translate-x-1">
                <Phone className="w-5 h-5 text-muted-foreground transition-colors duration-300 group-hover/item:text-primary" />
                <a
                    href={`tel:${phone}`}
                    className="transition-colors duration-300 group-hover/item:text-primary"
                >
                    {phone}
                </a>
            </div>
        </Card>
    );
}
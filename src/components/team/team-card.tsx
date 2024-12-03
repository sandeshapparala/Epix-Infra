"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TeamMemberProps {
    name: string;
    role: string;
    image: string;
    initials: string;
}

export function TeamMemberCard({ name, role, image, initials }: TeamMemberProps) {
    return (
        <Card className="group p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="relative">
                <Avatar className="w-32 h-32 mb-4 transition-transform duration-300 group-hover:scale-110">
                    <AvatarImage src={image} alt={name} className="object-cover" />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className={cn(
                    "absolute inset-0 rounded-full bg-primary/10 opacity-0 transition-opacity duration-300",
                    "group-hover:opacity-100"
                )} />
            </div>
            <h3 className="text-xl font-semibold mb-1 transition-colors duration-300 group-hover:text-primary">
                {name}
            </h3>
            <p className="text-muted-foreground transition-colors duration-300 group-hover:text-primary/80">
                {role}
            </p>
        </Card>
    );
}
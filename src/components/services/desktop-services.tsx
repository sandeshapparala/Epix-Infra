"use client";

import { ServiceCard } from './service-card';
import { services } from './service-data';

export function DesktopServices() {
    return (
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
                <ServiceCard key={index} service={service} index={index} />
            ))}
        </div>
    );
}
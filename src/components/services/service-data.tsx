import { Wrench, PaintBucket, Building, HomeIcon, Lightbulb, Sofa } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { ServiceItem } from "./types";

export const services: ServiceItem[] = [
    {
        icon: <HomeIcon className="w-10 h-10 text-orange-500" />,
        title: "Home Theatre Installation",
        description: "Design and installation of cutting-edge home theatre systems with premium brands and state-of-the-art .",
    },
    {
        icon: <PaintBucket className="w-10 h-10 text-orange-500" />,
        title: "Interior Design",
        description: "Tailored interior design services with meticulous attention to detail in furniture selection and spatial ",
    },
    {
        icon: <Building className="w-10 h-10 text-orange-500" />,
        title: "Construction Services",
        description: "Full-scale construction services for residential and commercial projects with expertise in structural design.",
    },
    {
        icon: <Wrench className="w-10 h-10 text-orange-500" />,
        title: "Electrical & Lighting",
        description: "Comprehensive electrical services with expertise in installations, wiring, and smart home integration.",
    },
    {
        icon: <Sofa className="w-10 h-10 text-orange-500" />,
        title: "Furniture Design",
        description: "Custom furniture design with quality craftsmanship and professional installation services.",
    },
    {
        icon: <Lightbulb className="w-10 h-10 text-orange-500" />,
        title: "Smart Integration",
        description: "Seamless integration of smart home technologies for lighting, audio, and complete home automation.",
    },
];
export interface Feature {
  id: string;
  title: string;
  description: string;
  image: string;
}

export const features: Feature[] = [
  {
    id: "4k",
    title: "4K Ultra HD Experience",
    description: "Immerse yourself in stunning 4K resolution with HDR technology, bringing movies and shows to life with incredible detail and vibrant colors.",
    image: "/images/theater/theater1.jpg"
  },
  {
    id: "dolby",
    title: "Dolby Atmos Sound",
    description: "Experience three-dimensional audio that flows all around you with breathtaking realism, creating a truly immersive soundscape.",
    image: "/images/theater/dolby.jpg"  },
  {
    id: "smart",
    title: "Smart Integration",
    description: "Control your entire home theater system effortlessly with smart home integration, from lighting to sound, all at your fingertips.",
    image: "/images/theater/smarthome.jpg"
  },
  {
    id: "acoustic",
    title: "Acoustic Excellence",
    description: "Achieve perfect sound reproduction with professional acoustic treatment and calibration, optimized for your specific space.",
    image: "/images/theater/theater2.jpg"  }
];
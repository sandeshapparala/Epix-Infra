import type { Metadata } from "next";
import TheaterBuilder from "@/components/theater-builder/TheaterBuilder";

export const metadata: Metadata = {
  title: "Home Theatre Design & Quotation Studio | Epix Infra",
  description:
    "Explore your cinema in 3D. Configure the room, seating, screen and surround sound with Epix Infra's interactive demonstration.",
  robots: { index: false, follow: false },
};
export default function HomeTheaterBuilderPage() {
  return <TheaterBuilder />;
}

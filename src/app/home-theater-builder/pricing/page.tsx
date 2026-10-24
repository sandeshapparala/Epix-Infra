import type { Metadata } from "next";
import PricingAdmin from "@/components/theater-builder/PricingAdmin";
import { StaffOnly } from "@/components/theater-builder/TheaterSession";
export const metadata: Metadata = {
  title: "Catalog pricing | Epix Infra",
  robots: { index: false, follow: false },
};
export default function PricingPage() {
  return <StaffOnly admin><PricingAdmin /></StaffOnly>;
}

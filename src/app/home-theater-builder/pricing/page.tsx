import type { Metadata } from "next";
import PricingAdmin from "@/components/theater-builder/PricingAdmin";
import { StaffOnly } from "@/components/theater-builder/TheaterSession";
export const metadata: Metadata = {
  title: "Catalog pricing | Epix Infra",
  robots: { index: false, follow: false },
};
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const { review } = await searchParams;
  return (
    <StaffOnly admin>
      <PricingAdmin initialReview={review === "1"} />
    </StaffOnly>
  );
}

import { TheaterSession } from "@/components/theater-builder/TheaterSession";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <TheaterSession>{children}</TheaterSession>;
}

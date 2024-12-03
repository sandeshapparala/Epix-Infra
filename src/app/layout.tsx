// import type { Metadata } from "next";

import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from '@vercel/analytics/next';


export const metadata = {
  title: "Epix Infra | Home Theater & Interior Designing Experts",
  description:
      "Luxury home theaters, stunning interiors, and expert lighting by Epix Infra. Transform your space today!",
  keywords:
      "Epix Infra, home theater solutions, interior designing, architectural lighting, electrical expertise, modern interiors, Hyderabad",
  authors: [{ name: "Epix Infra", url: "https://epixinfra.com" }],
  viewport: "width=device-width, initial-scale=1.0",
  openGraph: {
    type: "website",
    url: "https://epixinfra.com",
    title: "Epix Infra | Home Theater & Interior Designing Experts",
    description:
        "Explore the best in home theater systems and interior design services tailored to elevate your lifestyle. Epix Infra brings you innovation and style.",
    siteName: "Epix Infra",
    images: [
      {
        url: "https://epixinfra.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Epix Infra - Home Theater & Interior Designing Experts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@epixinfra",
    creator: "@epixinfra",
    title: "Epix Infra | Home Theater & Interior Designing Experts",
    description:
        "Epix Infra specializes in home theater solutions, modern interior designs, architectural lighting, and electrical expertise.",
    images: [
      {
        url: "https://epixinfra.com/twitter-card.jpg",
        alt: "Epix Infra - Home Theater & Interior Designing Experts",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <head>
      <link rel="icon" type="image/jpeg" href="/logo.jpg"/>
      <link
          rel="canonical"
          href="https://epixinfra.com"
      />
    </head>


    <body className={`antialiased`}>
      <Navbar/>

      {children}
      <SpeedInsights/>
        <Analytics/>
      <Footer/>
    </body>
    </html>
  );
}

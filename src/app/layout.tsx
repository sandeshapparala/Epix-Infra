// import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata    = {
  title: "Epix Infra | Home Theater & Interior Designing Experts",
  description:
      "Discover world-class home theater solutions, interior designing, architectural lighting, and electrical expertise with Epix Infra. Bringing luxury and functionality together.",
  keywords:
      "Epix Infra, home theater solutions, interior designing, architectural lighting, electrical expertise, modern interiors, Hyderabad",
  authors: [
    { name: "Epix Infra", url: "https://epixinfra.com" },
  ],
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
        url: "https://epixinfra.com/og-image.jpg", // Replace with the actual image URL
        width: 1200,
        height: 630,
        alt: "Epix Infra - Home Theater & Interior Designing Experts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@epixinfra", // Update with the correct Twitter handle if applicable
    creator: "@epixinfra",
    title: "Epix Infra | Home Theater & Interior Designing Experts",
    description:
        "Epix Infra specializes in home theater solutions, modern interior designs, architectural lighting, and electrical expertise.",
    images: [
      {
        url: "https://epixinfra.com/twitter-card.jpg", // Replace with the actual image URL
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
        <meta charSet="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta name="description" content={metadata.description}/>
        <meta name="keywords" content={metadata.keywords}/>
        <meta name="author" content="Epix Infra"/>
        <meta property="og:title" content={metadata.openGraph.title}/>
        <meta property="og:description" content={metadata.openGraph.description}/>
        <meta property="og:url" content={metadata.openGraph.url}/>
        <meta property="og:image" content={metadata.openGraph.images[0].url}/>
        <meta property="og:site_name" content={metadata.openGraph.siteName}/>
        <meta property="twitter:card" content={metadata.twitter.card}/>
        <meta property="twitter:title" content={metadata.twitter.title}/>
        <meta property="twitter:description" content={metadata.twitter.description}/>
        <meta property="twitter:image" content={metadata.twitter.images[0].url}/>
        <title>{metadata.title}</title>
<link rel="icon" type="image/jpeg" href="/logo.jpg"/>
      </head>

      <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar/>

        {children}
        <SpeedInsights/>
        <Footer/>
      </body>
      </html>
  );
}

import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/initUser";
import Provider from "@/Provider";
import PhoneLinkModal from "@/features/auth/components/PhoneLinkModal";
import CookieConsent from "@/shared/components/CookieConsent";
import { LanguageProvider } from "@/context/LanguageContext";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ride-now-vehicle-booking-site.vercel.app"),
  title: {
    default: "RideNow - Smart Vehicle Booking Platform",
    template: "%s | RideNow",
  },
  description:
    "RideNow is a modern vehicle booking platform for reliable, transparent, and verified rides across India. Fast dispatch, upfront pricing, and safety-first mobility.",
  keywords: [
    "RideNow",
    "cab booking",
    "auto rickshaw",
    "bike taxi",
    "goods delivery",
    "vehicle booking India",
    "smart cab platform",
  ],
  authors: [{ name: "RideNow Mobility Technologies" }],
  creator: "RideNow",
  publisher: "RideNow",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://ride-now-vehicle-booking-site.vercel.app",
    siteName: "RideNow",
    title: "RideNow - Smart Vehicle Booking Platform",
    description:
      "Reliable, upfront pricing with instant dispatch for bikes, autos, cabs, and logistics.",
    images: [
      {
        url: "/logo.webp",
        width: 800,
        height: 400,
        alt: "RideNow Smart Vehicle Booking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RideNow - Smart Vehicle Booking Platform",
    description:
      "Reliable, upfront pricing with instant dispatch for bikes, autos, cabs, and logistics.",
    images: ["/logo.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "googlee620573e04cfbb4e",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TransportationService",
    name: "RideNow",
    url: "https://ride-now-vehicle-booking-site.vercel.app",
    logo: "https://ride-now-vehicle-booking-site.vercel.app/logo.webp",
    description: "Smart vehicle booking and transparent on-demand transportation platform.",
    areaServed: "IN",
    serviceType: ["Cab Booking", "Auto Rickshaw", "Bike Taxi", "Logistics Delivery"],
  };

  return (
    <html lang="en" className={`${outfit.variable} ${plusJakartaSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-white w-full min-h-screen font-sans flex flex-col">
        <Provider>
          <LanguageProvider>
            <StoreProvider>
              <InitUser />
              <PhoneLinkModal />
              <CookieConsent />
              <main id="main-content" className="flex-1 w-full flex flex-col">
                {children}
              </main>
            </StoreProvider>
          </LanguageProvider>
        </Provider>
      </body>
    </html>
  );
}

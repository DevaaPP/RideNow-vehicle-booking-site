import type { Metadata } from "next";
import { Inter, DM_Serif_Display, Outfit } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/initUser";
import Provider from "@/Provider";
import PhoneLinkModal from "@/features/auth/components/PhoneLinkModal";
import CookieConsent from "@/shared/components/CookieConsent";
import MobileBottomNav from "@/shared/components/MobileBottomNav";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ride-now-vehicle-booking-site.vercel.app"),
  title: {
    default: "Jaatri (যাত্ৰী) - Smart Vehicle Booking Platform",
    template: "%s | Jaatri",
  },
  description:
    "Jaatri (যাত্ৰী) is a modern vehicle booking platform for reliable, transparent, and verified rides across India. Fast dispatch, upfront pricing, and safety-first mobility.",
  keywords: [
    "Jaatri",
    "যাত্ৰী",
    "cab booking",
    "auto rickshaw",
    "bike taxi",
    "goods delivery",
    "vehicle booking India",
    "smart cab platform",
    "RideNow",
  ],
  authors: [{ name: "Jaatri Mobility Technologies" }],
  creator: "Jaatri",
  publisher: "Jaatri",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/logojatri.png", type: "image/png" },
      { url: "/logojatri.webp", type: "image/webp" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logojatri.png",
    apple: "/logojatri.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://ride-now-vehicle-booking-site.vercel.app",
    siteName: "Jaatri",
    title: "Jaatri (যাত্ৰী) - Smart Vehicle Booking Platform",
    description:
      "Reliable, upfront pricing with instant dispatch for bikes, autos, cabs, and logistics.",
    images: [
      {
        url: "/logojatri.png",
        width: 800,
        height: 400,
        alt: "Jaatri Smart Vehicle Booking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jaatri (যাত্ৰী) - Smart Vehicle Booking Platform",
    description:
      "Reliable, upfront pricing with instant dispatch for bikes, autos, cabs, and logistics.",
    images: ["/logojatri.png"],
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
    name: "Jaatri (যাত্ৰী)",
    alternateName: "RideNow",
    url: "https://ride-now-vehicle-booking-site.vercel.app",
    logo: "https://ride-now-vehicle-booking-site.vercel.app/logojatri.png",
    description: "Smart vehicle booking and transparent on-demand transportation platform.",
    areaServed: "IN",
    serviceType: ["Cab Booking", "Auto Rickshaw", "Bike Taxi", "Logistics Delivery"],
  };

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${dmSerifDisplay.variable} ${outfit.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('ridenow_theme');
                  var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches) || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-[#F7F1E5] dark:bg-[#101713] text-[#10251C] dark:text-[#F3F1E8] w-full min-h-screen font-sans flex flex-col transition-colors duration-200">
        <Provider>
          <ThemeProvider>
            <LanguageProvider>
              <StoreProvider>
                <InitUser />
                <PhoneLinkModal />
                <CookieConsent />
                <main id="main-content" className="flex-1 w-full flex flex-col">
                  {children}
                </main>
                <MobileBottomNav />
              </StoreProvider>
            </LanguageProvider>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}

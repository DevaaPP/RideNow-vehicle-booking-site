import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/initUser";
import Provider from "@/Provider";
import PhoneLinkModal from "@/features/auth/components/PhoneLinkModal";
import { LanguageProvider } from "@/context/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RideNow - Smart Vehicle Booking Platform",
  description: "RideNow is a modern vehicle booking platform for reliable, transparent, and verified rides across India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white w-full min-h-screen`}
      >
        <Provider>
          <LanguageProvider>
            <StoreProvider>
              <InitUser />
              <PhoneLinkModal />
              {children}
            </StoreProvider>
          </LanguageProvider>
        </Provider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/initUser";
import Provider from "@/Provider";
import PhoneLinkModal from "@/features/auth/components/PhoneLinkModal";
import CookieConsent from "@/shared/components/CookieConsent";
import { LanguageProvider } from "@/context/LanguageContext";

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
        className="antialiased bg-white w-full min-h-screen font-sans"
      >
        <Provider>
          <LanguageProvider>
            <StoreProvider>
              <InitUser />
              <PhoneLinkModal />
              <CookieConsent />
              {children}
            </StoreProvider>
          </LanguageProvider>
        </Provider>
      </body>
    </html>
  );
}

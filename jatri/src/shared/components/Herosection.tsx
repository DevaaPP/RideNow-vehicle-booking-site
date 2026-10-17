"use client";

import { RootState } from "@/redux/store";
import { motion } from "framer-motion";
import { BikeIcon, ScootyIcon, AutoIcon, CarIcon, TruckIcon } from "@/shared/components/VehicleIcons";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";

export default function HeroSection({
  onAuthRequired,
}: {
  onAuthRequired: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { userData } = useSelector(
    (state: RootState) => state.user
  );

  const handleBookNow = () => {
    if (!userData) {
      // ❌ NOT LOGGED IN
      onAuthRequired();
      return;
    }

    // ✅ LOGGED IN - Start fresh booking session
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("ridenow_booking_draft");
        localStorage.removeItem("ridenow_booking_draft");
      } catch (_) {}
    }
    router.push("/book?fresh=true");
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      <Image
        src="/heroImage.webp"
        alt="RideNow Fleet Background"
        fill
        priority
        quality={80}
        sizes="100vw"
        className="object-cover object-center pointer-events-none"
      />
      <div className="absolute inset-0 bg-black/80" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white font-extrabold text-4xl sm:text-5xl md:text-7xl"
        >
          {t("hero.bookAnyVehicle", "Book Any Vehicle")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 max-w-xl text-gray-300"
        >
          {t("hero.subtitleFull", "From daily rides to heavy transport — all in one platform.")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-gray-300"
        >
          <div className="flex flex-col items-center gap-1.5 opacity-85 hover:opacity-100 transition">
            <BikeIcon size={34} />
            <span className="text-xs text-zinc-300 font-medium">{t("fleet.bike", "Moto")}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 opacity-85 hover:opacity-100 transition">
            <ScootyIcon size={34} />
            <span className="text-xs text-zinc-300 font-medium">{t("fleet.scooty", "Scooty")}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 opacity-85 hover:opacity-100 transition">
            <AutoIcon size={34} />
            <span className="text-xs text-zinc-300 font-medium">{t("fleet.auto", "Auto")}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 opacity-85 hover:opacity-100 transition">
            <CarIcon size={34} />
            <span className="text-xs text-zinc-300 font-medium">{t("fleet.car", "Premier")}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 opacity-85 hover:opacity-100 transition">
            <TruckIcon size={34} />
            <span className="text-xs text-zinc-300 font-medium">{t("fleet.truck", "Freight")}</span>
          </div>
        </motion.div>

        <button
          onClick={handleBookNow}
          className="mt-10 px-8 py-3.5 bg-white hover:bg-zinc-100 text-zinc-950 rounded-xl font-bold text-base transition active:scale-98"
        >
          {t("hero.bookARide", "Book a Ride")}
        </button>
      </div>
    </section>
  );
}

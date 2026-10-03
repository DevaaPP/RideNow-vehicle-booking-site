import { auth } from "@/auth";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";


import User from "@/models/user.model";
import connectDb from "@/lib/db";
import PublicHome from "@/components/PublicHome";
import { redirect, RedirectType } from "next/navigation";
import GeoUpdater from "@/components/GeoUpdater";

import ActiveRideBanner from "@/features/rides/components/ActiveRideBanner";

export default async function Home() {
  const session = await auth();

  // ✅ DATABASE = SINGLE SOURCE OF TRUTH
  if (session?.user?.id) {
    await connectDb();

    const user = await User.findById(session.user.id)
      .select("role vendorOnboardingStep vendorStatus")
      .lean();

    if (user?.role === "vendor") {
      redirect("/partners/dashboard");
    }
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <Nav />
      <GeoUpdater userId={session?.user?.id}/>
      {session?.user?.role === "admin" ? (
        redirect("/admin/dashboard", RedirectType.push)
      ) : (
        <PublicHome />
      )}

      {/* Floating active ride recovery pill when user has an ongoing trip */}
      <ActiveRideBanner variant="floating" />

      <Footer />
    </div>
  );
}

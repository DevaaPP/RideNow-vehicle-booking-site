import { signOut } from "next-auth/react";
import { resetSocketAuth } from "@/lib/socket";
import { store } from "@/redux/store";
import { setUserData } from "@/redux/userSlice";

/**
 * Performs an immediate, optimistic, and reliable sign-out:
 * 1. Clears Redux user data instantly.
 * 2. Clears socket connection and authentication tokens.
 * 3. Clears local drafts and transient session items.
 * 4. Calls NextAuth signOut with timeout protection (max 800ms) to clear session cookies.
 * 5. Performs a clean window redirect to purge stale in-memory React session caches.
 */
export async function performFastSignOut(redirectTo: string = "/") {
  // 1. Optimistic client state cleanup
  try {
    store.dispatch(setUserData(null));
  } catch {}

  try {
    resetSocketAuth();
  } catch {}

  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ridenow_booking_draft");
      sessionStorage.removeItem("ridenow_booking_draft");
    }
  } catch {}

  // 2. Clear NextAuth session cookie (max 800ms race so slow networks never freeze the UI)
  try {
    await Promise.race([
      signOut({ redirect: false }),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
  } catch (err) {
    console.warn("[SignOut] NextAuth signout warning:", err);
  }

  // 3. Clean document redirect flushes all stale React and NextAuth session memory
  if (typeof window !== "undefined") {
    window.location.href = redirectTo;
  }
}

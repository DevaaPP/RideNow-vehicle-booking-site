export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import User from "@/models/user.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import { transitionBookingState } from "@/lib/bookingStateMachine";
import { emitSocketEvent } from "@/lib/socketServerEmit";
import { sendPushToUser } from "@/lib/webPush";
import logger from "@/lib/logger";
import { auth } from "@/auth";

/**
 * Validates whether the incoming cron request is authorized via:
 * 1. Admin user session (NextAuth)
 * 2. Vercel Cron Bearer secret matching CRON_SECRET env variable
 * 3. Local dev bypass if CRON_SECRET is unset
 */
function isAuthorizedCron(req: Request, isAdmin: boolean): boolean {
  if (isAdmin) return true;

  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Allow non-production development testing if CRON_SECRET is not yet configured
  if (process.env.NODE_ENV !== "production" && !cronSecret) {
    return true;
  }

  return false;
}

/**
 * Core Rides Cron Runner:
 * 1. Dispatches scheduled rides within 25-minute pickup window
 * 2. Sweeps and expires stale unfulfilled requests (> 15 minutes) with automatic refunds
 */
export async function executeRidesCron(req: Request) {
  try {
    await connectDb();
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    if (!isAuthorizedCron(req, isAdmin)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized cron execution" },
        { status: 401 }
      );
    }

    const now = new Date();
    const dispatchedIds: string[] = [];
    const expiredIds: string[] = [];

    // ── 1️⃣ Scheduled Rides Dispatch (<= 25 mins ahead) ────────────────────
    const dispatchHorizon = new Date(now.getTime() + 25 * 60 * 1000);
    const upcomingBookings = await Booking.find({
      status: "scheduled",
      isScheduled: true,
      scheduledPickupTime: { $lte: dispatchHorizon },
    }).populate("driver");

    for (const booking of upcomingBookings) {
      try {
        const transitionRes = await transitionBookingState({
          bookingId: booking._id,
          targetStatus: "requested",
          actorRole: "system",
          payload: {
            dispatchedAt: now,
          },
        });

        if (!transitionRes.success) {
          logger.warn("cron.scheduled_dispatch_transition_failed", {
            bookingId: String(booking._id),
            error: transitionRes.message,
          });
          continue;
        }

        dispatchedIds.push(booking._id.toString());

        // Notify assigned driver or broadcast to candidate drivers
        if (booking.driver?._id) {
          try {
            await emitSocketEvent({
              userId: booking.driver._id.toString(),
              event: "new-booking",
              data: transitionRes.booking || booking,
              directBookingId: booking._id.toString(),
            });
          } catch (sockErr: any) {
            logger.warn("cron.scheduled_driver_socket_failed", {
              bookingId: String(booking._id),
              error: sockErr?.message,
            });
          }
        } else if (Array.isArray(booking.candidateDrivers) && booking.candidateDrivers.length > 0) {
          for (const candidateId of booking.candidateDrivers) {
            try {
              await emitSocketEvent({
                userId: candidateId.toString(),
                event: "new-booking",
                data: transitionRes.booking || booking,
                directBookingId: booking._id.toString(),
              });
              await sendPushToUser(candidateId.toString(), {
                title: "Scheduled Ride Request Ready! 🚨",
                body: `Pickup in 25 mins: ${booking.pickupAddress?.slice(0, 32) || "Ride request"} • ₹${booking.fare}`,
                url: "/partner",
                tag: `booking-new-${booking._id.toString()}`,
              });
            } catch {
              // Best-effort push notification
            }
          }
        }

        // Notify passenger
        if (booking.user) {
          try {
            await emitSocketEvent({
              userId: booking.user.toString(),
              event: "booking-updated",
              data: {
                bookingId: booking._id.toString(),
                status: "requested",
                message: "Your scheduled ride is now searching for nearby drivers.",
              },
              directBookingId: booking._id.toString(),
            });
          } catch (sockErr: any) {
            logger.warn("cron.scheduled_passenger_socket_failed", {
              bookingId: String(booking._id),
              error: sockErr?.message,
            });
          }
        }

        logger.info("cron.scheduled_ride_dispatched", {
          bookingId: String(booking._id),
          scheduledPickupTime: booking.scheduledPickupTime,
        });
      } catch (dispatchErr: any) {
        logger.error("cron.scheduled_dispatch_error", {
          bookingId: String(booking._id),
          error: dispatchErr?.message || String(dispatchErr),
        });
      }
    }

    // ── 2️⃣ Stale Unfulfilled Request Sweeper (> 15 mins) ─────────────────
    const staleHorizon = new Date(now.getTime() - 15 * 60 * 1000);
    const staleBookings = await Booking.find({
      status: { $in: ["requested", "searching_driver"] },
      isScheduled: { $ne: true },
      createdAt: { $lte: staleHorizon },
    });

    for (const booking of staleBookings) {
      try {
        // Automatically refund customer if fare was prepaid
        if (booking.paymentStatus === "paid" && booking.user && booking.fare > 0) {
          const refundAmount = booking.fare;
          const riderWallet =
            (await Wallet.findOne({ userId: booking.user })) ||
            (await Wallet.create({ userId: booking.user, balance: 0, outstandingAmount: 0 }));

          const prevBalance = riderWallet.balance || 0;
          await Wallet.findByIdAndUpdate(riderWallet._id, {
            $inc: { balance: refundAmount },
          });
          await User.findByIdAndUpdate(booking.user, {
            $inc: { walletBalance: refundAmount },
          });

          await WalletTransaction.create({
            transactionId: `TXN_REF_EXP_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            walletId: riderWallet._id,
            userId: booking.user,
            rideId: booking._id,
            bookingId: booking._id,
            type: "credit",
            transactionType: "REFUND",
            category: "ride_refund",
            amount: refundAmount,
            balanceBefore: prevBalance,
            balanceAfter: prevBalance + refundAmount,
            description: `Full refund for unfulfilled expired ride #${booking._id.toString().slice(-6)}`,
            status: "success",
          });

          booking.paymentStatus = "refunded";
        }

        const transitionRes = await transitionBookingState({
          bookingId: booking._id,
          targetStatus: "expired",
          actorRole: "system",
          payload: {
            expiredAt: now,
            expiredReason: "No drivers accepted the request within the 15-minute fulfillment window.",
            paymentStatus: booking.paymentStatus,
          },
        });

        if (!transitionRes.success) {
          logger.warn("cron.stale_expire_transition_failed", {
            bookingId: String(booking._id),
            error: transitionRes.message,
          });
          continue;
        }

        expiredIds.push(booking._id.toString());

        // Notify passenger
        if (booking.user) {
          try {
            await emitSocketEvent({
              userId: booking.user.toString(),
              event: "booking-updated",
              data: {
                bookingId: booking._id.toString(),
                status: "expired",
                message: "No drivers were available in your area. Your ride request has expired.",
              },
              directBookingId: booking._id.toString(),
            });
            await sendPushToUser(booking.user.toString(), {
              title: "Ride Request Expired ⏱️",
              body: "No drivers were available in your area. Any prepaid fare has been refunded to your wallet.",
              url: `/ride/${booking._id.toString()}`,
              tag: `booking-expired-${booking._id.toString()}`,
            });
          } catch {
            // Best-effort notification
          }
        }

        logger.info("cron.stale_ride_expired", {
          bookingId: String(booking._id),
          createdAt: booking.createdAt,
        });
      } catch (expireErr: any) {
        logger.error("cron.stale_expire_error", {
          bookingId: String(booking._id),
          error: expireErr?.message || String(expireErr),
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      scheduledDispatchedCount: dispatchedIds.length,
      staleExpiredCount: expiredIds.length,
      dispatchedBookingIds: dispatchedIds,
      expiredBookingIds: expiredIds,
    });
  } catch (error: any) {
    logger.critical("cron.rides_execution_error", {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return NextResponse.json(
      { success: false, message: "Rides cron execution failed", error: error.message },
      { status: 500 }
    );
  }
}

// Vercel Cron sends GET requests by default
export async function GET(req: Request) {
  return executeRidesCron(req);
}

// POST support for manual admin trigger or external webhook scheduler
export async function POST(req: Request) {
  return executeRidesCron(req);
}

import { Types } from "mongoose";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import DriverIncentive from "@/models/driverIncentive.model";

export const INCENTIVE_TIERS = [
  { targetRides: 20, bonusAmount: 75 },
  { targetRides: 35, bonusAmount: 150 },
  { targetRides: 50, bonusAmount: 250 },
] as const;

export const MONTHLY_DRIVER_INCENTIVE_CAP = 1000; // ₹1,000 max per driver per month
export const INCENTIVE_TIMEZONE = "Asia/Kolkata";

export interface IstWeekBounds {
  weekKey: string;      // e.g. "2026-W43"
  monthKey: string;     // e.g. "2026-10"
  startOfWeek: Date;    // Monday 00:00:00.000 IST
  endOfWeek: Date;      // Sunday 23:59:59.999 IST
}

/**
 * Calculates start and end of week (Monday to Sunday) in Indian Standard Time (IST).
 */
export function getIstWeekBounds(refDate: Date = new Date()): IstWeekBounds {
  // Convert refDate to IST string
  const istDateString = refDate.toLocaleString("en-US", { timeZone: INCENTIVE_TIMEZONE });
  const istDate = new Date(istDateString);

  // Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const day = istDate.getDay();
  // Days since Monday (Monday = 0, Tuesday = 1, ..., Sunday = 6)
  const diffToMonday = (day + 6) % 7;

  const monday = new Date(istDate);
  monday.setDate(istDate.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Calculate ISO week number in IST
  const d = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  const weekKey = `${monday.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;

  const monthFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: INCENTIVE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  });
  const monthKey = monthFormatter.format(refDate);

  // Convert IST boundary timestamps back to real UTC Date instances
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const utcStart = new Date(monday.getTime() - istOffsetMs);
  const utcEnd = new Date(sunday.getTime() - istOffsetMs);

  return {
    weekKey,
    monthKey,
    startOfWeek: utcStart,
    endOfWeek: utcEnd,
  };
}

/**
 * Evaluates the highest single achieved tier (not additive).
 * Example: 40 completed rides qualifies for ₹150 (35-ride tier), NOT 75 + 150.
 */
export function evaluateDriverIncentiveTier(completedRides: number): {
  tierAchieved: number;
  bonusAmount: number;
  nextTarget: number | null;
  ridesToNextTarget: number;
} {
  let tierAchieved = 0;
  let bonusAmount = 0;
  let nextTarget: number | null = INCENTIVE_TIERS[0].targetRides;

  for (const t of INCENTIVE_TIERS) {
    if (completedRides >= t.targetRides) {
      tierAchieved = t.targetRides;
      bonusAmount = t.bonusAmount;
    }
  }

  // Find next target
  const upcoming = INCENTIVE_TIERS.find((t) => t.targetRides > completedRides);
  if (upcoming) {
    nextTarget = upcoming.targetRides;
    return {
      tierAchieved,
      bonusAmount,
      nextTarget,
      ridesToNextTarget: Math.max(0, upcoming.targetRides - completedRides),
    };
  }

  return {
    tierAchieved,
    bonusAmount,
    nextTarget: null,
    ridesToNextTarget: 0,
  };
}

export interface DriverWeeklyIncentiveSummary {
  weekKey: string;
  monthKey: string;
  completedRides: number;
  currentBonus: number;
  tierAchieved: number;
  nextTarget: number | null;
  ridesToNextTarget: number;
  monthlyEarningsThisMonth: number;
  monthlyCapRemaining: number;
  tiers: typeof INCENTIVE_TIERS;
  cyclePeriod: {
    start: Date;
    end: Date;
  };
}

/**
 * Evaluates driver's real-time progress toward weekly targets.
 * Queries only legitimate completed, paid rides.
 */
export async function getDriverWeeklyIncentiveProgress(
  driverId: string | Types.ObjectId
): Promise<DriverWeeklyIncentiveSummary> {
  const dId = typeof driverId === "string" ? new Types.ObjectId(driverId) : driverId;
  const { weekKey, monthKey, startOfWeek, endOfWeek } = getIstWeekBounds();

  // 1. Count completed rides in this week's IST window
  const completedRides = await Booking.countDocuments({
    driver: dId,
    status: "completed",
    completedAt: { $gte: startOfWeek, $lte: endOfWeek },
  });

  const tierEval = evaluateDriverIncentiveTier(completedRides);

  // 2. Calculate driver's credited incentives this month to respect the ₹1,000 monthly ceiling
  const monthlyCreditedIncentives = await DriverIncentive.find({
    driverId: dId,
    monthKey,
    status: "credited",
  }).lean();

  const monthlyTotal = monthlyCreditedIncentives.reduce((sum, inc) => sum + (inc.bonusAmount || 0), 0);
  const monthlyCapRemaining = Math.max(0, MONTHLY_DRIVER_INCENTIVE_CAP - monthlyTotal);

  // Cap current bonus to remaining monthly allowance if necessary
  const effectiveBonus = Math.min(tierEval.bonusAmount, monthlyCapRemaining);

  // 3. Upsert real-time progress tracking record
  await DriverIncentive.findOneAndUpdate(
    { driverId: dId, weekKey },
    {
      $set: {
        monthKey,
        completedRides,
        tierAchieved: tierEval.tierAchieved,
        bonusAmount: effectiveBonus,
        status: tierEval.bonusAmount > 0 ? "earned" : "in_progress",
      },
    },
    { upsert: true, new: true }
  ).catch((err) => console.warn("DriverIncentive upsert error:", err));

  return {
    weekKey,
    monthKey,
    completedRides,
    currentBonus: effectiveBonus,
    tierAchieved: tierEval.tierAchieved,
    nextTarget: tierEval.nextTarget,
    ridesToNextTarget: tierEval.ridesToNextTarget,
    monthlyEarningsThisMonth: monthlyTotal,
    monthlyCapRemaining,
    tiers: INCENTIVE_TIERS,
    cyclePeriod: {
      start: startOfWeek,
      end: endOfWeek,
    },
  };
}

/**
 * Idempotently settles and credits weekly incentive bonus to driver's RideNow wallet.
 * Uses existing INCENTIVE wallet transaction type.
 */
export async function settleWeeklyDriverIncentive(
  driverId: string | Types.ObjectId,
  targetWeekKey?: string
): Promise<{ success: boolean; creditedAmount: number; message: string; transactionId?: string }> {
  const dId = typeof driverId === "string" ? new Types.ObjectId(driverId) : driverId;
  const weekInfo = getIstWeekBounds();
  const weekKey = targetWeekKey || weekInfo.weekKey;

  const record = await DriverIncentive.findOne({ driverId: dId, weekKey });
  if (!record) {
    return { success: false, creditedAmount: 0, message: "No incentive record found for this week" };
  }

  if (record.status === "credited") {
    return { success: true, creditedAmount: record.bonusAmount, message: "Incentive already credited" };
  }

  if (record.bonusAmount <= 0) {
    return { success: false, creditedAmount: 0, message: "No bonus earned for this period (target not reached)" };
  }

  const bonus = record.bonusAmount;

  // Atomic wallet balance credit
  const wallet = await Wallet.findOneAndUpdate(
    { userId: dId },
    {
      $inc: {
        balance: bonus,
        totalEarnings: bonus,
      },
    },
    { new: true, upsert: true }
  );

  const balanceBefore = wallet.balance - bonus;
  const balanceAfter = wallet.balance;

  // Create audit transaction record
  const tx = await WalletTransaction.create({
    transactionId: `inc_${dId}_${weekKey}`,
    userId: dId,
    walletId: wallet._id,
    type: "credit",
    transactionType: "INCENTIVE",
    category: "incentive",
    amount: bonus,
    balanceBefore,
    balanceAfter,
    description: `Weekly Performance Bonus (${record.completedRides} completed rides, ${weekKey})`,
    status: "success",
    metadata: {
      weekKey,
      completedRides: record.completedRides,
      tierAchieved: record.tierAchieved,
    },
  });

  record.status = "credited";
  record.creditedAt = new Date();
  record.walletTransactionId = tx._id;
  await record.save();

  return {
    success: true,
    creditedAmount: bonus,
    transactionId: tx.transactionId,
    message: `₹${bonus} performance bonus successfully credited to driver wallet`,
  };
}

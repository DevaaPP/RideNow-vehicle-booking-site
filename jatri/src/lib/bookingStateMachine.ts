/**
 * RideNow Booking State Machine (Phase 4 Core Architecture)
 * Enforces canonical state transitions, role-based authorization, idempotent state checks,
 * and atomic concurrency locks against race conditions.
 */
import mongoose, { Types } from "mongoose";
import Booking, { BookingStatus, IBooking } from "@/models/booking.model";

export type AllowedTransitionRole = "user" | "driver" | "admin" | "system";

export interface TransitionContext {
  bookingId: string | Types.ObjectId;
  targetStatus: BookingStatus;
  actorId?: string | Types.ObjectId;
  actorRole: AllowedTransitionRole;
  payload?: Record<string, any>;
}

export interface TransitionResult {
  success: boolean;
  booking?: IBooking;
  previousStatus?: BookingStatus;
  currentStatus: BookingStatus;
  isDuplicateCall?: boolean;
  message?: string;
  errorCode?: "NOT_FOUND" | "UNAUTHORIZED" | "INVALID_TRANSITION" | "RACE_CONDITION" | "TERMINAL_STATE";
}

/**
 * Valid state transitions mapping. Terminal states have empty target sets.
 */
export const ALLOWED_TRANSITIONS: Record<string, BookingStatus[]> = {
  requested: ["searching_driver", "driver_assigned", "awaiting_payment", "confirmed", "cancelled", "expired", "no_drivers_available"],
  searching_driver: ["driver_assigned", "awaiting_payment", "confirmed", "cancelled", "expired", "no_drivers_available"],
  awaiting_payment: ["confirmed", "driver_assigned", "driver_arriving", "driver_arrived", "cancelled", "expired", "payment_failed"],
  confirmed: ["driver_assigned", "driver_arriving", "driver_arrived", "started", "ride_started", "cancelled", "disputed"],
  driver_assigned: ["driver_arriving", "driver_arrived", "started", "ride_started", "cancelled", "disputed"],
  driver_arriving: ["driver_arrived", "started", "ride_started", "cancelled", "disputed"],
  driver_arrived: ["started", "ride_started", "cancelled", "disputed"],
  started: ["ride_in_progress", "completed", "cancelled", "disputed"],
  ride_started: ["ride_in_progress", "completed", "cancelled", "disputed"],
  ride_in_progress: ["completed", "cancelled", "disputed"],

  // Terminal states (no further transitions allowed)
  completed: [],
  cancelled: [],
  expired: [],
  no_drivers_available: [],
  payment_failed: [],
  disputed: [],
};

/**
 * Role-based permission matrix for triggering state transitions.
 */
export const ROLE_TRANSITION_PERMISSIONS: Record<string, AllowedTransitionRole[]> = {
  searching_driver: ["system", "admin"],
  driver_assigned: ["driver", "system", "admin"],
  awaiting_payment: ["driver", "system", "admin"],
  confirmed: ["user", "driver", "system", "admin"],
  driver_arriving: ["driver", "system", "admin"],
  driver_arrived: ["driver", "system", "admin"],
  started: ["driver", "system", "admin"],
  ride_started: ["driver", "system", "admin"],
  ride_in_progress: ["driver", "system", "admin"],
  completed: ["driver", "system", "admin"],
  cancelled: ["user", "driver", "system", "admin"],
  expired: ["system", "admin"],
  no_drivers_available: ["system", "admin"],
  payment_failed: ["system", "user", "admin"],
  disputed: ["user", "driver", "system", "admin"],
};

/**
 * Checks whether a proposed state transition is valid from the current state.
 */
export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return true; // Idempotent check
  const allowedNext = ALLOWED_TRANSITIONS[from] || [];
  return allowedNext.includes(to);
}

/**
 * Checks whether the specified actor role is authorized to perform the transition.
 */
export function isAuthorizedForTransition(targetStatus: BookingStatus, role: AllowedTransitionRole): boolean {
  const allowedRoles = ROLE_TRANSITION_PERMISSIONS[targetStatus] || ["admin", "system"];
  return allowedRoles.includes(role);
}

/**
 * Executes an atomic, race-condition safe state transition.
 */
export async function transitionBookingState(ctx: TransitionContext): Promise<TransitionResult> {
  const { bookingId, targetStatus, actorId, actorRole, payload = {} } = ctx;

  const currentBooking = await Booking.findById(bookingId);
  if (!currentBooking) {
    return {
      success: false,
      currentStatus: "requested",
      message: "Booking record not found.",
      errorCode: "NOT_FOUND",
    };
  }

  const currentStatus = currentBooking.status;

  // 1. Idempotency Check (If already in target state, return duplicate success)
  if (currentStatus === targetStatus) {
    return {
      success: true,
      booking: currentBooking,
      previousStatus: currentStatus,
      currentStatus: targetStatus,
      isDuplicateCall: true,
      message: `Booking is already in state '${targetStatus}'.`,
    };
  }

  // 2. Terminal State Check
  if (["completed", "cancelled", "expired", "no_drivers_available"].includes(currentStatus)) {
    return {
      success: false,
      previousStatus: currentStatus,
      currentStatus,
      message: `Cannot transition booking ${bookingId} from terminal state '${currentStatus}' to '${targetStatus}'.`,
      errorCode: "TERMINAL_STATE",
    };
  }

  // 3. Allowed Transition Check
  if (!isValidTransition(currentStatus, targetStatus)) {
    return {
      success: false,
      previousStatus: currentStatus,
      currentStatus,
      message: `Invalid state transition from '${currentStatus}' to '${targetStatus}'.`,
      errorCode: "INVALID_TRANSITION",
    };
  }

  // 4. Role Authorization Check
  if (!isAuthorizedForTransition(targetStatus, actorRole)) {
    return {
      success: false,
      previousStatus: currentStatus,
      currentStatus,
      message: `Role '${actorRole}' is not authorized to transition booking to '${targetStatus}'.`,
      errorCode: "UNAUTHORIZED",
    };
  }

  // 5. Driver Ownership Authorization Check
  if (actorRole === "driver" && actorId) {
    const driverIdStr = actorId.toString();

    // If driver is attempting to accept a ride, enforce candidate check or open search
    if (["driver_assigned", "awaiting_payment"].includes(targetStatus)) {
      if (currentBooking.driver && currentBooking.driver.toString() !== driverIdStr && currentBooking.status !== "requested") {
        return {
          success: false,
          previousStatus: currentStatus,
          currentStatus,
          message: "Ride has already been accepted by another driver.",
          errorCode: "RACE_CONDITION",
        };
      }
    } else if (currentBooking.driver && currentBooking.driver.toString() !== driverIdStr) {
      return {
        success: false,
        previousStatus: currentStatus,
        currentStatus,
        message: "You are not the assigned driver for this ride.",
        errorCode: "UNAUTHORIZED",
      };
    }
  }

  // 6. User Ownership Authorization Check
  if (actorRole === "user" && actorId) {
    const userIdStr = actorId.toString();
    if (currentBooking.user.toString() !== userIdStr) {
      return {
        success: false,
        previousStatus: currentStatus,
        currentStatus,
        message: "You are not authorized to modify this booking.",
        errorCode: "UNAUTHORIZED",
      };
    }
  }

  // 7. Atomic Mongo Update for Concurrency Protection
  const updateDoc: Record<string, any> = {
    $set: {
      status: targetStatus,
      ...payload,
    },
  };

  // Set transition timestamps automatically
  const now = new Date();
  if (targetStatus === "driver_assigned" || targetStatus === "awaiting_payment") {
    updateDoc.$set.acceptedAt = updateDoc.$set.acceptedAt || now;
  } else if (targetStatus === "started" || targetStatus === "ride_started") {
    updateDoc.$set.startedAt = updateDoc.$set.startedAt || now;
  } else if (targetStatus === "completed") {
    updateDoc.$set.completedAt = updateDoc.$set.completedAt || now;
    updateDoc.$set.actualDropoffTime = updateDoc.$set.actualDropoffTime || now;
  } else if (targetStatus === "cancelled") {
    updateDoc.$set.cancelledAt = updateDoc.$set.cancelledAt || now;
  }

  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: currentStatus },
    updateDoc,
    { new: true }
  );

  if (!updatedBooking) {
    return {
      success: false,
      previousStatus: currentStatus,
      currentStatus: "requested",
      message: "State transition failed due to concurrent modification by another request.",
      errorCode: "RACE_CONDITION",
    };
  }

  return {
    success: true,
    booking: updatedBooking,
    previousStatus: currentStatus,
    currentStatus: targetStatus,
    isDuplicateCall: false,
  };
}

/**
 * RideNow Driver Matching Engine (Phase 5 Architecture)
 * Responsible for driver eligibility filtering, location freshness checks,
 * duplicate assignment prevention, ranked candidate waterfall queues, and timeout escalations.
 */
import { Types } from "mongoose";
import User, { IUser } from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import Booking, { IBooking } from "@/models/booking.model";
import { haversineDistance } from "@/lib/routeUtils";
import { validateServiceArea } from "@/lib/serviceArea";
import { transitionBookingState } from "@/lib/bookingStateMachine";
import axios from "axios";

export interface CandidateDriver {
  driverId: Types.ObjectId;
  driverName: string;
  driverMobile: string;
  distanceKm: number;
  estimatedEtaMinutes: number;
  vehicleId: Types.ObjectId;
  vehicleModel: string;
  vehicleNumber: string;
}

export interface MatchingResult {
  success: boolean;
  candidates: CandidateDriver[];
  totalEligibleFound: number;
  searchRadiusKm: number;
  logs: string[];
}

export interface EscalationResult {
  success: boolean;
  status: string;
  currentDriverIndex: number;
  nextDriverId?: Types.ObjectId;
  message: string;
  candidatesExhausted?: boolean;
}

/**
 * Finds eligible, available, and online drivers ranked by distance to pickup.
 */
export async function findEligibleCandidates(options: {
  pickupLng: number;
  pickupLat: number;
  vehicleType: string;
  maxRadiusKm?: number;
  excludeDriverIds?: (string | Types.ObjectId)[];
  maxCandidates?: number;
}): Promise<MatchingResult> {
  const {
    pickupLng,
    pickupLat,
    vehicleType,
    maxRadiusKm = 10,
    excludeDriverIds = [],
    maxCandidates = 5,
  } = options;

  const logs: string[] = [];
  logs.push(`Matching request initiated for ${vehicleType} at [${pickupLng}, ${pickupLat}].`);

  // 1. Service Area Verification (log warning without hard-blocking dispatch)
  const areaCheck = validateServiceArea(pickupLat, pickupLng);
  if (!areaCheck.isSupported) {
    logs.push(`Location service area notice: ${areaCheck.message || "Operating outside standard boundary"}. Proceeding with matching.`);
  }

  // 2. Fetch active vehicles of matching type (case-insensitive & category aliases)
  const normalizedType = vehicleType.toLowerCase();
  let candidateTypes: string[] = [normalizedType];
  if (normalizedType === "intercity") {
    candidateTypes = ["car", "priority", "intercity", "mini", "premier", "cab", "sedan"];
  } else if (normalizedType === "mini") {
    candidateTypes = ["mini", "car", "priority", "intercity", "premier", "cab", "sedan"];
  } else if (normalizedType === "priority") {
    candidateTypes = ["priority", "car", "mini", "intercity", "premier", "suv", "cab"];
  } else if (normalizedType === "car") {
    candidateTypes = ["car", "mini", "priority", "intercity", "premier", "cab", "sedan"];
  } else if (normalizedType === "scooty") {
    candidateTypes = ["scooty", "bike", "two-wheeler", "scooter"];
  } else if (normalizedType === "bike") {
    candidateTypes = ["bike", "scooty", "two-wheeler", "motorcycle"];
  } else if (normalizedType === "auto") {
    candidateTypes = ["auto", "three-wheeler", "rickshaw"];
  } else if (normalizedType === "loading") {
    candidateTypes = ["loading", "truck", "commercial", "express"];
  } else if (normalizedType === "truck") {
    candidateTypes = ["truck", "loading", "commercial", "heavy"];
  }

  const typeRegexes = candidateTypes.map((t) => new RegExp(`^${t}$`, "i"));
  const isCarCategory = ["car", "mini", "priority", "intercity", "premier"].includes(normalizedType);

  const typeFilter = isCarCategory
    ? {
        $or: [
          { type: { $in: typeRegexes } },
          { type: { $in: ["car", "mini", "priority", "intercity", "premier", "cab", "sedan"].map((t) => new RegExp(`^${t}$`, "i")) } },
          { type: { $exists: false } },
          { type: null },
          { type: "" },
        ],
      }
    : { type: { $in: typeRegexes } };

  // Fetch online vendors first to ensure live drivers are always matched
  const onlineVendors = await User.find({
    isOnline: { $in: [true, "true"] },
    isVendorBlocked: { $ne: true },
    location: { $exists: true },
  }).lean();

  logs.push(`Found ${onlineVendors.length} online vendors currently active in system.`);

  const activeVehicles = await Vehicle.find({
    ...typeFilter,
    status: { $ne: "rejected" },
  }).lean();

  // If online vendors exist, ensure each has a recognized vehicle in activeVehicles
  if (onlineVendors.length > 0) {
    for (const vendor of onlineVendors) {
      const vIdStr = vendor._id.toString();
      const hasVeh = activeVehicles.some((v) => v.owner && v.owner.toString() === vIdStr);
      if (!hasVeh) {
        // Look up any existing non-rejected vehicle for this online vendor
        const existingVeh = await Vehicle.findOne({ owner: vendor._id, status: { $ne: "rejected" } }).lean();
        if (existingVeh) {
          activeVehicles.push(existingVeh);
        } else {
          // Auto-create matching vehicle for online vendor
          const isTwoWheeler = ["scooty", "bike"].includes(normalizedType);
          const isAuto = normalizedType === "auto";
          const isGoods = ["loading", "truck"].includes(normalizedType);
          const newVeh = await Vehicle.create({
            owner: vendor._id,
            type: (isTwoWheeler ? normalizedType : isAuto ? "auto" : isGoods ? normalizedType : "car") as any,
            number: "AS-01-RN-" + Math.floor(1000 + Math.random() * 9000),
            vehicleModel: isTwoWheeler ? "Two Wheeler" : isAuto ? "Auto Rickshaw" : isGoods ? "Delivery Vehicle" : "RideNow Cab",
            status: "approved",
            isActive: true,
          });
          activeVehicles.push(newVeh.toObject());
        }
      }
    }
  }

  // Ensure active status on vehicles
  for (const v of activeVehicles) {
    if (v.isActive === false) {
      await Vehicle.updateOne({ _id: v._id }, { isActive: true }).catch(() => {});
      (v as any).isActive = true;
    }
  }

  if (!activeVehicles.length) {
    logs.push(`No active eligible ${normalizedType} vehicles found in fleet.`);
    return {
      success: false,
      candidates: [],
      totalEligibleFound: 0,
      searchRadiusKm: maxRadiusKm,
      logs,
    };
  }

  const eligibleOwnerObjectIds: any[] = [];
  for (const v of activeVehicles) {
    if (!v.owner) continue;
    const str = v.owner.toString();
    eligibleOwnerObjectIds.push(str);
    try {
      eligibleOwnerObjectIds.push(new Types.ObjectId(str));
    } catch (e) {}
  }

  // 3. Duplicate Assignment Prevention: Freshness threshold applied to avoid locking out drivers from stale test bookings
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const busyDriverIds = await Booking.find({
    status: {
      $in: [
        "confirmed",
        "driver_assigned",
        "driver_arriving",
        "driver_arrived",
        "started",
        "ride_started",
        "ride_in_progress",
      ],
    },
    updatedAt: { $gte: threeHoursAgo },
  }).distinct("driver");

  const pendingPaymentDriverIds = await Booking.find({
    status: "awaiting_payment",
    updatedAt: { $gte: tenMinutesAgo },
  }).distinct("driver");

  const pendingOfferDriverIds = await Booking.find({
    status: { $in: ["requested", "searching_driver"] },
    driver: { $exists: true, $ne: null },
    updatedAt: { $gte: new Date(Date.now() - 25 * 1000) },
  }).distinct("driver");

  const excludedSet = new Set([
    ...busyDriverIds.map((id) => id.toString()),
    ...pendingPaymentDriverIds.map((id) => id.toString()),
    ...pendingOfferDriverIds.map((id) => id.toString()),
    ...excludeDriverIds.map((id) => id.toString()),
  ]);

  logs.push(
    `Filtered out ${busyDriverIds.length} busy drivers, ${pendingPaymentDriverIds.length} pending-payment drivers, ${pendingOfferDriverIds.length} pending-offer drivers, and ${excludeDriverIds.length} explicitly excluded drivers.`
  );

  // 4. Query online vendors/drivers who own these vehicles (supports both ObjectId & string)
  const candidateDrivers = await User.find({
    _id: { $in: eligibleOwnerObjectIds },
    isOnline: { $in: [true, "true"] },
    isVendorBlocked: { $ne: true },
    location: { $exists: true },
  }).lean();

  logs.push(`Found ${candidateDrivers.length} online vendors before location & freshness filtering.`);

  // 5. Dual freshness verification:
  // - Heartbeat freshness: relaxed to 24 hours for online drivers
  // - GPS freshness: relaxed to 24 hours for online drivers
  const now = Date.now();
  const MAX_GPS_STALENESS_MS = 24 * 60 * 60 * 1000;
  const MAX_HEARTBEAT_STALENESS_MS = 24 * 60 * 60 * 1000;

  const eligibleList: CandidateDriver[] = [];
  const secondaryRadiusList: CandidateDriver[] = [];

  for (const driver of candidateDrivers) {
    const driverIdStr = driver._id.toString();
    if (excludedSet.has(driverIdStr)) continue;

    // A0. Verify driver cancellation dispatch cooldown lockout
    if (driver.dispatchBlockedUntil && new Date(driver.dispatchBlockedUntil).getTime() > now) {
      const remainingSecs = Math.round((new Date(driver.dispatchBlockedUntil).getTime() - now) / 1000);
      logs.push(
        `Driver ${driver._id} excluded: under cancellation cooldown for ${remainingSecs}s.`
      );
      continue;
    }

    // A. Verify session heartbeat responsiveness
    const heartbeatTime = driver.lastHeartbeat
      ? new Date(driver.lastHeartbeat).getTime()
      : driver.lastLocationUpdate
      ? new Date(driver.lastLocationUpdate).getTime()
      : driver.updatedAt
      ? new Date(driver.updatedAt).getTime()
      : now;
    const heartbeatAge = now - heartbeatTime;
    if (heartbeatAge > MAX_HEARTBEAT_STALENESS_MS) {
      logs.push(
        `Driver ${driver._id} excluded: stale session heartbeat (${Math.round(heartbeatAge / 1000)}s ago).`
      );
      continue;
    }

    // B. Verify GPS coordinates
    const driverCoords = driver.location?.coordinates;
    if (!driverCoords || driverCoords.length < 2 || isNaN(driverCoords[0]) || isNaN(driverCoords[1])) {
      logs.push(`Driver ${driver._id} excluded: invalid GPS coordinates.`);
      continue;
    }

    const gpsTime = driver.lastLocationUpdate
      ? new Date(driver.lastLocationUpdate).getTime()
      : driver.updatedAt
      ? new Date(driver.updatedAt).getTime()
      : now;
    const gpsAge = now - gpsTime;
    if (gpsAge > MAX_GPS_STALENESS_MS) {
      logs.push(
        `Driver ${driver._id} excluded: stale GPS coordinates (${Math.round(gpsAge / 1000)}s ago).`
      );
      continue;
    }

    const [dLng, dLat] = driverCoords;
    const distanceKm = Number(haversineDistance([pickupLng, pickupLat], [dLng, dLat]).toFixed(2));

    const vehicleDoc = activeVehicles.find((v) => v.owner && v.owner.toString() === driverIdStr);
    if (vehicleDoc) {
      const candidateObj: CandidateDriver = {
        driverId: driver._id,
        driverName: driver.name || "Driver",
        driverMobile: driver.mobileNumber || "",
        distanceKm,
        estimatedEtaMinutes: Math.max(2, Math.round(distanceKm * 2.5)),
        vehicleId: vehicleDoc._id,
        vehicleModel: vehicleDoc.vehicleModel || "Vehicle",
        vehicleNumber: vehicleDoc.number || "",
      };

      if (distanceKm <= maxRadiusKm) {
        eligibleList.push(candidateObj);
      } else if (distanceKm <= 25) {
        secondaryRadiusList.push(candidateObj);
      }
    }
  }

  // If no candidates found in strict primary radius (e.g. 10 km), fallback to secondary metro radius
  let finalCandidates = eligibleList;
  let effectiveRadius = maxRadiusKm;
  if (finalCandidates.length === 0 && secondaryRadiusList.length > 0) {
    finalCandidates = secondaryRadiusList;
    effectiveRadius = 25;
    logs.push(`No drivers within ${maxRadiusKm} km; expanded search radius to 25 km to include nearest available driver.`);
  }

  // 6. Sort candidates by closest distance
  finalCandidates.sort((a, b) => a.distanceKm - b.distanceKm);

  const topCandidates = finalCandidates.slice(0, maxCandidates);
  logs.push(`Selected top ${topCandidates.length} nearest candidates out of ${finalCandidates.length} eligible.`);

  return {
    success: topCandidates.length > 0,
    candidates: topCandidates,
    totalEligibleFound: finalCandidates.length,
    searchRadiusKm: effectiveRadius,
    logs,
  };
}

/**
 * Escalates a booking to the next candidate driver in the waterfall queue upon rejection or timeout.
 */
export async function escalateToNextCandidate(
  bookingId: string | Types.ObjectId,
  reason: "timeout" | "rejected" | "cancelled" = "timeout"
): Promise<EscalationResult> {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return {
      success: false,
      status: "not_found",
      currentDriverIndex: 0,
      message: "Booking not found.",
    };
  }

  if (booking.status !== "requested" && booking.status !== "searching_driver") {
    return {
      success: false,
      status: booking.status,
      currentDriverIndex: booking.currentDriverIndex || 0,
      message: `Booking is in state '${booking.status}' and cannot be escalated.`,
    };
  }

  // Record current driver into cancelled/rejected list
  if (booking.driver) {
    booking.cancelledDriverIds = booking.cancelledDriverIds || [];
    if (!booking.cancelledDriverIds.some((id: any) => id.toString() === booking.driver.toString())) {
      booking.cancelledDriverIds.push(booking.driver);
    }
  }

  const nextIndex = (booking.currentDriverIndex || 0) + 1;
  const candidates = booking.candidateDrivers || [];

  if (nextIndex < candidates.length) {
    const nextDriverId = candidates[nextIndex];
    const nextDriver = await User.findById(nextDriverId).select("name mobileNumber isOnline");

    // Verify candidate driver is still online and eligible
    if (nextDriver && nextDriver.isOnline) {
      booking.driver = nextDriver._id;
      booking.driverMobileNumber = nextDriver.mobileNumber || "";
      booking.currentDriverIndex = nextIndex;
      await booking.save();

      // Dispatch real-time WebSocket notification to candidate driver
      try {
        const socketServer = process.env.NEXT_PUBLIC_SOCKET_SERVER;
        const socketSecret = process.env.SOCKET_INTERNAL_SECRET || "ridenow-internal-secret-2026";
        if (socketServer) {
          await axios.post(
            `${socketServer}/emit`,
            {
              userId: nextDriver._id.toString(),
              event: "new-booking",
              data: booking,
            },
            {
              headers: { "x-socket-secret": socketSecret },
            }
          );
        }
      } catch (err) {
        console.warn("Socket notification error on dispatch escalation:", err);
      }

      return {
        success: true,
        status: booking.status,
        currentDriverIndex: nextIndex,
        nextDriverId: nextDriver._id,
        message: `Escalated to candidate driver index ${nextIndex}.`,
      };
    }
  }

  // Candidates exhausted: Check search elapsed window (90s)
  const createdAtMs = booking.createdAt ? new Date(booking.createdAt).getTime() : Date.now();
  const elapsedSeconds = (Date.now() - createdAtMs) / 1000;

  if (elapsedSeconds < 90 && booking.pickupLocation?.coordinates) {
    const [pLng, pLat] = booking.pickupLocation.coordinates;
    const vehicleType = booking.fareBreakdown?.vehicleType || "car";

    // Re-sweep nearby drivers
    const freshSweep = await findEligibleCandidates({
      pickupLng: pLng,
      pickupLat: pLat,
      vehicleType,
      maxRadiusKm: 12,
      excludeDriverIds: booking.cancelledDriverIds || [],
    });

    if (freshSweep.candidates.length > 0) {
      const newCandidateIds = freshSweep.candidates.map((c) => c.driverId);
      booking.candidateDrivers = [...(booking.candidateDrivers || []), ...newCandidateIds];
      const newDriver = freshSweep.candidates[0];

      booking.driver = newDriver.driverId;
      booking.driverMobileNumber = newDriver.driverMobile;
      booking.currentDriverIndex = booking.candidateDrivers.length - freshSweep.candidates.length;
      await booking.save();

      try {
        const socketServer = process.env.NEXT_PUBLIC_SOCKET_SERVER;
        const socketSecret = process.env.SOCKET_INTERNAL_SECRET || "ridenow-internal-secret-2026";
        if (socketServer) {
          await axios.post(
            `${socketServer}/emit`,
            {
              userId: newDriver.driverId.toString(),
              event: "new-booking",
              data: booking,
            },
            {
              headers: { "x-socket-secret": socketSecret },
            }
          );
        }
      } catch (err) {
        console.warn("Socket notification error on fresh candidate sweep:", err);
      }

      return {
        success: true,
        status: booking.status,
        currentDriverIndex: booking.currentDriverIndex,
        nextDriverId: newDriver.driverId,
        message: "Found new candidate drivers on proximity sweep.",
      };
    }
  }

  // Transition to no_drivers_available via State Machine
  await transitionBookingState({
    bookingId: booking._id,
    targetStatus: "no_drivers_available",
    actorRole: "system",
  });

  return {
    success: false,
    status: "no_drivers_available",
    currentDriverIndex: nextIndex,
    candidatesExhausted: true,
    message: "No drivers available within operational range.",
  };
}

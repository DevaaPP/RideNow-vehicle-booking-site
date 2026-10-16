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

  // 1. Service Area Verification
  const areaCheck = validateServiceArea(pickupLat, pickupLng);
  if (!areaCheck.isSupported) {
    logs.push(`Location outside service area: ${areaCheck.message}`);
    return {
      success: false,
      candidates: [],
      totalEligibleFound: 0,
      searchRadiusKm: maxRadiusKm,
      logs,
    };
  }

  // 2. Fetch active vehicles of matching type
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

  let activeVehicles = await Vehicle.find({
    ...typeFilter,
    isActive: { $ne: false },
    status: { $ne: "rejected" },
  }).lean();

  // If no vehicles matched by strict category, check if online drivers exist with any registered vehicle
  if (!activeVehicles.length) {
    const onlineVendors = await User.find({
      isOnline: { $in: [true, "true"] },
      isVendorBlocked: { $ne: true },
      location: { $exists: true },
    }).select("_id").lean();

    if (onlineVendors.length > 0) {
      const vendorIds = onlineVendors.map((v) => v._id);
      activeVehicles = await Vehicle.find({
        owner: { $in: vendorIds },
        isActive: { $ne: false },
        status: { $ne: "rejected" },
      }).lean();

      // If an online driver doesn't have a vehicle document yet, create one for immediate dispatch
      if (!activeVehicles.length) {
        for (const vendor of onlineVendors) {
          const newVeh = await Vehicle.create({
            owner: vendor._id,
            type: (["scooty", "bike"].includes(normalizedType) ? normalizedType : "car") as any,
            number: "AS-01-RN-" + Math.floor(1000 + Math.random() * 9000),
            vehicleModel: ["scooty", "bike"].includes(normalizedType) ? "Two Wheeler" : "RideNow Cab",
            status: "approved",
            isActive: true,
          });
          activeVehicles.push(newVeh.toObject());
        }
      }
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

  // 3. Duplicate Assignment Prevention: Find drivers currently busy with an active trip
  // or reserved with an active 25-second pending dispatch countdown
  const busyDriverIds = await Booking.find({
    status: {
      $in: [
        "awaiting_payment",
        "confirmed",
        "driver_assigned",
        "driver_arriving",
        "driver_arrived",
        "started",
        "ride_started",
        "ride_in_progress",
      ],
    },
  }).distinct("driver");

  const pendingOfferDriverIds = await Booking.find({
    status: { $in: ["requested", "searching_driver"] },
    driver: { $exists: true, $ne: null },
    updatedAt: { $gte: new Date(Date.now() - 25 * 1000) },
  }).distinct("driver");

  const excludedSet = new Set([
    ...busyDriverIds.map((id) => id.toString()),
    ...pendingOfferDriverIds.map((id) => id.toString()),
    ...excludeDriverIds.map((id) => id.toString()),
  ]);

  logs.push(
    `Filtered out ${busyDriverIds.length} busy drivers, ${pendingOfferDriverIds.length} pending-offer drivers, and ${excludeDriverIds.length} explicitly excluded drivers.`
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
  // - Heartbeat freshness: relaxed to 30 mins (stationary/screen-lock resilience)
  // - GPS freshness: relaxed to 30 mins
  const now = Date.now();
  const MAX_GPS_STALENESS_MS = 30 * 60 * 1000;
  const MAX_HEARTBEAT_STALENESS_MS = 30 * 60 * 1000;

  const eligibleList: CandidateDriver[] = [];

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

    if (distanceKm <= maxRadiusKm) {
      const vehicleDoc = activeVehicles.find((v) => v.owner.toString() === driverIdStr);
      if (vehicleDoc) {
        eligibleList.push({
          driverId: driver._id,
          driverName: driver.name || "Driver",
          driverMobile: driver.mobileNumber || "",
          distanceKm,
          estimatedEtaMinutes: Math.max(2, Math.round(distanceKm * 2.5)),
          vehicleId: vehicleDoc._id,
          vehicleModel: vehicleDoc.vehicleModel || "Vehicle",
          vehicleNumber: vehicleDoc.number || "",
        });
      }
    }
  }

  // 6. Sort candidates by closest distance
  eligibleList.sort((a, b) => a.distanceKm - b.distanceKm);

  const topCandidates = eligibleList.slice(0, maxCandidates);
  logs.push(`Selected top ${topCandidates.length} nearest candidates out of ${eligibleList.length} eligible.`);

  return {
    success: topCandidates.length > 0,
    candidates: topCandidates,
    totalEligibleFound: eligibleList.length,
    searchRadiusKm: maxRadiusKm,
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

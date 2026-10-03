import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import FareConfig from "@/models/fareConfig.model";
import { DEFAULT_VEHICLE_RATES } from "@/lib/fareEngine";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    let configs = await FareConfig.find({});
    
    // Auto-seed if empty
    if (!configs.length) {
      const seedData = Object.entries(DEFAULT_VEHICLE_RATES).map(([vehicleType, rate]) => ({
        vehicleType,
        ...rate,
      }));
      await FareConfig.insertMany(seedData);
      configs = await FareConfig.find({});
    }

    return NextResponse.json({ success: true, configs });
  } catch (error) {
    console.error("ADMIN GET PRICING ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const body = await req.json();
    const {
      vehicleType,
      baseFare,
      pricePerKm,
      pricePerMinute = 0,
      waitingChargePerMinute = 2.5,
      freeWaitingMinutes = 3,
      platformFee = 15,
      taxRate = 0.05,
      cancellationFee = 50,
      multiplier = 1.0,
      minDistance = 0,
      maxDistance = 9999,
    } = body;

    if (!vehicleType || baseFare === undefined || pricePerKm === undefined) {
      return NextResponse.json({ message: "Missing required fields (vehicleType, baseFare, pricePerKm)" }, { status: 400 });
    }

    const config = await FareConfig.findOneAndUpdate(
      { vehicleType: vehicleType.toLowerCase() },
      {
        baseFare: Number(baseFare),
        pricePerKm: Number(pricePerKm),
        pricePerMinute: Number(pricePerMinute),
        waitingChargePerMinute: Number(waitingChargePerMinute),
        freeWaitingMinutes: Number(freeWaitingMinutes),
        platformFee: Number(platformFee),
        taxRate: Number(taxRate),
        cancellationFee: Number(cancellationFee),
        multiplier: Number(multiplier),
        minDistance: Number(minDistance),
        maxDistance: Number(maxDistance),
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("ADMIN POST PRICING ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

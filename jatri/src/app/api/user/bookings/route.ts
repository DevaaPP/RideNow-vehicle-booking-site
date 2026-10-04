import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Booking from "@/models/booking.model";
import { parsePagination, getRequestId } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    // 1️⃣ Connect DB
    await connectDb();

    // 2️⃣ Auth Check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", meta: { requestId } },
        { status: 401 }
      );
    }

    // 3️⃣ Pagination & Status Filtering
    const { page, limit, skip } = parsePagination(req, 20, 100);
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const query: any = { user: session.user.id };
    if (statusFilter && statusFilter !== "all") {
      query.status = statusFilter;
    }

    // 4️⃣ Execute Count & Query in parallel
    const [total, bookings] = await Promise.all([
      Booking.countDocuments(query),
      Booking.find(query)
        .populate({
          path: "vehicle",
          select: "vehicleModel imageUrl type",
        })
        .populate({
          path: "driver",
          select: "name mobileNumber",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // 5️⃣ Success Response
    return NextResponse.json(
      {
        success: true,
        bookings: bookings || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: { "X-Request-Id": requestId },
      }
    );
  } catch (error: any) {
    console.error(`[${requestId}] USER BOOKINGS API ERROR:`, error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong fetching bookings",
        error: error.message,
        meta: { requestId },
      },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import { escalateToNextCandidate } from "@/lib/driverMatchingEngine";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const id = (await context.params).id;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const result = await escalateToNextCandidate(id, "timeout");

  return NextResponse.json({
    success: result.success,
    status: result.status,
    currentDriverIndex: result.currentDriverIndex,
    message: result.message,
  });
}

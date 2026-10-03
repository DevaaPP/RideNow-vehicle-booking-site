import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/webPush";

export async function GET() {
  return NextResponse.json({
    publicKey: getVapidPublicKey(),
  });
}

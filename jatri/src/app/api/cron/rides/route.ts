export const dynamic = "force-dynamic";
export const revalidate = 0;

import { executeRidesCron } from "@/app/api/booking/scheduled/dispatch/route";

export async function GET(req: Request) {
  return executeRidesCron(req);
}

export async function POST(req: Request) {
  return executeRidesCron(req);
}

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processNotificationJobs } from "@/lib/notifications";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.MAINTENANCE_SECRET;
  const token = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(token) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(token),Buffer.from(expected))) return NextResponse.json({error:"Unauthorized"},{status:401});
  const db = createAdminClient();
  if (!db) return NextResponse.json({error:"Unavailable"},{status:503});
  const {error} = await db.rpc("expire_reservations");
  if (error) return NextResponse.json({error:"Maintenance failed"},{status:503});
  const result = await processNotificationJobs();
  await db.rpc("prune_submission_limits");
  return NextResponse.json(result,{status:result.ok ? 200 : 503});
}

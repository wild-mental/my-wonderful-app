import { NextResponse } from "next/server";

// NOTE: `force-dynamic` ensures the timestamp is always fresh — health checks
// must reflect actual server liveness, not a cached snapshot.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(): NextResponse<{ ok: true; ts: string }> {
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}

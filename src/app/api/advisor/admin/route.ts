import { db } from "@/db";
import { advisorAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

export async function POST(request: Request) {
  const adminToken = process.env.ADVISOR_ADMIN_TOKEN;
  const providedToken = request.headers.get("x-advisor-admin-token");

  if (!adminToken || providedToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json(
      { error: "status must be pending, approved, or rejected" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(advisorAccounts)
    .set({
      status: status as (typeof VALID_STATUSES)[number],
      updatedAt: new Date(),
    })
    .where(eq(advisorAccounts.email, email))
    .returning({
      id: advisorAccounts.id,
      email: advisorAccounts.email,
      businessName: advisorAccounts.businessName,
      status: advisorAccounts.status,
    });

  if (!updated) {
    return NextResponse.json({ error: "Advisor account not found" }, { status: 404 });
  }

  return NextResponse.json({ account: updated });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAdvisorByAuthId, createAdvisorAccount } from "@/lib/advisor";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await getAdvisorByAuthId(authUser.id);
  if (!account) {
    return NextResponse.json({ account: null });
  }

  return NextResponse.json({
    account: {
      id: account.id,
      email: account.email,
      businessName: account.businessName,
      status: account.status,
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
  if (!businessName) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  const existing = await getAdvisorByAuthId(authUser.id);
  if (existing) {
    return NextResponse.json(
      { error: "Advisor account already exists", status: existing.status },
      { status: 409 }
    );
  }

  const account = await createAdvisorAccount({
    authId: authUser.id,
    email: authUser.email ?? "",
    businessName,
  });

  return NextResponse.json({
    account: {
      id: account.id,
      email: account.email,
      businessName: account.businessName,
      status: account.status,
    },
  });
}

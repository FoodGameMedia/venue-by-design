import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAdvisorByAuthId, getAdvisorClients } from "@/lib/advisor";

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
    return NextResponse.json({ error: "Advisor account not found" }, { status: 404 });
  }
  if (account.status !== "approved") {
    return NextResponse.json(
      { error: "Advisor account is not approved", status: account.status },
      { status: 403 }
    );
  }

  const clients = await getAdvisorClients(account.id);
  return NextResponse.json({ clients });
}

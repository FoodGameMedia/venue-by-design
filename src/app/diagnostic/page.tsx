import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasDiagnosticAccess, verifyAndRecordDiagnosticPurchase } from "@/lib/diagnostic-access";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DiagnosticForm } from "./diagnostic-form";

export default async function DiagnosticPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login?redirectTo=/diagnostic");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
  });
  if (!dbUser) redirect("/onboarding");

  const params = await searchParams;
  if (params.checkout === "success" && params.session_id) {
    await verifyAndRecordDiagnosticPurchase(params.session_id, dbUser.id);
    redirect("/diagnostic");
  }

  const hasAccess = await hasDiagnosticAccess(dbUser.id);
  if (!hasAccess) redirect("/pricing?diagnostic=required");

  const admin = createAdminClient();
  const { data: userVenues } = await admin
    .from("venues")
    .select("id, name")
    .eq("user_id", dbUser.id);
  if (!userVenues?.length) redirect("/onboarding");

  const venue = userVenues[0];

  return (
    <div className="min-h-screen bg-transparent">
      <DiagnosticForm venueId={venue.id} userId={dbUser.id} venueName={venue.name} />
    </div>
  );
}

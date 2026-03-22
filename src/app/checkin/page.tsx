import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckinForm } from "./checkin-form";

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login?redirectTo=/checkin");

  const admin = createAdminClient();
  const { data: dbUsers } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .limit(1);
  const dbUser = dbUsers?.[0];
  if (!dbUser) redirect("/onboarding");

  const { data: userVenues } = await admin
    .from("venues")
    .select("id, name")
    .eq("user_id", dbUser.id);
  if (!userVenues?.length) redirect("/onboarding");

  const venue = userVenues[0];

  return (
    <div className="min-h-screen bg-background">
      <CheckinForm venueId={venue.id} userId={dbUser.id} venueName={venue.name} />
    </div>
  );
}

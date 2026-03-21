import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, venues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CheckinForm } from "./checkin-form";

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login?redirectTo=/checkin");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
  });
  if (!dbUser) redirect("/onboarding");

  const userVenues = await db.query.venues.findMany({
    where: eq(venues.userId, dbUser.id),
  });
  if (userVenues.length === 0) redirect("/onboarding");

  const venue = userVenues[0];

  return (
    <div className="min-h-screen bg-[#F2EBE2]">
      <CheckinForm venueId={venue.id} userId={dbUser.id} venueName={venue.name} />
    </div>
  );
}

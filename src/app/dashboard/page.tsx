import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, venues } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login?redirectTo=/dashboard");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
  });
  if (!dbUser) redirect("/onboarding");

  const userVenues = await db.query.venues.findMany({
    where: eq(venues.userId, dbUser.id),
  });
  if (userVenues.length === 0) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-[#F2EBE2]">
      <header className="border-b border-[#3C3F43]/20 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Venue by Design</h1>
          <div className="flex items-center gap-4">
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                Pricing
              </Button>
            </Link>
            <BillingButton />
            <form action="/api/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-serif text-[#1A1A1A]">Dashboard</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-[#3C3F43]/20 bg-white p-6">
            <p className="text-[#3C3F43]">
              Welcome back. Your venue{userVenues.length > 1 ? "s" : ""}:{" "}
              {userVenues.map((v) => v.name).join(", ")}
            </p>
            <div className="mt-4">
              <Link href="/checkin">
                <Button className="bg-[#B9704B] hover:bg-[#A3603B] text-white">
                  Weekly check-in
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-[#3C3F43]/70">
              Venue Pulse and Deep Diagnostic features will appear here in later sprints.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function BillingButton() {
  return (
    <form action="/api/billing/portal" method="post">
      <Button type="submit" variant="outline" size="sm">
        Manage billing
      </Button>
    </form>
  );
}

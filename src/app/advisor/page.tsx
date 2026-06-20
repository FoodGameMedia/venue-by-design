import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { getAdvisorByAuthId, getAdvisorClients } from "@/lib/advisor";
import { AdvisorClients } from "./advisor-clients";

export default async function AdvisorPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login?redirectTo=/advisor");

  const account = await getAdvisorByAuthId(authUser.id);
  if (!account) redirect("/advisor/onboarding");

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="flex h-14 min-h-[56px] w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-lg text-foreground">Advisor Portal</h1>
          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm" className="text-xs sm:text-sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="w-full px-4 py-6 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="font-serif text-2xl text-foreground">{account.businessName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{account.email}</p>
        </div>

        {account.status !== "approved" ? (
          <div className="border-l-[3px] border-primary bg-card p-6">
            <p className="font-serif text-xl text-foreground">
              {account.status === "pending"
                ? "Your advisor account is pending approval"
                : "Your advisor account was not approved"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {account.status === "pending"
                ? "We'll review your business and enable client access shortly. Check back soon."
                : "Please contact support if you believe this is a mistake."}
            </p>
            <div className="mt-4">
              <Link href="/" className="cursor-pointer">
                <Button variant="outline">Back to home</Button>
              </Link>
            </div>
          </div>
        ) : (
          <AdvisorClientsSection advisorId={account.id} />
        )}
      </main>
    </div>
  );
}

async function AdvisorClientsSection({ advisorId }: { advisorId: string }) {
  const clients = await getAdvisorClients(advisorId);
  return <AdvisorClients clients={clients} />;
}

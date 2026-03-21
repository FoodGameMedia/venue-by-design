import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const existing = await db.query.users.findFirst({
          where: eq(users.authId, authUser.id),
        });
        if (!existing) {
          await db.insert(users).values({
            authId: authUser.id,
            email: authUser.email ?? "",
            fullName: authUser.user_metadata?.full_name ?? null,
            avatarUrl: authUser.user_metadata?.avatar_url ?? null,
          });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

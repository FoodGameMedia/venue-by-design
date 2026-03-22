import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-serif text-foreground md:text-5xl">
          Venue by Design
        </h1>
        <p className="text-lg text-muted-foreground">
          Diagnostic and prescriptive support for Australian hospitality operators.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/login" className="cursor-pointer">
            <Button>Sign in</Button>
          </Link>
          <Link href="/pricing" className="cursor-pointer">
            <Button variant="outline">View pricing</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

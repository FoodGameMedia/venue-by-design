import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col justify-center px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl border-l-4 border-primary pl-6 sm:pl-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            For Australian hospitality operators
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] text-foreground md:text-7xl">
            Venue by Design
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Diagnostic and prescriptive support that turns service friction into a clear,
            week-by-week plan — built for exhausted operators, not enterprise dashboards.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/login" className="cursor-pointer">
              <Button size="lg">Sign in</Button>
            </Link>
            <Link href="/pricing" className="cursor-pointer">
              <Button variant="outline" size="lg">
                View pricing
              </Button>
            </Link>
          </div>
          <Link
            href="/advisor"
            className="mt-8 inline-block cursor-pointer text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            Advisor Portal →
          </Link>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F2EBE2] px-4">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-serif text-[#1A1A1A] md:text-5xl">
          Venue by Design
        </h1>
        <p className="text-lg text-[#3C3F43]">
          Diagnostic and prescriptive support for Australian hospitality operators.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/login">
            <Button className="bg-[#B9704B] hover:bg-[#A3603B] text-white">
              Sign in
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" className="border-[#3C3F43]/30">
              View pricing
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

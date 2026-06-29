"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { COLLAGE_URLS, getCollageVariant } from "@/lib/collage-background";

export function ScrollingCollageBackground({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const variant = getCollageVariant(pathname ?? "/");
  const collageUrl = COLLAGE_URLS[variant];

  return (
    <div className="relative isolate flex min-h-full flex-1 flex-col">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: `url('${collageUrl}')`,
          backgroundRepeat: "repeat-y",
          backgroundPosition: "top center",
          backgroundSize: "100% auto",
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}

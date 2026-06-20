import type { ReactNode } from "react";

const COLLAGE_URL = "/backgrounds/venue-collage-loop.png";

export function ScrollingCollageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-full flex-1 flex-col">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{
          backgroundImage: `url('${COLLAGE_URL}')`,
          backgroundRepeat: "repeat-y",
          backgroundPosition: "top center",
          backgroundSize: "100% auto",
        }}
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}

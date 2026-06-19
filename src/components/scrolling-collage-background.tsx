import type { ReactNode } from "react";

const COLLAGE_URL = "/backgrounds/venue-collage-loop.png";

export function ScrollingCollageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full flex flex-1 flex-col">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-50"
        style={{
          backgroundImage: `url('${COLLAGE_URL}')`,
          backgroundRepeat: "repeat-y",
          backgroundPosition: "top center",
          backgroundSize: "100% auto",
        }}
        aria-hidden
      />
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

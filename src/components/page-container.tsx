/**
 * The measure for every signed-in page.
 *
 * Before this existed, every page was `w-full` with only padding, so on a wide
 * monitor a line of body text ran close to nineteen hundred pixels. That is
 * roughly four times a readable line, and it is what made the app feel empty
 * rather than calm. The cap is the fix; the rail is what earns the space back.
 */

type Width = "wide" | "reading";

/** Wide carries charts and two-up grids. Reading is for a single column of prose. */
const WIDTHS: Record<Width, string> = {
  wide: "max-w-5xl",
  reading: "max-w-3xl",
};

export function PageContainer({
  children,
  aside,
  width = "wide",
  className,
}: {
  children: React.ReactNode;
  /**
   * Secondary content for the right rail. Anything here must be genuinely
   * secondary: the page has to read correctly on a phone, where the rail
   * falls below the content rather than beside it.
   */
  aside?: React.ReactNode;
  width?: Width;
  className?: string;
}) {
  const padding = "px-4 py-8 pb-14 sm:px-6 lg:px-8";

  if (!aside) {
    return (
      <main className={`mx-auto w-full ${WIDTHS[width]} ${padding} ${className ?? ""}`}>
        {children}
      </main>
    );
  }

  return (
    <main className={`mx-auto w-full max-w-[86rem] ${padding} ${className ?? ""}`}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        <div className="min-w-0">{children}</div>
        <aside className="mt-10 space-y-5 lg:mt-0">{aside}</aside>
      </div>
    </main>
  );
}

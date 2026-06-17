export function isAdvisorPortalLogin(redirectTo: string): boolean {
  return redirectTo === "/advisor" || redirectTo.startsWith("/advisor/");
}

export function AdvisorPortalExplainer() {
  return (
    <div
      className="w-full max-w-md border-l-[3px] border-primary bg-card p-6 sm:max-w-lg sm:p-8"
      data-testid="advisor-portal-explainer"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Advisor Portal
      </p>
      <h1 className="mt-2 font-serif text-2xl text-foreground sm:text-3xl">
        For the people around your venue
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        This portal is for anyone supporting venues on Venue by Design, not for running the weekly
        loop day to day. Sign in with your own account. Once a venue is linked to you, you can see
        its Calm Index, domain health, and latest prescription, and download a branded report to
        share.
      </p>
      <ul className="mt-5 space-y-3 text-sm text-foreground">
        <li>
          <span className="font-medium">Venue operators</span>
          <span className="text-muted-foreground">
            {" "}
            give your coach, consultant, or senior manager read access to your progress.
          </span>
        </li>
        <li>
          <span className="font-medium">Multi-site owners</span>
          <span className="text-muted-foreground">
            {" "}
            let regional managers or advisors follow linked venues in one place.
          </span>
        </li>
        <li>
          <span className="font-medium">Advisors and consultants</span>
          <span className="text-muted-foreground">
            {" "}
            link client venues and use this as your client workspace.
          </span>
        </li>
      </ul>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Each person uses their own login. Operators still use the main app for diagnostics and weekly
        check-ins.
      </p>
    </div>
  );
}

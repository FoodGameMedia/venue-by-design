export interface PageExplainerContent {
  label: string;
  heading: string;
  why: string;
  how: string;
  testId: string;
}

export const PAGE_EXPLAINERS = {
  thisWeek: {
    label: "This week",
    heading: "You showed up. This is where the loop becomes action.",
    why: "You already did the hard part: showing up each week and scoring honestly. This page gathers that work in one place. Your Calm Index, prescription, and next small change are a map of where the venue is headed, not a grade on how hard you worked. Patterns take a few weeks to sharpen. Keep coming back and the picture will get clearer.",
    how: "Start with this week's prescription focus, glance at your domain scores, and make the one change you committed to. You do not need to fix everything at once. If something does not land or you are unsure what to do next, tap Ask before your next check-in.",
    testId: "this-week-explainer",
  },
  domains: {
    label: "Domains",
    heading: "Seven lenses on how your venue runs",
    why: "Every domain is a place pressure can show up, and every weekly score you add is another point on the map. Low numbers are not a verdict on a rough shift. They show you where to look. Small moves in one domain compound over time. You do not need to lift all seven at once.",
    how: "Scan the scores that sit lowest, compare them to where you were last week, and open a domain card when you want more detail. When a score confuses you or you are stuck on what to try, Ask is there to help you read the signal and plan your next step.",
    testId: "domains-explainer",
  },
  myPlan: {
    label: "My Plan",
    heading: "Your long view and this week, side by side",
    why: "The Deep Diagnostic set your starting point. Each check-in since then has been updating the picture. My Plan keeps that arc visible alongside what to focus on right now, so the work you put in week by week has somewhere to land. One focused change beats trying to fix the whole venue at once.",
    how: "Read your diagnostic overview when you need the big picture, then follow this week's prescription and watch how your scores shift over the coming weeks. Come back after each check-in to see progress add up. If you hit a wall, Ask can help you interpret the plan and choose your next move.",
    testId: "my-plan-explainer",
  },
} satisfies Record<string, PageExplainerContent>;

export function PageExplainer({ label, heading, why, how, testId }: PageExplainerContent) {
  return (
    <div
      className="mb-6 border-l-[3px] border-primary bg-card p-6"
      data-testid={testId}
    >
      <p className="vbd-section-label">{label}</p>
      <h2 className="mt-2 font-serif text-xl text-foreground">{heading}</h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{why}</p>
      <p className="mt-4 text-sm leading-relaxed text-foreground">
        <span className="font-medium">How to use this page:</span>{" "}
        <span className="text-muted-foreground">{how}</span>
      </p>
    </div>
  );
}

export function ThisWeekExplainer() {
  return <PageExplainer {...PAGE_EXPLAINERS.thisWeek} />;
}

export function DomainsExplainer() {
  return <PageExplainer {...PAGE_EXPLAINERS.domains} />;
}

export function MyPlanExplainer() {
  return <PageExplainer {...PAGE_EXPLAINERS.myPlan} />;
}

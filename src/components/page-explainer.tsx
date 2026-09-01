export interface PageExplainerContent {
  label: string;
  heading: string;
  why: string[];
  how: string[];
  testId: string;
}

export const PAGE_EXPLAINERS = {
  thisWeek: {
    label: "This week",
    heading: "Your weekly pulse, where honest check-ins become calm action",
    why: [
      "Hospitality weeks run hard and fast. Service blows up, roster gaps appear, and it is easy to lose sight of whether the venue is actually holding together or just surviving shift to shift. This page is your weekly pause: the place where your check-in lands and turns into something you can act on. The Calm Index, your domain scores, and this week's prescription are not a report card on how tough the week was. They are a read on whether your systems are holding under real trading conditions.",
      "The calm operational process works because you show up regularly and score honestly, not because any single week needs to look perfect. Patterns take a few weeks to sharpen. A dip in one domain is often the venue telling you where pressure is building before it becomes a blow-up on a Saturday night. Keep coming back each week and the picture gets clearer, and the work feels less like guesswork and more like steady progress.",
    ],
    how: [
      "Start with this week's prescription focus at the top of the page. That is your one intentional move for the week, not a list of everything that needs fixing. Glance at your Calm Index trend and domain scores to see whether last week's change is starting to hold. If you committed to a next change, treat it as a small experiment: try it on real shifts, then come back and re-score.",
      "You do not need to lift every domain at once. If a score confuses you or you are unsure what to try next, tap Ask before your next check-in. It is there to help you read the signal and choose a sensible next step. The habit that matters most is the weekly loop itself: check in, focus on one change, repeat.",
    ],
    testId: "this-week-explainer",
  },
  domains: {
    label: "Domains",
    heading: "Seven lenses on how your venue actually runs",
    why: [
      "A venue is not one problem. It is front of house, back of house, rostering, communication, leadership, and the way all of those interact on a busy Friday. The seven domains give you separate lenses on those moving parts so you can see where pressure shows up before it turns into firefighting. Every weekly score you add is another point on the map. Low numbers are not a verdict on a rough shift or a bad week; they are useful signal about where to look next.",
      "This matters to the calm operational process because improvement in hospitality rarely comes from one big overhaul. It comes from small, steady moves in the right place: fixing handover before you rewrite the roster, clarifying one standard before you rebuild training. When you understand which domain is dragging, you can stop spreading your energy across everything and focus where it will actually compound over the coming weeks.",
    ],
    how: [
      "Scan the scores that sit lowest and compare them to where you were last week. Movement matters more than the absolute number. Expand a domain card when you want the definition, your mini trend from base, and any prescribed change tied to that area. If a domain is marked as your primary focus, that is where this week's prescription lives.",
      "Use the reference section at the bottom when you need a plain-language reminder of what each domain covers. When a score puzzles you or you are stuck on what to try, Ask can help you read the signal in plain terms and plan your next step, without adding another layer of admin to your week.",
    ],
    testId: "domains-explainer",
  },
  systems: {
    label: "Systems",
    heading: "Which of your procedures are actually carrying weight",
    why: [
      "Most venues do not suffer from too few systems. They suffer from too many of the wrong ones: procedures written in a calm office for an imagined, disciplined staff, and quietly abandoned by the second hard Friday. The binder grows, compliance with it shrinks, and the gap between what is written and what is done is where bad nights are born.",
      "This page audits what you already have. Every procedure is judged against three questions: do people actually do it when the room is full, does it cover a moment you reliably break on, and does it install a default rather than a rule someone has to remember at eight o'clock. Nothing here is generated in bulk. A procedure only gets written for a breakpoint you have already named.",
    ],
    how: [
      "Start by naming your breakpoints, the three to five moments your venue reliably breaks and the small thing that starts each one. That map is the lens the audit looks through, and without it we can only tell you half of what you need. Then upload what you already have, as a Word file, a PDF, or a photo of the binder, or describe how a normal shift runs.",
      "The verdict is blunt on purpose. Retiring a procedure is a win, not a gap: a short set people trust beats a long one they have learned to ignore. Work the keep, rewrite and retire queue at whatever pace the week allows, and export the survivors as a print pack or as text you can paste straight into the tool your team already runs.",
    ],
    testId: "systems-explainer",
  },
  myPlan: {
    label: "My Plan",
    heading: "Your long view and this week, side by side",
    why: [
      "The Deep Diagnostic captured where your venue was when you started: the base Calm Index, domain scores, and the patterns that showed up under honest answers. My Plan keeps that starting picture visible alongside what has shifted since, so the work you put in each week has somewhere to land. Without that long view, it is easy to forget how far you have come or lose track of what you were trying to fix in the first place.",
      "This page is the backbone of the calm operational process: it connects your ninety-day direction to this week's prescription so you are not choosing between big-picture strategy and practical action. One focused change, repeated and re-scored, beats trying to fix the whole venue at once. My Plan is where you confirm you are working on the right thing, not just the loudest thing from last service.",
    ],
    how: [
      "Read the diagnostic overview and executive summary when you need the big picture: your base band, where to start, and the domain scores from when you first opened the book. Then scroll to your prescription and the per-domain design changes for concrete moves you can try on the floor or in the pass this week.",
      "After each weekly check-in, come back here to see how your scores have moved from base to current. Use the ninety-day plan as your horizon, but let this week's prescription be your actual workload, one change at a time. If you hit a wall interpreting the plan or choosing your next move, Ask is there to help you read what the numbers are saying and keep momentum without burning out.",
    ],
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
      {why.map((paragraph, index) => (
        <p
          key={`why-${index}`}
          className={`text-sm leading-relaxed text-muted-foreground ${index === 0 ? "mt-4" : "mt-3"}`}
        >
          {paragraph}
        </p>
      ))}
      <div className="mt-4">
        <p className="text-sm font-medium text-foreground">How to use this page:</p>
        {how.map((paragraph, index) => (
          <p
            key={`how-${index}`}
            className={`text-sm leading-relaxed text-muted-foreground ${index === 0 ? "mt-2" : "mt-3"}`}
          >
            {paragraph}
          </p>
        ))}
      </div>
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

export function SystemsExplainer() {
  return <PageExplainer {...PAGE_EXPLAINERS.systems} />;
}

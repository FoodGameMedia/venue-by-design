/**
 * 40 questions for Deep Diagnostic, grouped by the seven behavioural domains.
 * Each scored 0–3 (0 = struggling, 3 = strength).
 */
import type { Domain } from "./checkin-questions";

export const DOMAINS = [
  "throughput",
  "defaults",
  "signals",
  "pacing",
  "endings",
  "people_load",
  "operational_memory",
] as const satisfies readonly Domain[];

export type DiagnosticDomain = (typeof DOMAINS)[number];

export interface DiagnosticQuestion {
  id: string;
  domain: DiagnosticDomain;
  question: string;
  description?: string;
  /**
   * Four answer options specific to this question.
   * Index is the score: [0] failing, [1] fragile, [2] functional, [3] designed.
   * A low pick is a map, not an accusation.
   */
  options: readonly [string, string, string, string];
}

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  // Throughput (6)
  {
    id: "t1",
    domain: "throughput",
    question: "How predictable is your capacity during peak service?",
    options: [
      "Every peak is a surprise, you brace and hope.",
      "Covers swing hard and you only find out on the night.",
      "Most nights track to plan, the odd one runs hotter than booked.",
      "You know your ceiling and book to it, peaks land where you expect.",
    ],
  },
  {
    id: "t2",
    domain: "throughput",
    question: "How effective is your rostering at matching demand?",
    options: [
      "Same flat roster every week, busy and quiet staffed the same.",
      "Set by habit, you patch gaps with last-minute calls.",
      "Roughly matched, a couple of shifts are over or under most weeks.",
      "The roster is built from real patterns, right people on the right nights.",
    ],
  },
  {
    id: "t3",
    domain: "throughput",
    question: "How well does your team handle surges without you?",
    options: [
      "Without you on the floor a surge tips into chaos.",
      "They hold for a bit then stall until you step in.",
      "They cope, but glance at you to confirm the calls.",
      "A rush hits and the floor adjusts on its own, you are not needed.",
    ],
  },
  {
    id: "t4",
    domain: "throughput",
    question: "How clear are your choke points and bottlenecks?",
    options: [
      "It backs up somewhere different every night, no pattern named.",
      "You feel the jams but have not pinned down where they start.",
      "You know the main pinch point, the rest you find as they bite.",
      "You know exactly where it backs up first and have designed around it.",
    ],
  },
  {
    id: "t5",
    domain: "throughput",
    question: "How often does your front-of-house and back-of-house stay in sync?",
    options: [
      "Two separate worlds, each blames the other when it slips.",
      "They fall out of step often and fix it with shouting.",
      "Mostly aligned, they drift apart in the hardest part of service.",
      "Front and kitchen read the same picture all night, timing just works.",
    ],
  },
  {
    id: "t6",
    domain: "throughput",
    question: "How reliable is your prep and mise for busy periods?",
    options: [
      "You regularly run out mid-service and improvise.",
      "Prep depends who is on, some days you open behind.",
      "Usually ready, one or two lines get caught short on big nights.",
      "Prep is set to par every time, you start each service fully loaded.",
    ],
  },
  // Defaults (6)
  {
    id: "d1",
    domain: "defaults",
    question: "How often do your protocols handle exceptions without escalation?",
    options: [
      "Anything off-script stops until you are found.",
      "Most exceptions still come to you to decide.",
      "Common exceptions are covered, the rare ones get bumped up.",
      "Odd situations have a known response, staff act without coming to you.",
    ],
  },
  {
    id: "d2",
    domain: "defaults",
    question: "How clear are your default behaviours for common situations?",
    options: [
      "Everyone does the common things their own way.",
      "Defaults live in a few heads, not written or agreed.",
      "Mostly clear, a few situations get handled differently by different people.",
      "The standard way to handle the regular stuff is known and shared.",
    ],
  },
  {
    id: "d3",
    domain: "defaults",
    question: "How well does your team follow established routines?",
    options: [
      "Routines exist on paper but not in practice.",
      "Followed only when a manager is watching.",
      "Followed most of the time, they slip when it gets busy.",
      "Routines are followed as designed, even on quiet nights.",
    ],
  },
  {
    id: "d4",
    domain: "defaults",
    question: "How documented are your exception-handling procedures?",
    options: [
      "Nothing is written, it all depends on who is on.",
      "A little is written, most is carried in memory.",
      "The big ones are documented, the rest are word of mouth.",
      "The how-to for the tricky cases is written down and easy to find.",
    ],
  },
  {
    id: "d5",
    domain: "defaults",
    question: "How automatic are your opening and closing routines?",
    options: [
      "No set routine, you find what was missed the next day.",
      "They vary by who is rostered, things slip through.",
      "Mostly consistent, the odd step gets missed.",
      "Open and close run the same way every time, by checklist, no thinking needed.",
    ],
  },
  {
    id: "d6",
    domain: "defaults",
    question: "How consistent are decisions when you're not there?",
    options: [
      "You brace for what you will find when you get back.",
      "Decisions swing depending who is in charge.",
      "Usually close to yours, a few would surprise you.",
      "The call made in your absence is the call you would have made.",
    ],
  },
  // Signals (6)
  {
    id: "s1",
    domain: "signals",
    question: "How clear are your environmental cues to guests about flow?",
    options: [
      "The room gives no guidance, staff direct everyone by hand.",
      "Guests often have to ask where to wait, order, or sit.",
      "Mostly clear, a few spots still cause a pause or a wrong turn.",
      "The space tells guests where to go and what to do without a word.",
    ],
  },
  {
    id: "s2",
    domain: "signals",
    question: "How well does your space communicate expectations to staff?",
    options: [
      "The setup gives no cues, everything has to be explained.",
      "Staff rely on memory more than on what the space shows.",
      "Mostly clear, a new starter still needs telling in places.",
      "Stations and layout make the right action obvious to whoever is on.",
    ],
  },
  {
    id: "s3",
    domain: "signals",
    question: "How effective are your handover signals between shifts?",
    options: [
      "Shifts change with no real handover, the next crew finds out the hard way.",
      "Handover is a quick word, a lot is left to discover.",
      "Handover covers the main things, details fall through sometimes.",
      "The next shift picks up knowing exactly what is live and what is pending.",
    ],
  },
  {
    id: "s4",
    domain: "signals",
    question: "How visible is critical information when it's needed?",
    options: [
      "You only learn the critical thing once it has gone wrong.",
      "Important info is scattered and often out of date.",
      "Most key info is to hand, some takes a hunt.",
      "Allergens, 86s, bookings, all visible at the point you need them.",
    ],
  },
  {
    id: "s5",
    domain: "signals",
    question: "How well does your layout reduce the need to ask?",
    options: [
      "Nothing is where it makes sense, asking is the only way.",
      "People are constantly asking where things are or what to do.",
      "It helps, but staff still ask for the same few things.",
      "The layout answers most questions before they are asked.",
    ],
  },
  {
    id: "s6",
    domain: "signals",
    question: "How consistent are your visual and verbal cues?",
    options: [
      "No standard cues, every sign and every person says it differently.",
      "Cues often contradict each other, guests get mixed messages.",
      "Mostly consistent, a few signs or scripts are out of date.",
      "Signs, labels, and what staff say all line up and match.",
    ],
  },
  // Pacing (6)
  {
    id: "p1",
    domain: "pacing",
    question: "How disciplined is your pre-service prep?",
    options: [
      "You are still prepping as the first guests sit down.",
      "It depends on who opens and how the morning went.",
      "Generally done on time, crunch nights it runs to the wire.",
      "Prep follows the same checklist and finishes before doors, every shift.",
    ],
  },
  {
    id: "p2",
    domain: "pacing",
    question: "How well do you reset between rushes?",
    options: [
      "One rush bleeds into the next, you never catch the floor up.",
      "Resets happen only if someone remembers in the moment.",
      "You reset the essentials, some stations stay messy into the next push.",
      "The lull resets stations and people, you start the next wave clean.",
    ],
  },
  {
    id: "p3",
    domain: "pacing",
    question: "How predictable is your temporal load across the week?",
    options: [
      "Load lands at random, every week feels different.",
      "You sense the rhythm but cannot plan staff or prep to it.",
      "The shape of the week is roughly known, a day or two surprises you.",
      "You know which days and hours carry the weight and plan to them.",
    ],
  },
  {
    id: "p4",
    domain: "pacing",
    question: "How often does your team hit the right rhythm?",
    options: [
      "It is stop-start all night, never a groove.",
      "You get good patches between scrambles, rarely a whole service.",
      "The rhythm comes, but later than it should.",
      "Service settles into a steady tempo most nights, not slow, not frantic.",
    ],
  },
  {
    id: "p5",
    domain: "pacing",
    question: "How sustainable is the pace you expect from staff?",
    options: [
      "The pace only works because staff run on empty.",
      "People keep up by overreaching, it costs them later.",
      "Sustainable most weeks, the busy stretch leaves people flat.",
      "The pace holds shift after shift without burning people out.",
    ],
  },
  {
    id: "p6",
    domain: "pacing",
    question: "How well do you protect recovery time between busy periods?",
    options: [
      "No recovery built in, people go flat out till close.",
      "Breaks are short and often skipped on hard days.",
      "Recovery happens when it can, first to go when it gets busy.",
      "Breaks and gaps are built in and protected, people actually recover.",
    ],
  },
  // Endings (5)
  {
    id: "e1",
    domain: "endings",
    question: "How strong is your final impression on guests?",
    options: [
      "Guests often leave on a flat or rushed note.",
      "The ending is hit or miss depending on the night.",
      "Usually a good finish, it dips when the floor is slammed.",
      "The last moment is designed and lands well, people leave glad.",
    ],
  },
  {
    id: "e2",
    domain: "endings",
    question: "How smooth is your payment and farewell flow?",
    options: [
      "Settling up is a regular friction point that sours the end.",
      "Payment often drags and the goodbye gets lost in it.",
      "Mostly smooth, a queue or fumble at the till on busy nights.",
      "Paying and leaving is quick and easy, no awkward wait.",
    ],
  },
  {
    id: "e3",
    domain: "endings",
    question: "How well do you apply the peak-end rule in practice?",
    options: [
      "The end of service is an afterthought, whatever happens happens.",
      "You know the idea but rarely act on it.",
      "It happens, more by instinct than by design.",
      "You deliberately shape a high point and a strong finish into service.",
    ],
  },
  {
    id: "e4",
    domain: "endings",
    question: "How often do guests leave on a high note?",
    options: [
      "Guests mostly leave relieved it is over, not lifted.",
      "Only the standout nights end on a high.",
      "Many do, a fair few just slip out unremarked.",
      "Most guests leave clearly happy, you can see it as they go.",
    ],
  },
  {
    id: "e5",
    domain: "endings",
    question: "How consistent is your close-out and handover?",
    options: [
      "Close is rushed and patchy, the morning crew inherits the mess.",
      "Close depends on who is on and how tired they are.",
      "Mostly consistent, the odd step gets skipped late.",
      "Close-out runs the same every night and sets the next day up clean.",
    ],
  },
  // People Load (5)
  {
    id: "pl1",
    domain: "people_load",
    question: "How sustainable is the emotional labour on your team?",
    options: [
      "The job is wearing people down and turnover shows it.",
      "People absorb a lot silently, it shows over time.",
      "Manageable for most, a few carry more than their share.",
      "The emotional weight is shared and talked about, people last.",
    ],
  },
  {
    id: "pl2",
    domain: "people_load",
    question: "How well distributed is the cognitive load?",
    options: [
      "One person holds it all and the place stops if they blink.",
      "A few key people carry most of the mental load.",
      "Mostly spread, one or two roles still juggle too much.",
      "Who-tracks-what is clear, no one holds the whole night in their head.",
    ],
  },
  {
    id: "pl3",
    domain: "people_load",
    question: "How often does hero culture create burnout risk?",
    options: [
      "The whole operation depends on heroes pushing past their limit.",
      "You lean on a couple of heroes more than you would like.",
      "Mostly systems, but a hero still steps in on the worst nights.",
      "The place runs on systems, not on someone saving the day.",
    ],
  },
  {
    id: "pl4",
    domain: "people_load",
    question: "How well do you support staff under pressure?",
    options: [
      "Under pressure staff are exposed with no backup.",
      "People are mostly left to handle the hard moments alone.",
      "Support is there, sometimes only once the pressure has passed.",
      "When it gets hard people are backed in the moment and after.",
    ],
  },
  {
    id: "pl5",
    domain: "people_load",
    question: "How clear are boundaries around availability and after-hours?",
    options: [
      "No line at all, staff are on call in all but name.",
      "People are contacted off shift fairly often.",
      "Mostly respected, the odd after-hours message creeps in.",
      "Off shift means off, contact outside hours is rare and respected.",
    ],
  },
  // Operational Memory (6)
  {
    id: "om1",
    domain: "operational_memory",
    question: "How well does your team learn from failure?",
    options: [
      "The same failures keep happening with no learning.",
      "You talk about what went wrong but little changes.",
      "You learn from the big failures, smaller ones slip by.",
      "When something goes wrong it gets fixed at the root and does not return.",
    ],
  },
  {
    id: "om2",
    domain: "operational_memory",
    question: "How regular and effective are your debriefs?",
    options: [
      "No debriefs, you move straight to the next service.",
      "You debrief only when something blows up.",
      "Debriefs happen after big nights, not as a habit.",
      "You debrief on a rhythm and real changes come out of it.",
    ],
  },
  {
    id: "om3",
    domain: "operational_memory",
    question: "How documented are improvements and learnings?",
    options: [
      "Nothing is captured, every lesson has to be relearned.",
      "Little is written, improvements fade when people leave.",
      "The major ones get recorded, the rest stay in memory.",
      "Changes that work are written down so they stick and spread.",
    ],
  },
  {
    id: "om4",
    domain: "operational_memory",
    question: "How often do the same issues recur?",
    options: [
      "You fight the same fires over and over.",
      "Familiar problems return on a regular cycle.",
      "Most stay fixed, a few keep creeping back.",
      "Once solved, a problem stays solved.",
    ],
  },
  {
    id: "om5",
    domain: "operational_memory",
    question: "How accessible is institutional knowledge to new staff?",
    options: [
      "Knowledge walks out the door when people leave.",
      "New staff learn by asking around, slowly.",
      "Most is findable, some still lives only in long-timers' heads.",
      "A new starter can find how things work without tapping a veteran.",
    ],
  },
  {
    id: "om6",
    domain: "operational_memory",
    question: "How well do you capture and act on feedback?",
    options: [
      "Feedback goes nowhere, no one logs or uses it.",
      "Feedback is heard but rarely turns into change.",
      "You collect it and act on the loudest signals.",
      "Guest and staff feedback is gathered and visibly acted on.",
    ],
  },
];

export const MAX_DIAGNOSTIC_SCORE = 120; // 40 questions × 3 max

export function calcDiagnosticCalmIndex(total: number): number {
  return Math.round((total / MAX_DIAGNOSTIC_SCORE) * 10 * 10) / 10;
}

export function getQuestionsByDomain(): Map<DiagnosticDomain, DiagnosticQuestion[]> {
  const map = new Map<DiagnosticDomain, DiagnosticQuestion[]>();
  for (const q of DIAGNOSTIC_QUESTIONS) {
    const list = map.get(q.domain) ?? [];
    list.push(q);
    map.set(q.domain, list);
  }
  return map;
}

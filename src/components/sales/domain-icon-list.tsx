import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowRight,
  Bell,
  Clock,
  DoorOpen,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import type { Domain } from "@/lib/checkin-questions";
import { DOMAIN_LABELS } from "@/lib/domains";

const DOMAIN_ICONS: Record<Domain, LucideIcon> = {
  throughput: ArrowRight,
  pacing: Clock,
  defaults: SlidersHorizontal,
  people_load: Users,
  signals: Bell,
  endings: DoorOpen,
  operational_memory: Archive,
};

const DOMAIN_ORDER: Domain[] = [
  "throughput",
  "pacing",
  "defaults",
  "people_load",
  "signals",
  "endings",
  "operational_memory",
];

export function DomainIconList() {
  return (
    <ul
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      data-testid="sales-domain-icons"
    >
      {DOMAIN_ORDER.map((domain) => {
        const Icon = DOMAIN_ICONS[domain];
        return (
          <li
            key={domain}
            className="vbd-elevated-card flex items-center gap-3 px-3 py-2.5 transition-[box-shadow,border-color] duration-200 hover:border-primary/25"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Icon className="size-4 text-primary" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="text-xs text-foreground sm:text-sm">{DOMAIN_LABELS[domain]}</span>
          </li>
        );
      })}
    </ul>
  );
}

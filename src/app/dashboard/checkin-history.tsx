import Link from "next/link";

interface Checkin {
  id: string;
  calm_index: number;
  created_at: string;
}

export function CheckinHistory({ checkins }: { checkins: Checkin[] }) {
  if (checkins.length === 0) return null;

  return (
    <div className="divide-y divide-border border-t border-border">
      {checkins.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between px-1 py-3"
        >
          <span className="text-sm text-muted-foreground">
            {new Date(c.created_at).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span
            className="text-lg font-serif font-medium text-primary"
            data-testid="checkin-history-score"
          >
            {c.calm_index}/10
          </span>
        </div>
      ))}
    </div>
  );
}

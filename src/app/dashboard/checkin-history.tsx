import Link from "next/link";

interface Checkin {
  id: string;
  calm_index: number;
  created_at: string;
}

export function CheckinHistory({ checkins }: { checkins: Checkin[] }) {
  if (checkins.length === 0) return null;

  return (
    <div className="space-y-2">
      {checkins.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between rounded-lg border border-[#3C3F43]/20 bg-white px-4 py-3"
        >
          <span className="text-sm text-[#3C3F43]">
            {new Date(c.created_at).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span
            className="text-lg font-serif font-medium text-[#B9704B]"
            data-testid="checkin-history-score"
          >
            {c.calm_index}/10
          </span>
        </div>
      ))}
    </div>
  );
}

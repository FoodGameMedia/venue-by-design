"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DataPoint {
  week: string;
  score: number;
  fullDate: string;
}

export function CalmIndexTrend({ data }: { data: DataPoint[] }) {
  if (data.length === 0) return null;

  return (
    <div className="h-[180px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#C9A87C" strokeOpacity={0.18} />
          <XAxis
            dataKey="week"
            tick={{ fill: "#C4A0AC", fontSize: 11 }}
            stroke="#C4A0AC"
            strokeOpacity={0.3}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fill: "#C4A0AC", fontSize: 11 }}
            stroke="#C4A0AC"
            strokeOpacity={0.3}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F1F1D",
              border: "1px solid rgba(245, 237, 232, 0.18)",
              borderRadius: 8,
              fontSize: 12,
              color: "#F5EDE8",
            }}
            formatter={(value: unknown) => [`${value != null ? value : 0}/10`, "Calm Index"]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullDate
                ? new Date(payload[0].payload.fullDate).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : ""
            }
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#C9A87C"
            strokeWidth={2.5}
            dot={{ fill: "#C9A87C", stroke: "#D696A9", strokeWidth: 1, r: 3 }}
            activeDot={{ r: 5, fill: "#D696A9", stroke: "#C9A87C", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

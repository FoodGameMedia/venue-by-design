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
          <CartesianGrid strokeDasharray="3 3" stroke="#3C3F43" strokeOpacity={0.15} />
          <XAxis
            dataKey="week"
            tick={{ fill: "#3C3F43", fontSize: 11 }}
            stroke="#3C3F43"
            strokeOpacity={0.3}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fill: "#3C3F43", fontSize: 11 }}
            stroke="#3C3F43"
            strokeOpacity={0.3}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#F2EBE2",
              border: "1px solid #3C3F43",
              borderRadius: 8,
              fontSize: 12,
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
            stroke="#B9704B"
            strokeWidth={2}
            dot={{ fill: "#B9704B", r: 3 }}
            activeDot={{ r: 5, fill: "#A3603B" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const DOMAIN_LABELS: Record<string, string> = {
  throughput: "Throughput",
  defaults: "Defaults",
  signals: "Signals",
  pacing: "Pacing",
  endings: "Endings",
  people_load: "People",
  operational_memory: "Memory",
};

interface RadarPoint {
  domain: string;
  score: number;
  fullMark: number;
}

export function DomainRadar({ data }: { data: RadarPoint[] }) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    subject: DOMAIN_LABELS[d.domain] ?? d.domain.replace(/_/g, " "),
  }));

  return (
    <div className="h-[220px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid stroke="#C4A0AC" strokeOpacity={0.2} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#C4A0AC", fontSize: 10 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 3]}
            tick={{ fill: "#C4A0AC", fontSize: 9 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F1F1D",
              border: "1px solid rgba(245, 237, 232, 0.18)",
              borderRadius: 8,
              fontSize: 12,
              color: "#F5EDE8",
            }}
            formatter={(value: unknown) => [`${value != null ? value : 0}/3`, "Score"]}
          />
          <Radar
            name="Domain score"
            dataKey="score"
            stroke="#D696A9"
            fill="#D696A9"
            fillOpacity={0.3}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

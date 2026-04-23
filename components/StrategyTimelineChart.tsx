"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompound } from "@/lib/analytics";

type Stint = {
  driverName: string;
  stint_number: number;
  compound: string;
  lap_start: number;
  lap_end: number;
  stint_length: number | null;
};

type Props = {
  stints: Stint[];
};

type ChartRow = {
  name: string;
  start: number;
  length: number;
  compound: string;
  label: string;
};

const compoundColors: Record<string, string> = {
  SOFT: "#ef4444",
  MEDIUM: "#facc15",
  HARD: "#e5e7eb",
  INTERMEDIATE: "#22c55e",
  WET: "#3b82f6",
  UNKNOWN: "#6b7280",
};

export default function StrategyTimelineChart({ stints }: Props) {
  if (!stints.length) {
    return null;
  }

  const data: ChartRow[] = stints.map((stint) => ({
    name: `${stint.driverName} • Phase ${stint.stint_number}`,
    start: Math.max(0, stint.lap_start - 1),
    length: stint.stint_length ?? 0,
    compound: stint.compound,
    label: formatCompound(stint.compound),
  }));

  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-black">
      <h3 className="text-lg font-semibold mb-2">
        Tyre Strategy Across Race Laps
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Comparing selected drivers
      </p>

      <div className="w-full h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              type="number"
              stroke="#a1a1aa"
              tick={{ fill: "#a1a1aa" }}
              label={{
                value: "Race Lap Number",
                position: "insideBottom",
                offset: -5,
                fill: "#a1a1aa",
              }}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#a1a1aa"
              tick={{ fill: "#e4e4e7" }}
              width={180}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value, name) => {
                if (name === "length") {
                  return [`${value} laps`, "Length"];
                }
                return [value, name];
              }}
              labelFormatter={(_, payload) => {
                if (!payload || !payload.length) return "";
                const row = payload[0].payload as ChartRow;
                return `${row.name} • ${row.label}`;
              }}
            />
            <Legend wrapperStyle={{ color: "#e4e4e7" }} />
            <Bar dataKey="start" stackId="a" fill="transparent" name="Offset" />
            <Bar dataKey="length" stackId="a" name="Tyre Phase Length">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={compoundColors[entry.compound?.toUpperCase()] || "#6b7280"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Each bar shows when a tyre phase starts and how many laps it lasts during the race.
      </p>

      <div className="flex flex-wrap gap-3 mt-4 text-sm">
        {Object.entries(compoundColors).map(([compound, color]) => (
          <div key={compound} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-sm border border-zinc-700"
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-300">{formatCompound(compound)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
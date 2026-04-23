"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompound } from "@/lib/analytics";

type Props = {
  stints: {
    driverName: string;
    stint_number: number;
    compound: string;
    lap_start: number;
    lap_end: number;
    stint_length: number | null;
  }[];
};

type ChartRow = {
  axisLabel: string;
  driverName: string;
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

export default function StrategyTimelineChart(props: Props) {
  const { stints } = props;

  if (!stints || stints.length === 0) {
    return null;
  }

  const data: ChartRow[] = stints.map((stint) => ({
    axisLabel: `Phase ${stint.stint_number}`,
    driverName: stint.driverName,
    start: Math.max(0, stint.lap_start - 1),
    length: stint.stint_length ?? 0,
    compound: stint.compound,
    label: formatCompound(stint.compound),
  }));

  const uniqueDrivers = [...new Set(stints.map((stint) => stint.driverName))];

  return (
    <div className="rounded-lg border border-zinc-700 bg-black p-4">
      <h3 className="mb-2 text-lg font-semibold">Tyre Strategy Across Race Laps</h3>
      <p className="mb-4 text-sm text-gray-400">Comparing selected drivers</p>

      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              type="number"
              stroke="#a1a1aa"
              tick={{ fill: "#a1a1aa" }}
              label={{
                value: "Race Lap Number",
                position: "insideBottom",
                offset: -10,
                fill: "#a1a1aa",
              }}
            />
            <YAxis
              dataKey="axisLabel"
              type="category"
              stroke="#a1a1aa"
              tick={{ fill: "#e4e4e7" }}
              width={100}
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
                return `${row.driverName} • ${row.axisLabel} • ${row.label}`;
              }}
            />
            <Bar dataKey="start" stackId="a" fill="transparent" />
            <Bar dataKey="length" stackId="a">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    compoundColors[entry.compound?.toUpperCase()] || "#6b7280"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs text-gray-500">Selected drivers</p>
        <div className="flex flex-wrap gap-3 text-sm">
          {uniqueDrivers.map((driver) => (
            <div
              key={driver}
              className="rounded-full border border-zinc-700 px-3 py-1 text-gray-300"
            >
              {driver}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Each bar shows when a tyre phase starts and how many laps it lasts during
        the race.
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {Object.entries(compoundColors).map(([compound, color]) => (
          <div key={compound} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-zinc-700"
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-300">{formatCompound(compound)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
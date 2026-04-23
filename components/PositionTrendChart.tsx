"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PositionPoint = {
  driver_number: number;
  position?: number;
  date?: string;
};

type Driver = {
  driverNumber: number;
  driverName: string;
};

type Props = {
  drivers: Driver[];
  positions: PositionPoint[];
};

type ChartRow = {
  progression: number;
  timeLabel: string;
  [key: string]: string | number;
};

const lineColors = ["#60a5fa", "#f472b6", "#34d399"];

export default function PositionTrendChart({ drivers, positions }: Props) {
  const chartRowsMap = new Map<number, ChartRow>();

  drivers.forEach((driver) => {
    const driverPositions = positions
      .filter(
        (item) =>
          item.driver_number === driver.driverNumber &&
          item.position != null &&
          item.date
      )
      .sort(
        (a, b) =>
          new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
      );

    driverPositions.forEach((item, index) => {
      const progression = index + 1;
      const existing = chartRowsMap.get(progression) || {
        progression,
        timeLabel: new Date(item.date as string).toLocaleTimeString(),
      };

      existing[driver.driverName] = Number(item.position);
      chartRowsMap.set(progression, existing);
    });
  });

  const data = Array.from(chartRowsMap.values()).sort(
    (a, b) => Number(a.progression) - Number(b.progression)
  );

  if (!data.length) {
    return null;
  }

  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-black">
      <h3 className="text-lg font-semibold mb-2">Race Position Trend</h3>
      <p className="text-sm text-gray-400 mb-4">
        Comparing selected drivers
      </p>

      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="progression"
              stroke="#a1a1aa"
              tick={{ fill: "#a1a1aa" }}
              label={{
                value: "Race Progression",
                position: "insideBottom",
                offset: -5,
                fill: "#a1a1aa",
              }}
            />
            <YAxis
              reversed
              allowDecimals={false}
              stroke="#a1a1aa"
              tick={{ fill: "#e4e4e7" }}
              label={{
                value: "Race Position",
                angle: -90,
                position: "insideLeft",
                fill: "#a1a1aa",
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
              labelFormatter={(label, payload) => {
                if (!payload || !payload.length) return `Step ${label}`;
                const row = payload[0].payload as ChartRow;
                return `Progress Step ${label} • ${row.timeLabel}`;
              }}
            />
            <Legend wrapperStyle={{ color: "#e4e4e7" }} />
            {drivers.map((driver, index) => (
              <Line
                key={driver.driverNumber}
                type="monotone"
                dataKey={driver.driverName}
                stroke={lineColors[index % lineColors.length]}
                strokeWidth={3}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Lower position numbers are better. This chart uses time-ordered position
        updates to approximate race progression.
      </p>
    </div>
  );
}
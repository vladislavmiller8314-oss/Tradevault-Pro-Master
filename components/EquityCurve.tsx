"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EquityPoint } from "@/types/trade";

export function EquityCurve({ data }: { data: EquityPoint[] }) {
  const isUp = data.length > 1 && data[data.length - 1].equity >= data[0].equity;
  const color = isUp ? "#00C853" : "#D32F2F";

  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">Equity Curve</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "#8B93A7", fontSize: 11 }}
              axisLine={{ stroke: "#242836" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8B93A7", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: "#0A0B10",
                border: "1px solid #242836",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#8B93A7" }}
              itemStyle={{ color: "#E8EAF0" }}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={color}
              strokeWidth={2}
              fill="url(#equityFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

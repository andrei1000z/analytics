"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrafficPoint } from "../lib/dashboardData";

export default function TrafficChart({ data }: { data: TrafficPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="h-[320px] w-full">
      {!mounted ? (
        <div className="h-full w-full animate-pulse rounded-2xl bg-gray-50" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0055ff" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#0055ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="#f1f1f1"
              strokeDasharray="0"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              stroke="#9ca3af"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fontWeight: 500 }}
              width={48}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{
                stroke: "#0055ff",
                strokeWidth: 1,
                strokeDasharray: 4,
              }}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid #ececec",
                boxShadow: "0 10px 40px -12px rgba(15, 23, 42, 0.12)",
                padding: "10px 14px",
                fontSize: 12,
              }}
              labelStyle={{
                color: "#0a0a0a",
                fontWeight: 600,
                marginBottom: 4,
              }}
              itemStyle={{ color: "#374151" }}
              formatter={(value) => [
                Number(value).toLocaleString("ro-RO"),
                "Vizualizări",
              ]}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#0055ff"
              strokeWidth={2.5}
              fill="url(#viewsGradient)"
              activeDot={{ r: 5, strokeWidth: 0, fill: "#0055ff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

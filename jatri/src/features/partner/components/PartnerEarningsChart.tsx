"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Star, BarChart2 } from "lucide-react";
import axios from "axios";

type Earnings = {
  date: string;
  earnings: number;
};

type TooltipPayload = {
  value: number;
  payload: Earnings;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-zinc-300 rounded-none p-3 shadow-none min-w-[130px]">
        <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-lg font-bold text-zinc-950 font-mono">
          ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function PartnerEarningsChart() {
  const [data, setData] = useState<Earnings[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    axios
      .get("/api/partner/earnings")
      .then((res) => {
        const earnings = Array.isArray(res.data?.earnings) ? res.data.earnings : [];
        const last7Days: Earnings[] = earnings.slice(-7);
        setData(last7Days);
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load partner earnings:", err);
        setData([]);
        setLoaded(true);
      });
  }, []);

  const total = data.reduce((a, d) => a + d.earnings, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  const max = data.length ? Math.max(...data.map((d) => d.earnings)) : 0;
  const bestDay = data.find((d) => d.earnings === max);
  const today = data[data.length - 1];
  const yesterday = data[data.length - 2];
  const delta = today && yesterday ? today.earnings - yesterday.earnings : 0;
  const deltaPositive = delta >= 0;
  const deltaPct = yesterday && yesterday.earnings > 0 ? Math.abs(Math.round((delta / yesterday.earnings) * 100)) : 0;

  const metrics = [
    {
      label: "Peak Day",
      value: fmt(max),
      sub: bestDay?.date ?? "—",
      icon: <Star size={13} />,
    },
    {
      label: "Shift Average",
      value: fmt(avg),
      sub: "per day",
      icon: <BarChart2 size={13} />,
    },
  ];

  return (
    <div className="bg-white rounded-none border border-zinc-300 p-5 sm:p-7 shadow-none">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-none bg-zinc-950 inline-block" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-500">
              Revenue Analytics
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-950 tracking-tight font-sans">
            7-Day Performance Ledger
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5 font-mono">
            Daily verified fare settlements
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-0.5">
            Trailing 7-Day Gross
          </p>
          <motion.p
            key={total}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-zinc-950 font-mono tracking-tight"
          >
            {fmt(total)}
          </motion.p>
          <div
            className={`flex items-center sm:justify-end gap-1 text-[11px] font-mono mt-0.5 ${
              deltaPositive ? "text-zinc-900" : "text-zinc-600"
            }`}
          >
            {deltaPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{deltaPct}% vs previous day</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Bento */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 6 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="bg-zinc-50 rounded-none border border-zinc-200 p-3.5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-zinc-500 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              <span>{m.label}</span>
              <span className="text-zinc-950">{m.icon}</span>
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-zinc-950 font-mono leading-none">
                {m.value}
              </p>
              <p className="text-[10px] font-mono text-zinc-400 mt-1">{m.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <AnimatePresence>
        {loaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-56"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="2 2" stroke="#e4e4e7" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }}
                  axisLine={{ stroke: "#d4d4d8" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }}
                  axisLine={{ stroke: "#d4d4d8" }}
                  tickLine={false}
                  tickFormatter={(v) => "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f4f5" }} />
                <Bar dataKey="earnings" radius={[0, 0, 0, 0]}>
                  {data.map((entry, index) => {
                    const isToday = index === data.length - 1;
                    const isBest = entry.earnings === max && !isToday;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isToday ? "#18181b" : isBest ? "#3f3f46" : "#a1a1aa"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
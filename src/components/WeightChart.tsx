// src/components/WeightChart.tsx
"use client";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip
);

type Props = {
  logs: { date: string; weight_kg: number }[];
  goalWeight?: number;
};

export default function WeightChart({ logs, goalWeight }: Props) {
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  const data = {
    labels: sortedLogs.map((log) => log.date),
    datasets: [
      {
        label: "Weight (kg)",
        data: sortedLogs.map((log) => log.weight_kg),
        fill: false,
        borderColor: "hsl(var(--primary))", // uses primary from CSS vars
        tension: 0.25,
      },
      ...(goalWeight !== undefined
        ? [
            {
              label: "Goal Weight",
              data: sortedLogs.map(() => goalWeight),
              borderColor: "hsl(var(--chart-2))", // uses chart-2 from CSS vars
              borderDash: [6, 6],
              pointRadius: 0,
              borderWidth: 2,
              fill: false,
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          precision: 0,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"line">) => `${ctx.parsed.y} kg`,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}

'use client';

import { memo } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PieChartData {
  name: string;
  value: number;
  fill: string;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = [
  '#2DD4BF', // teal
  '#F43F5E', // rose
  '#A78BFA', // violet
  '#FBBF24', // amber
  '#34D399', // emerald
  '#60A5FA', // blue
  '#F472B6', // pink
  '#FB923C', // orange
];

const PieChart = memo(function PieChart({
  data,
  title,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
}: PieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500">
        Belum ada data untuk ditampilkan
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {title && (
        <h3 className="text-sm font-medium text-zinc-400 mb-3">{title}</h3>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#141414',
                border: '1px solid #262626',
                borderRadius: '8px',
                color: '#E5E5E5',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)',
              }}
              formatter={(value: number) => [
                `Rp ${value.toLocaleString('id-ID')}`,
                '',
              ]}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
          {data.slice(0, 6).map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
              />
              <span className="text-xs text-zinc-400 truncate max-w-[80px]">
                {entry.name}
              </span>
            </div>
          ))}
          {data.length > 6 && (
            <span className="text-xs text-zinc-500">+{data.length - 6} more</span>
          )}
        </div>
      )}
    </div>
  );
});

export default PieChart;

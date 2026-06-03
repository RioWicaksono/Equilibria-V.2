'use client';

import { memo, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DashboardChart = memo(function DashboardChart({ data }: { data: any[] }) {
  const tickFormatter = useCallback((value: number) => `Rp ${value / 1000}k`, []);
  
  const chartContent = useMemo(() => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#A1A1AA', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#A1A1AA', fontSize: 12 }}
            tickFormatter={tickFormatter}
          />
          <Tooltip 
            cursor={{ fill: '#1A1A1A' }}
            contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px', color: '#E5E5E5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
            itemStyle={{ color: '#E5E5E5' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
          <Bar dataKey="income" name="Pemasukan" fill="#2DD4BF" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expense" name="Pengeluaran" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    );
  }, [data, tickFormatter]);

  if (data.length === 0) {
    return <div className="h-full flex items-center justify-center text-zinc-500">Belum ada data untuk ditampilkan</div>;
  }

  return chartContent;
});

export default DashboardChart;

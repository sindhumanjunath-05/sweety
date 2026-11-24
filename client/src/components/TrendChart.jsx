import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export const TrendChart = ({ readings = [], title = 'Glucose Trends' }) => {
  if (!readings || readings.length === 0) {
    return null;
  }

  // Format data for chart
  const chartData = readings.map((r, index) => ({
    index: index + 1,
    date: r.date ? r.date.substring(5) : '', // MM-DD
    fullDate: r.date,
    slot: r.slot,
    value: Number(r.value),
    displayLabel: `${r.date ? r.date.substring(5) : ''} (${r.slot ? r.slot.split(' ')[0] : ''})`,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/90 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700">
          <p className="font-bold text-slate-200">{data.fullDate}</p>
          <p className="text-slate-400 mb-1">{data.slot}</p>
          <div className="flex items-center space-x-1.5">
            <span className="text-rose-400 font-extrabold text-base">{data.value}</span>
            <span className="text-slate-400 font-normal">mg/dl</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500">
            Target glucose range (70 – 140 mg/dl) highlighted
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1 text-slate-500">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span>Blood Glucose</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-600">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span>
            <span>Target Range (70-140)</span>
          </span>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="displayLabel"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[40, 300]}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Target glucose zone boundaries */}
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
            <ReferenceLine y={140} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#f43f5e', strokeWidth: 1.5, stroke: '#ffffff' }}
              activeDot={{ r: 5, fill: '#e11d48' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;

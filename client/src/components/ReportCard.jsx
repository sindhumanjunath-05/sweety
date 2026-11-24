import React from 'react';
import { TrendingUp, TrendingDown, Activity, Hash, Inbox } from 'lucide-react';

export const ReportCard = ({ title, dateRange, stats, emptyMessage = 'No readings recorded for this period.' }) => {
  const { count = 0, highest = null, lowest = null, average = null } = stats || {};

  const getStatusBadge = (val) => {
    if (val === null || val === undefined) return null;
    if (val < 70) return <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Low</span>;
    if (val <= 140) return <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Optimal</span>;
    return <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Elevated</span>;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
      {/* Title & Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 font-medium">{dateRange}</p>
        </div>
        <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-100 px-2.5 py-1 rounded-lg">
          <Hash className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">{count} {count === 1 ? 'Reading' : 'Readings'}</span>
        </div>
      </div>

      {/* Empty State */}
      {count === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-2">
            <Inbox className="w-6 h-6 stroke-[1.5]" />
          </div>
          <p className="text-sm font-semibold text-slate-600 mb-1">{emptyMessage}</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Start logging your glucose readings to generate comprehensive daily and monthly insights.
          </p>
        </div>
      ) : (
        /* Stats Grid */
        <div className="grid grid-cols-3 gap-3 pt-4">
          {/* Highest */}
          <div className="bg-gradient-to-br from-rose-50/60 to-rose-50/20 p-3.5 rounded-xl border border-rose-100/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                <span>Highest</span>
              </span>
              {getStatusBadge(highest)}
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-extrabold text-slate-800">{highest}</span>
              <span className="text-xs font-medium text-slate-400">mg/dl</span>
            </div>
          </div>

          {/* Lowest */}
          <div className="bg-gradient-to-br from-teal-50/60 to-teal-50/20 p-3.5 rounded-xl border border-teal-100/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
                <span>Lowest</span>
              </span>
              {getStatusBadge(lowest)}
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-extrabold text-slate-800">{lowest}</span>
              <span className="text-xs font-medium text-slate-400">mg/dl</span>
            </div>
          </div>

          {/* Average */}
          <div className="bg-gradient-to-br from-amber-50/60 to-amber-50/20 p-3.5 rounded-xl border border-amber-100/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>Average</span>
              </span>
              {getStatusBadge(average)}
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-extrabold text-slate-800">{Number(average).toFixed(1)}</span>
              <span className="text-xs font-medium text-slate-400">mg/dl</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCard;

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { getTodayDateString, SLOTS } from '../components/ReadingModal';
import {
  Activity,
  PlusCircle,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  Sun,
  Coffee,
  Utensils,
  Moon,
} from 'lucide-react';

export const DashboardPage = ({ onNavigate, onOpenAddModalWithSlot, onOpenEditModal }) => {
  const { user } = useAuth();
  const today = getTodayDateString();

  const [todayReadings, setTodayReadings] = useState([]);
  const [stats, setStats] = useState({ count: 0, highest: null, lowest: null, average: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch daily report for today
      const reportData = await api.get('/reports/daily', { date: today });
      setTodayReadings(reportData.readings || []);
      setStats({
        count: reportData.count,
        highest: reportData.highest,
        lowest: reportData.lowest,
        average: reportData.average,
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Slot icon helper
  const getSlotIcon = (slotName) => {
    switch (slotName) {
      case 'Morning (fasting)':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'After breakfast':
        return <Coffee className="w-4 h-4 text-emerald-500" />;
      case 'After lunch':
        return <Utensils className="w-4 h-4 text-rose-500" />;
      case 'After dinner':
        return <Moon className="w-4 h-4 text-indigo-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getGlucoseStatusPill = (val) => {
    if (val < 70) {
      return <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">Low</span>;
    }
    if (val <= 140) {
      return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">Optimal</span>;
    }
    return <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">High</span>;
  };

  // Find reading for a given slot
  const findReadingForSlot = (slotName) => {
    return todayReadings.find((r) => r.slot === slotName);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-600/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Today: {today}</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || 'Patient'} 👋
            </h1>
            <p className="text-rose-100 text-sm mt-1 max-w-xl">
              Track your daily blood glucose across 4 standard slots and monitor your health metrics in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('readings')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 backdrop-blur-md"
            >
              All Readings
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-4 py-2.5 bg-white text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all shadow-md shadow-black/10"
            >
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* Today's 4 Slots Tracking Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today's Glucose Slots</h2>
            <p className="text-xs text-slate-500">
              Each day allows up to 4 readings (one per designated slot)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">
              Progress: <strong className="text-slate-900">{stats.count} / 4</strong> recorded
            </span>
            <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                style={{ width: `${(stats.count / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 4 Slots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {SLOTS.map((slotName) => {
            const reading = findReadingForSlot(slotName);
            return (
              <div
                key={slotName}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  reading
                    ? 'bg-gradient-to-b from-white to-slate-50/70 border-slate-200/90 shadow-xs'
                    : 'bg-slate-50/50 border-dashed border-slate-300 hover:border-rose-300 hover:bg-rose-50/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-white shadow-xs border border-slate-100">
                      {getSlotIcon(slotName)}
                    </span>
                    {reading ? (
                      <span className="flex items-center space-x-1 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Logged</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium">Pending</span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">{slotName}</h3>

                  {reading ? (
                    <div className="mt-2">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-black text-slate-900">{reading.value}</span>
                        <span className="text-xs font-semibold text-slate-400">mg/dl</span>
                      </div>
                      <div className="mt-2">{getGlucoseStatusPill(reading.value)}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2">No reading recorded yet for today</p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  {reading ? (
                    <button
                      onClick={() => onOpenEditModal(reading)}
                      className="w-full py-1.5 px-3 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      Edit Reading
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenAddModalWithSlot(today, slotName)}
                      className="w-full py-1.5 px-3 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Record Reading</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Highest */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Highest</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {stats.highest !== null ? `${stats.highest} mg/dl` : '—'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Lowest */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Lowest</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {stats.lowest !== null ? `${stats.lowest} mg/dl` : '—'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Average */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Average</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {stats.average !== null ? `${Number(stats.average).toFixed(1)} mg/dl` : '—'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

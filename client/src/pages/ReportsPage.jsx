import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { getTodayDateString } from '../components/ReadingModal';
import { ReportCard } from '../components/ReportCard';
import { TrendChart } from '../components/TrendChart';
import {
  Calendar,
  BarChart3,
  RefreshCw,
  Sun,
  Coffee,
  Utensils,
  Moon,
  Clock,
  Sparkles,
} from 'lucide-react';

export const ReportsPage = ({ onOpenAddModalWithDate }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [reportsData, setReportsData] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('all'); // 'all', 'daily', 'mtd', 'monthly'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get('/reports', { date: selectedDate });
      setReportsData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch reports.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Date Selector Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-rose-600" />
            <span>Glucose Analytics & Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze daily, month-to-date, and whole previous month glucose statistics
          </p>
        </div>

        {/* Date Selector & Presets */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 pl-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Selected Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
            <button
              onClick={() => setSelectedDate(getTodayDateString())}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate('2026-10-15')}
              className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center space-x-1"
              title="Loads assignment example date (15 Oct 2026)"
            >
              <Sparkles className="w-3 h-3 text-rose-500" />
              <span>Assignment Date (15 Oct 2026)</span>
            </button>
          </div>

          <button
            onClick={fetchReports}
            title="Refresh reports"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Report Tabs Switcher */}
      <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl max-w-fit">
        <button
          onClick={() => setActiveReportTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Reports Overview
        </button>
        <button
          onClick={() => setActiveReportTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'daily'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily Report
        </button>
        <button
          onClick={() => setActiveReportTab('mtd')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'mtd'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Month-to-Date
        </button>
        <button
          onClick={() => setActiveReportTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'monthly'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Monthly (Prev Month)
        </button>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2 bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
          <span>Generating reports for {selectedDate}...</span>
        </div>
      ) : reportsData ? (
        <div className="space-y-6">
          {/* 3 Report Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Report */}
            {(activeReportTab === 'all' || activeReportTab === 'daily') && (
              <ReportCard
                title="Daily Report"
                dateRange={reportsData.daily.startDate}
                stats={reportsData.daily}
                emptyMessage="No readings recorded for this day."
              />
            )}

            {/* Month-to-Date Report */}
            {(activeReportTab === 'all' || activeReportTab === 'mtd') && (
              <ReportCard
                title="Month-to-Date Report"
                dateRange={`${reportsData.monthToDate.startDate} to ${reportsData.monthToDate.endDate}`}
                stats={reportsData.monthToDate}
                emptyMessage="No readings recorded in month-to-date range."
              />
            )}

            {/* Monthly Report (Previous Month) */}
            {(activeReportTab === 'all' || activeReportTab === 'monthly') && (
              <ReportCard
                title="Monthly Report (Previous Month)"
                dateRange={`${reportsData.monthly.startDate} to ${reportsData.monthly.endDate}`}
                stats={reportsData.monthly}
                emptyMessage="No readings recorded in previous month."
              />
            )}
          </div>

          {/* Daily Slot Breakdown (Required: "The daily report also lists each reading with its slot") */}
          {(activeReportTab === 'all' || activeReportTab === 'daily') && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daily Readings Breakdown ({reportsData.daily.startDate})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lists each reading with its designated slot for the selected date
                  </p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold self-start sm:self-auto">
                  {reportsData.daily.readings.length} Logged Slots
                </span>
              </div>

              {reportsData.daily.readings.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <p className="font-semibold text-slate-600 mb-1">No readings logged on this date</p>
                  <button
                    onClick={() => onOpenAddModalWithDate(selectedDate)}
                    className="mt-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100"
                  >
                    + Log reading for {selectedDate}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {reportsData.daily.readings.map((reading) => (
                    <div
                      key={reading.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-1.5 bg-white rounded-lg shadow-2xs border border-slate-200">
                          {getSlotIcon(reading.slot)}
                        </span>
                        {getGlucoseStatusPill(reading.value)}
                      </div>
                      <p className="text-xs font-bold text-slate-700">{reading.slot}</p>
                      <div className="mt-2 flex items-baseline space-x-1">
                        <span className="text-2xl font-black text-slate-900">{reading.value}</span>
                        <span className="text-xs font-semibold text-slate-400">mg/dl</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Monthly Trend Chart (Bonus Task: Charts over the month with Recharts) */}
          {(activeReportTab === 'all' || activeReportTab === 'monthly') && (
            <TrendChart
              readings={reportsData.monthly.readings}
              title={`Monthly Blood Glucose Trends (${reportsData.monthly.startDate} – ${reportsData.monthly.endDate})`}
            />
          )}

          {/* Month-to-date Chart */}
          {(activeReportTab === 'mtd') && (
            <TrendChart
              readings={reportsData.monthToDate.readings}
              title={`Month-to-Date Blood Glucose Trends (${reportsData.monthToDate.startDate} – ${reportsData.monthToDate.endDate})`}
            />
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ReportsPage;

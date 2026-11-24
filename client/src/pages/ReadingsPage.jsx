import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { SLOTS } from '../components/ReadingModal';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Activity,
  Calendar,
  Clock,
  Inbox,
  RefreshCw,
} from 'lucide-react';

export const ReadingsPage = ({ onOpenAddModal, onOpenEditModal, onOpenDeleteModal, refreshTrigger }) => {
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReadings = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (selectedDate) params.date = selectedDate;
      if (selectedSlot) params.slot = selectedSlot;

      const data = await api.get('/readings', params);
      setReadings(data.readings || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load readings.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedSlot]);

  useEffect(() => {
    fetchReadings(1);
  }, [fetchReadings, refreshTrigger]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReadings(newPage);
    }
  };

  const handleClearFilters = () => {
    setSelectedDate('');
    setSelectedSlot('');
  };

  const getGlucoseBadge = (val) => {
    if (val < 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Low ({val} mg/dl)
        </span>
      );
    }
    if (val <= 140) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Optimal ({val} mg/dl)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        High ({val} mg/dl)
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Blood Glucose Log</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, filter, edit and maintain your historical glucose records
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Reading</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date:</span>
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Slot Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Slot:</span>
            </span>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All Slots</option>
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {(selectedDate || selectedSlot) && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2"
            >
              Clear filters
            </button>
          )}
        </div>

        <button
          onClick={() => fetchReadings(pagination.page)}
          title="Refresh"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Readings Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
            <span>Loading readings...</span>
          </div>
        ) : readings.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Inbox className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">No glucose readings found</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {selectedDate || selectedSlot
                ? 'No records match your selected date or slot filter.'
                : 'You have not recorded any blood glucose readings yet.'}
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
            >
              + Record First Reading
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Time Slot</th>
                  <th className="px-6 py-3.5">Reading Value</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {readings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">
                      {reading.date}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                      {reading.slot}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 whitespace-nowrap">
                      <span className="text-base">{reading.value}</span>{' '}
                      <span className="text-[11px] font-semibold text-slate-400">mg/dl</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getGlucoseBadge(reading.value)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => onOpenEditModal(reading)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenDeleteModal(reading)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Showing page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
              <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.total} total)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 transition-colors flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 transition-colors flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingsPage;

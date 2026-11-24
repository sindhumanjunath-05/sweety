import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Calendar, Clock, Activity } from 'lucide-react';
import { api } from '../api/client';

export const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ReadingModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  prefilledDate = null,
  prefilledSlot = null,
}) => {
  const [date, setDate] = useState(prefilledDate || getTodayDateString());
  const [slot, setSlot] = useState(prefilledSlot || SLOTS[0]);
  const [value, setValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setSlot(initialData.slot);
      setValue(String(initialData.value));
    } else {
      setDate(prefilledDate || getTodayDateString());
      setSlot(prefilledSlot || SLOTS[0]);
      setValue('');
    }
    setErrorMessage('');
  }, [initialData, prefilledDate, prefilledSlot, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    // 1. Date cannot be in the future
    const today = getTodayDateString();
    if (!date) {
      return 'Date is required.';
    }
    if (date > today) {
      return 'Date cannot be in the future.';
    }

    // 2. Slot required
    if (!slot) {
      return 'Please select a time slot.';
    }

    // 3. Value required & range check
    if (value === undefined || value === null || String(value).trim() === '') {
      return 'Please enter a glucose value.';
    }

    const num = Number(value);
    if (!Number.isInteger(num) || num < 40 || num > 600) {
      return 'Value must be between 40 and 600 mg/dl.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validation check
    const clientError = validateForm();
    if (clientError) {
      setErrorMessage(clientError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialData && initialData.id) {
        // Edit existing reading
        const res = await api.put(`/readings/${initialData.id}`, {
          date,
          slot,
          value: Number(value),
        });
        onSuccess(res.reading, 'updated');
      } else {
        // Add new reading
        const res = await api.post('/readings', {
          date,
          slot,
          value: Number(value),
        });
        onSuccess(res.reading, 'created');
      }
      onClose();
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred while saving reading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="reading-modal"
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {initialData ? 'Edit Blood Glucose Reading' : 'Record Blood Glucose'}
              </h3>
              <p className="text-xs text-slate-500">Track your readings across 4 daily slots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid="modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2.5 animate-in fade-in duration-200"
              role="alert"
              data-testid="validation-error-message"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Date Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Reading Date</span>
            </label>
            <input
              type="date"
              value={date}
              max={getTodayDateString()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm"
              required
              data-testid="input-date"
            />
            <p className="text-[11px] text-slate-400 mt-1">Date cannot be in the future.</p>
          </div>

          {/* Slot Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Time Slot (Max 4 per day)</span>
            </label>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm"
              required
              data-testid="select-slot"
            >
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Value Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>Glucose Value (mg/dl)</span>
              </span>
              <span className="text-slate-400 text-[11px] font-normal">Range: 40 – 600</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="e.g. 110"
                value={value}
                min="40"
                max="600"
                step="1"
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-16 border border-slate-300 rounded-xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm placeholder:font-normal placeholder:text-slate-300"
                data-testid="input-value"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400 uppercase pointer-events-none">
                mg/dl
              </span>
            </div>
            {/* Quick value indicators */}
            <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              <span>&lt;70 Low</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-1"></span>
              <span>70–140 Normal</span>
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 ml-1"></span>
              <span>&gt;140 High</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 rounded-xl shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
              data-testid="submit-reading-btn"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Reading' : 'Save Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReadingModal;

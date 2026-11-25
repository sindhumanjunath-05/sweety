import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { getTodayDateString } from '../components/ReadingModal';
import { ReportCard } from '../components/ReportCard';
import { TrendChart } from '../components/TrendChart';
import {
  Users,
  Calendar,
  Activity,
  ArrowLeft,
  RefreshCw,
  Sun,
  Coffee,
  Utensils,
  Moon,
  Clock,
  Sparkles,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';

export const DoctorPortalPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [patientReports, setPatientReports] = useState(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch assigned patients
  const fetchPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    setError(null);
    try {
      const data = await api.get('/doctor/patients');
      setPatients(data.patients || []);
      // Auto-select first patient if none selected
      if (!selectedPatient && data.patients && data.patients.length > 0) {
        setSelectedPatient(data.patients[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch assigned patients.');
    } finally {
      setIsLoadingPatients(false);
    }
  }, [selectedPatient]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // 2. Fetch patient reports when patient or date changes
  const fetchPatientReports = useCallback(async () => {
    if (!selectedPatient) return;
    setIsLoadingReports(true);
    try {
      const data = await api.get(`/doctor/patients/${selectedPatient.id}/reports`, {
        date: selectedDate,
      });
      setPatientReports(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch patient reports.');
    } finally {
      setIsLoadingReports(false);
    }
  }, [selectedPatient, selectedDate]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientReports();
    }
  }, [selectedPatient, selectedDate, fetchPatientReports]);

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
      return <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Low</span>;
    }
    if (val <= 140) {
      return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Optimal</span>;
    }
    return <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">High</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-700/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Clinical Portal (Bonus Feature)</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Assigned Patients Overview
            </h1>
            <p className="text-teal-100 text-sm mt-1 max-w-xl">
              Inspect clinical records, multi-window reports, and historical glucose charts for patients assigned to your care.
            </p>
          </div>
          <button
            onClick={fetchPatients}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 self-start sm:self-auto flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPatients ? 'animate-spin' : ''}`} />
            <span>Refresh Patients</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Sidebar Patients List + Report View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Patient List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Assigned Patients ({patients.length})</span>
            </h2>
          </div>

          {isLoadingPatients ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No patients assigned yet.</div>
          ) : (
            <div className="space-y-2">
              {patients.map((patient) => {
                const isSelected = selectedPatient?.id === patient.id;
                return (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-300 shadow-xs'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{patient.name}</h3>
                      <p className="text-[11px] text-slate-500">{patient.email}</p>
                      <div className="mt-1.5 flex items-center space-x-2 text-[10px] text-slate-400">
                        <span>{patient.total_readings} records</span>
                        {patient.latest_reading_value && (
                          <span>• Last: <strong className="text-slate-700">{patient.latest_reading_value} mg/dl</strong></span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Patient Clinical Reports (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPatient ? (
            <>
              {/* Patient Header & Date Selector */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-black text-slate-900">{selectedPatient.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      Patient
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedPatient.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent font-bold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setSelectedDate('2026-10-15')}
                    className="px-2.5 py-1.5 text-[11px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors flex items-center space-x-1"
                    title="Assignment demo date"
                  >
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Assignment Date (15 Oct 2026)</span>
                  </button>
                </div>
              </div>

              {isLoadingReports ? (
                <div className="bg-white rounded-3xl p-12 text-center text-xs text-slate-400 border border-slate-200">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                  <span>Loading patient clinical report...</span>
                </div>
              ) : patientReports ? (
                <div className="space-y-6">
                  {/* 3 Report Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ReportCard
                      title="Daily Report"
                      dateRange={patientReports.daily.startDate}
                      stats={patientReports.daily}
                      emptyMessage="No readings logged on this date."
                    />
                    <ReportCard
                      title="Month-to-Date"
                      dateRange={`${patientReports.monthToDate.startDate} to ${patientReports.monthToDate.endDate}`}
                      stats={patientReports.monthToDate}
                      emptyMessage="No readings logged MTD."
                    />
                    <ReportCard
                      title="Monthly (Prev Month)"
                      dateRange={`${patientReports.monthly.startDate} to ${patientReports.monthly.endDate}`}
                      stats={patientReports.monthly}
                      emptyMessage="No readings in previous month."
                    />
                  </div>

                  {/* Daily Slot Breakdown */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Daily Slot Readings ({patientReports.daily.startDate})
                      </h3>
                      <span className="text-xs font-semibold text-slate-500">
                        {patientReports.daily.readings.length} slots recorded
                      </span>
                    </div>

                    {patientReports.daily.readings.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        No readings logged by patient for this day.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {patientReports.daily.readings.map((reading) => (
                          <div
                            key={reading.id}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="p-1 bg-white rounded shadow-2xs border border-slate-200">
                                {getSlotIcon(reading.slot)}
                              </span>
                              {getGlucoseStatusPill(reading.value)}
                            </div>
                            <p className="text-xs font-bold text-slate-700 truncate">{reading.slot}</p>
                            <div className="mt-1 flex items-baseline space-x-1">
                              <span className="text-xl font-black text-slate-900">{reading.value}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">mg/dl</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Monthly Trend Chart */}
                  <TrendChart
                    readings={patientReports.monthly.readings}
                    title={`${selectedPatient.name} – Monthly Glucose Trends (${patientReports.monthly.startDate} – ${patientReports.monthly.endDate})`}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-xs text-slate-400 border border-slate-200">
              Select a patient from the list to view their reports.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPortalPage;

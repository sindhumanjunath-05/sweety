import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, BarChart3, ListFilter, LogOut, HeartPulse, User } from 'lucide-react';

export const Navbar = ({ activeTab, onTabChange, onOpenAddModal }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <HeartPulse className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Sweety
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Glucose Tracker
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {user?.role === 'doctor' ? (
              <span className="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>Doctor Clinical Portal</span>
              </span>
            ) : (
              <>
                <button
                  onClick={() => onTabChange('dashboard')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-rose-50 text-rose-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => onTabChange('readings')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'readings'
                      ? 'bg-rose-50 text-rose-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  <span>Readings Log</span>
                </button>

                <button
                  onClick={() => onTabChange('reports')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'reports'
                      ? 'bg-rose-50 text-rose-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Reports</span>
                </button>
              </>
            )}
          </nav>

          {/* Right actions: Quick Add Reading + User profile + Logout */}
          <div className="flex items-center space-x-3">
            {user?.role !== 'doctor' && (
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white rounded-lg text-sm font-semibold shadow-sm shadow-rose-600/30 transition-all active:scale-[0.98]"
              >
                <span>+ Log Reading</span>
              </button>
            )}

            <div className="hidden sm:flex items-center pl-2 border-l border-slate-200 space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border ${
                user?.role === 'doctor'
                  ? 'bg-teal-100 text-teal-800 border-teal-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}>
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-slate-800 leading-tight truncate max-w-[120px]">{user?.name}</p>
                <p className="text-slate-400 text-[11px] truncate max-w-[120px]">{user?.role === 'doctor' ? 'Physician' : user?.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Log out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-100 py-2 space-x-1 justify-around">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold ${
              activeTab === 'dashboard' ? 'bg-rose-50 text-rose-700' : 'text-slate-600'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => onTabChange('readings')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold ${
              activeTab === 'readings' ? 'bg-rose-50 text-rose-700' : 'text-slate-600'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Readings</span>
          </button>
          <button
            onClick={() => onTabChange('reports')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold ${
              activeTab === 'reports' ? 'bg-rose-50 text-rose-700' : 'text-slate-600'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ReadingModal } from './components/ReadingModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReadingsPage } from './pages/ReadingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DoctorPortalPage } from './pages/DoctorPortalPage';
import { api } from './api/client';
import { CheckCircle, HeartPulse } from 'lucide-react';

export const App = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'readings' | 'reports'

  // Modals state
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState(null);
  const [prefilledSlot, setPrefilledSlot] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [readingToDelete, setReadingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refresh trigger for data reloading across components
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingReading(null);
    setPrefilledDate(null);
    setPrefilledSlot(null);
    setIsReadingModalOpen(true);
  };

  const handleOpenAddModalWithSlot = (date, slot) => {
    setEditingReading(null);
    setPrefilledDate(date);
    setPrefilledSlot(slot);
    setIsReadingModalOpen(true);
  };

  const handleOpenAddModalWithDate = (date) => {
    setEditingReading(null);
    setPrefilledDate(date);
    setPrefilledSlot(null);
    setIsReadingModalOpen(true);
  };

  const handleOpenEditModal = (reading) => {
    setEditingReading(reading);
    setPrefilledDate(null);
    setPrefilledSlot(null);
    setIsReadingModalOpen(true);
  };

  const handleReadingSuccess = (reading, action) => {
    setRefreshTrigger((prev) => prev + 1);
    if (action === 'created') {
      showToast(`Logged ${reading.value} mg/dl for ${reading.slot}!`);
    } else {
      showToast(`Updated reading successfully!`);
    }
  };

  const handleOpenDeleteModal = (reading) => {
    setReadingToDelete(reading);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!readingToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/readings/${readingToDelete.id}`);
      showToast('Reading deleted successfully.');
      setIsDeleteModalOpen(false);
      setReadingToDelete(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err.message || 'Failed to delete reading.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg animate-pulse">
            <HeartPulse className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold text-slate-500">Loading Sweety...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  // Authenticated App Flow
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-rose-100 selection:text-rose-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {user?.role === 'doctor' ? (
          <DoctorPortalPage />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardPage
                onNavigate={setActiveTab}
                onOpenAddModalWithSlot={handleOpenAddModalWithSlot}
                onOpenEditModal={handleOpenEditModal}
              />
            )}

            {activeTab === 'readings' && (
              <ReadingsPage
                onOpenAddModal={handleOpenAddModal}
                onOpenEditModal={handleOpenEditModal}
                onOpenDeleteModal={handleOpenDeleteModal}
                refreshTrigger={refreshTrigger}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsPage
                onOpenAddModalWithDate={handleOpenAddModalWithDate}
              />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <ReadingModal
        isOpen={isReadingModalOpen}
        onClose={() => setIsReadingModalOpen(false)}
        onSuccess={handleReadingSuccess}
        initialData={editingReading}
        prefilledDate={prefilledDate}
        prefilledSlot={prefilledSlot}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        reading={readingToDelete}
        isDeleting={isDeleting}
      />

      {/* App Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>Sweety – Blood Glucose Tracker (MERN + PostgreSQL) • Built for diabetic patient care</p>
      </footer>
    </div>
  );
};

export default App;

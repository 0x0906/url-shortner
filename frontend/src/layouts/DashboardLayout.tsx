import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
const DashboardLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0b] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600/20 dark:border-emerald-400/20 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0a0a0b] transition-colors duration-300 relative overflow-hidden">
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;

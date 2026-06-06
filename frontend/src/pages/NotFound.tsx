import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Link2 } from 'lucide-react';
export const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Link2 className="w-12 h-12" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">404</h1>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Page Not Found</h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
            The resource you are trying to view does not exist, has expired, or was moved to another location.
          </p>
        </div>
        <div className="pt-2">
          <Button variant="primary" onClick={() => navigate('/')} className="w-full gap-2 cursor-pointer">
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
export default NotFound;

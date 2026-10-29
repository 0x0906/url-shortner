import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
const Navbar = () => {
  const { user, logout } = useAuth();
  return (
    <nav className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="p-2 bg-emerald-600 rounded-xl text-white">
          <Link2 className="w-5 h-5" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
          TrimURL
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{user.name}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{user.email}</span>
            </div>
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all duration-200 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Log In
            </Link>
            <Link to="/register" className="px-3 py-1.5 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;

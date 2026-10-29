import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Link2, LogOut, Laptop, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
const Sidebar = () => {
  const { logout } = useAuth();
  const navItems = [
    { to: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { to: '/links', name: 'My Links', icon: Link2 },
    { to: '/devices', name: 'Logged Devices', icon: Laptop },
    { to: '/settings', name: 'Settings', icon: SettingsIcon }
  ];
  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/40 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] shrink-0">
      <div className="py-6 px-4 flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 mb-2">
          Navigation
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 border border-transparent'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          );
        })}
      </div>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;

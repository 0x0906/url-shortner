import React from 'react';
import { LucideIcon } from 'lucide-react';
export interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
  className?: string;
}
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  isLoading = false,
  className = ''
}) => {
  return (
    <div className={`group bg-white/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm relative overflow-hidden ${className}`}>
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
          <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
              {title}
            </span>
            {Icon && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {value}
            </span>
          </div>
          {subtext && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {subtext}
            </p>
          )}
        </>
      )}
    </div>
  );
};
export default StatCard;

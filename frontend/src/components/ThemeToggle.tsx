import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700/40">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
          theme === 'dark'
            ? 'bg-zinc-700 text-amber-400 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
          theme === 'system'
            ? 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
        }`}
        title="System Mode"
      >
        <Laptop className="w-4 h-4" />
      </button>
    </div>
  );
};
export default ThemeToggle;

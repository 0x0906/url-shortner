import React from 'react';
export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className="overflow-x-auto w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/40">
    <table className={`min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-sm ${className}`}>
      {children}
    </table>
  </div>
);
export const Thead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
    {children}
  </thead>
);
export const Tbody: React.FC<{ children: React.ReactNode; isEmpty?: boolean; colSpan?: number }> = ({ children, isEmpty = false, colSpan = 1 }) => (
  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
    {isEmpty ? (
      <tr>
        <td colSpan={colSpan} className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500 font-medium">
          No records found.
        </td>
      </tr>
    ) : (
      children
    )}
  </tbody>
);
export const Tr: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <tr className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${className}`}>
    {children}
  </tr>
);
export const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th className={`px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 ${className}`}>
    {children}
  </th>
);
export const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-6 py-4 whitespace-nowrap align-middle ${className}`}>
    {children}
  </td>
);

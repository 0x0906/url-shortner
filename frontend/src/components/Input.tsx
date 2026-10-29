import React from 'react';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
const Input: React.FC<InputProps> = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-2.5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20 transition-all duration-200 ${
          error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500 dark:focus:border-rose-500 dark:focus:ring-rose-500/20' : ''
        }`}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-rose-500 mt-0.5 animate-slide-in">
          {error}
        </span>
      )}
    </div>
  );
};
export default Input;

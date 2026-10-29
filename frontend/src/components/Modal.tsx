import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  if (!isOpen) return null;
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizes[size]} bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10`}
        style={{
          animation: 'modalOpen 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 max-h-[80vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes modalOpen {
          from {
            transform: scale(0.95) translateY(10px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};
export default Modal;

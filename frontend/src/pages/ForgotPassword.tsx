import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import Navbar from '../components/Navbar';
import Button from '../components/Button';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setIsSent(true);
      toast('Link sent.', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to send link.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] bg-grid-pattern transition-colors duration-300 flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-sm p-6 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Forgot Password?</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              We'll send you reset steps.
            </p>
          </div>

          {isSent ? (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-800 dark:text-zinc-200 text-sm">
                Link sent to <strong>{email}</strong>. Check console.
              </div>
              <Link to="/login" className="inline-block text-sm font-medium text-zinc-900 dark:text-white hover:underline">
                Back to Log In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full rounded-md" isLoading={isLoading}>
                Send Link
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                  Back to Log In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

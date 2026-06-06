import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import Navbar from '../components/Navbar';
import Button from '../components/Button';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!token) {
      toast('Bad or missing token.', 'error');
      navigate('/login');
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 8) {
      toast('Password needs 8+ chars.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response: any = await api.post('/auth/reset-password', { token, newPassword: password });
      if (response.success) {
        toast('Password reset. Please log in.', 'success');
        navigate('/login');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to reset password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] bg-grid-pattern transition-colors duration-300 flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-sm p-6 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">New Password</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Type your new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full rounded-md mt-2" isLoading={isLoading}>
              Reset Password
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Back to Log In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

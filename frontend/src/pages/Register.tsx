import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import Input from '../components/Input';
import Button from '../components/Button';
import Navbar from '../components/Navbar';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { prefilledUrl?: string } | null;

  const validate = () => {
    const newErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Name required.';
    }
    if (!email) {
      newErrors.email = 'Email required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email.';
    }
    if (!password) {
      newErrors.password = 'Must be 8+ chars with upper, lower, number, and symbol.';
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);
      if (password.length < 8 || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        newErrors.password = 'Must be 8+ chars with upper, lower, number, and symbol.';
      }
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Type password again.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register(name, email, password);
      toast('Signed up! Check console for link.', 'success');
      navigate('/login', { 
        state: { 
          verificationInfo: 'Link sent. Click it to verify, then log in.' 
        } 
      });
    } catch (err: any) {
      toast(err.message || 'Sign up failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] bg-grid-pattern transition-colors duration-300 flex flex-col relative overflow-hidden">
      <Navbar />
      
      <div className="flex-grow flex flex-col justify-center items-center p-6 relative z-10">
        <div className="w-full max-w-md p-10 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm backdrop-blur-xl transition-all">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Create Account</h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Sign up to start tracking your links.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Name"
              name="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              required
            />

            <Button type="submit" variant="primary" className="w-full rounded-xl py-3.5 font-bold text-base mt-4 shadow-sm transition-transform active:scale-95" isLoading={isLoading}>
              Sign Up
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-zinc-500 mt-8">
            Already have an account?{' '}
            <Link 
              to="/login" 
              state={state}
              className="text-zinc-900 dark:text-white font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

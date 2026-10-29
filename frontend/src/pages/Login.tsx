import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import Input from '../components/Input';
import Button from '../components/Button';
import Navbar from '../components/Navbar';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    prefilledUrl?: string;
    verificationInfo?: string;
    userEmail?: string;
    senderEmail?: string;
  } | null;
  const queryParams = new URLSearchParams(location.search);
  const isVerified = queryParams.get('verified') === 'true';
  const isError = queryParams.get('error');

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email.';
    }
    if (!password) {
      newErrors.password = 'Password required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(email, password);
      toast('Logged in.', 'success');
      if (state?.prefilledUrl) {
        navigate('/dashboard', { state: { prefilledUrl: state.prefilledUrl } });
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast(err.message || 'Login failed.', 'error');
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
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Welcome Back</h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Log in to your account to continue.</p>
          </div>

          {isVerified && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm font-medium flex items-center justify-center">
              Email confirmed. Log in below.
            </div>
          )}

          {isError === 'invalid_token' && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-medium flex items-center justify-center">
              Bad or expired link.
            </div>
          )}

          {state?.verificationInfo && !isVerified && (
            <div className="mb-6 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/50 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-zinc-200/60 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1 flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    Verification link sent
                  </p>
                  {state.userEmail && state.senderEmail ? (
                    <>
                      <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                        Sent to <span className="font-semibold text-zinc-900 dark:text-zinc-200">{state.userEmail}</span> from{' '}
                        <span className="font-semibold text-zinc-900 dark:text-zinc-200">{state.senderEmail}</span>.
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] pt-1">
                        Please check your inbox or spam folder to complete verification.
                      </p>
                    </>
                  ) : (
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                      {state.verificationInfo}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="none"
            />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                  Forgot?
                </Link>
              </div>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full rounded-xl py-3.5 font-bold text-base mt-2 shadow-sm transition-transform active:scale-95" isLoading={isLoading}>
              Log In
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-zinc-500 mt-8">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              state={state}
              className="text-zinc-900 dark:text-white font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

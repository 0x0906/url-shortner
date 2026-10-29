import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2, Link2, ExternalLink, MousePointerClick, Lock } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
interface ResolveResponse {
  original_url: string;
  click_count: number;
}
const RedirectPage = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [urlData, setUrlData] = useState<ResolveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const fetchedRef = React.useRef(false);
  useEffect(() => {
    const resolveUrl = async (providedPassword?: string) => {
      if (!providedPassword && fetchedRef.current) return;
      if (!providedPassword) fetchedRef.current = true;
      try {
        setIsLoading(true);
        setPasswordError('');
        const response: any = await api.post(`/urls/resolve/${shortCode}`, { password: providedPassword });
        if (response.success) {
          setIsPasswordRequired(false);
          setUrlData(response.data);
        }
      } catch (err: any) {
        if (err.message === 'PASSWORD_REQUIRED') {
          setIsPasswordRequired(true);
        } else if (err.status === 403 && err.message === 'Invalid password.') {
          setPasswordError('Incorrect password. Please try again.');
        } else {
          setError(err.message || 'Failed to resolve link.');
          setTimeout(() => navigate('/404'), 2000);
        }
      } finally {
        setIsLoading(false);
      }
    };
    if (!isPasswordRequired && !urlData) {
      resolveUrl();
    }
  }, [shortCode, navigate, isPasswordRequired, urlData]);
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    const submitPassword = async () => {
      setIsLoading(true);
      setPasswordError('');
      try {
        const response: any = await api.post(`/urls/resolve/${shortCode}`, { password });
        if (response.success) {
          setIsPasswordRequired(false);
          setUrlData(response.data);
        }
      } catch (err: any) {
        if (err.message === 'Invalid password.' || (err.status === 403 && err.message?.toLowerCase().includes('password'))) {
          setPasswordError('Incorrect password. Please try again.');
        } else {
          setError(err.message || 'Failed to resolve link.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    submitPassword();
  };
  useEffect(() => {
    if (!urlData || isLoading || error || isPasswordRequired) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      window.location.href = urlData.original_url;
    }
  }, [countdown, urlData, isLoading, error, isPasswordRequired]);
  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex flex-col justify-center items-center p-4 transition-colors duration-300">
        <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center max-w-md w-full">
          <div className="text-rose-500 font-bold mb-2">Error</div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">{error}</p>
          <p className="text-xs text-zinc-400 mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }
  if (isPasswordRequired) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse-slow" />
        <div className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl border border-zinc-200 dark:border-zinc-800 relative z-10 text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-600/20">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Protected Link</h1>
          <p className="text-sm text-zinc-500 mb-6">This link is protected. Please enter the password to continue.</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <Input
              name="password"
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
              required
            />
            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Unlock Link
            </Button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="w-full max-w-lg p-8 rounded-2xl glass-panel shadow-2xl border border-zinc-200 dark:border-zinc-800 relative text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-600/20">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Link2 className="w-8 h-8" />}
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Resolving Link...</h1>
            <p className="text-sm text-zinc-500 font-medium">Please wait a moment.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-in">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Redirecting in <span className="text-emerald-600 dark:text-emerald-400">{countdown}</span>...
              </h1>
              <p className="text-sm text-zinc-500 font-medium">You are being taken to the original destination.</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-left flex flex-col gap-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <ExternalLink className="w-3.5 h-3.5" /> Destination
                </span>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate select-all" title={urlData?.original_url}>
                  {urlData?.original_url}
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <MousePointerClick className="w-3.5 h-3.5" /> Link Statistics
                </span>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  This link has been opened <strong className="text-zinc-900 dark:text-white">{urlData?.click_count}</strong> times.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => window.location.href = urlData!.original_url}
                className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                Skip Countdown <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default RedirectPage;

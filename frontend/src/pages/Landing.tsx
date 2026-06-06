import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { 
  BarChart3, 
  Zap,
  QrCode, 
  Lock, 
  ArrowRight
} from 'lucide-react';

export const Landing = () => {
  const [url, setUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleGetStarted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (isAuthenticated) {
      navigate('/dashboard', { state: { prefilledUrl: url } });
    } else {
      setIsLoading(true);
      try {
        const response: any = await api.post('/urls', { original_url: url });
        if (response.success) {
          const shortCode = response.data.short_code;
          const fullUrl = `${window.location.origin.replace('5173', '5000')}/${shortCode}`;
          setShortenedUrl(fullUrl);
          toast('Short link created! Expires in 7 days.', 'success');
        }
      } catch (err: any) {
        toast(err.message || 'Failed to create link.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] bg-grid-pattern transition-colors duration-300 relative overflow-hidden">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-24 sm:py-32 space-y-32 relative z-10">
        
        {/* Hero Section */}
        <section className="text-center space-y-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-widest shadow-sm backdrop-blur-md">
            The Modern Link Manager
          </div>
          
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-zinc-900 dark:text-white tracking-tighter leading-tight drop-shadow-sm">
            Make Links <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-transparent bg-clip-text drop-shadow-sm">
              Short and Simple
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto font-medium">
            Turn long, messy links into powerful short URLs. Set custom names, instantly generate QR codes, and track your global clicks in real-time.
          </p>

          <form 
            onSubmit={handleGetStarted} 
            className="mt-12 p-2 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto backdrop-blur-xl focus-within:ring-2 focus-within:ring-zinc-900/20 dark:focus-within:ring-white/20 transition-all duration-300"
          >
            <input
              type="url"
              placeholder="Paste your long link here..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setShortenedUrl(null);
              }}
              required
              className="flex-grow bg-transparent border-none focus:ring-0 text-base px-6 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none w-full"
            />
            <Button type="submit" variant="primary" className="rounded-xl px-8 py-4 font-bold text-base shrink-0 transition-transform active:scale-95" isLoading={isLoading}>
              Shorten Now
            </Button>
          </form>

          {shortenedUrl && !isAuthenticated && (
            <div className="mt-8 p-6 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between text-left animate-slide-in shadow-sm max-w-3xl mx-auto backdrop-blur-md">
              <div className="w-full sm:w-auto overflow-hidden">
                <span className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">Your Ready Link</span>
                <a href={shortenedUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-zinc-900 dark:text-white hover:underline transition-colors truncate block">
                  {shortenedUrl}
                </a>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(shortenedUrl);
                  toast('Copied to clipboard!', 'success');
                }}
                className="mt-4 sm:mt-0 w-full sm:w-auto px-6 py-3 rounded-xl font-bold shadow-sm"
              >
                Copy Link
              </Button>
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="space-y-16">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Everything you need</h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400 mt-4 font-medium">Powerful tools packed into a beautiful dashboard.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: "Deep Analytics", desc: "Track every single click, device, and browser in real-time." },
              { icon: Zap, title: "Custom Aliases", desc: "Make your links memorable with fully custom URL endings." },
              { icon: QrCode, title: "QR Codes", desc: "Instantly generate and download scannable QR codes." },
              { icon: Lock, title: "Secure & Fast", desc: "Enterprise-grade infrastructure ensures maximum uptime." }
            ].map((feature, i) => (
              <div key={i} className="group p-8 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative p-12 md:p-20 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-center overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
              Ready to take control?
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
              Join today and start tracking, managing, and supercharging your links for free.
            </p>
            <Link to="/register" className="inline-block">
              <Button variant="primary" className="rounded-2xl px-8 py-4 font-bold text-lg shadow-sm group flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 flex items-center justify-center border-t border-zinc-200 dark:border-zinc-800 relative z-10">
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">© 2026 TrimURL.</p>
      </footer>
    </div>
  );
};

export default Landing;

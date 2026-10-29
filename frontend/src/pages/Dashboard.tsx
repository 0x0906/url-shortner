import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import StatCard from '../components/StatCard';
import Input from '../components/Input';
import Button from '../components/Button';
import QrCodeModal from '../components/QrCodeModal';
import { 
  Link2, 
  MousePointerClick, 
  ToggleLeft, 
  Copy, 
  QrCode, 
  Globe, 
  Smartphone, 
  Cpu, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
interface UrlItem {
  id: string;
  original_url: string;
  short_code: string;
  custom_alias: string | null;
  click_count: number;
  expires_at: string | null;
  is_active: boolean;
  user_id: string;
  created_at: string;
}
interface BreakdownItem {
  name: string;
  value: number;
  percentage?: number;
}
interface DashboardAnalytics {
  summary: {
    totalUrls: number;
    totalClicks: number;
    activeUrls: number;
  };
  topUrls: UrlItem[];
  dailyClicks: { date: string; clicks: number }[];
  recentActivity: any[];
  breakdowns: {
    browser: BreakdownItem[];
    os: BreakdownItem[];
    device: BreakdownItem[];
  };
}
export const Dashboard = () => {
  const location = useLocation();
  const state = location.state as { prefilledUrl?: string } | null;
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [originalUrl, setOriginalUrl] = useState<string>(state?.prefilledUrl || '');
  const [customAlias, setCustomAlias] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isOneTime, setIsOneTime] = useState<boolean>(false);
  const [newLink, setNewLink] = useState<UrlItem | null>(null);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const toast = useToast();
  const fetchDashboardData = async () => {
    try {
      const response: any = await api.get('/analytics/dashboard');
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to fetch dashboard data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchDashboardData();
  }, []);
  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl) {
      toast('Please provide a URL to shorten.', 'error');
      return;
    }
    setIsCreating(true);
    try {
      const response: any = await api.post('/urls', {
        original_url: originalUrl,
        custom_alias: customAlias || undefined,
        expires_at: expiresAt || undefined,
        password: password || undefined,
        is_one_time: isOneTime
      });
      if (response.success) {
        setNewLink(response.data);
        setOriginalUrl('');
        setCustomAlias('');
        setExpiresAt('');
        setPassword('');
        setIsOneTime(false);
        toast('Short URL created successfully!', 'success');
        fetchDashboardData();
      }
    } catch (err: any) {
      toast(err.message || 'Shortening failed.', 'error');
    } finally {
      setIsCreating(false);
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Link copied to clipboard!', 'success');
  };
  const getFullShortUrl = (shortCode: string) => {
    return `${window.location.origin.replace('5173', '5000')}/${shortCode}`;
  };
  const getPercentageList = (list: BreakdownItem[]) => {
    if (!list || list.length === 0) return [];
    const total = list.reduce((sum, item) => sum + item.value, 0);
    return list.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0
    }));
  };
  return (
    <div className="space-y-8 animate-fade-in text-zinc-800 dark:text-zinc-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-base text-zinc-500 mt-2 font-medium">Manage your links and view real-time analytics.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl w-fit shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Status
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Clicks"
          value={analytics?.summary?.totalClicks ?? 0}
          subtext="How many times people clicked your links"
          icon={MousePointerClick}
          isLoading={isLoading}
        />
        <StatCard
          title="Short Links"
          value={analytics?.summary?.totalUrls ?? 0}
          subtext="How many short links you made"
          icon={Link2}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Links"
          value={analytics?.summary?.activeUrls ?? 0}
          subtext="Links that work right now"
          icon={ToggleLeft}
          isLoading={isLoading}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/60 shadow-sm border border-zinc-200 dark:border-zinc-800 relative backdrop-blur-xl">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
              Make a Short Link
            </h2>
            <form onSubmit={handleShorten} className="space-y-4">
              <Input
                label="Long Link"
                name="originalUrl"
                placeholder="https://example.com/some-long-link"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Custom Name (Optional)"
                  name="customAlias"
                  placeholder="e.g., my-link"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                />
                <Input
                  label="Expiry Date (Optional)"
                  name="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <Input
                  label="Password (Optional)"
                  name="password"
                  type="password"
                  placeholder="Leave empty for public"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="isOneTime"
                    checked={isOneTime}
                    onChange={(e) => setIsOneTime(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isOneTime" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    One-Time Link (stops working after 1 click)
                  </label>
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full cursor-pointer" isLoading={isCreating}>
                Make Short Link
              </Button>
            </form>
            {newLink && (
              <div className="mt-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-in">
                <div className="space-y-1 overflow-hidden">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Your Short Link</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white break-all select-all">
                    {getFullShortUrl(newLink.short_code)}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    Goes to: {newLink.original_url}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => copyToClipboard(getFullShortUrl(newLink.short_code))} className="px-3 py-2 text-xs gap-1.5 cursor-pointer">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </Button>
                  <Button variant="secondary" onClick={() => setIsQrOpen(true)} className="px-3 py-2 text-xs gap-1.5 cursor-pointer">
                    <QrCode className="w-3.5 h-3.5" /> QR Code
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Top Links</h2>
              <Link to="/links" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            ) : !analytics?.topUrls || analytics.topUrls.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm font-medium">
                No links yet. Make one above!
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {analytics.topUrls.map((url) => (
                  <div key={url.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{url.custom_alias || url.short_code}</p>
                      <p className="text-xs text-zinc-400 truncate">{url.original_url}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{url.click_count}</span>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase">Clicks</p>
                      </div>
                      <Link
                        to={`/links`}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                        title="View Details"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Visitor Devices</h2>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              </div>
            ) : !analytics?.breakdowns?.device || analytics.breakdowns.device.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-sm font-medium">
                No device clicks recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {getPercentageList(analytics.breakdowns.device).map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> {item.name}
                      </span>
                      <span>{item.value} ({Math.round(item.percentage ?? 0)}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Visitor Web Browsers</h2>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              </div>
            ) : !analytics?.breakdowns?.browser || analytics.breakdowns.browser.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-sm font-medium">
                No browser clicks recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {getPercentageList(analytics.breakdowns.browser).map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> {item.name}
                      </span>
                      <span>{item.value} ({Math.round(item.percentage ?? 0)}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Recent Clicks</h2>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            ) : !analytics?.recentActivity || analytics.recentActivity.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-sm font-medium">
                No clicks recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="text-xs p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/40 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        /{activity.url.custom_alias || activity.url.short_code}
                      </span>
                      <span>
                        {new Date(activity.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-zinc-400 truncate select-all">{activity.url.original_url}</p>
                    <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold pt-1">
                      <span>IP: {activity.ip_address}</span>
                      <span>OS: {activity.user_agent.includes('Windows') ? 'Windows' : 'Mac/Linux/Other'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {newLink && (
        <QrCodeModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          shortUrl={getFullShortUrl(newLink.short_code)}
          alias={newLink.custom_alias || newLink.short_code}
        />
      )}
    </div>
  );
};
export default Dashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import QrCodeModal from '../components/QrCodeModal';
import { 
  Search, 
  Copy, 
  QrCode, 
  Edit, 
  Trash2, 
  BarChart3, 
  ToggleLeft, 
  ToggleRight, 
  Calendar,
  AlertCircle
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
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
export const Links = () => {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, pages: 1, limit: 10, total: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [selectedUrl, setSelectedUrl] = useState<UrlItem | null>(null);
  const [editOriginalUrl, setEditOriginalUrl] = useState<string>('');
  const [editCustomAlias, setEditCustomAlias] = useState<string>('');
  const [editExpiresAt, setEditExpiresAt] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editPassword, setEditPassword] = useState<string>('');
  const [editIsOneTime, setEditIsOneTime] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const toast = useToast();
  const navigate = useNavigate();
  const fetchUrls = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeParam = statusFilter === 'active' ? 'true' : statusFilter === 'inactive' ? 'false' : undefined;
      const response: any = await api.get('/urls', {
        params: {
          search,
          is_active: activeParam,
          page,
          limit: 8
        }
      });
      if (response.success) {
        setUrls(response.urls);
        setPagination(response.pagination);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to fetch URLs.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page, toast]);
  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Link copied to clipboard!', 'success');
  };
  const getFullShortUrl = (shortCode: string) => {
    return `${window.location.origin.replace('5173', '5000')}/${shortCode}`;
  };
  const openQrModal = (url: UrlItem) => {
    setSelectedUrl(url);
    setIsQrOpen(true);
  };
  const openEditModal = (url: UrlItem) => {
    setSelectedUrl(url);
    setEditOriginalUrl(url.original_url);
    setEditCustomAlias(url.custom_alias || '');
    setEditExpiresAt(
      url.expires_at ? new Date(url.expires_at).toISOString().slice(0, 16) : ''
    );
    setEditIsActive(url.is_active);
    setEditPassword(''); // Reset password field, user can enter a new one to change it
    // Note: Since we don't return is_one_time in the URL object for security/simplicity reasons right now,
    setEditIsOneTime((url as any).is_one_time || false);
    setIsEditOpen(true);
  };
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOriginalUrl || !selectedUrl) return;
    setIsUpdating(true);
    try {
      const response: any = await api.put(`/urls/${selectedUrl.id}`, {
        original_url: editOriginalUrl,
        custom_alias: editCustomAlias || null,
        expires_at: editExpiresAt || null,
        is_active: editIsActive,
        password: editPassword || undefined,
        is_one_time: editIsOneTime
      });
      if (response.success) {
        toast('URL details updated successfully.', 'success');
        setIsEditOpen(false);
        fetchUrls();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update URL.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };
  const openDeleteModal = (url: UrlItem) => {
    setSelectedUrl(url);
    setIsDeleteOpen(true);
  };
  const handleDelete = async () => {
    if (!selectedUrl) return;
    try {
      const response: any = await api.delete(`/urls/${selectedUrl.id}`);
      if (response.success) {
        toast('URL has been deleted.', 'success');
        setIsDeleteOpen(false);
        fetchUrls();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to delete URL.', 'error');
    }
  };
  const toggleStatusDirectly = async (url: UrlItem) => {
    try {
      const response: any = await api.put(`/urls/${url.id}`, {
        is_active: !url.is_active
      });
      if (response.success) {
        toast(`Link set to ${!url.is_active ? 'active' : 'inactive'}.`, 'success');
        fetchUrls();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to toggle status.', 'error');
    }
  };
  return (
    <div className="space-y-6 animate-fade-in text-zinc-800 dark:text-zinc-100">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Your Links</h1>
        <p className="text-sm text-zinc-500 mt-1">Search, edit, or check stats for your short links.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by link or name..."
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-zinc-50 dark:bg-zinc-800/60 text-sm pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={handleFilterChange}
            className="bg-white dark:bg-zinc-900/60 text-sm px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Links</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <Thead>
              <Tr>
                <Th>Link Name</Th>
                <Th>Web Link</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-center">Clicks</Th>
                <Th>Expires On</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody isEmpty={urls.length === 0} colSpan={6}>
              {urls.map((url) => {
                const shortUrl = getFullShortUrl(url.short_code);
                const isExpired = url.expires_at && new Date(url.expires_at) < new Date();
                return (
                  <Tr key={url.id}>
                    <Td className="font-semibold text-zinc-900 dark:text-white">
                      <div className="flex flex-col">
                        <span>/{url.custom_alias || url.short_code}</span>
                        <button
                          onClick={() => copyToClipboard(shortUrl)}
                          className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold shrink-0 self-start transition-colors cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy Link
                        </button>
                      </div>
                    </Td>
                    <Td className="max-w-xs truncate text-zinc-500 dark:text-zinc-400 select-all" title={url.original_url}>
                      {url.original_url}
                    </Td>
                    <Td className="text-center">
                      <button
                        onClick={() => toggleStatusDirectly(url)}
                        className="cursor-pointer"
                        title={url.is_active ? 'Click to turn off' : 'Click to turn on'}
                      >
                        {url.is_active && !isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                            Working
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">
                            Disabled
                          </span>
                        )}
                      </button>
                    </Td>
                    <Td className="text-center font-bold text-zinc-700 dark:text-zinc-200">
                      {url.click_count}
                    </Td>
                    <Td className="text-xs text-zinc-500 dark:text-zinc-400">
                      {url.expires_at ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                          {new Date(url.expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 font-medium">Never</span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openQrModal(url)}
                          className="p-2 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-700/40 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                          title="QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/analytics/${url.id}`)}
                          className="p-2 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-700/40 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                          title="Click Stats"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(url)}
                          className="p-2 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-700/40 text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                          title="Edit Link"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(url)}
                          className="p-2 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-700/40 text-zinc-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} links)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs cursor-pointer"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 py-1.5 text-xs cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      {selectedUrl && (
        <QrCodeModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          shortUrl={getFullShortUrl(selectedUrl.short_code)}
          alias={selectedUrl.custom_alias || selectedUrl.short_code}
        />
      )}
      {selectedUrl && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Link">
          <form onSubmit={handleUpdate} className="space-y-5 py-2">
            <Input
              label="Long Link"
              name="originalUrl"
              value={editOriginalUrl}
              onChange={(e) => setEditOriginalUrl(e.target.value)}
              required
            />
            <Input
              label="Custom Name (Optional)"
              name="customAlias"
              value={editCustomAlias}
              onChange={(e) => setEditCustomAlias(e.target.value)}
              placeholder="e.g., my-link"
            />
            <Input
              label="Expiry Date (Optional)"
              name="expiresAt"
              type="datetime-local"
              value={editExpiresAt}
              onChange={(e) => setEditExpiresAt(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <Input
                label="New Password (Optional)"
                name="password"
                type="password"
                placeholder="Leave blank to keep current"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="editIsOneTime"
                  checked={editIsOneTime}
                  onChange={(e) => setEditIsOneTime(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="editIsOneTime" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  One-Time Link
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setEditIsActive(!editIsActive)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
              >
                {editIsActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />}
              </button>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Status (Active/Inactive)</span>
                <span className="text-xs text-zinc-500">Turn off to stop people from using this link.</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsEditOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="cursor-pointer" isLoading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {selectedUrl && (
        <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Link?">
          <div className="space-y-5 py-2">
            <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400">Are you sure?</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-5">
                  Do you want to permanently delete the short link <strong className="text-zinc-900 dark:text-white">/{selectedUrl.custom_alias || selectedUrl.short_code}</strong>? 
                  This will delete the link and all its click statistics. You cannot undo this.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} className="cursor-pointer">
                Yes, Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default Links;

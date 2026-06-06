import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Settings as SettingsIcon, KeyRound } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
export const Settings = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast('New password must be at least 8 characters.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response: any = await api.post('/auth/change-password', { oldPassword, newPassword });
      if (response.success) {
        toast('Password changed successfully.', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to change password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          Account Settings
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your account preferences and security.</p>
      </div>
      <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <Input
            label="Current Password"
            name="oldPassword"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
          <Button type="submit" variant="primary" className="mt-2" isLoading={isLoading}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
};
export default Settings;

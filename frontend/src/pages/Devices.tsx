import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import Button from '../components/Button';
import { Laptop, Smartphone, LogOut, History, ShieldAlert } from 'lucide-react';
interface SessionItem {
  id: string;
  device_name: string;
  ip_address: string;
  created_at: string;
  is_current: boolean;
}
export const Devices = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTerminatingAll, setIsTerminatingAll] = useState<boolean>(false);
  const toast = useToast();
  const { logoutAll } = useAuth();
  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response: any = await api.get('/auth/sessions');
      if (response.success) {
        setSessions(response.sessions);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to fetch active sessions.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchSessions();
  }, []);
  const handleTerminateSession = async (sessionId: string) => {
    try {
      const response: any = await api.delete(`/auth/sessions/${sessionId}`);
      if (response.success) {
        toast('Session terminated successfully.', 'success');
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err: any) {
      toast(err.message || 'Failed to terminate session.', 'error');
    }
  };
  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to log out of all devices? This will close your current session as well.')) {
      return;
    }
    setIsTerminatingAll(true);
    try {
      await logoutAll();
      toast('Successfully logged out of all devices.', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to log out of all devices.', 'error');
    } finally {
      setIsTerminatingAll(false);
    }
  };
  return (
    <div className="space-y-6 animate-fade-in text-zinc-800 dark:text-zinc-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Devices</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your active logins.</p>
        </div>
        <Button
          variant="danger"
          onClick={handleLogoutAll}
          isLoading={isTerminatingAll}
          className="flex items-center gap-2 text-xs font-semibold cursor-pointer shrink-0 self-start sm:self-center"
        >
          <LogOut className="w-4 h-4" /> Log Out of All Devices
        </Button>
      </div>
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <History className="w-5 h-5 text-zinc-500 dark:text-zinc-400" /> Active Sessions
        </h2>
        {isLoading ? (
          <div className="space-y-3 animate-pulse py-6">
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Device</Th>
                <Th>IP Address</Th>
                <Th>Login Time</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody isEmpty={sessions.length === 0} colSpan={4}>
              {sessions.map((session) => {
                const isMobile = session.device_name?.includes('iPhone') || session.device_name?.includes('Android');
                const DeviceIcon = isMobile ? Smartphone : Laptop;
                return (
                  <Tr key={session.id}>
                    <Td className="font-semibold text-zinc-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          <DeviceIcon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{session.device_name}</span>
                          {session.is_current && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 self-start mt-1">
                              This Device
                            </span>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td className="text-zinc-500 dark:text-zinc-400 select-all font-medium text-xs">
                      {session.ip_address}
                    </Td>
                    <Td className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                      {new Date(session.created_at).toLocaleString()}
                    </Td>
                    <Td className="text-right">
                      {!session.is_current ? (
                        <button
                          onClick={() => handleTerminateSession(session.id)}
                          className="p-2 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                          title="Terminate Session"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-600 font-semibold italic pr-3">Current</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </div>
    </div>
  );
};
export default Devices;

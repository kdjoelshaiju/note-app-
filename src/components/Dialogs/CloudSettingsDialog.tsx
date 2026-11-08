import React, { useEffect, useState } from 'react';
import { Cloud, LogOut, RefreshCw, Settings, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NotebookDocument } from '../../types/document';

interface CloudSettingsDialogProps {
  isOpen: boolean;
  documents: NotebookDocument[];
  onClose: () => void;
}

export const CloudSettingsDialog: React.FC<CloudSettingsDialogProps> = ({ isOpen, documents, onClose }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase || !isOpen) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
      setProviderToken(data.session?.provider_token ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      setProviderToken(session?.provider_token ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const signInWithGoogle = async () => {
    if (!supabase) {
      setMessage('Supabase is not configured for this preview.');
      return;
    }
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/drive.file',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) setMessage('Google sign-in could not start. Check the Supabase Google provider configuration.');
  };

  const syncNotes = async () => {
    if (!providerToken) {
      setMessage('Connect Google first to sync notes.');
      return;
    }
    setSyncing(true);
    setMessage('');
    try {
      const content = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), notes: documents }, null, 2)], { type: 'application/json' });
      const metadata = { name: 'Note App — synced notes.json', mimeType: 'application/json' };
      const body = new FormData();
      body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      body.append('file', content);
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken}` },
        body,
      });
      if (!response.ok) throw new Error('sync failed');
      setMessage('Notes synced to Google Drive.');
    } catch {
      setMessage('Sync failed. Please reconnect Google and try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cloud-settings-title">
      <div className="w-full max-w-md rounded-2xl border border-[#383633] bg-[#211f1d] p-6 text-[#f5f4f0] shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#30302c] p-2.5 text-[#d6d3cd]"><Settings size={18} /></div>
            <div><h2 id="cloud-settings-title" className="font-editorial-heading text-lg font-semibold">App settings</h2><p className="text-xs text-[#918c84]">Account and note backups</p></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-[#918c84] hover:bg-[#302e2b] hover:text-white" aria-label="Close settings"><X size={17} /></button>
        </div>
        <section className="rounded-xl border border-[#383633] bg-[#191817] p-4">
          <div className="flex items-center gap-3"><Cloud size={18} className="text-[#c8c3ba]" /><div className="flex-1"><p className="text-sm font-medium">Google Drive sync</p><p className="mt-1 text-xs text-[#918c84]">Keep a JSON backup of all notes in your Drive.</p></div></div>
          {userEmail ? (
            <div className="mt-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs text-[#c8c3ba]">Connected as</p><p className="truncate text-sm">{userEmail}</p></div><button onClick={() => supabase?.auth.signOut()} className="flex items-center gap-2 rounded-lg border border-[#403d39] px-3 py-2 text-xs text-[#c8c3ba] hover:bg-[#302e2b]"><LogOut size={14} /> Sign out</button></div>
          ) : <button onClick={signInWithGoogle} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#f0eee8] px-3 py-2.5 text-sm font-medium text-[#242321] hover:bg-white">Continue with Google</button>}
          {userEmail && <button onClick={syncNotes} disabled={syncing} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#4d4a44] px-3 py-2.5 text-sm text-[#e8e5df] hover:bg-[#302e2b] disabled:opacity-60"><RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing notes…' : 'Sync notes now'}</button>}
          {message && <p className="mt-3 text-xs text-[#c8c3ba]" role="status">{message}</p>}
        </section>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Mail, Calendar, Crown, LogOut, Edit2, Check, X, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { User } from '../App';

interface ProfileProps {
  user: User;
  userId: string;
  onUserUpdate: (user: User) => void;
}

export function Profile({ user, userId, onUserUpdate }: ProfileProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === user.name) { setEditing(false); setName(user.name); return; }
    setSaving(true);
    try {
      const avatar = trimmed.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const updated: User = { ...user, name: trimmed, avatar };
      await api.updateUser(userId, updated);
      onUserUpdate(updated);
      setEditing(false);
    } catch {
      // silently keep current
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
  };

  const joinDate = new Date(user.joinDate).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-6">Profil</h1>

      <div className="rounded-2xl p-6 mb-4" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-semibold shrink-0"
            style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' }}
          >
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm text-white outline-none"
                  style={{ background: '#111827', border: '1px solid #6D28D9' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') { setEditing(false); setName(user.name); }
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="p-1.5 rounded-lg hover:opacity-70 disabled:opacity-40"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditing(false); setName(user.name); }}
                  className="p-1.5 rounded-lg hover:opacity-70"
                  style={{ background: 'rgba(100,116,139,0.15)', color: '#64748B' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-white font-medium truncate">{user.name}</p>
                <button onClick={() => setEditing(true)} className="p-1 rounded hover:opacity-70 transition-opacity">
                  <Edit2 className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              {user.plan === 'pro' ? (
                <span
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}
                >
                  <Crown className="w-3 h-3" /> Pro
                </span>
              ) : (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid rgba(100,116,139,0.2)' }}
                >
                  Free
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-0 divide-y" style={{ borderColor: '#1E2740' }}>
          <div className="flex items-center gap-3 py-3">
            <Mail className="w-4 h-4 shrink-0" style={{ color: '#64748B' }} />
            <div>
              <p className="text-xs" style={{ color: '#64748B' }}>Email</p>
              <p className="text-sm text-white">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3">
            <Calendar className="w-4 h-4 shrink-0" style={{ color: '#64748B' }} />
            <div>
              <p className="text-xs" style={{ color: '#64748B' }}>Bergabung sejak</p>
              <p className="text-sm text-white">{joinDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3">
            <Shield className="w-4 h-4 shrink-0" style={{ color: '#64748B' }} />
            <div>
              <p className="text-xs" style={{ color: '#64748B' }}>Plan</p>
              <p className="text-sm text-white capitalize">{user.plan === 'pro' ? 'Pro' : 'Free'}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
        style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <LogOut className="w-4 h-4" />
        {loggingOut ? 'Keluar...' : 'Keluar dari Akun'}
      </button>
    </div>
  );
}

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Zap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'login' | 'signup';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!email.trim() || !password) { setError('Email dan password wajib diisi.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Nama wajib diisi.'); return; }
    if (password.length < 6) { setError('Password minimal 6 karakter.'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const trimmedName = name.trim();
        const avatar = trimmedName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: trimmedName, avatar } },
        });
        if (err) throw err;
        setSuccess('Akun berhasil dibuat! Cek email kamu untuk verifikasi, lalu masuk.');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
      }
    } catch (e: any) {
      const msg = e?.message || 'Terjadi kesalahan. Coba lagi.';
      if (msg.includes('Invalid login credentials')) setError('Email atau password salah.');
      else if (msg.includes('Email not confirmed')) setError('Email belum diverifikasi. Cek inbox kamu.');
      else if (msg.includes('already registered')) setError('Email sudah terdaftar. Coba masuk.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#080B14' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)' }}
          >
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Impetus</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            {mode === 'login' ? 'Masuk ke akunmu' : 'Buat akun baru'}
          </p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
          <div className="flex rounded-xl p-1 mb-6" style={{ background: '#111827' }}>
            {(['login', 'signup'] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={
                  mode === m
                    ? { background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' }
                    : { color: '#64748B' }
                }
              >
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#94A3B8' }}>Nama Lengkap</label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: '#111827', border: '1px solid #1E2740' }}
                >
                  <User className="w-4 h-4 shrink-0" style={{ color: '#64748B' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nama kamu"
                    className="flex-1 text-sm bg-transparent outline-none text-white placeholder-gray-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#94A3B8' }}>Email</label>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: '#111827', border: '1px solid #1E2740' }}
              >
                <Mail className="w-4 h-4 shrink-0" style={{ color: '#64748B' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@kamu.com"
                  className="flex-1 text-sm bg-transparent outline-none text-white placeholder-gray-600"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>

            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#94A3B8' }}>Password</label>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: '#111827', border: '1px solid #1E2740' }}
              >
                <Lock className="w-4 h-4 shrink-0" style={{ color: '#64748B' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="flex-1 text-sm bg-transparent outline-none text-white placeholder-gray-600"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <button onClick={() => setShowPass(v => !v)} className="transition-opacity hover:opacity-70">
                  {showPass
                    ? <EyeOff className="w-4 h-4" style={{ color: '#64748B' }} />
                    : <Eye className="w-4 h-4" style={{ color: '#64748B' }} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                className="text-xs px-3 py-2.5 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {error}
              </p>
            )}
            {success && (
              <p
                className="text-xs px-3 py-2.5 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                {success}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' }}
            >
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Buat Akun'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#334155' }}>
          Impetus · Productivity &amp; Growth Tracker
        </p>
      </div>
    </div>
  );
}

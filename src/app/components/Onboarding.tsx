import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { User } from '../App';

const SHORT_GOALS = [
  'Naik jabatan atau gaji', 'Bangun dana darurat', 'Turunkan berat badan / olahraga rutin',
  'Pelajari skill baru', 'Mulai side project', 'Perbaiki rutinitas harian',
  'Baca lebih banyak buku', 'Perluas jaringan profesional', 'Menabung untuk pembelian besar', 'Jaga kesehatan mental',
];
const LONG_GOALS = [
  'Pindah karir atau naik jabatan tinggi', 'Kebebasan finansial', 'Mulai bisnis sendiri',
  'Kuasai bidang tertentu', 'Keseimbangan hidup-kerja', 'Beli properti',
  'Jadi pemimpin di bidangku', 'Bangun multiple income streams', 'Terbitkan sesuatu yang bermakna', 'Pensiun lebih awal',
];
const HABIT_OPTIONS = [
  'Rutinitas pagi', 'Olahraga / workout', 'Membaca', 'Meditasi',
  'Journaling', 'Makan sehat', 'Belajar online', 'Networking',
  'Side project', 'Tidur 8 jam', 'Minum air cukup', 'Tidak main HP sebelum jam 12',
];
const SKILL_SUGGESTIONS = [
  'JavaScript', 'Python', 'Analisis Data', 'Public Speaking', 'Menulis',
  'Desain', 'Manajemen Proyek', 'Marketing', 'Leadership', 'Literasi Keuangan',
  'Negosiasi', 'Manajemen Waktu', 'Komunikasi', 'Critical Thinking', 'Sales',
];
const LOADING_MSGS = [
  'Menganalisis profilmu...', 'Membangun peta jalanmu...',
  'Mengevaluasi target vs realita...', 'Hampir selesai...',
];

// Dashboard color palette
const C = {
  bg: '#080B14', surface: '#0D111F', card: '#111827', edge: '#1E2740',
  accent: '#6D28D9', accent2: '#4F46E5', accentLight: '#A78BFA',
  text: '#F1F5F9', muted: '#94A3B8', dim: '#64748B',
  green: '#10B981', pink: '#F472B6', gold: '#D4A853',
};

interface OnbData {
  age: string; occupation: string; income: number;
  shortGoals: string[]; longGoals: string[]; skills: string[]; habits: string[];
}

interface ProfileResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  roadmap: Array<{ label: string; focus: string; actions: string[]; color: string }>;
}

interface Props {
  user: User;
  userId: string;
  onComplete: (updatedUser: User) => void;
}

export function Onboarding({ user, userId, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnbData>({
    age: '', occupation: '', income: 5000000,
    shortGoals: [], longGoals: [], skills: [], habits: [],
  });
  const [profileResult, setProfileResult] = useState<ProfileResult | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [genError, setGenError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [occError, setOccError] = useState('');
  const [customShort, setCustomShort] = useState('');
  const [customLong, setCustomLong] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [customHabit, setCustomHabit] = useState('');

  useEffect(() => { if (step === 7) runGeneration(); }, [step]);

  const runGeneration = async () => {
    setGenError(''); setLoadingProgress(10); setLoadingMsg(LOADING_MSGS[0]);
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx++;
      if (msgIdx < LOADING_MSGS.length) { setLoadingMsg(LOADING_MSGS[msgIdx]); setLoadingProgress((msgIdx + 1) / LOADING_MSGS.length * 80); }
    }, 900);
    try {
      const result = await api.generateLifeProfile(userId, {
        age: parseInt(data.age), occupation: data.occupation, income: data.income,
        shortGoals: data.shortGoals, longGoals: data.longGoals, skills: data.skills, habits: data.habits, userName: user.name,
      });
      clearInterval(interval); setLoadingProgress(100);
      if ((result as any).error || !result.summary) {
        setGenError((result as any).error || 'AI tidak mengembalikan profil. Coba lagi.');
        return;
      }
      setProfileResult(result as ProfileResult);
      await new Promise(r => setTimeout(r, 500)); setStep(8);
    } catch (e: any) { clearInterval(interval); setLoadingProgress(100); setGenError(e?.message || 'Gagal generate profil.'); }
  };

  const handleEnterDashboard = () => {
    if (!profileResult) return;
    onComplete({
      ...user, age: parseInt(data.age), occupation: data.occupation, income: data.income,
      shortGoals: data.shortGoals, longGoals: data.longGoals, skills: data.skills, habits: data.habits,
      onboardingComplete: true,
      lifeProfile: { summary: profileResult.summary, strengths: profileResult.strengths, weaknesses: profileResult.weaknesses },
      roadmap: profileResult.roadmap,
    });
  };

  const nextStep = () => {
    if (step === 1) {
      const age = parseInt(data.age);
      if (!data.age || age < 16 || age > 100) { setAgeError('Masukkan umur yang valid (16–100)'); return; }
      if (!data.occupation.trim()) { setOccError('Masukkan pekerjaan kamu'); return; }
      setAgeError(''); setOccError('');
    }
    if (step === 3 && data.shortGoals.length === 0) return;
    if (step === 4 && data.longGoals.length === 0) return;
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => Math.max(0, s - 1));
  const toggleArr = (key: keyof OnbData, val: string) => {
    setData(d => { const arr = d[key] as string[]; return { ...d, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }; });
  };
  const addCustom = (key: keyof OnbData, val: string, reset: () => void) => {
    if (!val.trim()) return;
    if (!(data[key] as string[]).includes(val.trim())) setData(d => ({ ...d, [key]: [...(d[key] as string[]), val.trim()] }));
    reset();
  };

  // ─── Shared UI ───────────────────────────────────────
  const wrap: React.CSSProperties = {
    background: C.bg, minHeight: '100vh', color: C.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '24px',
  };
  const inp: React.CSSProperties = {
    width: '100%', background: C.surface, border: `1px solid ${C.edge}`,
    borderRadius: '12px', padding: '12px 16px', color: C.text,
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };
  const chip = (sel: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
    border: `1px solid ${sel ? C.accentLight : C.edge}`,
    background: sel ? 'rgba(109,40,217,0.15)' : 'transparent',
    color: sel ? C.accentLight : C.text, fontSize: '14px', transition: 'all .2s',
    userSelect: 'none', textAlign: 'left',
  });
  const btnPrimary = (disabled = false): React.CSSProperties => ({
    background: disabled ? C.edge : `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
    color: disabled ? C.muted : '#fff',
    fontWeight: 700, padding: '10px 24px', borderRadius: '12px', border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '14px',
    boxShadow: disabled ? 'none' : '0 0 20px rgba(109,40,217,0.3)',
  });
  const tag = (val: string, onRemove: () => void) => (
    <span key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', fontSize: '13px', background: 'rgba(109,40,217,0.15)', color: C.accentLight, border: '1px solid rgba(109,40,217,0.3)' }}>
      {val}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '11px', opacity: 0.7 }}>×</button>
    </span>
  );
  const dots = (cur: number, total: number) => (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === cur - 1 ? C.accent : C.edge, boxShadow: i === cur - 1 ? `0 0 10px ${C.accent}` : 'none', transition: 'all .3s' }} />
      ))}
    </div>
  );
  const navBtns = (canNext = true, nextLabel = 'Lanjut') => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
      <button onClick={prevStep} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '14px', padding: '8px 16px' }}>← Kembali</button>
      <button onClick={nextStep} disabled={!canNext} style={btnPrimary(!canNext)}>{nextLabel}</button>
    </div>
  );
  const customRow = (value: string, onChange: (v: string) => void, onAdd: () => void, placeholder: string) => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onAdd()}
        placeholder={placeholder} style={{ ...inp, flex: 1 }} />
      <button onClick={onAdd} style={{ background: C.surface, border: `1px solid ${C.edge}`, borderRadius: '12px', padding: '0 16px', color: C.text, cursor: 'pointer' }}>+</button>
    </div>
  );

  // ─── STEP 0: Welcome ─────────────────────────────────
  if (step === 0) return (
    <div style={wrap}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', marginBottom: '32px', border: '1px solid rgba(109,40,217,0.3)', background: 'rgba(109,40,217,0.1)', color: C.accentLight, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ⚡ Strategic Assessment
        </div>
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(109,40,217,0.4)' }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk, -apple-system, sans-serif', fontSize: 'clamp(3rem,8vw,5rem)', fontWeight: 700, letterSpacing: '-0.05em', marginBottom: '16px', lineHeight: 1 }}>IMPETUS</h1>
        <p style={{ color: C.muted, fontSize: '1.125rem', marginBottom: '48px' }}>The force behind your strategic progress.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '48px' }}>
          {[['💼', 'Career'], ['💰', 'Finance'], ['❤️', 'Health']].map(([icon, label]) => (
            <div key={label} style={{ padding: '16px', borderRadius: '16px', background: C.surface, border: `1px solid ${C.edge}`, textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setStep(1)} style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, color: '#fff', fontWeight: 700, padding: '16px 40px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '1.125rem', boxShadow: '0 0 30px rgba(109,40,217,0.4)' }}>
          Begin Initiation →
        </button>
      </div>
    </div>
  );

  // ─── STEP 1: Age & Occupation ─────────────────────────
  if (step === 1) return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <p style={{ color: C.accentLight, fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Step 1 of 6</p>
        {dots(1, 6)}
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>Tentang Kamu</h2>
        <p style={{ color: C.muted, fontSize: '14px', marginBottom: '32px' }}>Bantu kami memahami titik awalmu.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', color: C.muted, display: 'block', marginBottom: '8px' }}>Umur</label>
            <input type="number" min={16} max={100} value={data.age} placeholder="e.g. 25"
              onChange={e => { setData(d => ({ ...d, age: e.target.value })); setAgeError(''); }} style={inp} />
            {ageError && <p style={{ color: C.pink, fontSize: '12px', marginTop: '4px' }}>{ageError}</p>}
          </div>
          <div>
            <label style={{ fontSize: '13px', color: C.muted, display: 'block', marginBottom: '8px' }}>Pekerjaan Saat Ini</label>
            <input type="text" value={data.occupation} placeholder="e.g. Software Engineer, Mahasiswa, Freelancer"
              onChange={e => { setData(d => ({ ...d, occupation: e.target.value })); setOccError(''); }} style={inp} />
            {occError && <p style={{ color: C.pink, fontSize: '12px', marginTop: '4px' }}>{occError}</p>}
          </div>
        </div>
        {navBtns()}
      </div>
    </div>
  );

  // ─── STEP 2: Income ───────────────────────────────────
  if (step === 2) return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: '680px', background: C.surface, border: `1px solid ${C.edge}`, borderRadius: '24px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr' }}>
          <div style={{ padding: '40px' }}>
            <p style={{ color: C.accentLight, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Step 2 of 6</p>
            {dots(2, 6)}
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '24px' }}>Financial Baseline</h2>
            <p style={{ color: C.muted, fontSize: '14px', marginBottom: '32px' }}>Berapa pendapatan bulanan kamu saat ini?</p>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: C.accentLight }}>
                Rp {data.income.toLocaleString('id-ID')}
              </span>
            </div>
            <input type="range" min={0} max={100000000} step={500000} value={data.income}
              onChange={e => setData(d => ({ ...d, income: parseInt(e.target.value) }))}
              style={{ width: '100%', accentColor: C.accent, cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
              <button onClick={prevStep} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '14px' }}>← Kembali</button>
              <button onClick={nextStep} style={btnPrimary()}>Next Step</button>
            </div>
          </div>
          <div style={{ background: 'rgba(109,40,217,0.05)', borderLeft: `1px solid ${C.edge}`, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(109,40,217,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '20px' }}>💹</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '12px' }}>Kenapa Income?</h3>
            <p style={{ color: C.muted, fontSize: '13px', lineHeight: 1.6 }}>
              Arus kas bulananmu menentukan <strong style={{ color: C.text }}>risk appetite</strong>. Impetus menggunakannya untuk memproyeksikan investasi skill yang optimal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── STEP 3: Short Goals ──────────────────────────────
  if (step === 3) return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <p style={{ color: C.accentLight, fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Step 3 of 6</p>
        {dots(3, 6)}
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>Target Jangka Pendek</h2>
        <p style={{ color: C.muted, fontSize: '14px', marginBottom: '24px' }}>Apa yang ingin kamu capai dalam 3–6 bulan ke depan?</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {SHORT_GOALS.map(g => <button key={g} onClick={() => toggleArr('shortGoals', g)} style={chip(data.shortGoals.includes(g))}>{g}</button>)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {data.shortGoals.filter(g => !SHORT_GOALS.includes(g)).map(g => tag(g, () => toggleArr('shortGoals', g)))}
        </div>
        {customRow(customShort, setCustomShort, () => addCustom('shortGoals', customShort, () => setCustomShort('')), 'Tambah goal custom...')}
        {data.shortGoals.length === 0 && <p style={{ color: C.pink, fontSize: '12px', marginTop: '8px' }}>Pilih minimal satu target</p>}
        {navBtns(data.shortGoals.length > 0)}
      </div>
    </div>
  );

  // ─── STEP 4: Long Goals ───────────────────────────────
  if (step === 4) return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <p style={{ color: C.accentLight, fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Step 4 of 6</p>
        {dots(4, 6)}
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>Visi Jangka Panjang</h2>
        <p style={{ color: C.muted, fontSize: '14px', marginBottom: '24px' }}>Di mana kamu ingin berada dalam 1–5 tahun ke depan?</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {LONG_GOALS.map(g => <button key={g} onClick={() => toggleArr('longGoals', g)} style={chip(data.longGoals.includes(g))}>{g}</button>)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {data.longGoals.filter(g => !LONG_GOALS.includes(g)).map(g => tag(g, () => toggleArr('longGoals', g)))}
        </div>
        {customRow(customLong, setCustomLong, () => addCustom('longGoals', customLong, () => setCustomLong('')), 'Tambah visi custom...')}
        {data.longGoals.length === 0 && <p style={{ color: C.pink, fontSize: '12px', marginTop: '8px' }}>Pilih minimal satu visi</p>}
        {navBtns(data.longGoals.length > 0)}
      </div>
    </div>
  );

  // ─── STEP 5: Skills ───────────────────────────────────
  if (step === 5) return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <p style={{ color: C.accentLight, fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Step 5 of 6</p>
        {dots(5, 6)}
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>Keahlianmu</h2>
        <p style={{ color: C.muted, fontSize: '14px', marginBottom: '24px' }}>Skill apa yang kamu miliki saat ini?</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {SKILL_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => toggleArr('skills', s)} style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '13px', cursor: 'pointer', transition: 'all .2s', background: data.skills.includes(s) ? 'rgba(109,40,217,0.15)' : 'rgba(109,40,217,0.06)', border: `1px solid ${data.skills.includes(s) ? C.accentLight : 'rgba(109,40,217,0.2)'}`, color: C.accentLight }}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', minHeight: '32px' }}>
          {data.skills.filter(s => !SKILL_SUGGESTIONS.includes(s)).map(s => tag(s, () => toggleArr('skills', s)))}
        </div>
        <input type="text" value={customSkill} onChange={e => setCustomSkill(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addCustom('skills', customSkill, () => setCustomSkill('')); }}
          placeholder="Ketik skill lain dan tekan Enter..." style={inp} />
        {navBtns()}
      </div>
    </div>
  );

  // ─── STEP 6: Habits ───────────────────────────────────
  if (step === 6) return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <p style={{ color: C.accentLight, fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Step 6 of 6</p>
        {dots(6, 6)}
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>Kebiasaan Harianmu</h2>
        <p style={{ color: C.muted, fontSize: '14px', marginBottom: '24px' }}>Kebiasaan mana yang sudah kamu lakukan?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          {HABIT_OPTIONS.map(h => <button key={h} onClick={() => toggleArr('habits', h)} style={chip(data.habits.includes(h))}>{data.habits.includes(h) ? '✓ ' : ''}{h}</button>)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {data.habits.filter(h => !HABIT_OPTIONS.includes(h)).map(h => tag(h, () => toggleArr('habits', h)))}
        </div>
        {customRow(customHabit, setCustomHabit, () => addCustom('habits', customHabit, () => setCustomHabit('')), 'Tambah kebiasaan custom...')}
        {navBtns(true, 'Generate My Profile')}
      </div>
    </div>
  );

  // ─── STEP 7: Loading ──────────────────────────────────
  if (step === 7) return (
    <div style={{ ...wrap, textAlign: 'center' }}>
      <div style={{ maxWidth: '400px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', fontSize: '28px', boxShadow: '0 0 40px rgba(109,40,217,0.4)' }}>⚡</div>
        {genError ? (
          <>
            <p style={{ color: C.pink, fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Gagal generate profil</p>
            <p style={{ color: C.muted, fontSize: '14px', marginBottom: '24px' }}>{genError}</p>
            <button onClick={() => { setGenError(''); runGeneration(); }} style={btnPrimary()}>Coba Lagi</button>
          </>
        ) : (
          <>
            <p style={{ color: C.muted, fontSize: '1rem', marginBottom: '8px' }}>{loadingMsg}</p>
            <div style={{ width: '192px', height: '4px', background: C.edge, borderRadius: '999px', margin: '24px auto 0', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: `linear-gradient(90deg, ${C.accent}, ${C.accent2})`, borderRadius: '999px', width: `${loadingProgress}%`, transition: 'width .5s ease' }} />
            </div>
            <p style={{ color: C.dim, fontSize: '12px', marginTop: '16px' }}>Memanggil AI — mungkin butuh beberapa detik</p>
          </>
        )}
      </div>
    </div>
  );

  // ─── STEP 8: Result ───────────────────────────────────
  if (step === 8 && profileResult) return (
    <div style={{ ...wrap, justifyContent: 'flex-start', paddingTop: '48px', paddingBottom: '48px' }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '28px' }}>✓</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>Your Life Profile</h2>
          <p style={{ color: C.muted, fontSize: '14px' }}>Dihasilkan AI berdasarkan data yang kamu berikan.</p>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.edge}`, borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
          <p style={{ color: C.muted, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>{profileResult.summary}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.edge}`, borderRadius: '16px', padding: '20px' }}>
            <p style={{ color: '#4ADE80', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>↑ Kekuatan</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(profileResult.strengths || []).map((s, i) => <li key={i} style={{ fontSize: '13px', color: C.muted, display: 'flex', gap: '8px' }}><span style={{ color: '#4ADE80', flexShrink: 0 }}>+</span>{s}</li>)}
            </ul>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.edge}`, borderRadius: '16px', padding: '20px' }}>
            <p style={{ color: C.pink, fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>! Kelemahan</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(profileResult.weaknesses || []).map((w, i) => <li key={i} style={{ fontSize: '13px', color: C.muted, display: 'flex', gap: '8px' }}><span style={{ color: C.pink, flexShrink: 0 }}>!</span>{w}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.edge}`, borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
          <p style={{ color: C.accentLight, fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>🗺 Peta Jalan 6 Bulan</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(profileResult.roadmap || []).map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px 16px', border: `1px solid ${C.edge}`, borderLeft: `3px solid ${m.color || C.accent}` }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: m.color || C.accentLight, marginBottom: '4px' }}>{m.label}</p>
                <p style={{ fontSize: '12px', color: C.muted, marginBottom: '6px' }}>Fokus: {m.focus}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {(m.actions || []).map((a, j) => <li key={j} style={{ fontSize: '12px', color: C.muted }}>• {a}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={handleEnterDashboard} style={{ ...btnPrimary(), padding: '14px 40px', fontSize: '1rem' }}>
            Masuk Dashboard →
          </button>
          <p style={{ color: C.dim, fontSize: '12px', marginTop: '12px' }}>AI akan otomatis membuat jadwal tugas berdasarkan profilmu</p>
        </div>
      </div>
    </div>
  );

  return null;
}
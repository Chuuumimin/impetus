import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Crown, Brain, Send, RefreshCw, Lock } from 'lucide-react';
import { PaywallModal } from './PaywallModal';
import type { User, Task } from '../App';

interface FutureSimulationProps {
  user: User;
  tasks: Task[];
  upgradeToPro: () => void;
}

type SimulationPhase = 'idle' | 'analyzing' | 'processing' | 'done';

function generateSimulationResult(tasks: Task[], goal: string): string {
  const done = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 60;
  const categories = [...new Set(tasks.map(t => t.category))];
  const score = Math.min(95, Math.max(60, rate + Math.floor(Math.random() * 15) + 10));
  const growth = (Math.random() * 2.5 + 2).toFixed(1);

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮  LAPORAN SIMULASI MASA DEPAN AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Berdasarkan analisis mendalam terhadap ${total} tugas aktif dan pola produktivitas kamu selama 30 hari terakhir, berikut proyeksi AI untuk 6 bulan ke depan:

📊 SKOR POTENSI MASA DEPAN: ${score}/100
Kamu berada di jalur yang sangat menjanjikan untuk pertumbuhan signifikan.

─────────────────────────────────────
🎯 MILESTONE UTAMA (6 Bulan)
─────────────────────────────────────

▸ Bulan 1–2 · Fondasi Kuat
  • Konsistensi produktivitas meningkat ${Math.floor(Math.random() * 20 + 30)}% dari baseline
  • ${categories[0] || 'Skill utama'} mencapai level yang lebih mahir
  • Rutinitas harian terbentuk dan stabil

▸ Bulan 3–4 · Akselerasi Pertumbuhan
  • Peluang baru terbuka berkat konsistensi yang terbangun
  • ${categories[1] || 'Bidang kedua'} berkembang pesat
  • Produktivitas harian meningkat ${Math.floor(Math.random() * 15 + 25)}%

▸ Bulan 5–6 · Puncak Transformasi
  • Potensi peningkatan kualitas hidup ${Math.floor(Math.random() * 20 + 25)}–${Math.floor(Math.random() * 10 + 45)}%
  • Network dan reputasi berkembang signifikan
  • Semua goal utama dalam jangkauan

─────────────────────────────────────
💡 REKOMENDASI PERSONAL AI
─────────────────────────────────────

${goal ? `Terkait goal kamu "${goal}": ` : ''}Fokus utama pada kategori ${categories.slice(0, 2).join(' dan ') || 'yang kamu miliki'} menunjukkan pola seseorang yang membangun fondasi kuat dan berkelanjutan.

Untuk mempercepat kemajuan, tingkatkan frekuensi penyelesaian tugas prioritas tinggi dan pertahankan konsistensi di atas 70% setiap minggunya.

─────────────────────────────────────
✨ PREDIKSI AKHIR
─────────────────────────────────────

Dalam 6 bulan ke depan, kamu diproyeksikan menjadi ${growth}× lebih produktif dari kondisi saat ini. Potensi yang kamu miliki sangat besar — terus bergerak!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Powered by Impetus AI ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function useTypingEffect(text: string, speed = 8) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return; }
    setDisplayed(''); setDone(false);
    let i = 0;
    const CHUNK = 3;
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + CHUNK)); i += CHUNK; }
      else { setDone(true); clearInterval(timer); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return { displayed, done };
}

const ANALYZING_STEPS = [
  'Menganalisis pola produktivitas kamu...',
  'Memproses data historis tugas...',
  'Menghitung skor potensi...',
  'Menyusun proyeksi masa depan...',
  'Menghasilkan rekomendasi personal...',
];

export function FutureSimulation({ user, tasks, upgradeToPro }: FutureSimulationProps) {
  const isPro = user.plan === 'pro';
  const [showPaywall, setShowPaywall] = useState(false);
  const [goal, setGoal] = useState('');
  const [phase, setPhase] = useState<SimulationPhase>('idle');
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [rawResult, setRawResult] = useState('');
  const pendingRunRef = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const runSimulation = useCallback(() => {
    setPhase('analyzing'); setAnalyzeStep(0); setAnalyzeProgress(0); setRawResult('');
    let step = 0; let progress = 0;
    const stepTimer = setInterval(() => { step++; if (step < ANALYZING_STEPS.length) setAnalyzeStep(step); else clearInterval(stepTimer); }, 600);
    const progressTimer = setInterval(() => {
      progress += Math.random() * 8 + 4;
      if (progress >= 100) {
        clearInterval(progressTimer); setAnalyzeProgress(100); setPhase('processing');
        setTimeout(() => { setRawResult(generateSimulationResult(tasks, goal)); setPhase('done'); }, 600);
      } else { setAnalyzeProgress(Math.min(progress, 99)); }
    }, 120);
  }, [tasks, goal]);

  const { displayed, done: typingDone } = useTypingEffect(phase === 'done' ? rawResult : '');

  useEffect(() => { if (typingDone && resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [typingDone]);

  const handleSimulateClick = () => { if (!isPro) setShowPaywall(true); else runSimulation(); };

  const handleUpgrade = () => {
    upgradeToPro(); setShowPaywall(false); pendingRunRef.current = true;
    setTimeout(() => { if (pendingRunRef.current) { pendingRunRef.current = false; runSimulation(); } }, 200);
  };

  const handleReset = () => { setPhase('idle'); setRawResult(''); setGoal(''); };

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold text-white">Future Simulation</h1>
              {isPro ? (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.35)' }}><Crown className="w-3 h-3" />PRO</span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(100,116,139,0.15)', color: '#94A3B8', border: '1px solid rgba(100,116,139,0.25)' }}><Lock className="w-3 h-3" />TERKUNCI</span>
              )}
            </div>
            <p className="text-sm" style={{ color: '#94A3B8' }}>AI akan menganalisis pola produktivitasmu dan memproyeksikan masa depan.</p>
          </div>
          {phase === 'done' && (
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-opacity hover:opacity-70" style={{ background: '#1E2740', color: '#94A3B8' }}><RefreshCw className="w-4 h-4" />Reset</button>
          )}
        </div>

        {!isPro && (
          <div className="mb-6 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}><Crown className="w-6 h-6" style={{ color: '#F59E0B' }} /></div>
              <div>
                <h3 className="text-base font-medium text-white mb-1">Fitur Eksklusif Pro</h3>
                <p className="text-sm" style={{ color: '#94A3B8' }}>Future Simulation menggunakan AI canggih untuk memprediksi perjalananmu. Upgrade ke Impetus PRO untuk mengakses fitur ini.</p>
              </div>
            </div>
          </div>
        )}

        {phase === 'idle' && (
          <div className="mb-6 rounded-2xl p-5" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
            <label className="text-sm font-medium text-white mb-3 block"><Brain className="w-4 h-4 inline mr-2" style={{ color: '#A78BFA' }} />Apa goal utamamu dalam 6 bulan ke depan?</label>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder={isPro ? 'Contoh: Saya ingin pindah kerja ke perusahaan teknologi, meningkatkan skill programming...' : 'Upgrade ke Pro untuk mengisi goal dan menjalankan simulasi AI...'} disabled={!isPro} rows={4} className="w-full text-sm text-white placeholder-gray-600 resize-none outline-none rounded-xl px-4 py-3" style={{ background: '#111827', border: '1px solid #1E2740', opacity: isPro ? 1 : 0.5, cursor: isPro ? 'text' : 'not-allowed' }} />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: isPro ? '#10B981' : '#EF4444' }} />
                <span className="text-xs" style={{ color: '#64748B' }}>{isPro ? `${tasks.length} tugas akan dianalisis oleh AI` : 'Diperlukan akun Pro untuk menjalankan simulasi'}</span>
              </div>
              <button onClick={handleSimulateClick} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95" style={isPro ? { background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' } : { background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#1C1007' }}>
                {isPro ? <><Sparkles className="w-4 h-4" />Simulasi Masa Depanku</> : <><Crown className="w-4 h-4" />Unlock &amp; Simulasi</>}
              </button>
            </div>
          </div>
        )}

        {(phase === 'analyzing' || phase === 'processing') && (
          <div className="mb-6 rounded-2xl p-7" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.35)' }}>
                <Brain className="w-8 h-8" style={{ color: '#A78BFA', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
              <p className="text-base font-medium text-white mb-1">{phase === 'processing' ? 'Menyusun laporan akhir...' : ANALYZING_STEPS[analyzeStep]}</p>
              <p className="text-xs mb-6" style={{ color: '#64748B' }}>Impetus AI sedang bekerja keras untuk kamu</p>
              <div className="w-full max-w-xs">
                <div className="h-2 rounded-full mb-2" style={{ background: '#1E2740' }}>
                  <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${phase === 'processing' ? 100 : analyzeProgress}%`, background: 'linear-gradient(90deg, #6D28D9, #4F46E5, #818CF8)' }} />
                </div>
                <p className="text-xs text-right" style={{ color: '#64748B' }}>{phase === 'processing' ? '100' : Math.round(analyzeProgress)}%</p>
              </div>
              <div className="flex gap-2 mt-4">
                {ANALYZING_STEPS.map((_, idx) => <div key={idx} className="w-2 h-2 rounded-full transition-all duration-300" style={{ background: idx <= analyzeStep ? '#6D28D9' : '#1E2740' }} />)}
              </div>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div ref={resultRef}>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(109,40,217,0.35)' }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.2), rgba(79,70,229,0.1))', borderBottom: '1px solid rgba(109,40,217,0.2)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(109,40,217,0.25)' }}><Sparkles className="w-4 h-4" style={{ color: '#A78BFA' }} /></div>
                <div>
                  <p className="text-sm font-medium text-white">Hasil Simulasi AI</p>
                  <p className="text-xs" style={{ color: '#64748B' }}>{typingDone ? 'Selesai dianalisis' : 'Sedang mengetik hasil...'}</p>
                </div>
                {!typingDone && (
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#A78BFA', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                  </div>
                )}
              </div>
              <div className="p-5" style={{ background: '#0D111F' }}>
                <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono" style={{ color: '#CBD5E1' }}>
                  {displayed}
                  {!typingDone && <span className="inline-block w-0.5 h-4 ml-0.5 align-middle" style={{ background: '#A78BFA', animation: 'blink 1s step-end infinite' }} />}
                </pre>
              </div>
            </div>
            {typingDone && (
              <div className="flex gap-3 mt-4">
                <button onClick={handleReset} className="flex-1 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-70" style={{ background: '#1E2740', color: '#94A3B8' }}><RefreshCw className="w-4 h-4 inline mr-2" />Simulasi Ulang</button>
                <button onClick={() => { setPhase('idle'); setGoal(''); }} className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' }}><Send className="w-4 h-4" />Simulasi Baru</button>
              </div>
            )}
          </div>
        )}
      </div>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} onUpgrade={handleUpgrade} />

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Crown, Brain, Send, RefreshCw, Lock, AlertTriangle, History, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { PaywallModal } from './PaywallModal';
import type { User, Task } from '../App';
import type { SimulationRecord } from '../lib/api';

interface FutureSimulationProps {
  user: User;
  tasks: Task[];
  upgradeToPro: () => void;
  simulateAI: (tasks: Task[], goal: string) => Promise<string>;
  simHistory: SimulationRecord[];
  clearSimHistory: () => Promise<void>;
}

type SimulationPhase = 'idle' | 'analyzing' | 'done' | 'error';

function useTypingEffect(text: string, speed = 8) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return; }
    setDisplayed(''); setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 4)); i += 4; }
      else { setDone(true); clearInterval(timer); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return { displayed, done };
}

const ANALYZING_STEPS = [
  'Menganalisis pola produktivitas kamu...',
  'Memproses data historis tugas...',
  'Membaca riwayat simulasi sebelumnya...',
  'Menghubungi Gemini AI...',
  'Menyusun proyeksi personal...',
];

function HistoryItem({ record, index }: { record: SimulationRecord; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const scoreMatch = record.result?.match(/SKOR POTENSI MASA DEPAN:\s*(\d+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
  const date = new Date(record.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = new Date(record.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const scoreColor = score ? (score >= 80 ? '#10B981' : score >= 65 ? '#F59E0B' : '#EF4444') : '#64748B';

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1E2740' }}>
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold" style={{ background: 'rgba(109,40,217,0.2)', color: '#A78BFA' }}>#{index + 1}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{record.goal || 'Tanpa goal spesifik'}</p>
          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{date} · {time}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {score && (<div className="text-center"><span className="text-base font-semibold" style={{ color: scoreColor }}>{score}</span><span className="text-xs" style={{ color: '#64748B' }}>/100</span></div>)}
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: '#64748B' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#64748B' }} />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: '#1E2740' }}>
          <div className="flex flex-wrap gap-2 py-3 mb-3">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>{record.taskSnapshot?.done}/{record.taskSnapshot?.total} selesai</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(109,40,217,0.12)', color: '#A78BFA', border: '1px solid rgba(109,40,217,0.25)' }}>{record.taskSnapshot?.rate}% rate</span>
            {record.taskSnapshot?.categories?.slice(0, 2).map(cat => (<span key={cat} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(100,116,139,0.12)', color: '#94A3B8', border: '1px solid rgba(100,116,139,0.2)' }}>{cat}</span>))}
          </div>
          <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words font-mono" style={{ color: '#94A3B8', maxHeight: '240px', overflowY: 'auto' }}>{record.result}</pre>
        </div>
      )}
    </div>
  );
}

export function FutureSimulation({ user, tasks, upgradeToPro, simulateAI, simHistory, clearSimHistory }: FutureSimulationProps) {
  const isPro = user.plan === 'pro';
  const [showPaywall, setShowPaywall] = useState(false);
  const [goal, setGoal] = useState('');
  const [phase, setPhase] = useState<SimulationPhase>('idle');
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [rawResult, setRawResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const pendingRunRef = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const runSimulation = useCallback(async (currentTasks: Task[], currentGoal: string) => {
    setPhase('analyzing'); setAnalyzeStep(0); setAnalyzeProgress(0); setRawResult(''); setErrorMsg('');
    let step = 0;
    const stepTimer = setInterval(() => { step++; if (step < ANALYZING_STEPS.length) setAnalyzeStep(step); else clearInterval(stepTimer); }, 700);
    let progress = 0;
    const progressTimer = setInterval(() => { progress += Math.random() * 2.5 + 0.8; if (progress >= 72) { progress = 72; clearInterval(progressTimer); } setAnalyzeProgress(Math.min(progress, 72)); }, 80);
    try {
      const result = await simulateAI(currentTasks, currentGoal);
      clearInterval(stepTimer); clearInterval(progressTimer);
      let p = 72;
      const finishTimer = setInterval(() => { p += 4; if (p >= 100) { p = 100; clearInterval(finishTimer); } setAnalyzeProgress(p); }, 50);
      setTimeout(() => { setRawResult(result); setPhase('done'); }, 700);
    } catch (e: any) {
      clearInterval(stepTimer); clearInterval(progressTimer);
      setErrorMsg(e?.message || 'Terjadi kesalahan saat menghubungi AI.');
      setPhase('error');
    }
  }, [simulateAI]);

  const { displayed, done: typingDone } = useTypingEffect(phase === 'done' ? rawResult : '');
  useEffect(() => { if (typingDone && resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [typingDone]);

  const handleSimulateClick = () => { if (!isPro) setShowPaywall(true); else runSimulation(tasks, goal); };
  const handleUpgrade = () => {
    upgradeToPro(); setShowPaywall(false); pendingRunRef.current = true;
    setTimeout(() => { if (pendingRunRef.current) { pendingRunRef.current = false; runSimulation(tasks, goal); } }, 300);
  };
  const handleReset = () => { setPhase('idle'); setRawResult(''); setGoal(''); setErrorMsg(''); };
  const handleClearHistory = async () => { setClearingHistory(true); await clearSimHistory(); setClearingHistory(false); setShowHistory(false); };

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold text-white">Future Simulation</h1>
              {isPro ? (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.35)' }}><Crown className="w-3 h-3" /> PRO</span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(100,116,139,0.15)', color: '#94A3B8', border: '1px solid rgba(100,116,139,0.25)' }}><Lock className="w-3 h-3" /> TERKUNCI</span>
              )}
            </div>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Gemini AI menganalisis pola produktivitasmu — konteks simulasi tersimpan untuk hasil yang makin akurat.</p>
          </div>
          <div className="flex items-center gap-2">
            {(phase === 'done' || phase === 'error') && (
              <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-opacity hover:opacity-70" style={{ background: '#1E2740', color: '#94A3B8' }}><RefreshCw className="w-4 h-4" /> Reset</button>
            )}
            {isPro && simHistory.length > 0 && (
              <button onClick={() => setShowHistory(v => !v)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-opacity hover:opacity-80" style={{ background: showHistory ? 'rgba(109,40,217,0.2)' : '#1E2740', color: showHistory ? '#A78BFA' : '#94A3B8', border: showHistory ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent' }}>
                <History className="w-4 h-4" /> Riwayat ({simHistory.length})
              </button>
            )}
          </div>
        </div>

        {isPro && simHistory.length > 0 && phase === 'idle' && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(109,40,217,0.1)', border: '1px solid rgba(109,40,217,0.25)' }}>
            <Brain className="w-3.5 h-3.5 shrink-0" style={{ color: '#A78BFA' }} />
            <p style={{ color: '#A78BFA' }}>AI memiliki konteks dari <strong>{simHistory.length} simulasi sebelumnya</strong> — hasil akan lebih akurat dan personal.</p>
          </div>
        )}

        {showHistory && simHistory.length > 0 && (
          <div className="mb-6 rounded-2xl p-5" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white">Riwayat Simulasi</h2>
              <button onClick={handleClearHistory} disabled={clearingHistory} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Trash2 className="w-3 h-3" />{clearingHistory ? 'Menghapus...' : 'Hapus Riwayat'}
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...simHistory].reverse().map((record, idx) => (
                <HistoryItem key={record.id} record={record} index={simHistory.length - 1 - idx} />
              ))}
            </div>
          </div>
        )}

        {!isPro && (
          <div className="mb-6 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}><Crown className="w-6 h-6" style={{ color: '#F59E0B' }} /></div>
              <div>
                <h3 className="text-base font-medium text-white mb-1">Fitur Eksklusif Pro</h3>
                <p className="text-sm" style={{ color: '#94A3B8' }}>Future Simulation menggunakan <strong style={{ color: '#FCD34D' }}>Gemini AI</strong> dengan memori kontekstual — setiap simulasi tersimpan untuk membuat prediksi berikutnya lebih akurat.</p>
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
                <span className="text-xs" style={{ color: '#64748B' }}>{isPro ? `${tasks.length} tugas · ${simHistory.length} riwayat tersimpan` : 'Diperlukan akun Pro untuk menjalankan simulasi'}</span>
              </div>
              <button onClick={handleSimulateClick} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95" style={isPro ? { background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' } : { background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#1C1007' }}>
                {isPro ? <><Sparkles className="w-4 h-4" />Simulasi Masa Depanku</> : <><Crown className="w-4 h-4" />Unlock &amp; Simulasi</>}
              </button>
            </div>
          </div>
        )}

        {phase === 'analyzing' && (
          <div className="mb-6 rounded-2xl p-8" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.35)' }}>
                <Brain className="w-8 h-8" style={{ color: '#A78BFA', animation: 'aiPulse 1.5s ease-in-out infinite' }} />
              </div>
              <p className="text-base font-medium text-white mb-1">{ANALYZING_STEPS[analyzeStep]}</p>
              <p className="text-xs mb-6" style={{ color: '#64748B' }}>{simHistory.length > 0 ? `Mempertimbangkan ${simHistory.length} riwayat simulasi sebelumnya...` : 'Gemini AI sedang menganalisis data produktivitasmu'}</p>
              <div className="w-full max-w-sm">
                <div className="h-2 rounded-full mb-2" style={{ background: '#1E2740' }}><div className="h-2 rounded-full transition-all duration-200" style={{ width: `${analyzeProgress}%`, background: 'linear-gradient(90deg, #6D28D9, #4F46E5, #818CF8)' }} /></div>
                <p className="text-xs text-right" style={{ color: '#64748B' }}>{Math.round(analyzeProgress)}%</p>
              </div>
              <div className="flex gap-2 mt-5">{ANALYZING_STEPS.map((_, idx) => (<div key={idx} className="w-2 h-2 rounded-full transition-all duration-300" style={{ background: idx <= analyzeStep ? '#6D28D9' : '#1E2740' }} />))}</div>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="mb-6 rounded-2xl p-6" style={{ background: '#0D111F', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertTriangle className="w-5 h-5" style={{ color: '#EF4444' }} /></div>
              <div>
                <p className="text-sm font-medium text-white mb-1">Simulasi Gagal</p>
                <p className="text-xs" style={{ color: '#94A3B8' }}>{errorMsg}</p>
                <p className="text-xs mt-2" style={{ color: '#64748B' }}>Pastikan GEMINI_API_KEY sudah dikonfigurasi di Supabase Edge Function secrets.</p>
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
                  <p className="text-sm font-medium text-white">Hasil Simulasi Gemini AI #{simHistory.length}</p>
                  <p className="text-xs" style={{ color: '#64748B' }}>{typingDone ? 'Tersimpan ke riwayat' : 'Sedang menampilkan hasil...'}</p>
                </div>
                {!typingDone && (<div className="ml-auto flex gap-1">{[0,1,2].map(i => (<div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#A78BFA', animation: `dotBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />))}</div>)}
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
                <button onClick={handleReset} className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-70" style={{ background: '#1E2740', color: '#94A3B8' }}><RefreshCw className="w-4 h-4" /> Simulasi Ulang</button>
                <button onClick={() => { setPhase('idle'); setGoal(''); }} className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' }}><Send className="w-4 h-4" /> Simulasi Baru</button>
              </div>
            )}
          </div>
        )}
      </div>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} onUpgrade={handleUpgrade} />
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes dotBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes aiPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.95)}}`}</style>
    </>
  );
}

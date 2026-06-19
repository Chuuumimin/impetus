import { useState } from 'react';
import { X, Crown, Check, Sparkles, Brain, FileText, Zap, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PRO_FEATURES = [
  { icon: Brain, text: 'Future AI Simulation — Prediksi masa depan berbasis AI' },
  { icon: Sparkles, text: 'Analitik Lanjutan — Insight mendalam produktivitasmu' },
  { icon: Zap, text: 'Prediksi Karir Personal — Peta jalan karir yang dipersonalisasi' },
  { icon: FileText, text: 'Export Laporan PDF — Unduh laporan lengkap kapan saja' },
  { icon: Crown, text: 'Prioritas Support — Dukungan pelanggan premium 24/7' },
];

export function PaywallModal({ open, onClose, onUpgrade }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 1800));
    setLoading(false);
    toast.success('Selamat! Kamu sekarang adalah Pro User 🎉', { description: 'Semua fitur premium telah diaktifkan.' });
    onUpgrade();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden" style={{ background: '#0D111F', border: '1px solid rgba(245,158,11,0.35)', boxShadow: '0 0 60px rgba(245,158,11,0.12)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="relative px-7 pt-9 pb-7 text-center overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.08) 50%, transparent 100%)' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.25) 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))', border: '1px solid rgba(245,158,11,0.4)' }}>
            <Crown className="w-8 h-8" style={{ color: '#F59E0B' }} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl font-semibold" style={{ background: 'linear-gradient(90deg, #F59E0B, #FCD34D, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Impetus PRO</h2>
          </div>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Unlock kekuatan penuh AI untuk masa depanmu</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }}>
            <Lock className="w-3 h-3" />
            Fitur ini eksklusif untuk Pro User
          </div>
        </div>

        <div className="mx-7" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)' }} />

        <div className="px-7 py-6">
          <p className="text-xs font-medium mb-4 uppercase tracking-wider" style={{ color: '#64748B' }}>Yang kamu dapatkan</p>
          <div className="space-y-3">
            {PRO_FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
                  </div>
                  <p className="text-sm leading-snug" style={{ color: '#CBD5E1' }}>{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-7" style={{ height: '1px', background: 'rgba(30,39,64,1)' }} />

        <div className="px-7 py-6">
          <div className="flex items-end justify-center gap-1 mb-5">
            <span className="text-3xl font-semibold text-white">Rp 49.000</span>
            <span className="text-sm mb-1" style={{ color: '#64748B' }}>/bulan</span>
          </div>
          <button onClick={handleUpgrade} disabled={loading} className="w-full py-3.5 rounded-2xl font-medium text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B, #FBBF24)', color: '#1C1007', boxShadow: '0 4px 20px rgba(245,158,11,0.35)' }}>
            {loading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Memproses Pembayaran...</>
            ) : (
              <><Crown className="w-4 h-4" />Upgrade ke Pro Sekarang</>
            )}
          </button>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Check className="w-3 h-3" style={{ color: '#10B981' }} />
            <p className="text-xs" style={{ color: '#64748B' }}>Batalkan kapan saja · Tanpa biaya tersembunyi</p>
          </div>
        </div>
      </div>
    </div>
  );
}

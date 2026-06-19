import { CheckCircle2, Clock, ListTodo, TrendingUp, ArrowRight, Sparkles, Target } from 'lucide-react';
import type { User, Task, Page } from '../App';

interface DashboardProps {
  user: User;
  tasks: Task[];
  setCurrentPage: (page: Page) => void;
}

export function Dashboard({ user, tasks, setCurrentPage }: DashboardProps) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Selamat Pagi' : greetingHour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  const statCards = [
    { label: 'Total Tugas', value: total, icon: ListTodo, color: '#6D28D9', bg: 'rgba(109,40,217,0.12)', border: 'rgba(109,40,217,0.3)' },
    { label: 'Selesai', value: done, icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
    { label: 'Sedang Berjalan', value: inProgress, icon: Clock, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
    { label: 'Tingkat Sukses', value: `${completionRate}%`, icon: TrendingUp, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  ];

  const priorityColor: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
  const priorityLabel: Record<string, string> = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };
  const statusColor: Record<string, string> = { done: '#10B981', 'in-progress': '#3B82F6', todo: '#64748B' };
  const statusLabel: Record<string, string> = { done: 'Selesai', 'in-progress': 'Berjalan', todo: 'Belum' };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-sm mb-1" style={{ color: '#64748B' }}>{greeting},</p>
        <h1 className="text-2xl font-semibold text-white">{user.name} 👋</h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
          Kamu memiliki <span style={{ color: '#A78BFA' }}>{inProgress} tugas aktif</span> dan{' '}
          <span style={{ color: '#60A5FA' }}>{todo} tugas menunggu</span> hari ini.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-4 rounded-2xl" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: `${card.color}22` }}>
                <Icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <p className="text-2xl font-semibold text-white">{card.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-white">Tugas Terbaru</h2>
            <button onClick={() => setCurrentPage('tasks')} className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70" style={{ color: '#A78BFA' }}>
              Lihat semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#111827' }}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: statusColor[task.status] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate" style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.6 : 1 }}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: '#64748B' }}>{task.category}</span>
                    <span className="text-xs" style={{ color: '#374151' }}>•</span>
                    <span className="text-xs" style={{ color: statusColor[task.status] }}>{statusLabel[task.status]}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: `${priorityColor[task.priority]}18`, color: priorityColor[task.priority], border: `1px solid ${priorityColor[task.priority]}33` }}>
                  {priorityLabel[task.priority]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
            <h3 className="text-sm font-medium text-white mb-4">Completion Rate</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#1E2740" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="url(#gradient)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50}`} strokeDashoffset={`${2 * Math.PI * 50 * (1 - completionRate / 100)}`} style={{ transition: 'stroke-dashoffset 1s ease' }} />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6D28D9" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold text-white">{completionRate}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span style={{ color: '#94A3B8' }}>Selesai</span><span style={{ color: '#10B981' }}>{done} tugas</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: '#94A3B8' }}>Berjalan</span><span style={{ color: '#3B82F6' }}>{inProgress} tugas</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: '#94A3B8' }}>Belum mulai</span><span style={{ color: '#64748B' }}>{todo} tugas</span></div>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.15), rgba(79,70,229,0.1))', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: '#A78BFA' }} />
              <span className="text-sm font-medium" style={{ color: '#A78BFA' }}>Future Simulation</span>
            </div>
            <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>Prediksi masa depanmu berdasarkan pola produktivitas dengan AI.</p>
            <button onClick={() => setCurrentPage('simulation')} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' }}>
              <Target className="w-4 h-4" />
              Coba Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

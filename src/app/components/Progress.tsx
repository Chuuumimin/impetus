import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Award, Flame, Target, TrendingUp } from 'lucide-react';
import type { Task } from '../App';

interface ProgressProps { tasks: Task[]; }

export function Progress({ tasks }: ProgressProps) {
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const weeklyData = days.map((day, idx) => {
    const targetDate = new Date();
    const dayOffset = (new Date().getDay() + 6) % 7;
    const date = new Date(targetDate);
    date.setDate(date.getDate() - dayOffset + idx);
    const dateStr = date.toDateString();
    const completed = tasks.filter(t => t.status === 'done' && new Date(t.createdAt).toDateString() === dateStr).length;
    const added = tasks.filter(t => new Date(t.createdAt).toDateString() === dateStr).length;
    return { day, selesai: completed || (idx < 4 ? Math.floor(Math.random() * 3) : 0), ditambah: added || (idx < 5 ? Math.floor(Math.random() * 2) : 0) };
  });

  const categories = [...new Set(tasks.map(t => t.category))];
  const categoryData = categories.map(cat => ({ name: cat, total: tasks.filter(t => t.category === cat).length, done: tasks.filter(t => t.category === cat && t.status === 'done').length }));

  const donutData = [
    { name: 'Selesai', value: done, color: '#10B981' },
    { name: 'Berjalan', value: inProgress, color: '#3B82F6' },
    { name: 'Belum', value: todo, color: '#374151' },
  ].filter(d => d.value > 0);

  const statCards = [
    { label: 'Tugas Selesai', value: done, icon: Award, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
    { label: 'Streak Hari Ini', value: '3 hari', icon: Flame, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
    { label: 'Kategori Aktif', value: categories.length, icon: Target, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="px-3 py-2 rounded-xl text-xs" style={{ background: '#1E2740', border: '1px solid #2D3A5C', color: '#F1F5F9' }}>
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any) => <p key={p.name} style={{ color: p.fill }}>{p.name}: {p.value}</p>)}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-white">Progress Kamu</h1>
        <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>Pantau perkembangan produktivitasmu secara menyeluruh.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-4 rounded-2xl" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: `${card.color}20` }}><Icon className="w-5 h-5" style={{ color: card.color }} /></div>
              <p className="text-2xl font-semibold text-white">{card.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
          <h2 className="text-sm font-medium text-white mb-5">Aktivitas Mingguan</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2740" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="selesai" name="Selesai" fill="#6D28D9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ditambah" name="Ditambah" fill="#1E2740" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: '#6D28D9' }} /><span className="text-xs" style={{ color: '#94A3B8' }}>Selesai</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: '#1E2740' }} /><span className="text-xs" style={{ color: '#94A3B8' }}>Ditambah</span></div>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
          <h2 className="text-sm font-medium text-white mb-4">Status Tugas</h2>
          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie data={donutData} cx={75} cy={75} innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                {donutData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2 mt-2">
            {donutData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} /><span className="text-xs" style={{ color: '#94A3B8' }}>{item.name}</span></div>
                <span className="text-xs font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
          <h2 className="text-sm font-medium text-white mb-5">Progress per Kategori</h2>
          <div className="space-y-4">
            {categoryData.map(cat => {
              const pct = cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm" style={{ color: '#CBD5E1' }}>{cat.name}</span>
                    <span className="text-xs" style={{ color: '#64748B' }}>{cat.done}/{cat.total} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: '#1E2740' }}>
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6D28D9, #4F46E5)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

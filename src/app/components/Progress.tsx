import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Award, Flame, Target, TrendingUp, CheckCircle2, Circle, Clock } from 'lucide-react';
import type { Task, User } from '../App';

interface ProgressProps { tasks: Task[]; user: User; }

const GOAL_COLORS = [
  '#6D28D9', '#4F46E5', '#7C3AED', '#2563EB', '#0891B2',
  '#059669', '#D97706', '#DC2626', '#9333EA', '#0284C7',
];

export function Progress({ tasks, user }: ProgressProps) {
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  // Weekly activity
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const weeklyData = days.map((day, idx) => {
    const date = new Date();
    const dayOffset = (new Date().getDay() + 6) % 7;
    date.setDate(date.getDate() - dayOffset + idx);
    const dateStr = date.toDateString();
    const completed = tasks.filter(t => t.status === 'done' && new Date(t.createdAt).toDateString() === dateStr).length;
    const added = tasks.filter(t => new Date(t.createdAt).toDateString() === dateStr).length;
    return { day, selesai: completed, ditambah: added };
  });

  // Category progress
  const categories = [...new Set(tasks.map(t => t.category))];
  const categoryData = categories.map(cat => ({
    name: cat,
    total: tasks.filter(t => t.category === cat).length,
    done: tasks.filter(t => t.category === cat && t.status === 'done').length,
  }));

  // Goal progress — group tasks by goalTag
  const allGoals = [...(user.shortGoals || []), ...(user.longGoals || [])];
  const goalProgress = allGoals.map((goal, idx) => {
    const goalTasks = tasks.filter(t => t.goalTag === goal);
    const goalDone = goalTasks.filter(t => t.status === 'done').length;
    const goalTotal = goalTasks.length;
    const pct = goalTotal > 0 ? Math.round((goalDone / goalTotal) * 100) : 0;
    const isShort = (user.shortGoals || []).includes(goal);
    return { goal, goalDone, goalTotal, pct, isShort, color: GOAL_COLORS[idx % GOAL_COLORS.length] };
  }).filter(g => g.goalTotal > 0);

  const donutData = [
    { name: 'Selesai', value: done, color: '#10B981' },
    { name: 'Berjalan', value: inProgress, color: '#6D28D9' },
    { name: 'Belum', value: todo, color: '#1E2740' },
  ].filter(d => d.value > 0);

  const statCards = [
    { label: 'Tugas Selesai', value: done, icon: Award, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    { label: 'Sedang Berjalan', value: inProgress, icon: Flame, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
    { label: 'Goals Aktif', value: goalProgress.length, icon: Target, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#1E2740', border: '1px solid #2D3A5C', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#F1F5F9' }}>
        <p style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</p>
        {payload.map((p: any) => <p key={p.name} style={{ color: p.fill, margin: 0 }}>{p.name}: {p.value}</p>)}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Progress Kamu</h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '4px' }}>Pantau perkembangan berdasarkan goals dan aktivitas harianmu.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={{ padding: '16px', borderRadius: '16px', background: card.bg, border: `1px solid ${card.border}` }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Icon size={18} style={{ color: card.color }} />
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>{card.value}</p>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Weekly Activity */}
        <div style={{ borderRadius: '16px', padding: '20px', background: '#0D111F', border: '1px solid #1E2740' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', marginBottom: '20px' }}>Aktivitas Mingguan</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2740" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="selesai" name="Selesai" fill="#6D28D9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ditambah" name="Ditambah" fill="#1E2740" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            {[['#6D28D9', 'Selesai'], ['#1E2740', 'Ditambah']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut */}
        <div style={{ borderRadius: '16px', padding: '20px', background: '#0D111F', border: '1px solid #1E2740' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', marginBottom: '16px' }}>Status Tugas</h2>
          {total === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', color: '#64748B', fontSize: '13px' }}>Belum ada tugas</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={150} height={150}>
                  <Pie data={donutData} cx={70} cy={70} innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                    {donutData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {donutData.map(item => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Goal Progress */}
      {goalProgress.length > 0 && (
        <div style={{ borderRadius: '16px', padding: '20px', background: '#0D111F', border: '1px solid #1E2740', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Progress per Goal</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[['#A78BFA', 'Jangka Pendek'], ['#60A5FA', 'Jangka Panjang']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: '11px', color: '#64748B' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {goalProgress.map(({ goal, goalDone, goalTotal, pct, isShort, color }) => (
              <div key={goal}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isShort ? '#A78BFA' : '#60A5FA', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{goal}</span>
                    <span style={{ fontSize: '11px', color: '#64748B', background: '#1E2740', padding: '1px 8px', borderRadius: '999px' }}>
                      {isShort ? 'Pendek' : 'Panjang'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>{goalDone}/{goalTotal} tugas</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: pct === 100 ? '#10B981' : '#A78BFA' }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: '6px', borderRadius: '999px', background: '#1E2740', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    width: `${pct}%`,
                    background: pct === 100 ? '#10B981' : `linear-gradient(90deg, #6D28D9, #4F46E5)`,
                    transition: 'width 0.7s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals without tasks info */}
      {allGoals.length > 0 && goalProgress.length < allGoals.length && (
        <div style={{ borderRadius: '16px', padding: '16px 20px', background: 'rgba(109,40,217,0.05)', border: '1px solid rgba(109,40,217,0.2)', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: '#A78BFA', margin: 0 }}>
            💡 {allGoals.length - goalProgress.length} goal belum punya tugas yang terhubung.
            Tambah tugas di <strong>Kelola Tugas</strong> untuk memantau progressnya.
          </p>
        </div>
      )}

      {/* Category Progress */}
      {categoryData.length > 0 && (
        <div style={{ borderRadius: '16px', padding: '20px', background: '#0D111F', border: '1px solid #1E2740' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', marginBottom: '20px' }}>Progress per Kategori</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categoryData.map(cat => {
              const pct = cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
              return (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {pct === 100 ? <CheckCircle2 size={14} style={{ color: '#10B981' }} /> : pct > 0 ? <Clock size={14} style={{ color: '#F59E0B' }} /> : <Circle size={14} style={{ color: '#64748B' }} />}
                      <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>{cat.done}/{cat.total} ({pct}%)</span>
                  </div>
                  <div style={{ height: '5px', borderRadius: '999px', background: '#1E2740', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', width: `${pct}%`, background: pct === 100 ? '#10B981' : 'linear-gradient(90deg, #6D28D9, #4F46E5)', transition: 'width 0.7s ease' }} />
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
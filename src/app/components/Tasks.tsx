import { useState } from 'react';
import { Plus, Trash2, Check, Clock, Circle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '../App';

interface TasksProps {
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
}

type FilterStatus = 'all' | 'todo' | 'in-progress' | 'done';

const CATEGORIES = ['Belajar', 'Kesehatan', 'Karir', 'Keuangan', 'Pribadi', 'Lainnya'];
const priorityColor: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const priorityLabel: Record<string, string> = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };
const statusBg: Record<string, string> = { done: 'rgba(16,185,129,0.15)', 'in-progress': 'rgba(59,130,246,0.15)', todo: 'rgba(100,116,139,0.15)' };
const statusBorder: Record<string, string> = { done: 'rgba(16,185,129,0.35)', 'in-progress': 'rgba(59,130,246,0.35)', todo: 'rgba(100,116,139,0.35)' };
const statusTextColor: Record<string, string> = { done: '#10B981', 'in-progress': '#3B82F6', todo: '#94A3B8' };
const statusText: Record<string, string> = { done: 'Selesai', 'in-progress': 'Berjalan', todo: 'Belum Mulai' };

export function Tasks({ tasks, setTasks }: TasksProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as Task['priority'], category: 'Belajar', dueDate: '' });

  const filtered = tasks.filter(t => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const addTask = () => {
    if (!form.title.trim()) { toast.error('Judul tugas tidak boleh kosong'); return; }
    const newTask: Task = { id: Date.now().toString(), title: form.title.trim(), description: form.description.trim(), status: 'todo', priority: form.priority, category: form.category, createdAt: new Date().toISOString(), dueDate: form.dueDate || undefined };
    setTasks(prev => [newTask, ...(prev as Task[])]);
    setForm({ title: '', description: '', priority: 'medium', category: 'Belajar', dueDate: '' });
    setShowForm(false);
    toast.success('Tugas berhasil ditambahkan!');
  };

  const cycleStatus = (id: string) => {
    setTasks(prev => (prev as Task[]).map(t => {
      if (t.id !== id) return t;
      const next: Record<Task['status'], Task['status']> = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };
      const newStatus = next[t.status];
      if (newStatus === 'done') toast.success(`"${t.title}" selesai! 🎉`);
      return { ...t, status: newStatus };
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => (prev as Task[]).filter(t => t.id !== id));
    toast('Tugas dihapus');
  };

  const StatusIcon = ({ status }: { status: Task['status'] }) => {
    if (status === 'done') return <Check className="w-4 h-4" style={{ color: '#10B981' }} />;
    if (status === 'in-progress') return <Clock className="w-4 h-4" style={{ color: '#3B82F6' }} />;
    return <Circle className="w-4 h-4" style={{ color: '#64748B' }} />;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Kelola Tugas</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>{tasks.length} tugas total · {tasks.filter(t => t.status === 'done').length} selesai</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' }}>
          <Plus className="w-4 h-4" /> Tambah Tugas
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 rounded-2xl" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
          <h3 className="text-sm font-medium text-white mb-4">Tugas Baru</h3>
          <div className="space-y-3">
            <input type="text" placeholder="Judul tugas..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none" style={{ background: '#111827', border: '1px solid #1E2740' }} />
            <input type="text" placeholder="Deskripsi (opsional)..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none" style={{ background: '#111827', border: '1px solid #1E2740' }} />
            <div className="grid grid-cols-3 gap-3">
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))} className="px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#111827', border: '1px solid #1E2740' }}>
                <option value="high">Prioritas Tinggi</option>
                <option value="medium">Prioritas Sedang</option>
                <option value="low">Prioritas Rendah</option>
              </select>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#111827', border: '1px solid #1E2740' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111827', border: '1px solid #1E2740', color: form.dueDate ? '#fff' : '#64748B' }} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm transition-opacity hover:opacity-70" style={{ color: '#64748B' }}>Batal</button>
              <button onClick={addTask} className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' }}>Simpan Tugas</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <Search className="w-4 h-4 shrink-0" style={{ color: '#64748B' }} />
          <input type="text" placeholder="Cari tugas..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent text-white placeholder-gray-500 outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: '#64748B' }} />
          {(['all', 'todo', 'in-progress', 'done'] as FilterStatus[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className="px-3 py-1 rounded-lg text-xs transition-all" style={{ background: filterStatus === s ? 'rgba(109,40,217,0.25)' : 'transparent', color: filterStatus === s ? '#A78BFA' : '#64748B', border: filterStatus === s ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent' }}>
              {s === 'all' ? 'Semua' : s === 'todo' ? 'Belum' : s === 'in-progress' ? 'Berjalan' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
            <p style={{ color: '#64748B' }}>Tidak ada tugas ditemukan</p>
          </div>
        ) : (
          filtered.map(task => (
            <div key={task.id} className="flex items-start gap-4 p-4 rounded-2xl group transition-all" style={{ background: '#0D111F', border: '1px solid #1E2740' }}>
              <button onClick={() => cycleStatus(task.id)} className="mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: statusBg[task.status], border: `1px solid ${statusBorder[task.status]}` }} title="Klik untuk ubah status">
                <StatusIcon status={task.status} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white" style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.5 : 1 }}>{task.title}</p>
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                  </button>
                </div>
                {task.description && <p className="text-xs mt-0.5 truncate" style={{ color: '#64748B' }}>{task.description}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: statusBg[task.status], color: statusTextColor[task.status], border: `1px solid ${statusBorder[task.status]}` }}>{statusText[task.status]}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${priorityColor[task.priority]}15`, color: priorityColor[task.priority], border: `1px solid ${priorityColor[task.priority]}33` }}>{priorityLabel[task.priority]}</span>
                  <span className="text-xs" style={{ color: '#475569' }}>{task.category}</span>
                  {task.dueDate && <span className="text-xs" style={{ color: '#475569' }}>Due: {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

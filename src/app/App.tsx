import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Tasks } from './components/Tasks';
import { Progress } from './components/Progress';
import { FutureSimulation } from './components/FutureSimulation';

export type Page = 'dashboard' | 'tasks' | 'progress' | 'simulation';
export type Plan = 'free' | 'pro';

export interface User {
  name: string;
  email: string;
  plan: Plan;
  avatar: string;
  joinDate: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
  dueDate?: string;
}

const DEFAULT_USER: User = {
  name: 'Budi Santoso',
  email: 'budi@example.com',
  plan: 'free',
  avatar: 'BS',
  joinDate: new Date(Date.now() - 30 * 86400000).toISOString(),
};

const DEFAULT_TASKS: Task[] = [
  {
    id: '1',
    title: 'Baca buku Atomic Habits',
    description: 'Selesaikan 3 bab per minggu untuk membangun kebiasaan produktif',
    status: 'done',
    priority: 'high',
    category: 'Belajar',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Olahraga rutin 30 menit',
    description: 'Lari pagi atau gym setiap hari',
    status: 'done',
    priority: 'high',
    category: 'Kesehatan',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'Kursus Python di Coursera',
    description: 'Pelajari Python dari dasar hingga machine learning',
    status: 'in-progress',
    priority: 'high',
    category: 'Belajar',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 21 * 86400000).toISOString(),
  },
  {
    id: '4',
    title: 'Meditasi harian 10 menit',
    description: 'Meditasi setiap pagi sebelum memulai hari',
    status: 'in-progress',
    priority: 'medium',
    category: 'Kesehatan',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: '5',
    title: 'Buat portofolio website',
    description: 'Design dan kembangkan portfolio pribadi yang profesional',
    status: 'todo',
    priority: 'high',
    category: 'Karir',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
  },
  {
    id: '6',
    title: 'Tabung 20% penghasilan',
    description: 'Transfer otomatis ke rekening tabungan setiap gajian',
    status: 'todo',
    priority: 'medium',
    category: 'Keuangan',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
  {
    id: '7',
    title: 'Pelajari public speaking',
    description: 'Ikuti kelas Toastmasters atau latihan presentasi',
    status: 'done',
    priority: 'medium',
    category: 'Karir',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const [user, setUser] = useState<User>(() => {
    try {
      const stored = localStorage.getItem('impetus_user');
      return stored ? JSON.parse(stored) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem('impetus_tasks');
      return stored ? JSON.parse(stored) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });

  useEffect(() => {
    localStorage.setItem('impetus_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('impetus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const upgradeToPro = () => {
    setUser(prev => ({ ...prev, plan: 'pro' }));
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080B14', color: '#F1F5F9' }}>
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} />
      <main className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && (
          <Dashboard user={user} tasks={tasks} setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'tasks' && (
          <Tasks tasks={tasks} setTasks={setTasks} />
        )}
        {currentPage === 'progress' && (
          <Progress tasks={tasks} />
        )}
        {currentPage === 'simulation' && (
          <FutureSimulation user={user} tasks={tasks} upgradeToPro={upgradeToPro} />
        )}
      </main>
      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}

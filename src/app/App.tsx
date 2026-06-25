import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Tasks } from './components/Tasks';
import { Progress } from './components/Progress';
import { FutureSimulation } from './components/FutureSimulation';
import { ChatAI } from './components/ChatAI';
import { api, type SimulationRecord, type ChatMessage } from './lib/api';

export type Page = 'dashboard' | 'tasks' | 'progress' | 'simulation' | 'chat';
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

const DEFAULT_USER = {
  name: 'Budi Santoso',
  email: 'budi@example.com',
  plan: 'free',
  avatar: 'BS',
  joinDate: new Date().toISOString(),
};

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Baca buku Atomic Habits', description: 'Selesaikan 3 bab per minggu', status: 'done', priority: 'high', category: 'Belajar', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: '2', title: 'Olahraga rutin 30 menit', description: 'Lari pagi atau gym setiap hari', status: 'done', priority: 'high', category: 'Kesehatan', createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: '3', title: 'Kursus Python di Coursera', description: 'Pelajari Python dari dasar hingga machine learning', status: 'in-progress', priority: 'high', category: 'Belajar', createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), dueDate: new Date(Date.now() + 21 * 86400000).toISOString() },
  { id: '4', title: 'Meditasi harian 10 menit', description: 'Meditasi setiap pagi sebelum memulai hari', status: 'in-progress', priority: 'medium', category: 'Kesehatan', createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: '5', title: 'Buat portofolio website', description: 'Design dan kembangkan portfolio pribadi', status: 'todo', priority: 'high', category: 'Karir', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), dueDate: new Date(Date.now() + 14 * 86400000).toISOString() },
  { id: '6', title: 'Tabung 20% penghasilan', description: 'Transfer otomatis ke rekening tabungan', status: 'todo', priority: 'medium', category: 'Keuangan', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: '7', title: 'Pelajari public speaking', description: 'Ikuti kelas Toastmasters atau latihan presentasi', status: 'done', priority: 'medium', category: 'Karir', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
];

function getUserId(): string {
  let id = localStorage.getItem('impetus_uid');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('impetus_uid', id); }
  return id;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>(DEFAULT_USER as User);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [simHistory, setSimHistory] = useState<SimulationRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const userId = useRef(getUserId()).current;
  const taskSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const userData = await api.getUser(userId);
        if (userData.error) {
          await api.createUser(userId, DEFAULT_USER);
          await api.saveTasks(userId, DEFAULT_TASKS);
          setUser(DEFAULT_USER as User);
          setTasks(DEFAULT_TASKS);
          setSimHistory([]);
          setChatMessages([]);
        } else {
          setUser(userData as User);
          const [tasksData, historyData, chatData] = await Promise.all([
            api.getTasks(userId),
            api.getSimulations(userId),
            api.getChat(userId),
          ]);
          setTasks(Array.isArray(tasksData) ? tasksData : DEFAULT_TASKS);
          setSimHistory(Array.isArray(historyData) ? historyData : []);
          setChatMessages(Array.isArray(chatData) ? chatData : []);
        }
      } catch (e) {
        console.log('Backend load failed, using defaults:', e);
        setUser(DEFAULT_USER as User);
        setTasks(DEFAULT_TASKS);
        setSimHistory([]);
        setChatMessages([]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [userId]);

  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    if (loading) return;
    clearTimeout(taskSaveTimer.current);
    taskSaveTimer.current = setTimeout(() => {
      api.saveTasks(userId, tasks).catch(e => console.log('Auto-save tasks failed:', e));
    }, 800);
    return () => clearTimeout(taskSaveTimer.current);
  }, [tasks, userId, loading]);

  const upgradeToPro = async () => {
    try {
      const result = await api.upgradeUser(userId);
      if (result.success) setUser(result.user);
      else throw new Error('Upgrade unsuccessful');
    } catch (e) {
      console.log('Backend upgrade failed, upgrading locally:', e);
      setUser(prev => ({ ...prev, plan: 'pro' }));
    }
  };

  const simulateAI = async (tasks: Task[], goal: string): Promise<string> => {
    const result = await api.simulate(userId, tasks, goal, user.name, simHistory);
    if (result.error) throw new Error(result.error);
    if (!result.result) throw new Error('Tidak ada hasil dari AI');
    api.getSimulations(userId).then(h => { if (Array.isArray(h)) setSimHistory(h); }).catch(() => {});
    return result.result;
  };

  const clearSimHistory = async () => {
    await api.clearSimulations(userId);
    setSimHistory([]);
  };

  const sendChatMessage = async (message: string) => {
    const optimisticUser: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, optimisticUser]);
    const result = await api.sendChat(userId, message, user.name);
    if (result.error) {
      setChatMessages(prev => prev.filter(m => m.id !== optimisticUser.id));
      throw new Error(result.error);
    }
    if (!result.message) {
      setChatMessages(prev => prev.filter(m => m.id !== optimisticUser.id));
      throw new Error('Tidak ada respons dari AI');
    }
    setChatMessages(prev => [...prev, result.message!]);
  };

  const clearChat = async () => {
    await api.clearChat(userId);
    setChatMessages([]);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#080B14' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)' }}>
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Impetus</p>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>Menghubungkan ke database...</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#6D28D9', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080B14', color: '#F1F5F9' }}>
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} />
      <main className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && <Dashboard user={user} tasks={tasks} setCurrentPage={setCurrentPage} />}
        {currentPage === 'tasks' && <Tasks tasks={tasks} setTasks={setTasks} />}
        {currentPage === 'progress' && <Progress tasks={tasks} />}
        {currentPage === 'simulation' && (
          <FutureSimulation
            user={user}
            tasks={tasks}
            upgradeToPro={upgradeToPro}
            simulateAI={simulateAI}
            simHistory={simHistory}
            clearSimHistory={clearSimHistory}
          />
        )}
        {currentPage === 'chat' && (
          <ChatAI
            user={user}
            messages={chatMessages}
            onSend={sendChatMessage}
            onClear={clearChat}
          />
        )}
      </main>
      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}

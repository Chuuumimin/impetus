import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Tasks } from './components/Tasks';
import { Progress } from './components/Progress';
import { FutureSimulation } from './components/FutureSimulation';
import { ChatAI } from './components/ChatAI';
import { Profile } from './components/Profile';
import { AuthPage } from './components/AuthPage';
import { Onboarding } from './components/Onboarding';
import { api, type SimulationRecord, type ChatMessage } from './lib/api';

export type Page = 'dashboard' | 'tasks' | 'progress' | 'simulation' | 'chat' | 'profile';
export type Plan = 'free' | 'pro';

export interface User {
  name: string;
  email: string;
  plan: Plan;
  avatar: string;
  joinDate: string;
  onboardingComplete?: boolean;
  age?: number;
  occupation?: string;
  income?: number;
  shortGoals?: string[];
  longGoals?: string[];
  skills?: string[];
  habits?: string[];
  lifeProfile?: { summary: string; strengths: string[]; weaknesses: string[] };
  roadmap?: Array<{ label: string; focus: string; actions: string[]; color: string }>;
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

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Baca buku Atomic Habits', description: 'Selesaikan 3 bab per minggu', status: 'done', priority: 'high', category: 'Belajar', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: '2', title: 'Olahraga rutin 30 menit', description: 'Lari pagi atau gym setiap hari', status: 'done', priority: 'high', category: 'Kesehatan', createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: '3', title: 'Kursus Python di Coursera', description: 'Pelajari Python dari dasar hingga machine learning', status: 'in-progress', priority: 'high', category: 'Belajar', createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), dueDate: new Date(Date.now() + 21 * 86400000).toISOString() },
  { id: '4', title: 'Meditasi harian 10 menit', description: 'Meditasi setiap pagi sebelum memulai hari', status: 'in-progress', priority: 'medium', category: 'Kesehatan', createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: '5', title: 'Buat portofolio website', description: 'Design dan kembangkan portfolio pribadi', status: 'todo', priority: 'high', category: 'Karir', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), dueDate: new Date(Date.now() + 14 * 86400000).toISOString() },
  { id: '6', title: 'Tabung 20% penghasilan', description: 'Transfer otomatis ke rekening tabungan', status: 'todo', priority: 'medium', category: 'Keuangan', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: '7', title: 'Pelajari public speaking', description: 'Ikuti kelas Toastmasters atau latihan presentasi', status: 'done', priority: 'medium', category: 'Karir', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
];

function makeDefaultUser(session: Session): User {
  const name = (session.user.user_metadata?.name as string) || session.user.email?.split('@')[0] || 'User';
  const avatar = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  return { name, email: session.user.email || '', plan: 'free', avatar, joinDate: new Date().toISOString(), onboardingComplete: false };
}

function LoadingScreen({ text }: { text: string }) {
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
          <p className="text-xs mt-1" style={{ color: '#64748B' }}>{text}</p>
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

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>({ name: '', email: '', plan: 'free', avatar: '', joinDate: '', onboardingComplete: false });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [simHistory, setSimHistory] = useState<SimulationRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const taskSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const skipNextTaskSave = useRef(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (!session) { setTasks([]); setSimHistory([]); setChatMessages([]); setCurrentPage('dashboard'); skipNextTaskSave.current = true; }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const userId = session.user.id;
    skipNextTaskSave.current = true;
    const init = async () => {
      setLoading(true);
      try {
        const userData = await api.getUser(userId);
        if (userData.error) {
          const defaultUser = makeDefaultUser(session);
          await api.createUser(userId, defaultUser);
          await api.saveTasks(userId, DEFAULT_TASKS);
          setUser(defaultUser);
          setTasks(DEFAULT_TASKS);
          setSimHistory([]); setChatMessages([]);
        } else {
          setUser(userData as User);
          const [tasksData, historyData, chatData] = await Promise.all([
            api.getTasks(userId), api.getSimulations(userId), api.getChat(userId),
          ]);
          setTasks(Array.isArray(tasksData) ? tasksData : DEFAULT_TASKS);
          setSimHistory(Array.isArray(historyData) ? historyData : []);
          setChatMessages(Array.isArray(chatData) ? chatData : []);
        }
      } catch {
        const defaultUser = makeDefaultUser(session);
        setUser(defaultUser); setTasks(DEFAULT_TASKS); setSimHistory([]); setChatMessages([]);
      } finally { setLoading(false); }
    };
    init();
  }, [session?.user.id]);

  useEffect(() => {
    if (!session) return;
    if (skipNextTaskSave.current) { skipNextTaskSave.current = false; return; }
    if (loading) return;
    clearTimeout(taskSaveTimer.current);
    taskSaveTimer.current = setTimeout(() => {
      api.saveTasks(session.user.id, tasks).catch(e => console.log('Auto-save failed:', e));
    }, 800);
    return () => clearTimeout(taskSaveTimer.current);
  }, [tasks, session?.user.id, loading]);

  const upgradeToPro = async () => {
    if (!session) return;
    try { const r = await api.upgradeUser(session.user.id); if (r.success) setUser(r.user); else throw new Error(); }
    catch { setUser(prev => ({ ...prev, plan: 'pro' })); }
  };

  const simulateAI = async (tasks: Task[], goal: string): Promise<string> => {
    if (!session) throw new Error('Tidak terautentikasi');
    const result = await api.simulate(session.user.id, tasks, goal, user.name, simHistory);
    if (result.error) throw new Error(result.error);
    if (!result.result) throw new Error('Tidak ada hasil dari AI');
    api.getSimulations(session.user.id).then(h => { if (Array.isArray(h)) setSimHistory(h); }).catch(() => {});
    return result.result;
  };

  const clearSimHistory = async () => { if (!session) return; await api.clearSimulations(session.user.id); setSimHistory([]); };

  const sendChatMessage = async (message: string) => {
    if (!session) throw new Error('Tidak terautentikasi');
    const optimistic: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: message, createdAt: new Date().toISOString() };
    setChatMessages(prev => [...prev, optimistic]);
    const result = await api.sendChat(session.user.id, message, user.name);
    if (result.error) { setChatMessages(prev => prev.filter(m => m.id !== optimistic.id)); throw new Error(result.error); }
    if (!result.message) { setChatMessages(prev => prev.filter(m => m.id !== optimistic.id)); throw new Error('Tidak ada respons dari AI'); }
    setChatMessages(prev => [...prev, result.message!]);
  };

  const clearChat = async () => { if (!session) return; await api.clearChat(session.user.id); setChatMessages([]); };

  const handleOnboardingComplete = (updatedUser: User) => { setUser(updatedUser); };

  if (authLoading) return <LoadingScreen text="Memuat sesi..." />;
  if (!session) return <AuthPage />;
  if (loading) return <LoadingScreen text="Menghubungkan ke database..." />;
  if (!user.onboardingComplete) return <Onboarding user={user} userId={session.user.id} onComplete={handleOnboardingComplete} />;

  const userId = session.user.id;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080B14', color: '#F1F5F9' }}>
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} />
      <main className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && <Dashboard user={user} tasks={tasks} setCurrentPage={setCurrentPage} />}
        {currentPage === 'tasks' && <Tasks tasks={tasks} setTasks={setTasks} />}
        {currentPage === 'progress' && <Progress tasks={tasks} />}
        {currentPage === 'simulation' && <FutureSimulation user={user} tasks={tasks} upgradeToPro={upgradeToPro} simulateAI={simulateAI} simHistory={simHistory} clearSimHistory={clearSimHistory} />}
        {currentPage === 'chat' && <ChatAI user={user} messages={chatMessages} onSend={sendChatMessage} onClear={clearChat} />}
        {currentPage === 'profile' && <Profile user={user} userId={userId} onUserUpdate={setUser} />}
      </main>
      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}

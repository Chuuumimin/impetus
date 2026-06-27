import type { Task, User } from '../App';

export interface SimulationRecord {
  id: string;
  goal: string;
  result: string;
  createdAt: string;
  taskSnapshot: { total: number; done: number; rate: number; categories: string[] };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const BASE = `https://${projectId}.supabase.co/functions/v1/server/make-server-886336a3`;
const HEADERS = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` };

async function req<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...HEADERS, ...options?.headers } });
  return res.json();
}

export const api = {
  getUser: (userId: string) => req<User & { error?: string }>(`/user/${userId}`),
  createUser: (userId: string, userData: object) => req(`/user`, { method: 'POST', body: JSON.stringify({ userId, ...userData }) }),
  updateUser: (userId: string, userData: Partial<User>) => req(`/user`, { method: 'POST', body: JSON.stringify({ userId, ...userData }) }),
  upgradeUser: (userId: string) => req<{ success: boolean; user: User }>(`/user/${userId}/upgrade`, { method: 'POST' }),
  getTasks: (userId: string) => req<Task[]>(`/tasks/${userId}`),
  saveTasks: (userId: string, tasks: Task[]) => req(`/tasks/${userId}`, { method: 'PUT', body: JSON.stringify(tasks) }),
  getSimulations: (userId: string) => req<SimulationRecord[]>(`/simulations/${userId}`),
  clearSimulations: (userId: string) => req(`/simulations/${userId}`, { method: 'DELETE' }),
  simulate: (userId: string, tasks: Task[], goal: string, userName: string, history: SimulationRecord[]) =>
    req<{ result?: string; error?: string }>(`/simulate`, { method: 'POST', body: JSON.stringify({ userId, tasks, goal, userName, history }) }),
  getChat: (userId: string) => req<ChatMessage[]>(`/chat/${userId}`),
  sendChat: (userId: string, message: string, userName: string) =>
    req<{ message?: ChatMessage; error?: string }>(`/chat/${userId}`, { method: 'POST', body: JSON.stringify({ message, userName }) }),
  clearChat: (userId: string) => req(`/chat/${userId}`, { method: 'DELETE' }),
  generateLifeProfile: (userId: string, data: any) =>
    req<{ summary?: string; strengths?: string[]; weaknesses?: string[]; roadmap?: any[]; error?: string }>(
      `/generate-life-profile`,
      { method: 'POST', body: JSON.stringify({ userId, ...data }) }
    ),
  generateTasks: (userId: string, data: any) =>
    req<{ tasks?: Task[]; error?: string }>(
      `/generate-tasks`,
      { method: 'POST', body: JSON.stringify({ userId, ...data }) }
    ),
};
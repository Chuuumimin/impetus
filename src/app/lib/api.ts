import { projectId, publicAnonKey } from '/utils/supabase/info';
import type { Task, User } from '../App';

export interface SimulationRecord {
  id: string;
  goal: string;
  result: string;
  createdAt: string;
  taskSnapshot: { total: number; done: number; rate: number; categories: string[] };
}

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-886336a3`;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

async function req<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...HEADERS, ...options?.headers },
  });
  return res.json();
}

export const api = {
  getUser: (userId: string) =>
    req<User & { error?: string }>(`/user/${userId}`),

  createUser: (userId: string, userData: object) =>
    req(`/user`, { method: 'POST', body: JSON.stringify({ userId, ...userData }) }),

  upgradeUser: (userId: string) =>
    req<{ success: boolean; user: User }>(`/user/${userId}/upgrade`, { method: 'POST' }),

  getTasks: (userId: string) =>
    req<Task[]>(`/tasks/${userId}`),

  saveTasks: (userId: string, tasks: Task[]) =>
    req(`/tasks/${userId}`, { method: 'PUT', body: JSON.stringify(tasks) }),

  getSimulations: (userId: string) =>
    req<SimulationRecord[]>(`/simulations/${userId}`),

  clearSimulations: (userId: string) =>
    req(`/simulations/${userId}`, { method: 'DELETE' }),

  simulate: (
    userId: string,
    tasks: Task[],
    goal: string,
    userName: string,
    history: SimulationRecord[]
  ) =>
    req<{ result?: string; error?: string }>(`/simulate`, {
      method: 'POST',
      body: JSON.stringify({ userId, tasks, goal, userName, history }),
    }),
};

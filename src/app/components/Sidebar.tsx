import { LayoutDashboard, CheckSquare, BarChart3, Sparkles, Crown, Zap, MessageSquare } from 'lucide-react';
import type { Page, User } from '../App';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  user: User;
}

const navItems: { id: Page; label: string; icon: React.ElementType; proOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Kelola Tugas', icon: CheckSquare },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'chat', label: 'Chat AI', icon: MessageSquare },
  { id: 'simulation', label: 'Future Simulation', icon: Sparkles, proOnly: true },
];

export function Sidebar({ currentPage, setCurrentPage, user }: SidebarProps) {
  const isPro = user.plan === 'pro';

  return (
    <aside
      className="flex flex-col w-64 shrink-0 border-r"
      style={{ background: '#0D111F', borderColor: '#1E2740' }}
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: '#1E2740' }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)' }}
        >
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-semibold tracking-wide">Impetus</span>
          {isPro && (
            <div
              className="text-xs px-1.5 py-0.5 rounded-full inline-block ml-2 leading-none"
              style={{ background: 'linear-gradient(90deg, #D97706, #F59E0B)', color: '#fff' }}
            >
              PRO
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const isLocked = item.proOnly && !isPro;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(109,40,217,0.3), rgba(79,70,229,0.2))'
                  : 'transparent',
                color: isActive ? '#A78BFA' : '#94A3B8',
                border: isActive ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
              }}
            >
              <Icon
                className="w-5 h-5 shrink-0"
                style={{ color: isActive ? '#A78BFA' : item.proOnly && !isPro ? '#F59E0B' : '#64748B' }}
              />
              <span className="flex-1 text-sm">{item.label}</span>
              {isLocked && (
                <div
                  className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}
                >
                  <Crown className="w-3 h-3" />
                  PRO
                </div>
              )}
              {item.proOnly && isPro && (
                <div
                  className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
                >
                  <Crown className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {!isPro && (
        <div className="mx-3 mb-3 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4" style={{ color: '#F59E0B' }} />
            <span className="text-sm font-medium" style={{ color: '#F59E0B' }}>Impetus PRO</span>
          </div>
          <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>
            Buka Future AI Simulation dan fitur eksklusif lainnya.
          </p>
          <button
            className="w-full py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(90deg, #D97706, #F59E0B)', color: '#fff' }}
          >
            Upgrade &mdash; Rp 49.000/bln
          </button>
        </div>
      )}

      {/* User card — click to go to Profile */}
      <div className="px-3 pb-4">
        <button
          onClick={() => setCurrentPage('profile')}
          className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5 text-left"
          style={{
            background: currentPage === 'profile' ? 'rgba(109,40,217,0.15)' : '#111827',
            border: currentPage === 'profile' ? '1px solid rgba(139,92,246,0.3)' : '1px solid #1E2740',
          }}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff' }}
          >
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            {isPro ? (
              <span className="text-xs" style={{ color: '#F59E0B' }}>Pro User ✦</span>
            ) : (
              <span className="text-xs" style={{ color: '#64748B' }}>Free User</span>
            )}
          </div>
        </button>
      </div>
    </aside>
  );
}

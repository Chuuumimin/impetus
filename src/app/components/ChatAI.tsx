import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Trash2, Bot, Loader2, AlertTriangle } from 'lucide-react';
import type { User } from '../App';
import type { ChatMessage } from '../lib/api';

interface ChatAIProps {
  user: User;
  messages: ChatMessage[];
  onSend: (message: string) => Promise<void>;
  onClear: () => Promise<void>;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const time = new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
          style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)' }}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words"
          style={
            isUser
              ? { background: 'linear-gradient(135deg, #6D28D9, #4F46E5)', color: '#fff', borderBottomRightRadius: '4px' }
              : { background: '#111827', color: '#CBD5E1', border: '1px solid #1E2740', borderBottomLeftRadius: '4px' }
          }
        >
          {msg.content}
        </div>
        <span className="text-xs" style={{ color: '#475569' }}>{time}</span>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'Bagaimana cara meningkatkan fokus saya?',
  'Tugas mana yang harus saya prioritaskan?',
  'Bantu saya buat jadwal harian yang efektif.',
];

export function ChatAI({ user, messages, onSend, onClear }: ChatAIProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setSending(true);
    setError('');
    try {
      await onSend(msg);
    } catch (e: any) {
      setError(e?.message || 'Gagal mengirim pesan. Coba lagi.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setError('');
    await onClear();
    setClearing(false);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: '#080B14' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: '#1E2740', background: '#0D111F' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)' }}
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">Chat AI</h1>
            <p className="text-xs" style={{ color: '#64748B' }}>
              {messages.length > 0
                ? `${messages.length} pesan tersimpan`
                : 'Productivity coach personal kamu'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <Trash2 className="w-3 h-3" />
            {clearing ? 'Menghapus...' : 'Hapus Chat'}
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !sending && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.3)' }}
            >
              <Bot className="w-8 h-8" style={{ color: '#A78BFA' }} />
            </div>
            <div>
              <p className="text-white font-medium mb-1">Halo, {user.name.split(' ')[0]}!</p>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Tanya apa saja soal produktivitas, goal, atau kebiasaan.<br />
                Semua percakapan tersimpan otomatis per akun.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm mt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-left text-sm px-4 py-2.5 rounded-xl transition-colors hover:bg-white/5"
                  style={{ background: '#0D111F', color: '#94A3B8', border: '1px solid #1E2740' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {sending && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)' }}
            >
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-2"
              style={{ background: '#111827', border: '1px solid #1E2740', borderBottomLeftRadius: '4px' }}
            >
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#A78BFA' }} />
              <span className="text-sm" style={{ color: '#64748B' }}>AI sedang mengetik...</span>
            </div>
          </div>
        )}

        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-6 py-4 shrink-0"
        style={{ borderTop: '1px solid #1E2740', background: '#0D111F' }}
      >
        <div
          className="flex items-end gap-3 px-4 py-3 rounded-2xl"
          style={{ background: '#111827', border: '1px solid #1E2740' }}
        >
          <textarea
            ref={(el) => {
              (inputRef as any).current = el;
              (textareaRef as any).current = el;
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan... (Enter kirim, Shift+Enter baris baru)"
            rows={1}
            className="flex-1 text-sm placeholder-gray-600"
            style={{
              background: 'transparent',
              color: '#F1F5F9',
              resize: 'none',
              outline: 'none',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #6D28D9, #4F46E5)' }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: '#334155' }}>
          Chat tersimpan otomatis per user · Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}

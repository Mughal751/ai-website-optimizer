'use client';

import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AssistantChat({ scanId }: { scanId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setError(null);
    const q = question;
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await fetch(`/api/scan/${scanId}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'The assistant could not answer that.');
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch {
      setError('Network error reaching the assistant.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card flex flex-col p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-button-gradient">
          <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        <h3 className="font-semibold text-white">Ask about this scan</h3>
      </div>

      <div className="mb-4 flex max-h-96 min-h-[80px] flex-col gap-3 overflow-y-auto scrollbar-thin">
        {messages.length === 0 && (
          <p className="text-caption text-white/40">
            e.g. &ldquo;Which fix should I prioritize first?&rdquo; or &ldquo;Why is my performance score low?&rdquo;
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'self-end rounded-lg bg-button-gradient px-4 py-2.5 text-body text-white'
                : 'glass self-start rounded-lg px-4 py-2.5 text-body text-white/85'
            }
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="glass self-start rounded-lg px-4 py-2.5 text-body text-white/50">Thinking...</div>
        )}
      </div>

      {error && <p className="mb-3 text-caption text-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this scan..."
          className="input-glass flex-1"
          style={{ height: 48 }}
        />
        <button type="submit" disabled={loading} className="btn-primary shrink-0 px-5" style={{ height: 48 }}>
          <Send className="h-4 w-4" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}

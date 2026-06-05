'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; content: string; usedRetrieval?: boolean };

const SUGGESTIONS = [
  'How does the 4-layer verification work?',
  'Find me a verified product manager in my college',
  'What semester marksheet uploads do I need?',
  'Recommend a practice domain for me',
];

const GREETING: Msg = {
  role: 'assistant',
  content:
    "Hey — I'm SkillBot. I can explain how verification works, help you find verified peers in your college, or point you at the right page. What's up?",
};

const MAX_PERSISTED = 50; // last N turns; keeps localStorage small

function storageKey(email: string | null | undefined): string | null {
  if (!email) return null;
  return `skillbot:history:${email}`;
}

/**
 * Floating bottom-right chat button. Conversation state lives in
 * localStorage keyed by the user's email — refresh keeps the thread, sign-out
 * (handled by Settings) doesn't leak across accounts because each account
 * has its own key. Calls the NestJS /chat endpoint, which decides whether
 * to do SQL-based retrieval.
 */
export function ChatWidget() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const email = session?.user?.email ?? null;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage when the user becomes known. Wrapped in
  // try/catch so a poisoned key doesn't crash the dashboard.
  useEffect(() => {
    const key = storageKey(email);
    if (!key) return;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Msg[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
      }
    } catch {
      // ignore — fall back to greeting
    }
  }, [email]);

  // Persist whenever messages change. Keep only the last MAX_PERSISTED
  // turns so localStorage doesn't grow unbounded over months of chatting.
  useEffect(() => {
    const key = storageKey(email);
    if (!key) return;
    try {
      const trimmed = messages.slice(-MAX_PERSISTED);
      window.localStorage.setItem(key, JSON.stringify(trimmed));
    } catch {
      // quota exceeded — silently drop persistence
    }
  }, [messages, email]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  function reset() {
    setMessages([GREETING]);
    const key = storageKey(email);
    if (key) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  }

  async function send(text?: string) {
    const body = (text ?? draft).trim();
    if (!body || !token) return;
    setDraft('');
    const next: Msg[] = [...messages, { role: 'user', content: body }];
    setMessages(next);
    setSending(true);
    try {
      const res = await api<{ reply: string; usedRetrieval: boolean }>('/chat', {
        method: 'POST',
        token,
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: res.reply, usedRetrieval: res.usedRetrieval },
      ]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${(e as Error).message}` }]);
    } finally {
      setSending(false);
    }
  }

  // Don't render at all if the user isn't signed in — chat is gated.
  if (!token) return null;

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-5 right-5 z-40 grid place-items-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition',
          open && 'hidden',
        )}
        aria-label="Open SkillBot"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-5 right-5 z-40 flex flex-col w-[360px] max-w-[calc(100vw-2.5rem)] h-[520px] max-h-[calc(100vh-2.5rem)] rounded-2xl border bg-background shadow-2xl transition',
          open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid place-items-center h-7 w-7 rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">SkillBot</div>
              <div className="text-[10px] text-muted-foreground">AI · powered by OpenRouter</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={reset}
              className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-secondary"
              title="Clear conversation"
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable transcript */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
          {messages.map((m, i) => (
            <Bubble key={i} msg={m} />
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
            </div>
          )}
        </div>

        {/* Suggestion chips (first turn only) */}
        {messages.length <= 1 && (
          <div className="border-t px-3 py-2">
            <div className="text-[10px] text-muted-foreground mb-1.5 px-1">Quick prompts</div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={sending}
                  className="rounded-full border bg-secondary/30 hover:bg-secondary px-2.5 py-1 text-[11px] transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask anything…"
              className="flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={sending}
            />
            <Button size="sm" onClick={() => send()} disabled={sending || !draft.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-2xl px-3 py-2 max-w-[85%] whitespace-pre-wrap leading-relaxed',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
        )}
      >
        {msg.content}
        {msg.usedRetrieval && (
          <div className="mt-1 text-[9px] uppercase tracking-wider opacity-60">
            ✦ retrieved from your institute
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, Send, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { errMessage } from '../../services/api.js';
import Button from '../../components/common/Button.jsx';
import { useUIStore } from '../../store/uiStore.js';
import './tutor.css';

export default function FloatingTutor() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [usage, setUsage] = useState(null);
  const [unavailable, setUnavailable] = useState(null);
  const scroller = useRef(null);
  const toast = useUIStore((s) => s.toast);

  const lessonSlug = location.pathname.match(/^\/lesson\/([^/]+)/)?.[1] || undefined;

  useEffect(() => {
    api.get('/api/v1/ai/usage').then(({ data }) => setUsage(data)).catch(() => {});
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setSending(true);

    // guest identity so anonymous users get quota too
    let guestId = sessionStorage.getItem('css-visual:guest');
    if (!guestId) {
      guestId = crypto.randomUUID();
      sessionStorage.setItem('css-visual:guest', guestId);
    }
    try {
      const { data } = await api.post('/api/v1/ai/chat', { message: text, conversationId, lessonSlug, guestSessionId: guestId });
      setConversationId((prev) => data.conversationId || prev);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      setUsage((u) => ({ ...u, used: data.usage?.used ?? u?.used, quota: data.usage?.quota ?? u?.quota }));
      setUnavailable(null);
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      const msg = errMessage(err);
      if (code === 'AI_NOT_CONFIGURED') setUnavailable('The tutor is not configured on this deployment. The rest of CSS Visual works fully.');
      else if (code === 'AI_QUOTA_EXCEEDED') setUnavailable(msg);
      else toast(msg, 'error');
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${code === 'AI_QUOTA_EXCEEDED' ? 'Daily limit reached.' : 'Something went wrong.'} ${msg}`, error: true }]);
    } finally {
      setSending(false);
    }
  };

  // hidden on the tutor's own landing entry & lesson pages where it would overlap content? keep everywhere.
  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-brand text-[#0d0e09] shadow-lg transition-transform hover:scale-105"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close AI tutor' : 'Open AI tutor'}
        title="AI CSS Tutor"
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="card-surface fixed bottom-20 right-5 z-40 flex h-[520px] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden shadow-2xl"
            role="dialog"
            aria-label="AI CSS Tutor"
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <Sparkles size={16} className="text-pro" aria-hidden />
              <span className="text-sm font-semibold">CSS Tutor</span>
              {usage?.configured && (
                <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted" title="Requests used today / daily quota">
                  <Gauge size={11} /> {usage.used}/{usage.quota}
                </span>
              )}
            </div>

            <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4">
              {unavailable && (
                <div className="rounded-lg border border-pro/40 bg-pro/5 p-3 text-xs text-pro">
                  {unavailable}
                  <button className="mt-2 block underline" onClick={() => setUnavailable(null)}>Dismiss</button>
                </div>
              )}
              {!messages.length && !unavailable && (
                <div className="grid gap-2 text-sm text-muted">
                  <p>Hi! I'm the CSS tutor. Ask me anything:</p>
                  {["Explain justify-content like I'm five", 'Why is my flex item overflowing?', "What's the difference between rem and em?"].map((s) => (
                    <button key={s} className="rounded-lg border border-line bg-surface p-2.5 text-left text-xs transition-colors hover:border-brand/60" onClick={() => setInput(s)}>
                      💬 {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`tutor-msg ${m.role} ${m.error ? 'error' : ''}`}>
                  {m.content}
                </div>
              ))}
              {sending && (
                <div className="tutor-msg assistant">
                  <span className="inline-block h-3 w-1.5 animate-pulse rounded bg-brand" /> thinking…
                </div>
              )}
            </div>

            {lessonSlug && <div className="border-t border-line px-4 py-1.5 text-[10px] text-muted">context: lesson <span className="font-mono">{lessonSlug}</span></div>}

            <form
              className="flex gap-2 border-t border-line p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                className="input-base flex-1 text-sm"
                placeholder="Ask about CSS…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={4000}
                aria-label="Message the tutor"
                disabled={sending}
              />
              <Button size="sm" type="submit" loading={sending} disabled={!input.trim()}>
                <Send size={14} />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AcwrResult, BalanceResult, PlateauResult } from '@/lib/hevy';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  summary: string;
  acwr: AcwrResult[];
  plateaus: PlateauResult[];
  balance: BalanceResult;
  nutritionSummary?: string;
  profileSummary?: string | null;
}

const STARTER_QUESTIONS = [
  'Am I overtraining any muscle groups?',
  'What should I focus on to break my biggest plateau?',
  'How is my push/pull balance looking?',
  'Plan me a deload week based on my recent training',
  'Is my protein intake supporting my training volume?',
  'How does my nutrition correlate with my session quality?',
];

function buildSystemPrompt(
  summary: string,
  acwr: AcwrResult[],
  plateaus: PlateauResult[],
  balance: BalanceResult,
  nutritionSummary?: string,
  profileSummary?: string | null,
): string {
  const acwrWarnings = acwr
    .filter((a) => a.status === 'danger' || a.status === 'undertrained')
    .map((a) => `${a.muscle_group}:${a.status.toUpperCase()}(${a.ratio.toFixed(2)})`)
    .join(', ') || 'none';

  const plateauWarnings = plateaus
    .filter((p) => p.risk !== 'none')
    .map((p) => `${p.exercise_title}:${p.risk.toUpperCase()}(${p.stall_weeks}wk stall)`)
    .join(', ') || 'none';

  const nutritionSection = nutritionSummary
    ? `\n\nUSER NUTRITION DATA:\n${nutritionSummary}`
    : '\n\nNUTRITION: No nutrition data logged yet.';

  const profileSection = profileSummary
    ? `\n\nUSER PROFILE:\n${profileSummary}`
    : '';

  return `You are a knowledgeable strength and conditioning coach with access to the user's complete training history and nutrition log. Your role is to analyze their data and provide specific, actionable coaching advice.

IMPORTANT RULES:
- Always base your answers on the training data provided below
- Be specific: reference actual exercises, dates, weights, and trends from the data
- When nutrition data is available, incorporate it into recovery and performance advice
- If a question cannot be answered from the data, say so clearly
- Keep responses concise (under 300 words) unless a detailed plan is requested
- Do not recommend injury-risking advice; suggest consulting a professional for pain/injury

USER TRAINING DATA:
${summary}

TODAY'S DATE: ${new Date().toISOString().slice(0, 10)}

COMPUTED METRICS:
- ACWR flags: ${acwrWarnings}
- Plateau flags: ${plateauWarnings}
- Push/Pull ratio (30d): ${balance.push_pull_ratio.toFixed(2)}
- Quad/Hip ratio (30d): ${balance.quad_hip_ratio.toFixed(2)}${nutritionSection}${profileSection}`;
}

export function ChatPanel({ summary, acwr, plateaus, balance, nutritionSummary, profileSummary }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const systemPrompt = buildSystemPrompt(summary, acwr, plateaus, balance, nutritionSummary, profileSummary);

  async function sendMessage(content: string) {
    if (!content.trim() || isStreaming) return;

    const userMsg: Message = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setIsOffline(false);

    // Append empty assistant message to stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt,
        }),
      });

      if (!res.ok) {
        setIsOffline(true);
        setMessages((prev) => prev.slice(0, -1)); // remove empty assistant msg
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const token = JSON.parse(data);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: 'assistant',
                content: updated[updated.length - 1].content + token,
              };
              return updated;
            });
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch {
      setIsOffline(true);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition-colors"
        aria-label="Open coach chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed right-0 top-0 z-30 flex h-full w-full flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300 md:w-[420px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
          <div>
            <h3 className="font-semibold text-zinc-100">Ask Your Coach</h3>
            <p className="text-xs text-zinc-500">Powered by Ollama</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Offline banner */}
        {isOffline && (
          <div className="border-b border-amber-800 bg-amber-900/30 px-4 py-3">
            <div className="text-sm font-medium text-amber-300">Model Offline</div>
            <div className="text-xs text-amber-400 mt-1">
              Make sure Ollama is running (<code className="bg-amber-900/50 px-1 rounded">ollama serve</code>) and the model set in <code className="bg-amber-900/50 px-1 rounded">OLLAMA_MODEL</code> is pulled. Run <code className="bg-amber-900/50 px-1 rounded">ollama list</code> to see available models.
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Ask me anything about your training. I have full access to your workout history, recovery status, plateau analysis, and nutrition log.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Suggested questions</p>
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-sm text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl bg-indigo-600 px-4 py-3 text-sm text-white">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[90%] rounded-2xl bg-zinc-800 px-4 py-3 text-sm text-zinc-200">
                  {msg.content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
                        em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
                        h1: ({ children }) => <h1 className="text-base font-bold text-zinc-100 mb-2 mt-3 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-bold text-zinc-100 mb-1.5 mt-3 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold text-zinc-200 mb-1 mt-2 first:mt-0">{children}</h3>,
                        ul: ({ children }) => <ul className="mb-2 space-y-1 pl-4">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 space-y-1 pl-4 list-decimal">{children}</ol>,
                        li: ({ children }) => (
                          <li className="relative pl-2 before:absolute before:left-[-0.75rem] before:content-['•'] before:text-indigo-400">
                            {children}
                          </li>
                        ),
                        code: ({ children, className }) => {
                          const isBlock = className?.includes('language-');
                          return isBlock ? (
                            <code className="block rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-300 overflow-x-auto my-2">{children}</code>
                          ) : (
                            <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-indigo-300">{children}</code>
                          );
                        },
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-indigo-500 pl-3 text-zinc-400 italic my-2">{children}</blockquote>
                        ),
                        hr: () => <hr className="border-zinc-700 my-3" />,
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-2">
                            <table className="w-full text-xs border-collapse">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => <th className="border border-zinc-700 bg-zinc-900 px-2 py-1 text-left font-semibold text-zinc-300">{children}</th>,
                        td: ({ children }) => <td className="border border-zinc-700 px-2 py-1 text-zinc-400">{children}</td>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800 px-4 py-4">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              style={{ maxHeight: 120, overflow: 'auto' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isStreaming || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="mt-1.5 text-xs text-zinc-600">Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </>
  );
}

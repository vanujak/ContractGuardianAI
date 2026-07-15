import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  MessageSquare,
  ShieldQuestion
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";

const QUICK_QUESTIONS = [
  "Can I terminate this contract?",
  "Who owns the IP rights?",
  "Are there overtime payments?",
  "What happens if payment is late?"
];

const formatMessage = (message, isAI) =>
  message.replace(
    /\*\*(.*?)\*\*/g,
    isAI
      ? '<strong class="font-semibold text-slate-950 dark:text-white">$1</strong>'
      : '<strong class="font-semibold text-white">$1</strong>',
  );

export default function ChatAssistant({
  contractId,
  persona,
  isDemoMode,
  demoChatMock
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Sync scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Load chat history if live mode
  useEffect(() => {
    const loadHistory = async () => {
      if (isDemoMode || !contractId) {
        setMessages([
          {
            role: "assistant",
            message: `Hello! I am your AI Contract Assistant. I am auditing this document under the lens of a **${persona}**. Ask me anything about this contract!`
          }
        ]);
        return;
      }

      try {
        const history = await api.getChatHistory(contractId);
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            {
              role: "assistant",
              message: `Hello! I am your AI Contract Assistant. I am auditing this document under the lens of a **${persona}**. Ask me anything about this contract!`
            }
          ]);
        }
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    };

    loadHistory();
  }, [contractId, persona, isDemoMode]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    if (!textToSend) setInput("");

    // Append user message
    const newMsg = { role: "user", message: query };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      if (isDemoMode) {
        // Mock reply
        setTimeout(() => {
          const reply = demoChatMock(query);
          setMessages(prev => [...prev, { role: "assistant", message: reply }]);
          setLoading(false);
        }, 800);
        return;
      }

      // Format history payload
      const historyPayload = messages.slice(1).map(m => ({
        role: m.role,
        message: m.message
      }));

      // Live request
      const res = await api.chatWithAssistant(contractId, query, persona, historyPayload);
      setMessages(prev => [...prev, { role: "assistant", message: res.answer }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        { role: "assistant", message: `Sorry, I failed to process that request: ${e.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              Contract Q&A
            </h3>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              Asking as{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {persona}
              </span>
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:flex">
          <ShieldQuestion className="h-3 w-3 text-indigo-500" />
          RAG chat
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          {messages.map((msg, index) => {
            const isAI = msg.role === "assistant";
            return (
              <div
                key={index}
                className={`flex gap-3 ${
                  isAI ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`flex max-w-[88%] gap-2 ${
                    isAI ? "" : "flex-row-reverse"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      isAI
                        ? "border-slate-200 bg-slate-100 text-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                        : "border-indigo-500 bg-indigo-600 text-white"
                    }`}
                  >
                    {isAI ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-1">
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isAI
                          ? "rounded-tl-md border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                          : "rounded-tr-md border border-indigo-200 bg-indigo-600 text-white dark:border-indigo-800 dark:bg-indigo-600"
                      }`}
                    >
                      <p
                        className="whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(msg.message, isAI)
                        }}
                      />
                    </div>
                    <div
                      className={`text-[10px] font-medium text-slate-400 ${
                        isAI ? "pl-1" : "pr-1 text-right"
                      }`}
                    >
                      {isAI ? "Assistant" : "You"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%] gap-2">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-indigo-500 dark:border-slate-700 dark:bg-slate-800">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  Reading the contract...
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Suggested Questions Pills */}
      {messages.length === 1 && (
        <div className="space-y-2 border-t border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            <Sparkles className="h-3 w-3 text-indigo-400" /> Suggested Questions
          </span>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-xs font-medium text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input panel */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this contract..."
          disabled={loading}
          className="h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-10 w-10 shrink-0 rounded-lg bg-indigo-600 p-0 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

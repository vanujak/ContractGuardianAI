import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from "lucide-react";
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
    <div className="flex flex-col h-[calc(100vh-230px)] max-h-[600px] border border-border rounded-xl overflow-hidden bg-card/25">
      
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isAI = msg.role === "assistant";
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${
                  isAI ? "self-start" : "self-end flex-row-reverse ml-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                    isAI
                      ? "bg-slate-900 border-slate-800 text-indigo-400"
                      : "bg-indigo-600 border-indigo-500 text-white"
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-lg text-sm leading-relaxed ${
                    isAI
                      ? "bg-slate-900/60 border border-slate-900/80 text-slate-200 rounded-tl-none"
                      : "bg-indigo-600/10 border border-indigo-500/20 text-slate-100 rounded-tr-none"
                  }`}
                >
                  <p 
                    className="whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: msg.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                  />
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="flex gap-3 max-w-[80%] self-start">
              <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900/40 border border-slate-900/80 text-slate-400 p-3 rounded-lg rounded-tl-none flex items-center gap-2 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Suggested Questions Pills */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-border bg-muted/40 space-y-1.5">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-indigo-400" /> Suggested Questions:
          </span>
          <div className="flex flex-wrap gap-1.5 pb-1">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-[10px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700/80 px-2 py-1 rounded transition-all disabled:opacity-50"
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
        className="p-3 bg-card border-t border-border flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this contract..."
          disabled={loading}
          className="flex-1 bg-slate-900/50 border-slate-800 focus-visible:ring-indigo-500 text-slate-200 h-9 rounded text-xs"
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 w-9 p-0 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

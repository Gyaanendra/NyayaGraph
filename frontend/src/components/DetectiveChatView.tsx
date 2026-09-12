"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  sendChatMessage,
  fetchAllCases,
  type ChatMessage,
  type ChatCitation,
  type ChatApiResponse,
  type ApiCaseSummary,
} from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { MarkdownView } from "@/components/MarkdownView";
import {
  Send,
  ShieldCheck,
  Building2,
  FileText,
  RotateCcw,
  Bot,
  User,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  Layers,
  Scale,
  CreditCard,
  Search,
  Filter,
  ArrowRight,
  Terminal,
} from "lucide-react";

interface DetectiveChatViewProps {
  initialCaseId?: string | null;
  initialFirNumber?: string | null;
  onJumpToCase?: (caseId: string) => void;
  onJumpToGraph?: (nodeId?: string) => void;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  engine?: string;
  latency?: number;
  citations?: ChatCitation[];
  focusedCaseId?: string;
}

const FORENSIC_PRESETS = [
  {
    icon: Building2,
    title: "Consortium Bank Fraud",
    desc: "Credit line diversion & defaulted bank consortiums in Bangalore BS&FB",
    query: "Analyze bank consortium credit line fraud cases in Bangalore (BS&FB).",
  },
  {
    icon: User,
    title: "Prime Accused Dossier",
    desc: "Cross-case profiling of key conspirators, brokers & named accused",
    query: "Profile prime accused Anowar Hussain and list connected offences and criminal links.",
  },
  {
    icon: Scale,
    title: "PC Act & Corruption",
    desc: "FIRs invoking Sections 7 & 13(2) of Prevention of Corruption Act",
    query: "Which FIRs invoke Section 7 & 13(2) of Prevention of Corruption Act?",
  },
  {
    icon: Layers,
    title: "Cross-Case Crime Syndicates",
    desc: "Multi-jurisdictional shell networks & shared entity bridges",
    query: "Identify entities bridging multiple CBI cases across different branches.",
  },
  {
    icon: ShieldCheck,
    title: "BSA 2023 Evidence Audit",
    desc: "Section 63(4) cryptographic hash trail & evidence authenticity",
    query: "Audit the BSA 2023 Section 63(4) cryptographic evidence hash trail and verification ledger.",
  },
];

export default function DetectiveChatView({
  initialCaseId,
  initialFirNumber,
  onJumpToCase,
  onJumpToGraph,
}: DetectiveChatViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [casesList, setCasesList] = useState<ApiCaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("ALL");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch cases for selector
  useEffect(() => {
    fetchAllCases().then((data) => {
      if (data && data.length > 0) {
        setCasesList(data);
      }
    });
  }, []);

  // Handle external case pre-selection
  useEffect(() => {
    if (initialCaseId) {
      setSelectedCaseId(initialCaseId);
      if (initialFirNumber) {
        setInput(
          `Provide a forensic summary of FIR ${initialFirNumber}: list named accused, defrauded institutions, and invoked penal sections.`
        );
      }
    }
  }, [initialCaseId, initialFirNumber]);

  // Initial welcome message with structured markdown
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          role: "assistant",
          content:
            "### CBI Central Intelligence & Forensic Copilot\n\n" +
            "Connected to the active **CBI Case Knowledge Base** (SQLite Registry, ChromaDB Vector Embeddings, and BSA 2023 Evidence Ledger) powered by **Bitdeer AI (GLM-5.3-Flash)**.\n\n" +
            "**Investigative Scope & Capabilities:**\n" +
            "• **FIR Dossiers**: Interrogate specifics of 500 ingested CBI case files & forensic dossiers (e.g. `RC0232024A0012`, `RC2212024E0018`)\n" +
            "• **Accused Entities**: Profile named accused, public servants, corporate promoters, and prime brokers\n" +
            "• **Financial & Banking Conduits**: Trace bank consortium defaults (Canara Bank, SBI, Bank of India) and shell accounts\n" +
            "• **Statutory Offence Codes**: Audit invoked sections under `IPC 420`, `IPC 120-B`, `PC Act Sec 7`, `Sec 13(2)`\n" +
            "• **Cryptographic Verification**: Verify electronic records under **BSA 2023 Section 63(4)**\n\n" +
            "Select an investigation preset from the left panel, choose an active case context, or enter your inquiry below.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          engine: "Bitdeer AI • GLM-5.3-Flash",
        },
      ]);
    }
  }, [messages.length]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const caseParam = selectedCaseId !== "ALL" ? selectedCaseId : undefined;
      const res: ChatApiResponse = await sendChatMessage(q, caseParam, historyPayload);

      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        engine: res.engine || "Bitdeer AI • GLM-5.3-Flash",
        latency: res.latency_seconds,
        citations: res.citations,
        focusedCaseId: res.focused_case_id,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Inference Notice**: ${(err as Error)?.message || "Failed to reach AI Detective endpoint."}\n\nPlease check that the backend server is running on port 8000.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        engine: "Fallback Error Handler",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (idx: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedCaseId("ALL");
  };

  const activeCaseObj = casesList.find((c) => c.case_id === selectedCaseId);

  return (
    <div
      className={`flex h-full w-full overflow-hidden font-sans select-none transition-colors duration-150 ${
        isDark ? "bg-[#0f1015] text-[#f5f4ef]" : "bg-[#f5f3ec] text-[#202124]"
      }`}
    >
      {/* ── 1. LEFT WORKBENCH SIDEBAR: INVESTIGATION PRESETS & CONTEXT ── */}
      <aside
        className={`w-80 xl:w-88 shrink-0 border-r flex flex-col justify-between overflow-hidden transition-colors ${
          isDark ? "border-[#262833] bg-[#14151c]" : "border-[#e8e4da] bg-[#f9f8f4]"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Sidebar Header */}
          <div
            className={`flex h-13 shrink-0 items-center justify-between border-b px-4 ${
              isDark ? "border-[#262833]" : "border-[#e8e4da]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Terminal className={`size-4 ${isDark ? "text-[#f5b838]" : "text-[#b87c12]"}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                Investigation Console
              </span>
            </div>
            <button
              onClick={clearChat}
              title="Reset Session"
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                isDark
                  ? "border-[#2a2c38] bg-[#1a1b24] text-[#9596a1] hover:text-white"
                  : "border-[#e8e4da] bg-white text-[#7a7b83] hover:text-[#1c1d22]"
              }`}
            >
              <RotateCcw className="size-3" />
              <span>New</span>
            </button>
          </div>

          {/* Active Case Context Filter */}
          <div
            className={`p-4 border-b space-y-2 ${
              isDark ? "border-[#262833] bg-[#1a1b24]/40" : "border-[#e8e4da] bg-[#faf8f3]"
            }`}
          >
            <div
              className={`flex items-center justify-between text-[11px] font-mono ${
                isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
              }`}
            >
              <span className="uppercase font-bold tracking-wider">Case Scope:</span>
              {selectedCaseId !== "ALL" && (
                <button
                  onClick={() => setSelectedCaseId("ALL")}
                  className="hover:underline cursor-pointer"
                >
                  Reset to All
                </button>
              )}
            </div>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className={`w-full truncate rounded-xl border px-2.5 py-1.5 text-xs font-mono outline-none cursor-pointer transition-colors ${
                isDark
                  ? "border-[#2a2c38] bg-[#14151c] text-[#f5f4ef] focus:border-[#f5b838]"
                  : "border-[#e4dfd3] bg-white text-[#202124] focus:border-[#d29b28]"
              }`}
            >
              <option value="ALL">🌐 All Cases (Global Syndicate Graph)</option>
              {casesList.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  FIR {c.fir_number} — {c.police_station}
                </option>
              ))}
            </select>
            {activeCaseObj && (
              <div
                className={`rounded-xl border p-2 text-[11px] font-mono space-y-1 ${
                  isDark
                    ? "border-[#262833] bg-[#14151c] text-[#9596a1]"
                    : "border-[#e8e4da] bg-white text-[#7a7b83]"
                }`}
              >
                <div className="flex justify-between">
                  <span>Entities:</span>
                  <span className={`font-semibold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                    {activeCaseObj.node_count} nodes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date Logged:</span>
                  <span>{activeCaseObj.date_time ? activeCaseObj.date_time.split(" ")[0] : "2026-09-12"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Investigation Presets Section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                isDark ? "text-[#8a8c98]" : "text-[#7a7b83]"
              }`}
            >
              Forensic Inquiry Presets
            </span>
            <div className="space-y-2">
              {FORENSIC_PRESETS.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(preset.query)}
                    className={`w-full text-left rounded-2xl border p-3 transition-all cursor-pointer ${
                      isDark
                        ? "border-[#262833] bg-[#1a1b24] hover:border-[#383b4b] hover:bg-[#222430]"
                        : "border-[#e8e4da] bg-white hover:border-[#ded8cb] hover:bg-[#faf8f2]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-3.5 text-[#f5b838]" />
                      <span
                        className={`text-xs font-bold ${
                          isDark ? "text-white" : "text-[#1c1d22]"
                        }`}
                      >
                        {preset.title}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-[11px] line-clamp-2 leading-relaxed ${
                        isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                      }`}
                    >
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div
          className={`border-t p-4 font-mono text-[10px] space-y-1 ${
            isDark
              ? "border-[#262833] bg-[#101117] text-[#7d7f8d]"
              : "border-[#e8e4da] bg-[#f4efe4] text-[#7a7b83]"
          }`}
        >
          <div className="flex justify-between">
            <span>AI ENGINE:</span>
            <span className={`font-semibold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>GLM-5.3-Flash</span>
          </div>
          <div className="flex justify-between">
            <span>REGISTRY:</span>
            <span>500 Ingested FIRs Active</span>
          </div>
        </div>
      </aside>

      {/* ── 2. MAIN CHAT TERMINAL FEED & INTERROGATION AREA ── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Sub-Header */}
        <div
          className={`flex h-13 shrink-0 items-center justify-between border-b px-6 transition-colors ${
            isDark
              ? "border-[#262833] bg-[#14151c] text-white"
              : "border-[#e8e4da] bg-[#f9f8f4] text-[#1c1d22]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-xl bg-[#202126] text-white">
              <Bot className="size-4 text-[#f5b838]" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider">
                AI Detective Terminal
              </span>
              <span
                className={`flex items-center gap-1 rounded-md border px-1.5 py-0.2 text-[10px] font-mono ${
                  isDark
                    ? "border-[#154632] bg-[#06281e] text-[#34d399]"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                <span className="size-1.5 rounded-full bg-emerald-500" />
                ONLINE
              </span>
              {selectedCaseId !== "ALL" && (
                <span
                  className={`rounded-md border px-2 py-0.2 text-[10px] font-mono ${
                    isDark
                      ? "border-[#2a2c38] bg-[#1a1b24] text-[#dcdde4]"
                      : "border-[#e8e4da] bg-white text-[#1c1d22]"
                  }`}
                >
                  CONTEXT: FIR {activeCaseObj?.fir_number || selectedCaseId}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500">
            <span>INFERENCE: BITDEER HOSTED</span>
            <span>•</span>
            <span>TOP_K: 8</span>
          </div>
        </div>

        {/* Message Feed (Structured Ergonomic Column) */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl xl:max-w-5xl mx-auto space-y-6">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id || idx}
                  className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl border mt-1 shadow-2xs ${
                        isDark
                          ? "bg-[#252838] text-white border-[#383b4b]"
                          : "bg-[#faf8f3] text-[#1c1d22] border-[#e8e4da]"
                      }`}
                    >
                      <Bot className="size-4 text-[#f5b838]" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-2 rounded-2xl p-4.5 text-sm leading-relaxed ${
                      isUser
                        ? isDark
                          ? "max-w-[80%] bg-[#262838] text-white border border-[#3b3e52] shadow-sm"
                          : "max-w-[80%] bg-[#202126] text-white shadow-sm"
                        : isDark
                        ? "max-w-[92%] border border-[#262833] bg-[#1a1b24] text-[#e1e2e8] shadow-sm"
                        : "max-w-[92%] border border-[#ede9df] bg-white text-[#202124] shadow-xs"
                    }`}
                  >
                    {/* Header (Assistant) */}
                    {!isUser && (
                      <div
                        className={`flex items-center justify-between border-b pb-2 text-xs font-mono ${
                          isDark ? "border-[#262833] text-[#8a8c98]" : "border-[#ede9df] text-[#7a7b83]"
                        }`}
                      >
                        <span className="font-medium">
                          {m.engine || "NyayaGraph Forensic Engine"}
                        </span>
                        <div className="flex items-center gap-3">
                          {m.latency && (
                            <span className="text-[11px] text-[#9596a1]">
                              {m.latency}s latency
                            </span>
                          )}
                          <button
                            onClick={() => copyMessage(idx, m.content)}
                            className="flex items-center gap-1 text-[11px] hover:underline cursor-pointer"
                            title="Copy response"
                          >
                            {copiedIndex === idx ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                            <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Formatted Markdown Content */}
                    <MarkdownView content={m.content} />

                    {/* Citations Pill Bar */}
                    {m.citations && m.citations.length > 0 && (
                      <div
                        className={`mt-3.5 flex flex-col gap-2 border-t pt-3 ${
                          isDark ? "border-[#262833]" : "border-[#ede9df]"
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                            isDark ? "text-[#8a8c98]" : "text-[#7a7b83]"
                          }`}
                        >
                          Evidence References ({m.citations.length} Retrieved Dockets):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {m.citations.map((cit, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => cit.case_id && onJumpToCase && onJumpToCase(cit.case_id)}
                              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                                isDark
                                  ? "border-[#2a2c38] bg-[#14151c] text-[#dcdde4] hover:bg-[#222430]"
                                  : "border-[#e8e4da] bg-[#faf8f3] text-[#1c1d22] hover:bg-[#eeeae0]"
                              }`}
                            >
                              <FileText className="size-3.5 text-[#f5b838]" />
                              <span>FIR {cit.fir_number || cit.case_id}</span>
                              {cit.similarity_score && (
                                <span className="text-[10px] text-emerald-500 font-sans font-medium">
                                  ({cit.similarity_score}%)
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamp Footer */}
                    <div
                      className={`text-[10px] font-mono self-end pt-1 ${
                        isDark ? "text-[#7d7f8d]" : "text-[#9e9ea5]"
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl border mt-1 shadow-2xs ${
                        isDark
                          ? "bg-[#252838] text-white border-[#383b4b]"
                          : "bg-[#202126] text-white border-[#202126]"
                      }`}
                    >
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex w-full gap-3 justify-start">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${
                    isDark
                      ? "bg-[#252838] text-white border-[#383b4b]"
                      : "bg-[#faf8f3] text-[#1c1d22] border-[#e8e4da]"
                  }`}
                >
                  <Bot className="size-4 text-[#f5b838]" />
                </div>
                <div
                  className={`flex items-center gap-3 rounded-2xl rounded-tl-sm border px-4 py-3 text-sm shadow-xs transition-colors ${
                    isDark
                      ? "border-[#262833] bg-[#1a1b24] text-[#dcdde4]"
                      : "border-[#ede9df] bg-white text-[#1c1d22]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="size-1.5 animate-bounce rounded-full bg-[#f5b838]"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="size-1.5 animate-bounce rounded-full bg-[#f5b838]"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="size-1.5 animate-bounce rounded-full bg-[#f5b838]"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span
                    className={`font-mono text-xs ${
                      isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                    }`}
                  >
                    Querying Knowledge Base & Synthesizing GLM-5.3-Flash…
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Input Area */}
        <div
          className={`border-t p-4 transition-colors ${
            isDark ? "border-[#262833] bg-[#14151c]" : "border-[#e8e4da] bg-[#f9f8f4]"
          }`}
        >
          <div className="max-w-4xl xl:max-w-5xl mx-auto flex flex-col gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className={`flex items-center gap-2 rounded-2xl border p-2 transition-colors ${
                isDark
                  ? "border-[#2a2c38] bg-[#1a1b24] focus-within:border-[#f5b838]"
                  : "border-[#e8e4da] bg-white focus-within:border-[#f5b838]"
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask AI Detective about CBI FIRs, accused syndicates, banks, evidence..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className={`flex-1 bg-transparent px-3 py-1 text-sm outline-none font-sans ${
                  isDark ? "text-white placeholder-[#7d7f8d]" : "text-[#1c1d22] placeholder-[#9e9ea5]"
                }`}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f5b838] text-zinc-950 hover:brightness-105 disabled:opacity-40 transition-all cursor-pointer font-bold shadow-xs"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

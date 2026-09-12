"use client";

import React, { useEffect, useState } from "react";
import OfficialDashboardView from "@/components/OfficialDashboardView";
import ObsidianGraphView from "@/components/ObsidianGraphView";
import CasesExplorerView from "@/components/CasesExplorerView";
import DetectiveChatView from "@/components/DetectiveChatView";
import { FlowchartView } from "@/components/FlowchartView";
import { fetchFlowchartChapters } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import type { FlowChapter } from "@/data/cyberlifeData";
import {
  LayoutDashboard,
  Network,
  FolderArchive,
  MessageSquareCode,
  GitFork,
  ShieldCheck,
  Cpu,
  Radio,
  Sun,
  Moon,
} from "lucide-react";

export type ActiveAppView = "dashboard" | "graph" | "cases" | "chat" | "flowchart";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<ActiveAppView>("dashboard");
  const [stats, setStats] = useState<{ cases: number; nodes: number; edges: number } | null>(null);
  const [chapters, setChapters] = useState<FlowChapter[] | null>(null);

  // Cross-view state parameters
  const [chatCaseId, setChatCaseId] = useState<string | null>(null);
  const [chatFirNumber, setChatFirNumber] = useState<string | null>(null);

  useEffect(() => {
    if (view !== "flowchart" || chapters) return;
    fetchFlowchartChapters().then((d) => {
      if (d?.chapters?.length) setChapters(d.chapters as FlowChapter[]);
    });
  }, [view, chapters]);

  const handleOpenChatWithCase = (caseId?: string, firLabel?: string) => {
    if (caseId) setChatCaseId(caseId);
    if (firLabel) setChatFirNumber(firLabel);
    setView("chat");
  };

  const handleOpenCaseInExplorer = (caseId?: string) => {
    setView("cases");
  };

  const handleJumpToGlobalGraph = (nodeId?: string) => {
    setView("graph");
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`flex h-screen w-screen flex-col overflow-hidden font-sans select-none antialiased transition-colors duration-150 ${
        isDark ? "bg-[#0f1015] text-[#f5f4ef]" : "bg-[#f5f3ec] text-[#1c1d22]"
      }`}
    >
      {/* ── MASTER TOP NAVIGATION BAR (Executive Institutional System) ── */}
      <header
        className={`flex h-13 shrink-0 items-center justify-between border-b px-5 z-50 transition-colors duration-150 ${
          isDark
            ? "border-[#262833] bg-[#14151c] text-[#f5f4ef]"
            : "border-[#e8e4da] bg-[#f9f8f4] text-[#1c1d22]"
        }`}
      >
        {/* Left: Brand Identity & Live Metrics */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("dashboard")}
            className="flex items-center gap-2.5 cursor-pointer text-left"
          >
            <div className="flex size-8 items-center justify-center rounded-xl bg-[#202126] text-white shadow-xs">
              <ShieldCheck className="size-4.5 text-[#f5b838]" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black tracking-wider uppercase ${
                  isDark ? "text-white" : "text-[#1c1d22]"
                }`}
              >
                NyayaGraph
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10.5px] font-semibold ${
                  isDark
                    ? "border-[#2a2c38] bg-[#1a1b24] text-[#a5a7b5]"
                    : "border-[#e4dfd3] bg-white text-[#6b6c74]"
                }`}
              >
                CBI Core
              </span>
            </div>
          </button>

          <div
            className={`mx-2 h-4 w-px ${isDark ? "bg-[#262833]" : "bg-[#e8e4da]"}`}
          />

          {/* Quick Node & Edge Live Counter with 500 Ingested Files */}
          <div
            className={`hidden md:flex items-center gap-2 font-mono text-[11px] ${
              isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className={`font-semibold ${isDark ? "text-[#dcdde4]" : "text-[#33353e]"}`}>
                500 Ingested Files
              </span>
            </span>
            <span>•</span>
            <span className="font-semibold">
              {stats?.nodes ? `${stats.nodes.toLocaleString()} nodes` : "2,744 nodes"}
            </span>
            <span>•</span>
            <span className="font-semibold">
              {stats?.edges ? `${stats.edges.toLocaleString()} edges` : "5,252 edges"}
            </span>
          </div>
        </div>

        {/* Center: Master View Switcher Tabs */}
        <nav
          className={`flex items-center rounded-xl border p-1 transition-colors ${
            isDark
              ? "border-[#2a2c38] bg-[#1a1b24]"
              : "border-[#e5e0d5] bg-[#eeeae0]"
          }`}
        >
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "graph", label: "Syndicate Graph", icon: Network },
            { id: "cases", label: "Cases & FIRs", icon: FolderArchive },
            { id: "chat", label: "Detective AI", icon: MessageSquareCode, badge: "GLM-5.3" },
            { id: "flowchart", label: "Procedural Flow", icon: GitFork },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as ActiveAppView)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? isDark
                      ? "bg-[#262838] text-white shadow-xs border border-[#373a4d]"
                      : "bg-white text-[#1c1d22] shadow-xs border border-[#e0dacf]"
                    : isDark
                    ? "text-[#8c90a2] hover:text-white hover:bg-[#262838]/40"
                    : "text-[#65666e] hover:text-[#1c1d22] hover:bg-white/60"
                }`}
              >
                <Icon
                  className={`size-3.5 ${
                    active ? (isDark ? "text-[#f5b838]" : "text-[#b87c12]") : ""
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                      isDark
                        ? "bg-[#1f212e] text-[#b8bac6] border border-[#34374a]"
                        : "bg-[#f4efe4] text-[#555660] border border-[#ded8cb]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Engine Indicator, Knowledge Base & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <div
            className={`hidden lg:flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-mono ${
              isDark
                ? "border-[#262833] bg-[#1a1b24] text-[#9596a1]"
                : "border-[#e8e4da] bg-white text-[#7a7b83]"
            }`}
          >
            <Cpu className="size-3 text-[#f5b838]" />
            <span>GLM-5.3-Flash</span>
          </div>

          <div
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold ${
              isDark
                ? "border-[#262833] bg-[#1a1b24] text-[#dcdde4]"
                : "border-[#e8e4da] bg-white text-[#33353e]"
            }`}
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px]">KB ONLINE</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode (Warm Ivory)" : "Switch to Dark Mode (Obsidian Slate)"}
            className={`flex size-8 items-center justify-center rounded-xl border shadow-xs transition-all cursor-pointer hover:scale-105 ${
              isDark
                ? "border-[#2a2c38] bg-[#1a1b24] text-[#f5b838] hover:bg-[#252734]"
                : "border-[#e8e4da] bg-white text-[#1c1d22] hover:bg-[#faf8f2]"
            }`}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {/* ── ACTIVE VIEW CONTAINER ── */}
      <main className="flex-1 overflow-hidden relative">
        {view === "dashboard" && (
          <div className="h-full w-full">
            <OfficialDashboardView
              onNavigate={(v) => setView(v)}
              onOpenCase={(cid, fir) => {
                setView("cases");
              }}
              onOpenChat={(cid, fir) => handleOpenChatWithCase(cid, fir)}
            />
          </div>
        )}

        {view === "graph" && (
          <div className="h-full w-full">
            <ObsidianGraphView
              onStats={setStats}
              onOpenCaseExplorer={handleOpenCaseInExplorer}
              onOpenChat={handleOpenChatWithCase}
            />
          </div>
        )}

        {view === "cases" && (
          <div className="h-full w-full">
            <CasesExplorerView
              onOpenChatWithCase={(cid, fir) => handleOpenChatWithCase(cid, fir)}
              onJumpToGlobalGraph={handleJumpToGlobalGraph}
            />
          </div>
        )}

        {view === "chat" && (
          <div className="h-full w-full">
            <DetectiveChatView
              initialCaseId={chatCaseId}
              initialFirNumber={chatFirNumber}
              onJumpToCase={handleOpenCaseInExplorer}
              onJumpToGraph={handleJumpToGlobalGraph}
            />
          </div>
        )}

        {view === "flowchart" && (
          <div className="h-full w-full">
            {chapters ? (
              <FlowchartView
                chapters={chapters}
                onSelectNode={() => {}}
                onOpenLegend={() => {}}
                onJumpToChat={handleOpenChatWithCase}
                onJumpToCase={handleOpenCaseInExplorer}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500 font-mono text-xs">
                Loading procedural investigation flowchart...
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

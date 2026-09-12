"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  LayoutDashboard,
  Network,
  FolderArchive,
  MessageSquareCode,
  GitFork,
  ShieldCheck,
  Calendar,
  Share2,
  MoreHorizontal,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Bell,
  Sparkles,
  Layers,
  Building2,
  Briefcase,
  Users,
  CheckCircle2,
  ExternalLink,
  Bot,
  Filter,
  Check,
  Clock,
  Fingerprint,
} from "lucide-react";
import { fetchAllCases, ApiCaseSummary } from "@/lib/api";
import { CASE_LIST } from "@/lib/casesData";
import { useTheme } from "@/context/ThemeContext";

interface OfficialDashboardViewProps {
  onNavigate: (view: "dashboard" | "graph" | "cases" | "chat" | "flowchart") => void;
  onOpenCase: (caseId: string, firNumber?: string) => void;
  onOpenChat: (caseId?: string, firNumber?: string) => void;
}

export default function OfficialDashboardView({
  onNavigate,
  onOpenCase,
  onOpenChat,
}: OfficialDashboardViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [cases, setCases] = useState<ApiCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"warrants" | "summons" | "alerts">("warrants");
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  // Load cases from backend or fallback to CASE_LIST
  useEffect(() => {
    let mounted = true;
    fetchAllCases()
      .then((data) => {
        if (!mounted) return;
        if (data && data.length > 0) {
          setCases(data);
        } else {
          const fallback = CASE_LIST.map((c) => ({
            case_id: c.case_id,
            fir_number: c.fir_number,
            police_station: c.police_station,
            date_time: c.date_time,
            node_count: c.accused_count * 4 + 12,
            edge_count: c.accused_count * 7 + 18,
            broker_name: c.central_broker,
            sha256_hash: "0x8f" + Math.random().toString(16).substring(2, 10) + "...63b4",
          }));
          setCases(fallback);
        }
      })
      .catch(() => {
        if (!mounted) return;
        const fallback = CASE_LIST.map((c) => ({
          case_id: c.case_id,
          fir_number: c.fir_number,
          police_station: c.police_station,
          date_time: c.date_time,
          node_count: c.accused_count * 4 + 12,
          edge_count: c.accused_count * 7 + 18,
          broker_name: c.central_broker,
          sha256_hash: "0x8f" + Math.random().toString(16).substring(2, 10) + "...63b4",
        }));
        setCases(fallback);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Filtered cases for the bottom table
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.fir_number.toLowerCase().includes(q) ||
        c.case_id.toLowerCase().includes(q) ||
        (c.broker_name && c.broker_name.toLowerCase().includes(q)) ||
        c.police_station.toLowerCase().includes(q);

      const matchBranch =
        !selectedBranch || c.police_station.toLowerCase().includes(selectedBranch.toLowerCase());

      return matchQuery && matchBranch;
    });
  }, [cases, searchQuery, selectedBranch]);

  // High Priority Statutory Actions, Summons & Warrants
  const statutoryActions = [
    {
      id: "w-1",
      category: "warrants" as const,
      case_id: "CASE_CBI_RC0782026E0004",
      fir: "RC0782026E0004",
      title: "Section 94 BNSS Search & Seizure Warrant",
      desc: "NCS Sugars • Godown physical stock audit & consortium escrow freeze",
      time: "10:30 - 12:00 hrs",
      wing: "CBI BS&FB Bangalore",
      badgeColor: isDark ? "bg-[#332512] text-[#f5b838]" : "bg-[#fbeed4] text-[#b87c12]",
      isHighlighted: true,
      officer: "Dr. S. K. Narayanan",
    },
    {
      id: "w-2",
      category: "summons" as const,
      case_id: "CASE_CBI_RC0782026E0001",
      fir: "RC0782026E0001",
      title: "Section 173 BNSS Custodial Remand Summons",
      desc: "R L Jewels Pvt Ltd • Multi-hop bullion diversion paper trail interrogation",
      time: "14:00 - 16:30 hrs",
      wing: "CBI BS&FB Bangalore",
      badgeColor: isDark ? "bg-[#14233b] text-[#60a5fa]" : "bg-[#e8f1fb] text-[#1b62b3]",
      isHighlighted: false,
      officer: "Insp. Vikramaditya",
    },
    {
      id: "w-3",
      category: "alerts" as const,
      case_id: "CASE_2026_NOIDA_112",
      fir: "112/2026",
      title: "Look Out Circular (LOC) / Border Alert",
      desc: "Digital Arrest Extortion Gateway • VoIP SIP trunk intercept & escrow freeze",
      time: "ACTIVE 24/7",
      wing: "CBI Cyber & ACB",
      badgeColor: isDark ? "bg-[#271438] text-[#c084fc]" : "bg-[#f4ebfb] text-[#7d2db8]",
      isHighlighted: false,
      officer: "DySP Rajeshwari Sen",
    },
    {
      id: "w-4",
      category: "warrants" as const,
      case_id: "CASE_CBI_RC0782026E0003",
      fir: "RC0782026E0003",
      title: "Section 106 BNSS Bank Debit Freeze",
      desc: "Ashapura Garments • Canara Bank 14 mule accounts attached",
      time: "16:45 hrs",
      wing: "CBI BS&FB Bangalore",
      badgeColor: isDark ? "bg-[#06281e] text-[#34d399]" : "bg-emerald-50 text-emerald-700",
      isHighlighted: false,
      officer: "SP Anirudh Sharma",
    },
  ];

  return (
    <div
      className={`h-full w-full overflow-y-auto select-none transition-colors duration-150 ${
        isDark ? "bg-[#0f1015] text-[#f5f4ef]" : "bg-[#f5f3ec] text-[#202124]"
      }`}
    >
      <div className="flex min-h-full w-full">
        {/* ═══════════════════════════════════════════════════════════
            LEFT SIDEBAR (Faithful to Reference Image Layout)
           ═══════════════════════════════════════════════════════════ */}
        <aside
          className={`w-64 shrink-0 flex flex-col justify-between border-r p-4 lg:p-5 transition-colors duration-150 ${
            isDark
              ? "border-[#262833] bg-[#14151c]"
              : "border-[#e8e4da] bg-[#f9f8f4]"
          }`}
        >
          <div className="space-y-6">
            {/* Top Brand & Logo */}
            <div className="flex items-center gap-3 px-1 pt-1">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#202126] text-white shadow-xs">
                <ShieldCheck className="size-5 text-[#f5b838]" />
              </div>
              <div className="leading-tight">
                <span
                  className={`block text-sm font-extrabold tracking-tight ${
                    isDark ? "text-white" : "text-[#1c1d22]"
                  }`}
                >
                  NyayaGraph
                </span>
                <span
                  className={`text-[10.5px] font-medium ${
                    isDark ? "text-[#9596a1]" : "text-[#7d7e85]"
                  }`}
                >
                  CBI Intelligence Core
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search
                className={`absolute left-3 top-2.5 size-3.5 ${
                  isDark ? "text-[#7d7f8d]" : "text-[#9e9ea5]"
                }`}
              />
              <input
                type="text"
                placeholder="Search here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs shadow-xs focus:outline-none transition-colors ${
                  isDark
                    ? "border-[#2a2c38] bg-[#1a1b24] text-[#f5f4ef] placeholder-[#7d7f8d] focus:border-[#f5b838]"
                    : "border-[#e4dfd3] bg-white text-[#202124] placeholder-[#9e9ea5] focus:border-[#d29b28]"
                }`}
              />
            </div>

            {/* 6 Square Grid Action Tiles (2 cols x 3 rows) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Tile 1: Dashboard (Active State) */}
              <button
                onClick={() => onNavigate("dashboard")}
                className={`group flex flex-col items-start justify-between rounded-2xl p-3.5 text-left shadow-md transition-all cursor-pointer ${
                  isDark
                    ? "bg-[#252838] border border-[#3b3e52] text-white hover:bg-[#2f3347]"
                    : "bg-[#202126] text-white hover:bg-[#2b2c34]"
                }`}
              >
                <div className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white">
                  <LayoutDashboard className="size-4 text-[#f5b838]" />
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold text-white">Dashboard</span>
                  <span className="text-[9px] text-[#a0a1a8]">Executive Overview</span>
                </div>
              </button>

              {/* Tile 2: Master Syndicate Graph */}
              <button
                onClick={() => onNavigate("graph")}
                className={`group flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left shadow-xs transition-all cursor-pointer ${
                  isDark
                    ? "border-[#262833] bg-[#1a1b24] text-[#f5f4ef] hover:border-[#383b4b] hover:bg-[#222430]"
                    : "border-[#e8e4da] bg-white text-[#202124] hover:border-[#ded8cb] hover:bg-[#faf8f2]"
                }`}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-lg ${
                    isDark ? "bg-[#252838] text-white" : "bg-[#f4efe4] text-[#4f5159]"
                  }`}
                >
                  <Network className="size-4" />
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold">Syndicate Graph</span>
                  <span className={`text-[9px] ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                    2,744 Nodes
                  </span>
                </div>
              </button>

              {/* Tile 3: Cases & FIRs */}
              <button
                onClick={() => onNavigate("cases")}
                className={`group flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left shadow-xs transition-all cursor-pointer ${
                  isDark
                    ? "border-[#262833] bg-[#1a1b24] text-[#f5f4ef] hover:border-[#383b4b] hover:bg-[#222430]"
                    : "border-[#e8e4da] bg-white text-[#202124] hover:border-[#ded8cb] hover:bg-[#faf8f2]"
                }`}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-lg ${
                    isDark ? "bg-[#252838] text-white" : "bg-[#f4efe4] text-[#4f5159]"
                  }`}
                >
                  <FolderArchive className="size-4" />
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold">Cases & FIRs</span>
                  <span className={`text-[9px] ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                    500 Ingested Files
                  </span>
                </div>
              </button>

              {/* Tile 4: Detective AI Copilot */}
              <button
                onClick={() => onOpenChat()}
                className={`group flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left shadow-xs transition-all cursor-pointer ${
                  isDark
                    ? "border-[#262833] bg-[#1a1b24] text-[#f5f4ef] hover:border-[#383b4b] hover:bg-[#222430]"
                    : "border-[#e8e4da] bg-white text-[#202124] hover:border-[#ded8cb] hover:bg-[#faf8f2]"
                }`}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-lg ${
                    isDark ? "bg-[#252838] text-white" : "bg-[#f4efe4] text-[#4f5159]"
                  }`}
                >
                  <MessageSquareCode className="size-4" />
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold">Detective AI</span>
                  <span className={`text-[9px] ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                    GLM-5.3 Copilot
                  </span>
                </div>
              </button>

              {/* Tile 5: BSA Evidence Ledger */}
              <button
                onClick={() => {
                  setSelectedBranch(null);
                  setSearchQuery("");
                }}
                className={`group flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left shadow-xs transition-all cursor-pointer ${
                  isDark
                    ? "border-[#262833] bg-[#1a1b24] text-[#f5f4ef] hover:border-[#383b4b] hover:bg-[#222430]"
                    : "border-[#e8e4da] bg-white text-[#202124] hover:border-[#ded8cb] hover:bg-[#faf8f2]"
                }`}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-lg ${
                    isDark ? "bg-[#252838] text-white" : "bg-[#f4efe4] text-[#4f5159]"
                  }`}
                >
                  <ShieldCheck className="size-4" />
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold">BSA 63(4) Ledger</span>
                  <span className={`text-[9px] ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                    Immutable Proofs
                  </span>
                </div>
              </button>

              {/* Tile 6: Procedural Flowchart */}
              <button
                onClick={() => onNavigate("flowchart")}
                className={`group flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left shadow-xs transition-all cursor-pointer ${
                  isDark
                    ? "border-[#262833] bg-[#1a1b24] text-[#f5f4ef] hover:border-[#383b4b] hover:bg-[#222430]"
                    : "border-[#e8e4da] bg-white text-[#202124] hover:border-[#ded8cb] hover:bg-[#faf8f2]"
                }`}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-lg ${
                    isDark ? "bg-[#252838] text-white" : "bg-[#f4efe4] text-[#4f5159]"
                  }`}
                >
                  <GitFork className="size-4" />
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold">Flowchart</span>
                  <span className={`text-[9px] ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                    BNSS Statutory
                  </span>
                </div>
              </button>
            </div>

            {/* Favorite Sections */}
            <div className="space-y-2">
              <div
                className={`flex items-center justify-between text-[11px] font-bold tracking-wider uppercase ${
                  isDark ? "text-[#8a8c98]" : "text-[#7a7b83]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ChevronDown className="size-3" />
                  <span>Favorite Investigations</span>
                </span>
              </div>
              <ul className="space-y-1 text-xs">
                {[
                  { name: "Consortium Bank Fraud", query: "Consortium" },
                  { name: "Hawala Mule Matrix", query: "Hawala" },
                  { name: "NCS Sugar Mill Diversion", query: "Sugar" },
                ].map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => {
                        setSelectedBranch(null);
                        setSearchQuery(item.query);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 font-medium cursor-pointer transition-colors ${
                        isDark
                          ? "text-[#b8bad0] hover:bg-[#222430] hover:text-white"
                          : "text-[#4a4b52] hover:bg-[#eeeae0] hover:text-[#1c1d22]"
                      }`}
                    >
                      <span className="size-2 rounded-xs bg-[#f5b838]" />
                      <span>{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Investigation Branches */}
            <div className="space-y-2">
              <div
                className={`flex items-center justify-between text-[11px] font-bold tracking-wider uppercase ${
                  isDark ? "text-[#8a8c98]" : "text-[#7a7b83]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ChevronDown className="size-3" />
                  <span>Investigation Branches</span>
                </span>
              </div>
              <ul className="space-y-1 text-xs">
                {[
                  { name: "CBI BS&FB Bangalore (194 FIRs)", filter: "Bangalore" },
                  { name: "CBI ACB New Delhi (142 FIRs)", filter: "Delhi" },
                  { name: "CBI SCB Kolkata (98 FIRs)", filter: "Kolkata" },
                  { name: "Cyber Crime Unit (66 FIRs)", filter: "Cyber" },
                ].map((b) => (
                  <li key={b.name}>
                    <button
                      onClick={() =>
                        setSelectedBranch(selectedBranch === b.filter ? null : b.filter)
                      }
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 font-medium transition-colors cursor-pointer ${
                        selectedBranch === b.filter
                          ? isDark
                            ? "bg-[#252838] text-white font-bold"
                            : "bg-[#202126] text-white font-bold"
                          : isDark
                          ? "text-[#b8bad0] hover:bg-[#222430] hover:text-white"
                          : "text-[#4a4b52] hover:bg-[#eeeae0] hover:text-[#1c1d22]"
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      {selectedBranch === b.filter && <Check className="size-3" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Officer Profile Card */}
          <div
            className={`mt-6 flex items-center justify-between rounded-2xl border p-2.5 shadow-xs transition-colors ${
              isDark
                ? "border-[#262833] bg-[#1a1b24]"
                : "border-[#e8e4da] bg-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex size-9 items-center justify-center rounded-xl bg-[#202126] font-bold text-white">
                <span className="text-xs">SN</span>
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="leading-tight">
                <span
                  className={`block text-xs font-bold ${
                    isDark ? "text-white" : "text-[#1c1d22]"
                  }`}
                >
                  Dr. S. K. Narayanan
                </span>
                <span
                  className={`text-[10px] ${
                    isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                  }`}
                >
                  Chief Forensic Director
                </span>
              </div>
            </div>
            <button
              className={`flex size-8 items-center justify-center rounded-xl transition-colors ${
                isDark
                  ? "text-[#9596a1] hover:bg-[#222430] hover:text-white"
                  : "text-[#7a7b83] hover:bg-[#f4efe4] hover:text-[#1c1d22]"
              }`}
            >
              <Bell className="size-4" />
            </button>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════
            MAIN EXECUTIVE DASHBOARD CANVAS
           ═══════════════════════════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7 space-y-6">
          {/* Top Breadcrumb & Actions Bar */}
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-2 text-xs font-medium ${
                isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
              }`}
            >
              <span className="font-bold text-[#f5b838]">CBI SPE</span>
              <span>/</span>
              <span className={`font-semibold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                National Crime Intelligence Command
              </span>
              <span>/</span>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider ${
                  isDark
                    ? "border-[#332512] bg-[#1a150c] text-[#f5b838]"
                    : "border-[#f0dfba] bg-[#fffaf0] text-[#916719]"
                }`}
              >
                CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE // 500 INGESTED FILES
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-xs transition-colors ${
                  isDark
                    ? "border-[#262833] bg-[#1a1b24] text-[#dcdde4] hover:bg-[#222430]"
                    : "border-[#e8e4da] bg-white text-[#4a4b52] hover:bg-[#faf8f2]"
                }`}
              >
                <Calendar className="size-3.5" />
                <span>Statutory Session: 13 Sep 2026</span>
              </button>
              <button
                onClick={() => {
                  alert("Exporting official CBI forensic intelligence dossier across 500 ingested files...");
                }}
                className={`flex size-8 items-center justify-center rounded-xl border shadow-xs transition-colors cursor-pointer ${
                  isDark
                    ? "border-[#262833] bg-[#1a1b24] text-[#dcdde4] hover:bg-[#222430]"
                    : "border-[#e8e4da] bg-white text-[#4a4b52] hover:bg-[#faf8f2]"
                }`}
                title="Export Intelligence Summary"
              >
                <Share2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* ── TOP HERO CARD (Greeting + Core KPIs + Arc Gauge) ── */}
          <section
            className={`relative overflow-hidden rounded-3xl border p-6 lg:p-8 shadow-xs transition-colors ${
              isDark
                ? "border-[#262833] bg-gradient-to-br from-[#1a1b24] via-[#1a1b24] to-[#14151e]"
                : "border-[#ede9df] bg-gradient-to-br from-[#ffffff] via-[#fffdf9] to-[#fbf8f0]"
            }`}
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Greeting & 4 Stats */}
              <div className="lg:col-span-8 space-y-6">
                <div>
                  <h1
                    className={`text-2xl lg:text-3xl font-bold tracking-tight ${
                      isDark ? "text-white" : "text-[#1c1d22]"
                    }`}
                  >
                    CBI Master Forensic Intelligence & Syndicate Portal
                  </h1>
                  <p
                    className={`mt-1 text-xs lg:text-sm font-medium ${
                      isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                    }`}
                  >
                    Directorate General of Special Police Establishment • 500 Case Dossiers Ingested & Verified
                  </p>
                </div>

                {/* 4 Core Stat Counters */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <FolderArchive className="size-3.5 text-[#f5b838]" />
                      <span
                        className={`font-semibold text-xl lg:text-2xl ${
                          isDark ? "text-white" : "text-[#1c1d22]"
                        }`}
                      >
                        500
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                      }`}
                    >
                      Ingested Case Files
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Users
                        className={`size-3.5 ${isDark ? "text-[#f5b838]" : "text-[#202126]"}`}
                      />
                      <span
                        className={`font-semibold text-xl lg:text-2xl ${
                          isDark ? "text-white" : "text-[#1c1d22]"
                        }`}
                      >
                        2,744
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                      }`}
                    >
                      Extracted Entities
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Network className="size-3.5 text-[#f5b838]" />
                      <span
                        className={`font-semibold text-xl lg:text-2xl ${
                          isDark ? "text-white" : "text-[#1c1d22]"
                        }`}
                      >
                        5,252
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                      }`}
                    >
                      Syndicate Links
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Building2
                        className={`size-3.5 ${isDark ? "text-[#f5b838]" : "text-[#202126]"}`}
                      />
                      <span
                        className={`font-semibold text-xl lg:text-2xl ${
                          isDark ? "text-white" : "text-[#1c1d22]"
                        }`}
                      >
                        ₹842.6 Cr
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                      }`}
                    >
                      Defrauded Public Funds
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Circular Arc Gauge */}
              <div
                className={`lg:col-span-4 flex flex-col items-center justify-center border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 ${
                  isDark ? "border-[#262833]" : "border-[#ede9df]"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <svg className="size-40 -rotate-90 transform" viewBox="0 0 120 120">
                    {/* Background track */}
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      stroke={isDark ? "#282a36" : "#f1ede2"}
                      strokeWidth="9"
                      fill="transparent"
                      strokeDasharray="250"
                      strokeDashoffset="60"
                      strokeLinecap="round"
                    />
                    {/* Active golden amber arc meter */}
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      stroke="#f5b838"
                      strokeWidth="9"
                      fill="transparent"
                      strokeDasharray="250"
                      strokeDashoffset="100"
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                    {/* Indicator pointer dot */}
                    <circle
                      cx="98"
                      cy="27"
                      r="4.5"
                      fill={isDark ? "#14151c" : "#ffffff"}
                      stroke="#f5b838"
                      strokeWidth="3"
                    />
                  </svg>

                  {/* Arc tick labels */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span
                      className={`text-3xl font-black tracking-tight ${
                        isDark ? "text-white" : "text-[#1c1d22]"
                      }`}
                    >
                      94%
                    </span>
                    <span
                      className={`text-[10px] font-semibold tracking-wide uppercase ${
                        isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                      }`}
                    >
                      Evidence Authenticity
                    </span>
                    <span
                      className={`text-[9px] font-mono ${
                        isDark ? "text-[#7d7f8d]" : "text-[#a8a9b2]"
                      }`}
                    >
                      BSA 2023 Sec 63(4)
                    </span>
                  </div>

                  {/* Gauge edge ticks */}
                  <span
                    className={`absolute bottom-1 left-4 text-[9px] font-mono ${
                      isDark ? "text-[#656778]" : "text-[#9a9ba3]"
                    }`}
                  >
                    00
                  </span>
                  <span
                    className={`absolute top-1 left-4 text-[9px] font-mono ${
                      isDark ? "text-[#656778]" : "text-[#9a9ba3]"
                    }`}
                  >
                    20
                  </span>
                  <span
                    className={`absolute -top-1 text-[9px] font-mono ${
                      isDark ? "text-[#656778]" : "text-[#9a9ba3]"
                    }`}
                  >
                    40
                  </span>
                  <span
                    className={`absolute -top-1 right-12 text-[9px] font-mono ${
                      isDark ? "text-[#656778]" : "text-[#9a9ba3]"
                    }`}
                  >
                    60
                  </span>
                  <span
                    className={`absolute top-8 right-2 text-[9px] font-mono ${
                      isDark ? "text-[#656778]" : "text-[#9a9ba3]"
                    }`}
                  >
                    80
                  </span>
                  <span
                    className={`absolute bottom-1 right-4 text-[9px] font-mono ${
                      isDark ? "text-[#656778]" : "text-[#9a9ba3]"
                    }`}
                  >
                    100
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── MIDDLE ROW (Schedule Milestones + Resolution Chart + Branch Bars) ── */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 1. Schedule / Case Milestones Card */}
            <div
              className={`lg:col-span-4 flex flex-col justify-between rounded-3xl border p-5 shadow-xs transition-colors ${
                isDark ? "border-[#262833] bg-[#1a1b24]" : "border-[#ede9df] bg-white"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                        isDark
                          ? "border-[#2a2c38] bg-[#14151c] text-white"
                          : "border-[#e8e4da] bg-[#faf8f3] text-[#1c1d22]"
                      }`}
                    >
                      <span>13 Sep 2026</span>
                      <ChevronDown className="size-3 text-[#7a7b83]" />
                    </button>
                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                      Statutory Action Radar
                    </span>
                  </div>
                  <button
                    className={`flex size-7 items-center justify-center rounded-lg ${
                      isDark ? "text-[#9596a1] hover:bg-[#222430]" : "text-[#7a7b83] hover:bg-[#f4efe4]"
                    }`}
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 pt-1 pb-4">
                  {[
                    { id: "warrants", label: "Active Warrants (Sec 94)" },
                    { id: "summons", label: "Custodial Summons (Sec 173)" },
                    { id: "alerts", label: "Border Alerts (LOC)" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        activeTab === tab.id
                          ? isDark
                            ? "bg-[#f5b838] text-zinc-950 font-bold"
                            : "bg-[#202126] text-white font-bold"
                          : isDark
                          ? "bg-[#14151c] text-[#9596a1] hover:text-white"
                          : "bg-[#f4efe4] text-[#7a7b83] hover:text-[#1c1d22]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Milestone Cards List */}
                <div className="space-y-3">
                  {statutoryActions
                    .filter((item) => item.category === activeTab || (activeTab === "warrants" && item.category === "warrants"))
                    .map((item) => (
                    <div
                      key={item.id}
                      className={`group relative rounded-2xl p-4 transition-all ${
                        item.isHighlighted
                          ? isDark
                            ? "border border-[#654e1e] bg-gradient-to-br from-[#2a2418] to-[#1f1b13] shadow-xs"
                            : "border border-[#f8e2b2] bg-gradient-to-br from-[#fff7e6] to-[#fffcf5] shadow-xs"
                          : isDark
                          ? "border border-[#262833] bg-[#14151c] hover:bg-[#1a1b24] hover:border-[#383b4b]"
                          : "border border-[#eeeae0] bg-[#fbf9f4] hover:bg-white hover:border-[#ded8cb]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className={`block text-[10px] font-mono font-bold tracking-wider ${
                              isDark ? "text-[#f5b838]" : "text-[#916719]"
                            }`}
                          >
                            {item.fir}
                          </span>
                          <h4
                            className={`mt-0.5 text-xs font-bold transition-colors ${
                              isDark
                                ? "text-white group-hover:text-[#f5b838]"
                                : "text-[#1c1d22] group-hover:text-[#b87c12]"
                            }`}
                          >
                            {item.title}
                          </h4>
                          <p
                            className={`mt-1 text-[10.5px] ${
                              isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                            }`}
                          >
                            {item.desc}
                          </p>
                        </div>
                        <button
                          onClick={() => onOpenCase(item.case_id, item.fir)}
                          className={`flex size-6 shrink-0 items-center justify-center rounded-full shadow-xs hover:scale-105 transition-all cursor-pointer ${
                            isDark
                              ? "bg-[#252838] text-[#dcdde4] hover:text-white"
                              : "bg-white text-[#7a7b83] hover:text-[#1c1d22]"
                          }`}
                          title="Open Case"
                        >
                          <ExternalLink className="size-3" />
                        </button>
                      </div>

                      <div
                        className={`mt-3 flex items-center justify-between pt-2 border-t ${
                          isDark ? "border-[#262833]" : "border-[#f0eae0]/80"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${item.badgeColor}`}
                          >
                            {item.wing}
                          </span>
                          <span
                            className={`flex items-center gap-1 text-[10px] font-medium ${
                              isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                            }`}
                          >
                            <Clock className="size-3" />
                            {item.time}
                          </span>
                        </div>
                        <div className="flex size-5 items-center justify-center rounded-full bg-[#f5b838] text-[9px] font-bold text-zinc-950">
                          CBI
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Investigation & Resolution Velocity */}
            <div
              className={`lg:col-span-5 flex flex-col justify-between rounded-3xl border p-5 shadow-xs transition-colors ${
                isDark ? "border-[#262833] bg-[#1a1b24]" : "border-[#ede9df] bg-white"
              }`}
            >
              <div>
                {/* Header with KPI and Arrow */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex size-8 items-center justify-center rounded-xl ${
                        isDark ? "bg-[#14151c] text-white" : "bg-[#faf8f3] text-[#1c1d22]"
                      }`}
                    >
                      <Fingerprint className="size-4 text-[#f5b838]" />
                    </div>
                    <div>
                      <span
                        className={`text-2xl font-bold tracking-tight ${
                          isDark ? "text-white" : "text-[#1c1d22]"
                        }`}
                      >
                        94.8%
                      </span>
                      <span
                        className={`block text-[11px] font-medium ${
                          isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                        }`}
                      >
                        Cross-Syndicate Linkage Rate (500 Ingested Files)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate("graph")}
                    className={`flex size-8 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                      isDark
                        ? "border-[#262833] bg-[#14151c] text-white hover:bg-[#222430]"
                        : "border-[#ede9df] bg-[#faf8f3] text-[#1c1d22] hover:bg-[#eeeae0]"
                    }`}
                    title="Inspect Syndicate Matrix"
                  >
                    <ArrowUpRight className="size-4" />
                  </button>
                </div>

                {/* Smooth SVG Trend Line Chart */}
                <div className="mt-6">
                  <div className="relative h-32 w-full">
                    <svg
                      className="h-full w-full overflow-visible"
                      viewBox="0 0 320 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="chartGoldFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f5b838" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#f5b838" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Soft Grid Lines */}
                      <line
                        x1="0"
                        y1="20"
                        x2="320"
                        y2="20"
                        stroke={isDark ? "#262835" : "#f4efe4"}
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="0"
                        y1="50"
                        x2="320"
                        y2="50"
                        stroke={isDark ? "#262835" : "#f4efe4"}
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="0"
                        y1="80"
                        x2="320"
                        y2="80"
                        stroke={isDark ? "#262835" : "#f4efe4"}
                        strokeDasharray="3 3"
                      />

                      {/* Gradient Fill Area */}
                      <path
                        d="M 0,75 C 35,70 65,45 100,55 C 135,65 165,30 200,32 C 235,35 265,15 320,18 L 320,100 L 0,100 Z"
                        fill="url(#chartGoldFill)"
                      />

                      {/* Line */}
                      <path
                        d="M 0,75 C 35,70 65,45 100,55 C 135,65 165,30 200,32 C 235,35 265,15 320,18"
                        fill="none"
                        stroke="#f5b838"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Highlight Dots */}
                      <circle
                        cx="200"
                        cy="32"
                        r="4"
                        fill={isDark ? "#14151c" : "#ffffff"}
                        stroke="#f5b838"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx="320"
                        cy="18"
                        r="4"
                        fill={isDark ? "#14151c" : "#ffffff"}
                        stroke="#f5b838"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>

                  {/* Chart X-Axis Investigation Stages */}
                  <div
                    className={`mt-3 flex items-center justify-between text-[10px] font-mono font-semibold ${
                      isDark ? "text-[#7d7f8d]" : "text-[#7a7b83]"
                    }`}
                  >
                    <span>Phase 1: Ingestion</span>
                    <span>Phase 2: Entity Graph</span>
                    <span>Phase 3: Hawala Trace</span>
                    <span>Phase 4: Seizures</span>
                    <span>Phase 5: Cognizance</span>
                  </div>
                </div>
              </div>

              {/* Row of 5 Metric Sub-Cards */}
              <div
                className={`mt-5 grid grid-cols-5 gap-2 border-t pt-4 ${
                  isDark ? "border-[#262833]" : "border-[#ede9df]"
                }`}
              >
                {[
                  { label: "Active FIRs", val: "500 Files", action: "Inspect", fn: () => onNavigate("cases") },
                  { label: "Key Brokers", val: "48 Nodes", action: "Matrix", fn: () => onNavigate("graph") },
                  { label: "CBI Wings", val: "18 Units", action: "Filter", fn: () => setSelectedBranch(null) },
                  { label: "BSA Proofs", val: "500 Crypt", action: "Verify", fn: () => {} },
                  { label: "Asset Freezes", val: "₹842.6 Cr", action: "Sec 106", fn: () => setSearchQuery("Consortium") },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-2 text-left transition-colors ${
                      isDark ? "bg-[#14151c]" : "bg-[#faf8f3]"
                    }`}
                  >
                    <span
                      className={`block text-[9px] font-medium ${
                        isDark ? "text-[#8a8c98]" : "text-[#7a7b83]"
                      }`}
                    >
                      {stat.label}
                    </span>
                    <span
                      className={`block text-xs font-bold ${
                        isDark ? "text-white" : "text-[#1c1d22]"
                      }`}
                    >
                      {stat.val}
                    </span>
                    <button
                      onClick={stat.fn}
                      className="mt-1 flex items-center gap-0.5 text-[8.5px] font-medium text-[#f5b838] hover:underline cursor-pointer"
                    >
                      <span>{stat.action}</span>
                      <ArrowUpRight className="size-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Branch / Crime Distribution Vertical Bars */}
            <div
              className={`lg:col-span-3 flex flex-col justify-between rounded-3xl border p-5 shadow-xs transition-colors ${
                isDark ? "border-[#262833] bg-[#1a1b24]" : "border-[#ede9df] bg-white"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-xs font-bold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                      Syndicate Threat Vectors & Defrauded Public Funds
                    </h3>
                    <span className={`text-[10px] ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                      Fund distribution across 500 case files
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`block text-sm font-extrabold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                      500
                    </span>
                    <span className={`text-[9px] ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                      Ingested Files
                    </span>
                  </div>
                </div>

                {/* 3 Distinct Rounded Vertical Bars */}
                <div className="mt-8 flex h-48 items-end justify-center gap-4">
                  {/* Bar 1: Bank Fraud (BS&FB) - Amber 49% */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-[#f5b838]">49%</span>
                    <div className="relative w-11 rounded-2xl bg-[#f5b838] transition-all hover:brightness-105 h-38 shadow-xs flex flex-col justify-end p-1.5 items-center">
                      <span className="text-[9px] font-bold text-zinc-950 uppercase rotate-0">BS&FB</span>
                    </div>
                    <span className={`text-[10px] font-semibold ${isDark ? "text-[#e1e2e8]" : "text-[#1c1d22]"}`}>
                      Bank Fraud
                    </span>
                  </div>

                  {/* Bar 2: Anti-Corruption (ACB) - Charcoal 31% */}
                  <div className="flex flex-col items-center gap-2">
                    <span className={`text-[11px] font-bold ${isDark ? "text-[#dcdde4]" : "text-[#202126]"}`}>
                      31%
                    </span>
                    <div
                      className={`relative w-11 rounded-2xl transition-all hover:brightness-110 h-26 shadow-xs flex flex-col justify-end p-1.5 items-center ${
                        isDark ? "bg-[#333647]" : "bg-[#202126]"
                      }`}
                    >
                      <span className="text-[9px] font-bold text-white uppercase">ACB</span>
                    </div>
                    <span className={`text-[10px] font-semibold ${isDark ? "text-[#e1e2e8]" : "text-[#1c1d22]"}`}>
                      Corruption
                    </span>
                  </div>

                  {/* Bar 3: Special Crimes (SCB) - Muted Grey 20% */}
                  <div className="flex flex-col items-center gap-2">
                    <span className={`text-[11px] font-bold ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                      20%
                    </span>
                    <div
                      className={`relative w-11 rounded-2xl transition-all hover:brightness-105 h-18 shadow-xs flex flex-col justify-end p-1.5 items-center ${
                        isDark ? "bg-[#585b6e]" : "bg-[#9396a3]"
                      }`}
                    >
                      <span className="text-[9px] font-bold text-white uppercase">SCB</span>
                    </div>
                    <span className={`text-[10px] font-semibold ${isDark ? "text-[#e1e2e8]" : "text-[#1c1d22]"}`}>
                      Special Crime
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`mt-4 rounded-xl p-2.5 text-center ${
                  isDark ? "bg-[#14151c]" : "bg-[#faf8f3]"
                }`}
              >
                <span className={`text-[10.5px] font-medium ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                  ₹842.60 Cr Proceeds of Crime Attached under PMLA & BNSS
                </span>
              </div>
            </div>
          </section>

          {/* ── BOTTOM SECTION: ACTIVE CBI CASE REGISTER (List Cases Table) ── */}
          <section
            className={`rounded-3xl border p-5 lg:p-6 shadow-xs transition-colors ${
              isDark ? "border-[#262833] bg-[#1a1b24]" : "border-[#ede9df] bg-white"
            }`}
          >
            {/* Table Header & Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
              <div>
                <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                  Central FIR Registry & Criminal Syndicate Dossiers (500 Ingested Files)
                </h3>
                <span className={`text-xs ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                  Real-time forensic synchronization across 500 ingested case files & evidence vaults
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-2.5 size-3.5 ${
                      isDark ? "text-[#7d7f8d]" : "text-[#9e9ea5]"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Filter 500 files by FIR, accused, conduit, bank..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-56 lg:w-72 rounded-xl border py-2 pl-9 pr-3 text-xs focus:outline-none transition-colors ${
                      isDark
                        ? "border-[#2a2c38] bg-[#14151c] text-[#f5f4ef] placeholder-[#7d7f8d] focus:border-[#f5b838]"
                        : "border-[#e8e4da] bg-[#faf8f3] text-[#202124] placeholder-[#9e9ea5] focus:border-[#f5b838] focus:bg-white"
                    }`}
                  />
                </div>

                <button
                  onClick={() => {
                    setSelectedBranch(null);
                    setSearchQuery("");
                  }}
                  className={`flex size-8 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                    isDark
                      ? "border-[#2a2c38] bg-[#14151c] text-[#9596a1] hover:bg-[#222430] hover:text-white"
                      : "border-[#e8e4da] bg-[#faf8f3] text-[#7a7b83] hover:bg-[#eeeae0] hover:text-[#1c1d22]"
                  }`}
                  title="Reset Filters"
                >
                  <Filter className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b text-[10.5px] font-bold tracking-wider uppercase ${
                      isDark
                        ? "border-[#262833] text-[#8a8c98]"
                        : "border-[#ede9df] text-[#7a7b83]"
                    }`}
                  >
                    <th className="pb-3 pl-2">FIR & Case Title</th>
                    <th className="pb-3">Case ID</th>
                    <th className="pb-3">Prime Accused / Broker</th>
                    <th className="pb-3">Police Station & Wing</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Registration Date</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? "divide-[#222430]" : "divide-[#f4f0e6]"
                  }`}
                >
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#7a7b83]">
                        Loading case registry from CBI database...
                      </td>
                    </tr>
                  ) : filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#7a7b83]">
                        No matching cases found for query &ldquo;{searchQuery}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.slice(0, 10).map((c) => (
                      <tr
                        key={c.case_id}
                        className={`group transition-colors ${
                          isDark ? "hover:bg-[#14151c]" : "hover:bg-[#faf8f2]"
                        }`}
                      >
                        {/* FIR & Case Title */}
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex size-8 shrink-0 items-center justify-center rounded-xl font-mono font-bold text-[10px] group-hover:bg-[#f5b838] group-hover:text-zinc-950 transition-colors ${
                                isDark
                                  ? "bg-[#14151c] text-[#dcdde4]"
                                  : "bg-[#faf8f3] text-[#202126]"
                              }`}
                            >
                              FIR
                            </div>
                            <div>
                              <span
                                className={`block font-bold ${
                                  isDark ? "text-white" : "text-[#1c1d22]"
                                }`}
                              >
                                {c.fir_number}
                              </span>
                              <span
                                className={`text-[10px] ${
                                  isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                                }`}
                              >
                                {c.node_count} nodes • {c.edge_count} links
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Case ID */}
                        <td
                          className={`py-3 font-mono text-[11px] ${
                            isDark ? "text-[#b8bad0]" : "text-[#4a4b52]"
                          }`}
                        >
                          {c.case_id.length > 22 ? c.case_id.substring(0, 22) + "..." : c.case_id}
                        </td>

                        {/* Prime Accused / Broker */}
                        <td className="py-3">
                          <span
                            className={`font-semibold ${
                              isDark ? "text-white" : "text-[#1c1d22]"
                            }`}
                          >
                            {c.broker_name || "Syndicate Conduit"}
                          </span>
                        </td>

                        {/* Police Station */}
                        <td className={`py-3 ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                          <span className="line-clamp-1 max-w-[220px]">
                            {c.police_station}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                              isDark
                                ? "bg-[#06281e] text-[#34d399]"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            <CheckCircle2 className="size-3" />
                            <span>BSA 63(4) Valid</span>
                          </span>
                        </td>

                        {/* Registration Date */}
                        <td
                          className={`py-3 font-mono text-[11px] ${
                            isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                          }`}
                        >
                          {c.date_time ? c.date_time.split(" ")[0] : "2026-09-12"}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 pr-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenCase(c.case_id, c.fir_number)}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium shadow-2xs transition-colors cursor-pointer ${
                                isDark
                                  ? "border-[#2a2c38] bg-[#14151c] text-white hover:bg-[#222430]"
                                  : "border-[#e8e4da] bg-white text-[#1c1d22] hover:bg-[#faf8f2]"
                              }`}
                              title="Open in Case Explorer"
                            >
                              Explore
                            </button>
                            <button
                              onClick={() => onOpenChat(c.case_id, c.fir_number)}
                              className={`flex size-7 items-center justify-center rounded-lg border shadow-2xs transition-colors cursor-pointer ${
                                isDark
                                  ? "border-[#2a2c38] bg-[#14151c] text-[#f5b838] hover:bg-[#f5b838] hover:text-zinc-950"
                                  : "border-[#e8e4da] bg-white text-[#4a4b52] hover:bg-[#202126] hover:text-white"
                              }`}
                              title="Interrogate with Detective AI"
                            >
                              <Bot className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom table pagination & count info */}
            <div
              className={`mt-4 flex items-center justify-between border-t pt-3 text-xs ${
                isDark ? "border-[#262833] text-[#9596a1]" : "border-[#ede9df] text-[#7a7b83]"
              }`}
            >
              <span>
                Showing {Math.min(filteredCases.length, 10)} of 500 Ingested Case Files
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate("cases")}
                  className={`rounded-xl border px-3 py-1 font-medium shadow-2xs transition-colors cursor-pointer ${
                    isDark
                      ? "border-[#2a2c38] bg-[#14151c] text-white hover:bg-[#222430]"
                      : "border-[#e8e4da] bg-white text-[#1c1d22] hover:bg-[#faf8f2]"
                  }`}
                >
                  Explore All 500 Ingested Files in Dossier Explorer →
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

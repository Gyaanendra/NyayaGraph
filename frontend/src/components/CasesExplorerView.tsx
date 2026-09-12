"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  fetchAggregateGraph,
  fetchAllCases,
  fetchCaseDetail,
  fetchCaseGraph,
  type ApiCaseSummary,
  type ApiCaseDetail,
} from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import {
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Calendar,
  Users,
  Scale,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  FileText,
  Network,
  Eye,
  MessageSquare,
  Lock,
  Layers,
} from "lucide-react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";

interface CasesExplorerViewProps {
  onOpenChatWithCase?: (caseId: string, firNumber: string) => void;
  onJumpToGlobalGraph?: (nodeId?: string) => void;
}

type LocalSimNode = SimulationNodeDatum & {
  id: string;
  label: string;
  category: string;
  sublabel?: string;
  is_broker?: boolean;
  is_hub?: boolean;
  details?: Record<string, unknown>;
  x?: number;
  y?: number;
};

type LocalSimLink = SimulationLinkDatum<LocalSimNode> & {
  id: string;
  source: string | LocalSimNode;
  target: string | LocalSimNode;
  label?: string;
  source_type?: string;
  is_suspicious?: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  HUB: "#f59e0b",
  PERSON: "#38bdf8",
  BANK_ACCOUNT: "#10b981",
  LEGAL_SECTION: "#94a3b8",
  FACT: "#e2e8f0",
  EVIDENCE: "#64748b",
  LOCATION: "#64748b",
};

export default function CasesExplorerView({
  onOpenChatWithCase,
  onJumpToGlobalGraph,
}: CasesExplorerViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [cases, setCases] = useState<ApiCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<ApiCaseDetail | null>(null);

  // Single Case Graph State
  const [caseNodes, setCaseNodes] = useState<LocalSimNode[]>([]);
  const [caseEdges, setCaseEdges] = useState<LocalSimLink[]>([]);
  const [graphLoading, setGraphLoading] = useState(false);
  const [expandSyndicate, setExpandSyndicate] = useState(false);
  const [selectedNode, setSelectedNode] = useState<LocalSimNode | null>(null);

  const [, setTick] = useState(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");

  // Canvas Viewport & Zoom
  const [transform, setTransform] = useState({ x: 450, y: 320, k: 1.0 });
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 650 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<LocalSimNode, LocalSimLink> | null>(null);
  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  // Load all cases on mount
  useEffect(() => {
    fetchAllCases().then((data) => {
      setCases(data || []);
      if (data && data.length > 0) {
        setSelectedCaseId(data[0].case_id);
      }
      setLoading(false);
    });
  }, []);

  // Update canvas dimensions
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const { clientWidth, clientHeight } = canvasRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setCanvasSize({ w: clientWidth, h: clientHeight });
        }
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Synchronized fetch & D3 simulation for isolated case graph
  useEffect(() => {
    if (!selectedCaseId) return;

    let isCancelled = false;
    setGraphLoading(true);
    setSelectedNode(null);
    simRef.current?.stop();

    // Fetch full case detail for metadata
    fetchCaseDetail(selectedCaseId).then((det) => {
      if (!isCancelled) setSelectedCaseDetail(det);
    });

    // Fetch isolated case graph (and aggregate graph if expandSyndicate is on)
    Promise.all([
      fetchCaseGraph(selectedCaseId),
      expandSyndicate ? fetchAggregateGraph() : Promise.resolve(null),
    ])
      .then(([gData, agg]) => {
        if (isCancelled) return;

        if (!gData || !gData.nodes || gData.nodes.length === 0) {
          setCaseNodes([]);
          setCaseEdges([]);
          setGraphLoading(false);
          return;
        }

        const w = canvasSize.w || 900;
        const h = canvasSize.h || 650;
        const nodeMap = new Map<string, LocalSimNode>();
        const hubId = `HUB_${selectedCaseId}`;

        // Add base case nodes
        (gData.nodes || []).forEach((n: any) => {
          const isH = n.id.startsWith("HUB_") || n.id === hubId;
          nodeMap.set(n.id, {
            ...n,
            is_hub: isH,
            x: isH ? w / 2 : w / 2 + (Math.random() - 0.5) * 240,
            y: isH ? h / 2 : h / 2 + (Math.random() - 0.5) * 240,
            vx: 0,
            vy: 0,
          });
        });

        const rawLinksList: any[] = [...(gData.edges || [])];

        // If expandSyndicate is enabled, pull in directly connected bridge edges & nodes
        if (expandSyndicate && agg) {
          const localIds = new Set(nodeMap.keys());
          const bridgeEdges = (agg.edges || []).filter((e: any) => {
            const sId = typeof e.source === "object" ? e.source.id : String(e.source);
            const tId = typeof e.target === "object" ? e.target.id : String(e.target);
            return localIds.has(sId) || localIds.has(tId);
          });

          const neededNodeIds = new Set<string>();
          bridgeEdges.forEach((e: any) => {
            const sId = typeof e.source === "object" ? e.source.id : String(e.source);
            const tId = typeof e.target === "object" ? e.target.id : String(e.target);
            neededNodeIds.add(sId);
            neededNodeIds.add(tId);
          });

          (agg.nodes || []).forEach((n: any) => {
            if (neededNodeIds.has(n.id) && !nodeMap.has(n.id)) {
              nodeMap.set(n.id, {
                ...n,
                is_hub: n.id.startsWith("HUB_"),
                x: w / 2 + (Math.random() - 0.5) * 400,
                y: h / 2 + (Math.random() - 0.5) * 400,
                vx: 0,
                vy: 0,
              });
            }
          });

          rawLinksList.push(...bridgeEdges);
        }

        // CRITICAL INVARIANT: Only keep edges where BOTH source and target exist in nodeMap!
        const validNodes = Array.from(nodeMap.values());
        const validLinks: LocalSimLink[] = [];
        const seenLinks = new Set<string>();

        rawLinksList.forEach((e: any, idx: number) => {
          const sId = typeof e.source === "object" ? (e.source as any).id : String(e.source);
          const tId = typeof e.target === "object" ? (e.target as any).id : String(e.target);

          if (nodeMap.has(sId) && nodeMap.has(tId)) {
            const pairKey = `${sId}->${tId}`;
            if (!seenLinks.has(pairKey)) {
              seenLinks.add(pairKey);
              validLinks.push({
                ...e,
                id: e.id || `edge-${idx}`,
                source: sId,
                target: tId,
              });
            }
          }
        });

        setCaseNodes(validNodes);
        setCaseEdges(validLinks);
        setGraphLoading(false);

        // Run D3 Simulation safely
        const sim = forceSimulation<LocalSimNode, LocalSimLink>(validNodes)
          .force(
            "link",
            forceLink<LocalSimNode, LocalSimLink>(validLinks)
              .id((d) => d.id)
              .distance((l: any) => (l.is_hub ? 120 : 160))
              .strength(0.7)
          )
          .force("charge", forceManyBody().strength(-380))
          .force("center", forceCenter(w / 2, h / 2).strength(0.5))
          .force("collide", forceCollide().radius(38))
          .alpha(1)
          .restart();

        sim.on("tick", () => {
          setTick((t) => (t + 1) % 10000);
        });

        simRef.current = sim;
        setTransform({ x: 0, y: 0, k: 1.0 });
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Error loading case graph:", err);
          setGraphLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      simRef.current?.stop();
    };
  }, [selectedCaseId, expandSyndicate, canvasSize.w, canvasSize.h]);

  // Filtered cases list
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (branchFilter !== "ALL") {
        const ps = (c.police_station || "").toLowerCase();
        if (branchFilter === "BSFB" && !ps.includes("bs&fb") && !ps.includes("bsfb")) return false;
        if (branchFilter === "ACB" && !ps.includes("acb")) return false;
        if (branchFilter === "SCB" && !ps.includes("scb")) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.fir_number.toLowerCase().includes(q) ||
        (c.police_station && c.police_station.toLowerCase().includes(q)) ||
        (c.broker_name && c.broker_name.toLowerCase().includes(q))
      );
    });
  }, [cases, branchFilter, searchQuery]);

  const selectedCase = useMemo(() => {
    return cases.find((c) => c.case_id === selectedCaseId) || cases[0];
  }, [cases, selectedCaseId]);

  return (
    <div
      className={`flex h-full w-full overflow-hidden font-sans select-none transition-colors duration-150 ${
        isDark ? "bg-[#0f1015] text-[#f5f4ef]" : "bg-[#f5f3ec] text-[#202124]"
      }`}
    >
      {/* ── LEFT PANE: Searchable Case Catalog Sidebar ── */}
      <aside
        className={`w-96 shrink-0 flex flex-col border-r transition-colors ${
          isDark ? "border-[#262833] bg-[#14151c]" : "border-[#e8e4da] bg-[#f9f8f4]"
        }`}
      >
        {/* Search & Filter Header */}
        <div
          className={`flex flex-col gap-3 border-b p-4 ${
            isDark ? "border-[#262833]" : "border-[#e8e4da]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                CBI FIR Catalog
              </span>
              <span
                className={`rounded-md border px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  isDark
                    ? "border-[#2a2c38] bg-[#1a1b24] text-[#f5b838]"
                    : "border-[#e4dfd3] bg-white text-[#b87c12]"
                }`}
              >
                500 Ingested Files
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search
              className={`absolute left-3 top-2.5 size-4 ${
                isDark ? "text-[#7d7f8d]" : "text-[#9e9ea5]"
              }`}
            />
            <input
              type="text"
              placeholder="Search FIR, CBI Branch, Accused..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs outline-none transition-colors ${
                isDark
                  ? "border-[#2a2c38] bg-[#1a1b24] text-[#f5f4ef] placeholder-[#7d7f8d] focus:border-[#f5b838]"
                  : "border-[#e4dfd3] bg-white text-[#202124] placeholder-[#9e9ea5] focus:border-[#d29b28]"
              }`}
            />
          </div>

          {/* Branch Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium pb-0.5">
            {[
              { id: "ALL", label: "All Cases" },
              { id: "BSFB", label: "BS&FB (Bank Fraud)" },
              { id: "ACB", label: "ACB (Corruption)" },
              { id: "SCB", label: "SCB (Crime)" },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setBranchFilter(b.id)}
                className={`rounded-lg px-2.5 py-1 text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  branchFilter === b.id
                    ? isDark
                      ? "bg-[#252838] font-bold text-white border border-[#3b3e52]"
                      : "bg-[#202126] font-bold text-white"
                    : isDark
                    ? "bg-[#1a1b24] text-[#9596a1] hover:text-white"
                    : "bg-white text-[#65666e] hover:bg-[#eeeae0]"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Case Cards Scroll List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-xs text-zinc-500 font-mono">
              Loading FIR Catalog...
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-xs text-zinc-500 p-4 text-center font-mono">
              No cases matching your query.
            </div>
          ) : (
            filteredCases.map((c) => {
              const isSelected = c.case_id === selectedCaseId;
              return (
                <div
                  key={c.case_id}
                  onClick={() => setSelectedCaseId(c.case_id)}
                  className={`group relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-3.5 transition-all ${
                    isSelected
                      ? isDark
                        ? "border-[#654e1e] bg-gradient-to-br from-[#2a2418] to-[#1f1b13] shadow-xs"
                        : "border-[#f8e2b2] bg-gradient-to-br from-[#fff7e6] to-[#fffcf5] shadow-xs"
                      : isDark
                      ? "border-[#262833] bg-[#1a1b24] hover:border-[#383b4b] hover:bg-[#222430]"
                      : "border-[#e8e4da] bg-white hover:border-[#ded8cb] hover:bg-[#faf8f2]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isSelected
                            ? isDark
                              ? "text-[#f5b838]"
                              : "text-[#916719]"
                            : isDark
                            ? "text-white"
                            : "text-[#1c1d22]"
                        }`}
                      >
                        FIR {c.fir_number}
                      </span>
                      <span
                        className={`text-[11px] font-medium line-clamp-1 ${
                          isDark ? "text-[#9596a1]" : "text-[#7a7b83]"
                        }`}
                      >
                        {c.police_station || "CBI SPE"}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1 rounded-md border px-1.5 py-0.2 text-[10px] font-mono ${
                        isDark
                          ? "border-[#154632] bg-[#06281e] text-[#34d399]"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <ShieldCheck className="size-3" />
                      <span>BSA 63(4)</span>
                    </div>
                  </div>

                  {/* Accused / Broker */}
                  {c.broker_name && (
                    <div
                      className={`flex items-center gap-1.5 text-xs ${
                        isDark ? "text-[#dcdde4]" : "text-[#33353e]"
                      }`}
                    >
                      <Users className="size-3.5 text-[#f5b838] shrink-0" />
                      <span className="truncate">
                        Prime Accused: <strong className="font-bold">{c.broker_name}</strong>
                      </span>
                    </div>
                  )}

                  {/* Badges footer */}
                  <div
                    className={`flex items-center justify-between pt-1 border-t text-[10px] font-mono ${
                      isDark ? "border-[#262833] text-[#7d7f8d]" : "border-[#f0eae0] text-[#7a7b83]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                        {c.node_count || 0} Entities
                      </span>
                      <span>•</span>
                      <span>{c.edge_count || 0} Links</span>
                    </div>
                    <span>{c.date_time ? c.date_time.split(" ")[0] : "2026-09-12"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── RIGHT PANE: Focused Single-Case Isolated Graph & Details ── */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top Action Bar */}
        <header
          className={`flex h-13 items-center justify-between border-b px-6 transition-colors ${
            isDark
              ? "border-[#262833] bg-[#14151c] text-white"
              : "border-[#e8e4da] bg-[#f9f8f4] text-[#1c1d22]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs font-bold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                  FIR {selectedCase?.fir_number || "SELECT A CASE"}
                </span>
                <span
                  className={`rounded-md border px-2 py-0.2 text-[10px] font-mono uppercase tracking-wider ${
                    isDark
                      ? "border-[#2a2c38] bg-[#1a1b24] text-[#f5b838]"
                      : "border-[#e4dfd3] bg-white text-[#b87c12]"
                  }`}
                >
                  ISOLATED GRAPH
                </span>
              </div>
              <span className={`text-[11px] line-clamp-1 ${isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}`}>
                {selectedCase?.police_station}
              </span>
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Expand Syndicate Connections Toggle */}
            <button
              onClick={() => setExpandSyndicate(!expandSyndicate)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                expandSyndicate
                  ? isDark
                    ? "border-[#f5b838] bg-[#332512] text-[#f5b838] shadow-xs"
                    : "border-[#b87c12] bg-[#fbeed4] text-[#b87c12] shadow-xs"
                  : isDark
                  ? "border-[#262833] bg-[#1a1b24] text-[#9596a1] hover:border-[#383b4b] hover:text-white"
                  : "border-[#e8e4da] bg-white text-[#7a7b83] hover:border-[#ded8cb] hover:text-[#1c1d22]"
              }`}
            >
              <Network className="size-3.5 text-[#f5b838]" />
              <span>{expandSyndicate ? "Syndicate Bridges Active" : "Expand Syndicate Links"}</span>
            </button>

            {/* Jump to Detective Chat */}
            {onOpenChatWithCase && selectedCase && (
              <button
                onClick={() => onOpenChatWithCase(selectedCase.case_id, selectedCase.fir_number)}
                className="flex items-center gap-1.5 rounded-xl bg-[#f5b838] px-3 py-1.5 text-xs font-bold text-zinc-950 hover:brightness-105 transition-all cursor-pointer shadow-xs"
              >
                <MessageSquare className="size-3.5" />
                <span>Ask AI Copilot</span>
              </button>
            )}

            {/* Jump to Global Overview Graph */}
            {onJumpToGlobalGraph && (
              <button
                onClick={() => onJumpToGlobalGraph(selectedCase?.case_id)}
                title="View in Master Syndicate Graph"
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? "border-[#262833] bg-[#1a1b24] text-[#9596a1] hover:border-[#383b4b] hover:text-white"
                    : "border-[#e8e4da] bg-white text-[#7a7b83] hover:border-[#ded8cb] hover:text-[#1c1d22]"
                }`}
              >
                <Layers className="size-3.5" />
                <span>Global Graph</span>
              </button>
            )}
          </div>
        </header>

        {/* Interactive Graph Canvas */}
        <div
          ref={canvasRef}
          className={`relative flex-1 overflow-hidden transition-colors ${
            isDark ? "bg-[#09090b]" : "bg-[#f5f3ec]"
          }`}
        >
          {graphLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-xs text-[#a1a1aa]">
                <div className="size-7 animate-spin rounded-full border-2 border-[#a855f7] border-t-transparent" />
                <span>ISOLATING CASE GRAPH…</span>
              </div>
            </div>
          ) : caseNodes.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-xs text-[#71717a]">
              No graph data found for this case.
            </div>
          ) : (
            <svg
              className="h-full w-full block cursor-grab active:cursor-grabbing select-none"
              onWheel={(e) => {
                e.preventDefault();
                const k2 = Math.min(4.0, Math.max(0.4, transform.k * Math.exp(-e.deltaY * 0.0015)));
                const r = e.currentTarget.getBoundingClientRect();
                const mx = e.clientX - r.left;
                const my = e.clientY - r.top;
                setTransform({
                  k: k2,
                  x: mx - ((mx - transform.x) / transform.k) * k2,
                  y: my - ((my - transform.y) / transform.k) * k2,
                });
              }}
              onPointerDown={(e) => {
                if ((e.target as Element).closest("circle") || (e.target as Element).closest("text")) return;
                panRef.current = { sx: e.clientX, sy: e.clientY, ox: transform.x, oy: transform.y };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (panRef.current) {
                  const { ox, oy, sx, sy } = panRef.current;
                  setTransform((t) => ({
                    ...t,
                    x: ox + (e.clientX - sx),
                    y: oy + (e.clientY - sy),
                  }));
                }
              }}
              onPointerUp={(e) => {
                panRef.current = null;
                try {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                } catch {}
              }}
            >
              <defs>
                <marker
                  id="case-arrow"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5" fill="#52525b" />
                </marker>
                <marker
                  id="case-arrow-bridge"
                  viewBox="0 0 10 10"
                  refX="24"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9" fill="#e5851d" />
                </marker>
              </defs>

              <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                {/* Edges */}
                {caseEdges.map((l: any, idx: number) => {
                  const s = typeof l.source === "object" ? l.source : caseNodes.find((n) => n.id === l.source);
                  const t = typeof l.target === "object" ? l.target : caseNodes.find((n) => n.id === l.target);
                  if (!s || !t || s.x == null || s.y == null || t.x == null || t.y == null) return null;

                  const isBridge = l.source_type === "CROSS_CASE";
                  return (
                    <g key={l.id || `edge-${idx}`}>
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={isBridge ? "#e5851d" : isDark ? "#52525b" : "#c5c0b4"}
                        strokeWidth={isBridge ? 2.5 : 1.6}
                        strokeOpacity={isBridge ? 0.95 : isDark ? 0.7 : 0.55}
                        strokeDasharray={isBridge ? "5 3" : undefined}
                        markerEnd={isBridge ? "url(#case-arrow-bridge)" : "url(#case-arrow)"}
                      />
                      {/* Edge Label (if important or bridge) */}
                      {l.label && (
                        <text
                          x={(s.x + t.x) / 2}
                          y={(s.y + t.y) / 2 - 4}
                          textAnchor="middle"
                          fill={isBridge ? "#f59e0b" : isDark ? "#8c8c96" : "#65666e"}
                          fontSize={9}
                          fontFamily="monospace"
                          className="select-none"
                        >
                          {l.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {caseNodes.map((n) => {
                  if (n.x == null || n.y == null) return null;

                  const isHub = n.is_hub;
                  const isSelected = selectedNode?.id === n.id;
                  const color = isHub ? "#a855f7" : n.is_broker ? "#ef4444" : CATEGORY_COLORS[n.category] || "#94a3b8";
                  const r = isHub ? 24 : n.is_broker ? 18 : 14;

                  return (
                    <g
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className="cursor-pointer"
                    >
                      {/* Selection Glow */}
                      {isSelected && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={r + 8}
                          fill="none"
                          stroke="#e5851d"
                          strokeWidth={2}
                          className="animate-pulse"
                        />
                      )}

                      {/* Primary Circle */}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={r}
                        fill={color}
                        stroke={isSelected ? "#ffffff" : isHub ? "#f5f3ff" : isDark ? "#18181b" : "#ffffff"}
                        strokeWidth={isHub ? 3 : 2}
                        fillOpacity={0.9}
                      />

                      {/* Crisp Backdrop Pill & Label */}
                      <g className="pointer-events-none select-none">
                        <rect
                          x={n.x - Math.min(n.label.length, 24) * 3.3 - 4}
                          y={n.y + r + 5}
                          width={Math.min(n.label.length, 24) * 6.6 + 8}
                          height={15}
                          rx={3}
                          fill={isDark ? "#0e0e11" : "#ffffff"}
                          fillOpacity={0.92}
                          stroke={isSelected ? "#e5851d" : isDark ? "#27272a" : "#e8e4da"}
                          strokeWidth={isSelected ? 1.2 : 0.8}
                        />
                        <text
                          x={n.x}
                          y={n.y + r + 16}
                          textAnchor="middle"
                          fill={isSelected ? (isDark ? "#ffffff" : "#1c1d22") : isDark ? "#e4e4e7" : "#1c1d22"}
                          fontFamily="Inter, sans-serif"
                          fontSize={isHub ? 11.5 : 10.5}
                          fontWeight={isHub || n.is_broker ? 700 : 500}
                        >
                          {n.label.length > 24 ? `${n.label.slice(0, 22)}…` : n.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Bottom Left Zoom HUD */}
          <div
            className={`absolute bottom-5 left-5 z-10 flex items-center gap-2 rounded-xl border p-1.5 text-xs shadow-xl backdrop-blur-md transition-colors ${
              isDark
                ? "border-[#262833] bg-[#14151c]/95 text-[#dcdde4]"
                : "border-[#e8e4da] bg-white/95 text-[#1c1d22]"
            }`}
          >
            <button
              onClick={() => setTransform((t) => ({ ...t, k: Math.min(4.0, t.k * 1.25) }))}
              title="Zoom In"
              className={`flex size-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isDark ? "hover:bg-[#222430] hover:text-white" : "hover:bg-[#f4efe4] hover:text-[#1c1d22]"
              }`}
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              onClick={() => setTransform((t) => ({ ...t, k: Math.max(0.4, t.k / 1.25) }))}
              title="Zoom Out"
              className={`flex size-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isDark ? "hover:bg-[#222430] hover:text-white" : "hover:bg-[#f4efe4] hover:text-[#1c1d22]"
              }`}
            >
              <ZoomOut className="size-4" />
            </button>
            <div className={`h-4 w-px ${isDark ? "bg-[#262833]" : "bg-[#e8e4da]"}`} />
            <button
              onClick={() => setTransform({ x: 0, y: 0, k: 1.0 })}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                isDark ? "hover:bg-[#222430] hover:text-white" : "hover:bg-[#f4efe4] hover:text-[#1c1d22]"
              }`}
            >
              <Maximize2 className="size-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Node Details Overlay Panel (Bottom Right) */}
          {selectedNode && (
            <div
              className={`absolute bottom-5 right-5 z-20 w-88 rounded-2xl border p-5 shadow-2xl backdrop-blur-xl space-y-3 transition-colors ${
                isDark
                  ? "border-[#262833] bg-[#14151c]/98 text-white"
                  : "border-[#e8e4da] bg-white/98 text-[#1c1d22]"
              }`}
            >
              <div
                className={`flex items-start justify-between gap-3 border-b pb-3 ${
                  isDark ? "border-[#262833]" : "border-[#ede9df]"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#f5b838]">
                    {selectedNode.category}
                  </span>
                  <h4
                    className={`text-sm font-bold line-clamp-1 ${
                      isDark ? "text-white" : "text-[#1c1d22]"
                    }`}
                  >
                    {selectedNode.label}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className={`rounded-lg p-1 transition-colors cursor-pointer ${
                    isDark ? "text-[#9596a1] hover:text-white" : "text-[#7a7b83] hover:text-[#1c1d22]"
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {selectedNode.sublabel && (
                  <div className="flex items-center justify-between">
                    <span className={isDark ? "text-[#9596a1]" : "text-[#7a7b83]"}>Role:</span>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                      {selectedNode.sublabel}
                    </span>
                  </div>
                )}
                {selectedNode.is_broker && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40 px-2.5 py-1 text-[11px] font-bold text-rose-300">
                    ⚡ Central Criminal Broker
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import { fetchAggregateGraph, fetchAllCases, type ApiCaseSummary } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import {
  DOC_NODES,
  DOC_EDGES,
  getStepPositions,
  DOC_MARKDOWN_CONTENT,
  type DocNode,
} from "@/data/docGraphData";
import {
  Folder,
  FolderOpen,
  Search,
  Bookmark,
  FileText,
  FilePlus,
  FolderPlus,
  ArrowUpDown,
  ChevronsDownUp,
  RotateCcw,
  Minus,
  Square,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Network,
  LayoutGrid,
  Calendar,
  FileCode,
  HelpCircle,
  Settings,
  Sparkles,
  Flame,
  Shield,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Copy,
  Check,
  Sliders,
  Info,
  ExternalLink,
  MessageSquare,
  Play,
  FastForward,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────
export type GNode = {
  id: string;
  label: string;
  category: string;
  sublabel?: string;
  is_broker?: boolean;
  is_locked?: boolean;
  details?: Record<string, unknown>;
  x?: number;
  y?: number;
};

export type GEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  source_type?: string;
  is_suspicious?: boolean;
  evidence_ref?: string;
};

type SimNode = SimulationNodeDatum & GNode;
type SimLink = SimulationLinkDatum<SimNode> & {
  edge: GEdge;
};

// ── Obsidian Dark Theme Color Tokens ──────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  HUB: "#a855f7", // Purple - Case Centers
  CASE: "#a855f7",
  CRIME: "#ef4444", // Red - Crimes / Offenses
  PERSON: "#e5851d", // Amber - Accused & Persons
  ACCUSED: "#e5851d",
  COMPANY: "#3b82f6", // Blue - Organizations / Entities
  BANK_ACCOUNT: "#10b981", // Emerald - Financial accounts
  PHONE: "#06b6d4", // Cyan - Telephony / SIMs
  DOCUMENT: "#8b5cf6", // Violet - Proofs / Records
  SECTION: "#f59e0b", // Yellow - IPC / PC Act sections
  FACT: "#6366f1", // Indigo - Chronological ledger facts
};

function isHub(n: GNode): boolean {
  return n.category === "HUB" || n.category === "CASE" || n.id.startsWith("case_");
}

function getNodeColor(n: GNode): string {
  if (isHub(n)) return CATEGORY_COLORS.HUB;
  if (n.is_broker) return "#ef4444";
  return CATEGORY_COLORS[n.category] ?? "#94a3b8";
}

export default function ObsidianGraphView({
  onStats,
  onOpenCaseExplorer,
  onOpenChat,
}: {
  onStats?: (s: { cases: number; nodes: number; edges: number }) => void;
  onOpenCaseExplorer?: (caseId?: string) => void;
  onOpenChat?: (caseId?: string, label?: string) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);

  // Core API Data State
  const [cases, setCases] = useState<ApiCaseSummary[]>([]);
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<SimLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab & Selection State
  const [activeTab, setActiveTab] = useState<string>("graph");
  const [openTabs, setOpenTabs] = useState<{ id: string; label: string }[]>([
    { id: "graph", label: "Graph view" },
    { id: "syndicate-index", label: "Master_Syndicate_Index.md" },
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    syndicate: false,
  });
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [labelMode, setLabelMode] = useState<"smart" | "hubs" | "all">("smart");

  // Left Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Right HUD State: Dual-Mode (Details / Settings) ──
  const [rightHudMode, setRightHudMode] = useState<"details" | "settings">("details");
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(true);

  // Obsidian Settings Panel Accordions
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [displayOpen, setDisplayOpen] = useState(true);
  const [forcesOpen, setForcesOpen] = useState(true);

  // Obsidian Settings Controls
  const [searchFiles, setSearchFiles] = useState("");
  const [filterTags, setFilterTags] = useState(false);
  const [filterAttachments, setFilterAttachments] = useState(false);
  const [filterExistingFilesOnly, setFilterExistingFilesOnly] = useState(false);
  const [filterOrphans, setFilterOrphans] = useState(true);


  // Display
  const [arrows, setArrows] = useState(true);
  const [textFadeThreshold, setTextFadeThreshold] = useState(0.0);
  const [nodeSize, setNodeSize] = useState(1.15);
  const [linkThickness, setLinkThickness] = useState(1.2);

  // Forces
  const [centerForce, setCenterForce] = useState(0.52);
  const [repelForce, setRepelForce] = useState(11.0);
  const [linkForce, setLinkForce] = useState(1.0);
  const [linkDistance, setLinkDistance] = useState(240);

  // Viewport & Pan/Zoom (Default percentage view locked to 28% [25-30% range] for Syndicate, 100% for Doc Build)
  const [size, setSize] = useState({ w: 1100, h: 750 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.28 });
  const [docTransform, setDocTransform] = useState({ x: 0, y: 0, k: 1.0 });
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const [, setTick] = useState(0);

  // ── Graph View Mode: "doc-build" (6.3s Cinematic Sequence) | "cbi-syndicate" (500 Case Network) ──
  const [graphMode, setGraphMode] = useState<"doc-build" | "cbi-syndicate">("doc-build");

  // ── 6.3-Second Cinematic Doc Build-Out State Machine ──
  // 0.0s - 0.6s: Idle state — Single root node "index" centered, gently breathing
  // 0.6s - 5.5s: Spawning — 8 nodes spawn sequentially (~0.61s each), drawing arrow edges, layout smoothly rebalances
  // 5.5s - 6.0s: Settle — Motion damps out, resting layout: index roughly center-top, children fanned below/around it
  // 6.0s - 6.3s: Mouse cursor enters top-right, implying interactivity
  // > 6.3s: Full interactivity (drag, hover, click to inspect markdown dossier, pan & zoom)
  type DocAnimPhase = "idle" | "spawning" | "settling" | "interactive";
  const [docStep, setDocStep] = useState<number>(0);
  const [docPhase, setDocPhase] = useState<DocAnimPhase>("idle");
  const [cursorVisible, setCursorVisible] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorOpacity, setCursorOpacity] = useState<number>(0);
  const [isPlaying6s, setIsPlaying6s] = useState<boolean>(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>("index");
  const [hoverDocId, setHoverDocId] = useState<string | null>(null);
  const [draggedDocNodes, setDraggedDocNodes] = useState<Record<string, { x: number; y: number }>>({});

  // 6.3-Second Sequence Timeout Controller (Clean, single-pass timeouts, zero 60fps re-render loops!)
  useEffect(() => {
    if (!isPlaying6s || graphMode !== "doc-build") return;

    setDocStep(0);
    setDocPhase("idle");
    setCursorVisible(false);
    setCursorOpacity(0);
    setHoverDocId(null);

    const timers: NodeJS.Timeout[] = [];

    // Step 1: 0.60s (600ms) - Node 1 (01-soup-overview) appears
    timers.push(
      setTimeout(() => {
        setDocStep(1);
        setDocPhase("spawning");
      }, 600)
    );

    // Step 2: 1.21s (1212ms) - Node 2 (02-recommended-models) appears
    timers.push(
      setTimeout(() => {
        setDocStep(2);
      }, 1212)
    );

    // Step 3: 1.82s (1825ms) - Node 3 (03-conda-environment-setup) appears
    timers.push(
      setTimeout(() => {
        setDocStep(3);
      }, 1825)
    );

    // Step 4: 2.44s (2437ms) - Node 4 (04-experiment-template) appears
    timers.push(
      setTimeout(() => {
        setDocStep(4);
      }, 2437)
    );

    // Step 5: 3.05s (3050ms) - Node 5 (05-training-guide-and-workflow) appears
    timers.push(
      setTimeout(() => {
        setDocStep(5);
      }, 3050)
    );

    // Step 6: 3.66s (3662ms) - Node 6 (06-dataset-domains-roadmap) appears
    timers.push(
      setTimeout(() => {
        setDocStep(6);
      }, 3662)
    );

    // Step 7: 4.28s (4275ms) - Node 7 (07-function-calling-guide) appears
    timers.push(
      setTimeout(() => {
        setDocStep(7);
      }, 4275)
    );

    // Step 8: 4.89s (4887ms) - Node 8 (08-markdown-formatter-assistant-guide) appears
    timers.push(
      setTimeout(() => {
        setDocStep(8);
      }, 4887)
    );

    // Step 9: 5.50s (5500ms) - Settle: physics damps out, resting layout
    timers.push(
      setTimeout(() => {
        setDocPhase("settling");
      }, 5500)
    );

    // Step 10: 6.00s (6000ms) - Mouse cursor enters top-right
    timers.push(
      setTimeout(() => {
        const cx = sizeRef.current.w / 2;
        const cy = sizeRef.current.h / 2;
        setCursorVisible(true);
        setCursorPos({ x: cx + 240, y: cy - 90 });
        setCursorOpacity(1);
      }, 6000)
    );

    // Step 10b: 6.15s - Cursor glides toward 02-recommended-models
    timers.push(
      setTimeout(() => {
        const cx = sizeRef.current.w / 2;
        const cy = sizeRef.current.h / 2;
        setCursorPos({ x: cx + 160, y: cy - 30 });
        setHoverDocId("02-recommended-models");
      }, 6150)
    );

    // Step 11: 6.30s (6300ms) - Complete! Transition cleanly into interactive resting state
    timers.push(
      setTimeout(() => {
        setDocPhase("interactive");
        setCursorOpacity(0);
        setHoverDocId(null);
        setIsPlaying6s(false);
        setTimeout(() => setCursorVisible(false), 350);
      }, 6300)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isPlaying6s, graphMode]);

  const skipDocAnimation = useCallback(() => {
    setDocStep(8);
    setDocPhase("interactive");
    setCursorVisible(false);
    setCursorOpacity(0);
    setHoverDocId(null);
    setIsPlaying6s(false);
  }, []);

  const replayDocAnimation = useCallback(() => {
    setDraggedDocNodes({});
    setDocTransform({ x: 0, y: 0, k: 1.0 });
    setIsPlaying6s(true);
  }, []);

  // Base coordinates calculated for the current animation step
  const basePositions = useMemo(() => {
    const cx = size.w / 2;
    const cy = size.h / 2;
    return getStepPositions(docStep, cx, cy);
  }, [docStep, size.w, size.h]);

  const getDocNodePos = useCallback(
    (id: string) => {
      if (draggedDocNodes[id]) return draggedDocNodes[id];
      return basePositions[id] ?? { x: size.w / 2, y: size.h / 2 };
    },
    [draggedDocNodes, basePositions, size.w, size.h]
  );

  // Progressive visible doc nodes & edges
  const visibleDocNodes = useMemo(() => {
    return DOC_NODES.slice(0, docStep + 1);
  }, [docStep]);

  const visibleDocEdges = useMemo(() => {
    const visibleIds = new Set(visibleDocNodes.map((n) => n.id));
    return DOC_EDGES.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [visibleDocNodes]);

  const focusDocNode = useCallback(
    (id: string) => {
      setSelectedDocId(id);
      setSelectedNodeId(null);
      setRightHudMode("details");
      setSettingsPanelOpen(true);
      const node = DOC_NODES.find((d) => d.id === id);
      if (node) {
        setOpenTabs((tabs) => {
          if (tabs.some((t) => t.id === id)) return tabs;
          return [...tabs, { id, label: node.filename }];
        });
      }
    },
    []
  );

  // ── CBI Case Network State (Settled once, frozen in place at 28% zoom) ──
  const [revealedCount, setRevealedCount] = useState<number>(nodes.length || 1);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(false);

  const dragRef = useRef<{ id: string } | null>(null);
  const pointerDownPosRef = useRef<{ id: string; x: number; y: number; time: number } | null>(null);
  const didDragNodeRef = useRef(false);
  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const initialFittedRef = useRef(false);

  // Lookups
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Degree Map to order nodes by graph centrality
  const degreeMap = useMemo(() => {
    const deg = new Map<string, number>();
    for (const l of links) {
      const s = typeof l.source === "object" ? (l.source as SimNode).id : String(l.source);
      const t = typeof l.target === "object" ? (l.target as SimNode).id : String(l.target);
      deg.set(s, (deg.get(s) || 0) + 1);
      deg.set(t, (deg.get(t) || 0) + 1);
    }
    return deg;
  }, [links]);

  const timelineOrderedNodes = useMemo(() => {
    if (!nodes.length) return [];
    return nodes;
  }, [nodes]);

  const visibleNodes = useMemo(() => {
    return nodes;
  }, [nodes]);

  const visibleLinks = useMemo(() => {
    return links;
  }, [links]);

  const skipAnimation = useCallback(() => {
    setIsTimelinePlaying(false);
  }, []);

  const replayAnimation = useCallback(() => {
    if (graphMode === "doc-build") {
      replayDocAnimation();
    } else {
      fitView();
    }
  }, [graphMode, replayDocAnimation]);

  // Direct Connections (Neighbors) lookup
  const neighbors = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of links) {
      const s = typeof l.source === "object" ? (l.source as SimNode).id : String(l.source);
      const t = typeof l.target === "object" ? (l.target as SimNode).id : String(l.target);
      if (!m.has(s)) m.set(s, new Set());
      if (!m.has(t)) m.set(t, new Set());
      m.get(s)!.add(t);
      m.get(t)!.add(s);
    }
    return m;
  }, [links]);

  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) : null;
  const selectedNeighbors = selectedNodeId
    ? ([...(neighbors.get(selectedNodeId) ?? [])].map((id) => nodeById.get(id)).filter(Boolean) as SimNode[])
    : [];

  // Reset Settings to Defaults
  const resetToDefaults = () => {
    setSearchFiles("");
    setFilterTags(false);
    setFilterAttachments(false);
    setFilterExistingFilesOnly(false);
    setFilterOrphans(true);
    setArrows(true);
    setTextFadeThreshold(0.0);
    setNodeSize(1.15);
    setLinkThickness(1.2);
    setCenterForce(0.52);
    setRepelForce(11.0);
    setLinkForce(1.0);
    setLinkDistance(240);
    fitView();
  };

  // ── Fetch REAL CASE FILES DATA from Backend API ──
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAggregateGraph(), fetchAllCases()])
      .then(([d, casesList]) => {
        if (!d) {
          setError("Backend unreachable. Ensure FastAPI server is running on port 8000.");
          setLoading(false);
          return;
        }

        const casesArray = casesList || [];
        setCases(casesArray);

        // Keep syndicate folder collapsed by default so CBI branches are prominent
        const initialExpanded: Record<string, boolean> = { syndicate: false };
        casesArray.forEach((c) => {
          initialExpanded[c.case_id] = true;
        });
        setExpandedFolders(initialExpanded);

        const w = wrapRef.current?.clientWidth || 1100;
        const h = wrapRef.current?.clientHeight || 750;
        setSize({ w, h });

        const caseIds = d.case_ids || [];
        const numCases = Math.max(1, caseIds.length);
        const centerMap = new Map<string, { x: number; y: number }>();
        const layoutRadius = Math.min(w, h) * 0.40;

        caseIds.forEach((cid, i) => {
          const angle = (i / numCases) * 2 * Math.PI - Math.PI / 2;
          centerMap.set(cid, {
            x: w / 2 + layoutRadius * Math.cos(angle),
            y: h / 2 + layoutRadius * Math.sin(angle),
          });
        });

        // Map API Nodes
        const simNodes: SimNode[] = (d.nodes as GNode[]).map((n) => {
          const copy: SimNode = { ...n };
          delete copy.x;
          delete copy.y;
          delete copy.vx;
          delete copy.vy;
          delete copy.fx;
          delete copy.fy;

          const hubCase = copy.id.startsWith("HUB_") ? copy.id.replace("HUB_", "") : null;
          const casesOfNode = (copy.details as Record<string, unknown>)?.source_cases as string[] | undefined;
          const factCase =
            copy.category === "FACT"
              ? ((copy.details as Record<string, unknown>)?.case_id as string | undefined)
              : null;

          if (hubCase && centerMap.has(hubCase)) {
            const c = centerMap.get(hubCase)!;
            copy.x = c.x;
            copy.y = c.y;
          } else if (factCase && centerMap.has(factCase)) {
            const c = centerMap.get(factCase)!;
            const a = Math.random() * 2 * Math.PI;
            const r = 55 + Math.random() * 80;
            copy.x = c.x + r * Math.cos(a);
            copy.y = c.y + r * Math.sin(a);
          } else if (casesOfNode && casesOfNode.length > 0) {
            if (casesOfNode.length === 1 && centerMap.has(casesOfNode[0])) {
              const c = centerMap.get(casesOfNode[0])!;
              const a = Math.random() * 2 * Math.PI;
              const r = 60 + Math.random() * 95;
              copy.x = c.x + r * Math.cos(a);
              copy.y = c.y + r * Math.sin(a);
            } else {
              let avgX = 0,
                avgY = 0,
                cnt = 0;
              casesOfNode.forEach((cid) => {
                if (centerMap.has(cid)) {
                  avgX += centerMap.get(cid)!.x;
                  avgY += centerMap.get(cid)!.y;
                  cnt++;
                }
              });
              if (cnt > 0) {
                copy.x = avgX / cnt + (Math.random() - 0.5) * 50;
                copy.y = avgY / cnt + (Math.random() - 0.5) * 50;
              }
            }
          }

          if (copy.x == null || copy.y == null) {
            copy.x = w / 2 + (Math.random() - 0.5) * 280;
            copy.y = h / 2 + (Math.random() - 0.5) * 280;
          }

          return copy;
        });

        // Map API Edges
        const byId = new Map(simNodes.map((n) => [n.id, n]));
        const seenEdgeIds = new Set<string>();
        const simLinks: SimLink[] = (d.edges as GEdge[])
          .filter((e) => byId.has(e.source) && byId.has(e.target))
          .map((e, idx) => {
            let edgeId = e.id || `edge_${idx}`;
            if (seenEdgeIds.has(edgeId)) {
              edgeId = `${edgeId}_${idx}`;
            }
            seenEdgeIds.add(edgeId);
            return {
              source: byId.get(e.source)!,
              target: byId.get(e.target)!,
              edge: { ...e, id: edgeId },
            };
          });

        setNodes(simNodes);
        setLinks(simLinks);
        setLoading(false);

        // Keep initial selection clean so the 6.3s sequence plays seamlessly from the root node

        onStats?.({ cases: caseIds.length, nodes: simNodes.length, edges: simLinks.length });
      })
      .catch((err) => {
        console.error("API error:", err);
        setError("Failed to load case graph from API. Please ensure FastAPI is running on port 8000.");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Force Simulation Engine (Pre-settles and FREEZES all node positions) ──
  useEffect(() => {
    if (!nodes.length) return;

    // Run simulation to settle node positions ONCE, then freeze them completely!
    const sim = forceSimulation<SimNode, SimLink>(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((l) => (l.edge.source_type === "CROSS_CASE" ? linkDistance * 1.3 : linkDistance * 0.7))
          .strength((l) => (l.edge.source_type === "CROSS_CASE" ? linkForce * 0.25 : linkForce * 0.65))
      )
      .force(
        "charge",
        forceManyBody<SimNode>()
          .theta(0.95)
          .strength((d) => (isHub(d) ? -repelForce * 35 : d.category === "FACT" ? -repelForce * 25 : -repelForce * 18))
          .distanceMax(600)
      )
      .force("center", forceCenter(size.w / 2, size.h / 2).strength(centerForce * 0.08))
      .force(
        "collide",
        forceCollide<SimNode>()
          .radius((d) => (isHub(d) ? 22 * nodeSize + 25 : 14 * nodeSize + 15))
          .strength(0.5)
      )
      .alphaDecay(0.06);

    // Pre-settle synchronously so nodes are placed into their clusters
    for (let i = 0; i < 50; i++) sim.tick();

    // STOP SIMULATION IMMEDIATELY! All 2,744 node positions are now FROZEN in place!
    sim.stop();
    simRef.current = sim;

    // Fix node coordinates permanently — nodes will ONLY move when dragged by mouse
    nodes.forEach((n) => {
      if (n.x != null && n.y != null) {
        n.fx = n.x;
        n.fy = n.y;
      }
    });

    if (!initialFittedRef.current && size.w > 200 && size.h > 200) {
      initialFittedRef.current = true;
      setTimeout(() => fitView(), 80);
    }

    setTick((t) => t + 1);

    return () => {
      sim.stop();
    };
  }, [nodes, links, size.w, size.h, linkDistance, linkForce, repelForce, centerForce, nodeSize]);

  // Dynamic Viewport Resize
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 50 && r.height > 50) {
        setSize({ w: r.width, h: r.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit camera with comfortable, readable scale (locked to default 28% [25-30% range])
  const fitView = useCallback(() => {
    if (!nodes.length || size.w <= 0 || size.h <= 0) return;
    const xs = nodes.map((n) => n.x ?? size.w / 2);
    const ys = nodes.map((n) => n.y ?? size.h / 2);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);

    // Keep default percentage view locked to 28% (0.28) centered on master network
    const k = 0.28;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setTransform({
      k,
      x: size.w / 2 - midX * k,
      y: size.h / 2 - midY * k,
    });
  }, [nodes, size.w, size.h]);

  const triggerAnimate = () => {
    simRef.current?.alpha(0.8).restart();
  };

  function toWorld(clientX: number, clientY: number, svg: SVGSVGElement) {
    const r = svg.getBoundingClientRect();
    return {
      x: (clientX - r.left - transform.x) / transform.k,
      y: (clientY - r.top - transform.y) / transform.k,
    };
  }

  function toDocWorld(clientX: number, clientY: number, svg: SVGSVGElement) {
    const r = svg.getBoundingClientRect();
    return {
      x: (clientX - r.left - docTransform.x) / docTransform.k,
      y: (clientY - r.top - docTransform.y) / docTransform.k,
    };
  }

  // Focus a single node and show its details in right HUD!
  const focusNode = useCallback(
    (id: string) => {
      const n = nodeById.get(id);
      if (!n) return;
      setSelectedNodeId(id);
      setRightHudMode("details"); // Open Details Tab in Right HUD!
      setSettingsPanelOpen(true); // Ensure Right HUD is open!

      setOpenTabs((tabs) => {
        if (tabs.some((t) => t.id === id)) return tabs;
        return [...tabs, { id, label: `${n.label}.md` }];
      });

      if (n.x != null && n.y != null) {
        const targetK = Math.max(1.05, transform.k);
        // Clearance for the 380px Right HUD so the node is centered in the open viewport
        const clearCenterX = (size.w - 380) / 2;
        const targetCenterX = clearCenterX > 150 ? clearCenterX : size.w / 2;
        setTransform((prev) => ({
          k: Math.max(1.05, prev.k),
          x: targetCenterX - n.x! * targetK,
          y: size.h / 2 - n.y! * targetK,
        }));
      }
    },
    [nodeById, size.w, size.h, transform.k]
  );

  const copyNodeId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const copyNodeJson = (node: SimNode) => {
    navigator.clipboard.writeText(JSON.stringify(node, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  // Filtered nodes based on Search
  const filteredNodeIds = useMemo(() => {
    if (!searchFiles.trim()) return null;
    const q = searchFiles.toLowerCase();
    const set = new Set<string>();
    nodes.forEach((n) => {
      if ((n.label + " " + n.id + " " + (n.sublabel ?? "")).toLowerCase().includes(q)) {
        set.add(n.id);
      }
    });
    return set;
  }, [nodes, searchFiles]);

  // Group real API nodes by Case for the left file explorer
  const caseFileGroups = useMemo(() => {
    const map = new Map<string, { summary: ApiCaseSummary; items: SimNode[] }>();

    cases.forEach((c) => {
      map.set(c.case_id, { summary: c, items: [] });
    });

    nodes.forEach((n) => {
      const hubCase = n.id.startsWith("HUB_") ? n.id.replace("HUB_", "") : null;
      const caseId =
        hubCase ||
        (n.details as Record<string, unknown>)?.case_id ||
        (Array.isArray((n.details as Record<string, unknown>)?.source_cases)
          ? ((n.details as Record<string, unknown>)?.source_cases as string[])[0]
          : null);

      if (caseId && map.has(String(caseId))) {
        map.get(String(caseId))!.items.push(n);
      }
    });

    return Array.from(map.entries()).map(([cid, data]) => ({
      caseId: cid,
      summary: data.summary,
      items: data.items,
    }));
  }, [cases, nodes]);

  // Multi-case syndicate entities / central brokers (cleaned, no OCR noise)
  const syndicateBrokers = useMemo(() => {
    return nodes.filter((n) => {
      const lbl = (n.label || "").trim();
      if (lbl.length < 4 || lbl.length > 55) return false;
      if (lbl.includes("@") || lbl.includes("www") || lbl.includes(".com") || lbl.includes("http")) return false;
      if (lbl.startsWith("(") || lbl.startsWith('"') || lbl.startsWith("'") || lbl.startsWith("[") || lbl.startsWith("{")) return false;
      if (/^(with\s+|persons?\s+|Name:|Passport|Plot\s+|Accused\s+I|F-II|qr|qR|gR|fe\s+|ae\s+|Cle\s+|Unknown|Source)/i.test(lbl)) return false;
      if (/\b(particulars|report|repoiit|memo|information)\b/i.test(lbl)) return false;
      const sc = (n.details as Record<string, unknown>)?.source_cases;
      const isMulti = Array.isArray(sc) && sc.length > 1;
      return isMulti || (n.is_broker && (n.label.includes(" ") || n.label.startsWith("M/s")));
    });
  }, [nodes]);

  // Group real API cases by CBI Police Station / Branch for clean hierarchy
  const branchGroups = useMemo(() => {
    const bMap = new Map<string, { branchName: string; cases: typeof caseFileGroups }>();

    caseFileGroups.forEach((cg) => {
      const ps = cg.summary.police_station || "CBI General Investigation";
      if (!bMap.has(ps)) {
        bMap.set(ps, { branchName: ps, cases: [] });
      }
      bMap.get(ps)!.cases.push(cg);
    });

    const q = (sidebarSearch || "").trim().toLowerCase();
    if (!q) return Array.from(bMap.values());

    const filtered: { branchName: string; cases: typeof caseFileGroups }[] = [];
    bMap.forEach((bg) => {
      const matchB = bg.branchName.toLowerCase().includes(q);
      const matchedCases = bg.cases.filter(
        (c) =>
          matchB ||
          c.summary.fir_number.toLowerCase().includes(q) ||
          c.items.some((it) => it.label.toLowerCase().includes(q))
      );
      if (matchedCases.length > 0) {
        filtered.push({ branchName: bg.branchName, cases: matchedCases });
      }
    });
    return filtered;
  }, [caseFileGroups, sidebarSearch]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const closeTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    setOpenTabs((tabs) => tabs.filter((t) => t.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab("graph");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#16161a] text-sm font-semibold text-[#a1a1aa] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#a855f7] border-t-transparent" />
          <span className="tracking-wide">LOADING CASE DATABASE FROM API…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#16161a] p-8 text-center text-sm text-red-400 font-sans">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-red-900/60 bg-red-950/30 p-6 shadow-2xl">
          <ShieldAlert className="size-8 text-red-400" />
          <p className="font-semibold text-white">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded border border-red-800 bg-red-900/40 px-3 py-1.5 text-xs text-red-200 hover:bg-red-900"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden font-sans select-none transition-colors duration-150 ${
        isDark ? "bg-[#090a0f] text-zinc-200" : "bg-[#f5f3ec] text-[#1c1d22]"
      }`}
    >
      {/* ── 1. TOP TITLE BAR & OBSIDIAN TABS ────────────────────────────── */}
      <header
        className={`flex h-11 shrink-0 items-center justify-between border-b px-3 transition-colors ${
          isDark
            ? "border-zinc-800/80 bg-[#0e0f14] text-[#8c8c96]"
            : "border-[#e8e4da] bg-[#faf8f4] text-[#7a7b83]"
        }`}
      >
        {/* Left window actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            title="Toggle Left Sidebar"
            className={`flex size-8 items-center justify-center rounded p-1 transition-colors ${
              isDark ? "text-[#8c8c96] hover:bg-[#23232b] hover:text-white" : "text-[#7a7b83] hover:bg-[#ede8dc] hover:text-[#1c1d22]"
            }`}
          >
            <div className="size-4 border border-current rounded-sm flex">
              <div className="w-1.5 border-r border-current bg-current" />
            </div>
          </button>
          <button className={`flex size-8 items-center justify-center rounded transition-colors ${isDark ? "text-[#8c8c96] hover:bg-[#23232b] hover:text-white" : "text-[#7a7b83] hover:bg-[#ede8dc] hover:text-[#1c1d22]"}`}>
            <Folder className="size-4" />
          </button>
          <button className={`flex size-8 items-center justify-center rounded transition-colors ${isDark ? "text-[#8c8c96] hover:bg-[#23232b] hover:text-white" : "text-[#7a7b83] hover:bg-[#ede8dc] hover:text-[#1c1d22]"}`}>
            <Search className="size-4" />
          </button>
          <button className={`flex size-8 items-center justify-center rounded transition-colors ${isDark ? "text-[#8c8c96] hover:bg-[#23232b] hover:text-white" : "text-[#7a7b83] hover:bg-[#ede8dc] hover:text-[#1c1d22]"}`}>
            <Bookmark className="size-4" />
          </button>
        </div>

        {/* Center Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[65vw]">
          {openTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "graph" && tab.id !== "syndicate-index") {
                    focusNode(tab.id);
                  }
                }}
                className={`group flex items-center gap-2 rounded-t-lg px-4 py-2 cursor-pointer text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? isDark
                      ? "bg-[#222228] text-white shadow-xs"
                      : "bg-white text-[#1c1d22] shadow-xs border-t border-x border-[#e8e4da]"
                    : isDark
                    ? "bg-transparent text-[#8c8c96] hover:bg-[#1c1c22] hover:text-[#d4d4d8]"
                    : "bg-transparent text-[#7a7b83] hover:bg-[#ede8dc] hover:text-[#1c1d22]"
                }`}
              >
                {tab.id === "graph" ? (
                  <Network className="size-3.5 text-[#a855f7]" />
                ) : (
                  <FileText className="size-3.5 text-current" />
                )}
                <span className="truncate max-w-[170px]">{tab.label}</span>
                {tab.id !== "graph" && (
                  <button
                    onClick={(e) => closeTab(e, tab.id)}
                    className="rounded-sm p-0.5 text-current opacity-70 hover:opacity-100 ml-1"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* New Tab Button */}
          <button
            onClick={() => fitView()}
            title="Fit Graph View"
            className={`flex size-8 items-center justify-center rounded shrink-0 transition-colors ${
              isDark ? "text-[#8c8c96] hover:bg-[#23232b] hover:text-white" : "text-[#7a7b83] hover:bg-[#ede8dc] hover:text-[#1c1d22]"
            }`}
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* Right Window Controls */}
        <div className="flex items-center gap-2">
          <button className={`flex size-8 items-center justify-center transition-colors ${isDark ? "text-[#8c8c96] hover:bg-[#23232b] hover:text-white" : "text-[#7a7b83] hover:bg-[#ede8dc] hover:text-[#1c1d22]"}`}>
            <Minus className="size-4" />
          </button>
          <button className={`flex size-8 items-center justify-center transition-colors ${isDark ? "text-[#8c8c96] hover:bg-[#23232b] hover:text-white" : "text-[#7a7b83] hover:bg-[#ede8dc] hover:text-[#1c1d22]"}`}>
            <Square className="size-3.5" />
          </button>
          <button className="flex size-8 items-center justify-center text-[#8c8c96] hover:bg-rose-900/60 hover:text-white transition-colors">
            <X className="size-4" />
          </button>
        </div>
      </header>

      {/* ── 2. WORKSPACE BODY: RIBBON + SIDEBAR + GRAPH PANE ────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Leftmost Vertical Activity Bar (Ribbon) ── */}
        <div
          className={`flex w-11 shrink-0 flex-col items-center justify-between border-r py-3 transition-colors ${
            isDark ? "border-[#222227] bg-[#141417] text-[#8c8c96]" : "border-[#e8e4da] bg-[#f4efe4] text-[#7a7b83]"
          }`}
        >
          <div className="flex flex-col items-center gap-3.5">
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              title="Expand/Collapse Sidebar"
              className={`flex size-8 items-center justify-center rounded transition-colors ${
                isDark ? "hover:bg-[#23232b] hover:text-white text-[#8c8c96]" : "hover:bg-[#e4ded0] hover:text-[#1c1d22] text-[#7a7b83]"
              }`}
            >
              <div className="size-4 border border-current rounded-sm flex">
                <div className="w-1.5 border-r border-current bg-current" />
              </div>
            </button>
            <button
              title="Quick Switcher"
              className={`flex size-8 items-center justify-center rounded transition-colors ${
                isDark ? "hover:bg-[#23232b] hover:text-white text-[#8c8c96]" : "hover:bg-[#e4ded0] hover:text-[#1c1d22] text-[#7a7b83]"
              }`}
            >
              <FileCode className="size-4" />
            </button>
            <button
              title="Graph View"
              className={`flex size-8 items-center justify-center rounded transition-colors ${
                isDark ? "bg-[#25252e] text-white" : "bg-white text-[#1c1d22] shadow-xs border border-[#ded8cb]"
              }`}
            >
              <Network className="size-4 text-[#a855f7]" />
            </button>
            <button
              title="Canvas"
              className={`flex size-8 items-center justify-center rounded transition-colors ${
                isDark ? "hover:bg-[#23232b] hover:text-white text-[#8c8c96]" : "hover:bg-[#e4ded0] hover:text-[#1c1d22] text-[#7a7b83]"
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              title="Daily Notes"
              className={`flex size-8 items-center justify-center rounded transition-colors ${
                isDark ? "hover:bg-[#23232b] hover:text-white text-[#8c8c96]" : "hover:bg-[#e4ded0] hover:text-[#1c1d22] text-[#7a7b83]"
              }`}
            >
              <Calendar className="size-4" />
            </button>
            <button
              title="Templates"
              className={`flex size-8 items-center justify-center rounded transition-colors ${
                isDark ? "hover:bg-[#23232b] hover:text-white text-[#8c8c96]" : "hover:bg-[#e4ded0] hover:text-[#1c1d22] text-[#7a7b83]"
              }`}
            >
              <Sparkles className="size-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3.5">
            <button
              title="Help"
              className={`flex size-8 items-center justify-center rounded transition-colors ${
                isDark ? "hover:bg-[#23232b] hover:text-white text-[#8c8c96]" : "hover:bg-[#e4ded0] hover:text-[#1c1d22] text-[#7a7b83]"
              }`}
            >
              <HelpCircle className="size-4" />
            </button>
            <button
              title="Settings"
              className={`flex size-8 items-center justify-center rounded transition-colors ${
                isDark ? "hover:bg-[#23232b] hover:text-white text-[#8c8c96]" : "hover:bg-[#e4ded0] hover:text-[#1c1d22] text-[#7a7b83]"
              }`}
            >
              <Settings className="size-4" />
            </button>
          </div>
        </div>

        {/* ── Left Collapsible File Explorer: REAL CASE FILES FROM API ── */}
        {sidebarOpen && (
          <aside
            className={`flex w-84 xl:w-96 shrink-0 flex-col border-r transition-colors ${
              isDark
                ? "border-zinc-800/80 bg-[#0c0d12] text-[#a1a1aa]"
                : "border-[#e8e4da] bg-[#f9f8f4] text-[#4a4b52]"
            }`}
          >
            {/* Action Bar & Quick Search */}
            <div
              className={`flex flex-col border-b p-3.5 gap-2.5 transition-colors ${
                isDark ? "border-zinc-800/80 text-zinc-400" : "border-[#e8e4da] text-[#7a7b83]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-white" : "text-[#1c1d22]"
                  }`}
                >
                  CBI Evidence Vault
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedFolders({})}
                    title="Collapse All Folders"
                    className={`rounded-md p-1 transition-colors ${
                      isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-[#ede8dc] hover:text-[#1c1d22]"
                    }`}
                  >
                    <ChevronsDownUp className="size-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const allB: Record<string, boolean> = {};
                      branchGroups.forEach((bg) => {
                        allB[bg.branchName] = true;
                      });
                      setExpandedFolders(allB);
                    }}
                    title="Expand All Branches"
                    className={`rounded-md p-1 transition-colors ${
                      isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-[#ede8dc] hover:text-[#1c1d22]"
                    }`}
                  >
                    <FolderOpen className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search
                  className={`absolute left-3 top-2.5 size-3.5 ${
                    isDark ? "text-zinc-400" : "text-[#9e9ea5]"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Filter branches, FIRs, accused..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className={`w-full rounded-xl border py-1.5 pl-9 pr-3 text-xs outline-none transition ${
                    isDark
                      ? "border-zinc-800 bg-zinc-900/90 text-white placeholder-zinc-400 focus:border-purple-500/60"
                      : "border-[#e4dfd3] bg-white text-[#1c1d22] placeholder-[#9e9ea5] focus:border-[#d29b28]"
                  }`}
                />
              </div>
            </div>

            {/* Case Hierarchy Tree: Branches -> Cases -> Entities */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 text-xs">
              {/* Documentation Vault (6.3s Force Graph Files) */}
              <div className="mb-2">
                <div
                  onClick={() => toggleFolder("doc-vault")}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 cursor-pointer font-bold transition-colors ${
                    isDark ? "text-white hover:bg-[#1e1e24]" : "text-[#1c1d22] hover:bg-[#ede8dc]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {expandedFolders["doc-vault"] !== false ? (
                      <FolderOpen className="size-4 text-amber-500 shrink-0" />
                    ) : (
                      <Folder className="size-4 text-amber-500 shrink-0" />
                    )}
                    <span className={`truncate text-[12px] ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                      📂 Documentation Vault (6.3s Build)
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-500 font-mono px-2 py-0.5 rounded bg-amber-500/15">
                    9 files
                  </span>
                </div>

                {expandedFolders["doc-vault"] !== false && (
                  <div className={`pl-3 space-y-0.5 border-l ml-3.5 mt-1 ${isDark ? "border-[#24242d]" : "border-[#e8e4da]"}`}>
                    {DOC_NODES.map((d) => {
                      const isSelected = selectedDocId === d.id && graphMode === "doc-build";
                      return (
                        <div
                          key={d.id}
                          onClick={() => {
                            setGraphMode("doc-build");
                            focusDocNode(d.id);
                          }}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                            isSelected
                              ? isDark ? "bg-[#25252e] text-amber-400 font-bold" : "bg-amber-100 text-amber-900 font-bold"
                              : isDark ? "hover:bg-[#1e1e24] text-zinc-300" : "hover:bg-[#ede8dc] text-zinc-700"
                          }`}
                        >
                          <FileText className="size-3.5 text-amber-500/80 shrink-0" />
                          <span className="truncate text-xs font-mono">{d.filename}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Master Syndicate Folder (Cleaned) */}
              <div>
                <div
                  onClick={() => toggleFolder("syndicate")}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 cursor-pointer font-bold transition-colors ${
                    isDark ? "text-white hover:bg-[#1e1e24]" : "text-[#1c1d22] hover:bg-[#ede8dc]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {expandedFolders["syndicate"] ? (
                      <FolderOpen className="size-4 text-[#e5851d] shrink-0" />
                    ) : (
                      <Folder className="size-4 text-[#e5851d] shrink-0" />
                    )}
                    <span className={`truncate text-[12px] ${isDark ? "text-[#fbbf24]" : "text-[#b87c12]"}`}>
                      ⚡ Cross-Case Syndicates
                    </span>
                  </div>
                  <span className="text-[10px] text-[#e5851d] font-mono px-2 py-0.5 rounded bg-[#e5851d]/15">
                    {syndicateBrokers.length}
                  </span>
                </div>

                {expandedFolders["syndicate"] && (
                  <div className={`pl-3 space-y-1 border-l ml-3.5 mt-1 ${isDark ? "border-[#24242d]" : "border-[#e8e4da]"}`}>
                    {syndicateBrokers.length === 0 ? (
                      <div className={`text-[11px] p-1 ${isDark ? "text-[#71717a]" : "text-[#8c8c96]"}`}>
                        No cross-case brokers found.
                      </div>
                    ) : (
                      syndicateBrokers.map((brok) => {
                        const isSelected = selectedNodeId === brok.id;
                        return (
                          <div
                            key={brok.id}
                            onClick={() => focusNode(brok.id)}
                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                              isSelected
                                ? isDark ? "bg-[#25252e] text-white font-bold" : "bg-[#202126] text-white font-bold"
                                : isDark ? "hover:bg-[#1e1e24] hover:text-[#d4d4d8] text-[#d4d4d8]" : "hover:bg-[#ede8dc] hover:text-[#1c1d22] text-[#4a4b52]"
                            }`}
                          >
                            <Flame className="size-3 text-red-400 shrink-0" />
                            <span className="truncate text-xs font-medium">{brok.label}.md</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Grouped by CBI Branch / Police Station */}
              {branchGroups.map((bg) => {
                const isBranchOpen = Boolean(expandedFolders[bg.branchName]);
                return (
                  <div key={bg.branchName} className="space-y-0.5">
                    {/* Branch Folder */}
                    <div
                      onClick={() => toggleFolder(bg.branchName)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 cursor-pointer font-semibold transition-colors ${
                        isDark ? "text-[#e4e4e7] hover:bg-[#1e1e24]" : "text-[#1c1d22] hover:bg-[#ede8dc]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isBranchOpen ? (
                          <FolderOpen className="size-4 text-[#a855f7] shrink-0" />
                        ) : (
                          <Folder className="size-4 text-[#a855f7] shrink-0" />
                        )}
                        <span className={`truncate text-[12px] font-bold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                          {bg.branchName}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#a855f7] font-mono px-2 py-0.5 rounded bg-[#a855f7]/15 shrink-0 ml-1">
                        {bg.cases.length} FIRs
                      </span>
                    </div>

                    {/* FIR Cases inside this Branch */}
                    {isBranchOpen && (
                      <div className={`pl-3 space-y-1 border-l ml-3.5 mt-0.5 ${isDark ? "border-[#24242d]" : "border-[#e8e4da]"}`}>
                        {bg.cases.map(({ caseId, summary, items }) => {
                          const isCaseOpen = Boolean(expandedFolders[caseId]);
                          const hubNode = items.find((it) => it.id.startsWith("HUB_"));
                          return (
                            <div key={caseId} className="space-y-0.5">
                              <div
                                onClick={() => {
                                  toggleFolder(caseId);
                                  if (hubNode) focusNode(hubNode.id);
                                }}
                                className={`flex items-center justify-between rounded-md px-2 py-1 cursor-pointer transition-colors ${
                                  isDark ? "text-[#d4d4d8] hover:bg-[#1f1f27]" : "text-[#3a3b42] hover:bg-[#ede8dc]"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isCaseOpen ? (
                                    <FolderOpen className="size-3.5 text-[#c084fc] shrink-0" />
                                  ) : (
                                    <FileText className="size-3.5 text-[#c084fc] shrink-0" />
                                  )}
                                  <span className={`truncate text-[11px] font-semibold ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                                    FIR {summary.fir_number}
                                  </span>
                                </div>
                                <span className={`text-[9px] font-mono ${isDark ? "text-[#71717a]" : "text-[#8c8c96]"}`}>
                                  {items.length} nodes
                                </span>
                              </div>

                              {/* Entities inside Case */}
                              {isCaseOpen && (
                                <div className={`pl-3 space-y-0.5 border-l ml-2 mt-0.5 ${isDark ? "border-[#2e2e38]" : "border-[#e8e4da]"}`}>
                                  {items.slice(0, 15).map((doc) => {
                                    const isSelected = selectedNodeId === doc.id;
                                    return (
                                      <div
                                        key={doc.id}
                                        onClick={() => focusNode(doc.id)}
                                        className={`flex items-center gap-1.5 rounded px-2 py-1 cursor-pointer transition-colors ${
                                          isSelected
                                            ? isDark ? "bg-[#25252e] text-white font-bold" : "bg-[#202126] text-white font-bold"
                                            : isDark ? "hover:bg-[#1e1e24] hover:text-[#d4d4d8] text-[#a1a1aa]" : "hover:bg-[#ede8dc] hover:text-[#1c1d22] text-[#4b4c55]"
                                        }`}
                                      >
                                        <div
                                          className="size-1.5 rounded-full shrink-0"
                                          style={{ backgroundColor: getNodeColor(doc) }}
                                        />
                                        <span className="truncate text-[11px]">{doc.label}.md</span>
                                      </div>
                                    );
                                  })}
                                  {items.length > 15 && (
                                    <div className={`px-2 py-0.5 text-[10px] font-mono italic ${isDark ? "text-[#71717a]" : "text-[#8c8c96]"}`}>
                                      + {items.length - 15} more entities
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Vault Footer with 500 Ingested Files */}
            <div
              className={`flex h-11 items-center justify-between border-t px-3 text-xs transition-colors ${
                isDark ? "border-[#222228] bg-[#0c0d12] text-[#8c8c96]" : "border-[#e8e4da] bg-[#f9f8f4] text-[#7a7b83]"
              }`}
            >
              <div
                onClick={() => fitView()}
                title="NyayaGraph Live API Case Vault"
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  isDark ? "hover:text-white" : "hover:text-[#1c1d22]"
                }`}
              >
                <Shield className="size-4 text-emerald-500" />
                <span className={`truncate font-bold text-xs ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                  Nyaya_Case_Vault
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-semibold ${isDark ? "text-[#f5b838]" : "text-[#b87c12]"}`}>
                  500 Ingested Files
                </span>
                <Settings className={`size-4 cursor-pointer transition-colors ${isDark ? "hover:text-white" : "hover:text-[#1c1d22]"}`} />
              </div>
            </div>
          </aside>
        )}

        {/* ── Main View Area (Inner Header + Graph Canvas) ── */}
        <div
          className={`flex flex-1 flex-col overflow-hidden p-2.5 transition-colors ${
            isDark ? "bg-[#16161a]" : "bg-[#f0ece2]"
          }`}
        >
          {/* Inner Header Bar */}
          <div
            className={`flex h-9 shrink-0 items-center justify-between px-2 text-xs ${
              isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => fitView()}
                title="Fit to Screen"
                className={`p-1 transition-colors ${isDark ? "hover:text-white" : "hover:text-[#1c1d22]"}`}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                title="Forward"
                className={`p-1 transition-colors ${isDark ? "hover:text-white" : "hover:text-[#1c1d22]"}`}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            {/* Mode Switcher Buttons */}
            <div
              className={`flex items-center gap-1 rounded-lg border p-0.5 transition-colors ${
                isDark ? "border-[#2a2c38] bg-[#14151c]" : "border-[#e5e0d5] bg-[#ede8dc]"
              }`}
            >
              <button
                onClick={() => {
                  setGraphMode("doc-build");
                  replayDocAnimation();
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  graphMode === "doc-build"
                    ? isDark
                      ? "bg-amber-500 text-black shadow-xs"
                      : "bg-amber-600 text-white shadow-xs"
                    : isDark
                    ? "text-[#8c90a2] hover:text-white"
                    : "text-[#65666e] hover:text-[#1c1d22]"
                }`}
              >
                <Play className="size-3 fill-current" />
                <span>6.3s Doc Build-Out (Demo Video)</span>
              </button>
              <button
                onClick={() => {
                  setGraphMode("cbi-syndicate");
                  setTimeout(() => fitView(), 50);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  graphMode === "cbi-syndicate"
                    ? isDark
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-purple-700 text-white shadow-xs"
                    : isDark
                    ? "text-[#8c90a2] hover:text-white"
                    : "text-[#65666e] hover:text-[#1c1d22]"
                }`}
              >
                <Network className="size-3" />
                <span>CBI Case Syndicate (500 Files • 2,744 Nodes)</span>
              </button>
            </div>

            <button
              onClick={() => replayAnimation()}
              title="Replay sequence"
              className={`p-1 transition-colors ${isDark ? "hover:text-white" : "hover:text-[#1c1d22]"}`}
            >
              <RotateCcw className="size-4 text-amber-500" />
            </button>
          </div>

          {/* Graph Rounded Container */}
          <div
            ref={wrapRef}
            className={`relative flex-1 overflow-hidden rounded-2xl border transition-colors ${
              isDark ? "border-[#1c1d24] bg-[#08090c]" : "border-[#e8e4da] bg-[#f5f3ec]"
            }`}
          >
            {/* 6.3-Second Cinematic Doc Build-Out Live Status Banner */}
            {graphMode === "doc-build" && isPlaying6s && (
              <div
                className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-md transition-all ${
                  isDark
                    ? "border-amber-500/30 bg-[#0e0e12]/95 text-amber-400"
                    : "border-amber-500/30 bg-white/95 text-amber-800"
                }`}
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                </span>
                <span>
                  {docPhase === "idle"
                    ? "0.0–0.6s • Root Node 'index' Breathing (Idle)..."
                    : docPhase === "spawning"
                    ? `0.6–5.5s • Spawning Node ${docStep}/8: ${DOC_NODES[docStep]?.label}`
                    : docPhase === "settling"
                    ? "5.5–6.0s • Settle into Resting Layout..."
                    : "6.0–6.3s • Cursor Entering (Interactive Preview)"}
                </span>
                <button
                  onClick={skipDocAnimation}
                  className={`ml-1 rounded px-2 py-0.5 text-[11px] font-bold transition-colors ${
                    isDark
                      ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300"
                      : "bg-amber-100 hover:bg-amber-200 text-amber-900"
                  }`}
                >
                  Skip
                </button>
              </div>
            )}

            {/* Ultra-Fluid Organic Animation Styles for Node Pop-in, Idle Breathing & Edge Connect */}
            <style>{`
              @keyframes docIdlePulse {
                0%, 100% {
                  transform: scale(1);
                  opacity: 0.85;
                }
                50% {
                  transform: scale(1.18);
                  opacity: 1;
                }
              }
              @keyframes docNodePop {
                0% {
                  transform: scale(0);
                  opacity: 0;
                }
                65% {
                  transform: scale(1.12);
                  opacity: 0.95;
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
              .doc-node-pulse {
                animation: docIdlePulse 1.4s ease-in-out infinite;
                transform-origin: 0 0;
              }
              .doc-node-entrance {
                animation: docNodePop 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
                transform-origin: 0 0;
              }
              .doc-graph-edge {
                transition: x1 0.55s cubic-bezier(0.22, 1, 0.36, 1),
                            y1 0.55s cubic-bezier(0.22, 1, 0.36, 1),
                            x2 0.55s cubic-bezier(0.22, 1, 0.36, 1),
                            y2 0.55s cubic-bezier(0.22, 1, 0.36, 1);
              }
            `}</style>

            {/* SVG Interactive Obsidian Canvas */}
            <svg
              ref={svgRef}
              className="h-full w-full block cursor-grab active:cursor-grabbing select-none"
              onWheel={(e) => {
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                const mx = e.clientX - r.left;
                const my = e.clientY - r.top;
                if (graphMode === "doc-build") {
                  const k2 = Math.min(3.5, Math.max(0.3, docTransform.k * Math.exp(-e.deltaY * 0.0015)));
                  setDocTransform({
                    k: k2,
                    x: mx - ((mx - docTransform.x) / docTransform.k) * k2,
                    y: my - ((my - docTransform.y) / docTransform.k) * k2,
                  });
                } else {
                  const k2 = Math.min(4.0, Math.max(0.10, transform.k * Math.exp(-e.deltaY * 0.0015)));
                  setTransform({
                    k: k2,
                    x: mx - ((mx - transform.x) / transform.k) * k2,
                    y: my - ((my - transform.y) / transform.k) * k2,
                  });
                }
              }}
              onPointerDown={(e) => {
                if (
                  (e.target as Element).closest("circle") ||
                  (e.target as Element).closest("text") ||
                  (e.target as Element).closest("button")
                )
                  return;
                panRef.current = {
                  sx: e.clientX,
                  sy: e.clientY,
                  ox: graphMode === "doc-build" ? docTransform.x : transform.x,
                  oy: graphMode === "doc-build" ? docTransform.y : transform.y,
                };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (dragRef.current) {
                  const dragId = dragRef.current.id;
                  if (dragId.startsWith("doc_")) {
                    const docId = dragId.replace("doc_", "");
                    if (pointerDownPosRef.current) {
                      const dx = e.clientX - pointerDownPosRef.current.x;
                      const dy = e.clientY - pointerDownPosRef.current.y;
                      if (Math.hypot(dx, dy) > 4) {
                        didDragNodeRef.current = true;
                      }
                    }
                    if (didDragNodeRef.current) {
                      const p = toDocWorld(e.clientX, e.clientY, e.currentTarget);
                      setDraggedDocNodes((prev) => ({
                        ...prev,
                        [docId]: { x: p.x, y: p.y },
                      }));
                    }
                    return;
                  }
                  const n = nodes.find((node) => node.id === dragId);
                  if (n) {
                    if (pointerDownPosRef.current) {
                      const dx = e.clientX - pointerDownPosRef.current.x;
                      const dy = e.clientY - pointerDownPosRef.current.y;
                      if (Math.hypot(dx, dy) > 4) {
                        didDragNodeRef.current = true;
                      }
                    }
                    if (didDragNodeRef.current) {
                      const p = toWorld(e.clientX, e.clientY, e.currentTarget);
                      n.fx = p.x;
                      n.fy = p.y;
                      n.x = p.x;
                      n.y = p.y;
                      setTick((t) => t + 1);
                    }
                  }
                  return;
                }
                if (panRef.current) {
                  const { ox, oy, sx, sy } = panRef.current;
                  const nx = ox + (e.clientX - sx);
                  const ny = oy + (e.clientY - sy);
                  if (graphMode === "doc-build") {
                    setDocTransform((t) => ({ ...t, x: nx, y: ny }));
                  } else {
                    setTransform((t) => ({ ...t, x: nx, y: ny }));
                  }
                }
              }}
              onPointerUp={(e) => {
                if (dragRef.current && dragRef.current.id.startsWith("doc_")) {
                  const docId = dragRef.current.id.replace("doc_", "");
                  if (!didDragNodeRef.current) {
                    focusDocNode(docId);
                  }
                  dragRef.current = null;
                  pointerDownPosRef.current = null;
                  didDragNodeRef.current = false;
                  try {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    }
                  } catch {}
                  return;
                }
                if (dragRef.current && !didDragNodeRef.current) {
                  // Mouse released without drag movement -> Definitive click!
                  focusNode(dragRef.current.id);
                }
                dragRef.current = null;
                panRef.current = null;
                pointerDownPosRef.current = null;
                didDragNodeRef.current = false;
                try {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                } catch {}
              }}
            >
              <defs>
                {/* 6.3s Doc Build-Out Directed Arrowhead Marker */}
                <marker
                  id="doc-arrow-marker"
                  viewBox="0 0 10 10"
                  refX="17"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M 0 2 L 7 5 L 0 8"
                    fill={isDark ? "#71717a" : "#64748b"}
                    stroke={isDark ? "#71717a" : "#64748b"}
                    strokeWidth="1.2"
                  />
                </marker>
                {/* Directed Edge Arrowhead (Default Sharp) */}
                <marker
                  id="obs-arrow-exact"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M 0 1.5 L 8 5 L 0 8.5"
                    fill={isDark ? "#71717a" : "#64748b"}
                    stroke={isDark ? "#71717a" : "#64748b"}
                    strokeWidth="1.2"
                  />
                </marker>
                {/* Cross-case Bridge Arrowhead */}
                <marker
                  id="obs-arrow-bridge"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M 0 1.5 L 8 5 L 0 8.5"
                    fill={isDark ? "#f59e0b" : "#d97706"}
                    stroke={isDark ? "#f59e0b" : "#d97706"}
                    strokeWidth="1.4"
                  />
                </marker>
                {/* Active Selection Connection Arrowhead */}
                <marker
                  id="obs-arrow-selected"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M 0 1.5 L 8 5 L 0 8.5"
                    fill={isDark ? "#f59e0b" : "#ea580c"}
                    stroke={isDark ? "#f59e0b" : "#ea580c"}
                    strokeWidth="1.4"
                  />
                </marker>
              </defs>

              {graphMode === "doc-build" ? (
                <g transform={`translate(${docTransform.x},${docTransform.y}) scale(${docTransform.k})`}>
                  {/* ── 6.3s Doc Build-Out Directed Edges ── */}
                  {visibleDocEdges.map((e) => {
                    const p1 = getDocNodePos(e.source);
                    const p2 = getDocNodePos(e.target);
                    const isHighlighted = selectedDocId === e.source || selectedDocId === e.target;
                    return (
                      <line
                        key={e.id}
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={isHighlighted ? (isDark ? "#38bdf8" : "#0284c7") : (isDark ? "#52525b" : "#94a3b8")}
                        strokeWidth={isHighlighted ? 1.8 : 1.2}
                        strokeOpacity={isDark ? (isHighlighted ? 0.95 : 0.65) : (isHighlighted ? 0.95 : 0.75)}
                        className="doc-graph-edge"
                        markerEnd="url(#doc-arrow-marker)"
                      />
                    );
                  })}

                  {/* ── 6.3s Doc Build-Out Solid Light-Gray Nodes ── */}
                  {visibleDocNodes.map((n) => {
                    const pos = getDocNodePos(n.id);
                    const isRoot = n.id === "index";
                    const isSelected = selectedDocId === n.id;
                    const isHovered = hoverDocId === n.id;
                    const r = isRoot ? 11 : 9; // ~8-10px radius per spec

                    return (
                      <g
                        key={n.id}
                        className="cursor-pointer"
                        style={{
                          transform: `translate(${pos.x}px, ${pos.y}px)`,
                          transition: docPhase === "interactive" && dragRef.current ? "none" : "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          if (docPhase !== "interactive") return;
                          dragRef.current = { id: `doc_${n.id}` };
                          didDragNodeRef.current = false;
                          pointerDownPosRef.current = { id: n.id, x: e.clientX, y: e.clientY, time: Date.now() };
                          try {
                            (e.target as Element).setPointerCapture?.(e.pointerId);
                          } catch {}
                        }}
                        onPointerEnter={() => setHoverDocId(n.id)}
                        onPointerLeave={() => setHoverDocId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          focusDocNode(n.id);
                        }}
                      >
                        {/* Inner group with scale pop-in or idle pulse around local (0, 0) */}
                        <g className={isRoot && docPhase === "idle" ? "doc-node-pulse" : "doc-node-entrance"}>
                          {/* Transparent hit area for effortless clicking */}
                          <circle cx={0} cy={0} r={r + 14} fill="transparent" />

                          {/* Selection or Hover highlight ring */}
                          {(isSelected || isHovered) && (
                            <circle
                              cx={0}
                              cy={0}
                              r={r + 6}
                              fill="none"
                              stroke={isSelected ? "#e5851d" : isDark ? "#38bdf8" : "#0284c7"}
                              strokeWidth={1.5}
                              strokeOpacity={0.85}
                            />
                          )}

                          {/* Solid Light-Gray Node Circle (~8–10px radius per spec) */}
                          <circle
                            cx={0}
                            cy={0}
                            r={r}
                            fill={
                              isSelected
                                ? "#ffffff"
                                : isHovered
                                ? isDark ? "#e2e8f0" : "#334155"
                                : isDark ? "#cbd5e1" : "#475569"
                            }
                            stroke={isDark ? "#1e293b" : "#f1f5f9"}
                            strokeWidth={1.5}
                          />

                          {/* Label directly below each node in light-gray sans-serif text */}
                          <g className="pointer-events-none select-none">
                            <text
                              x={0}
                              y={r + 16}
                              textAnchor="middle"
                              fill={
                                isSelected
                                  ? (isDark ? "#ffffff" : "#0f172a")
                                  : isHovered
                                  ? (isDark ? "#38bdf8" : "#0284c7")
                                  : (isDark ? "#94a3b8" : "#475569")
                              }
                              fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                              fontSize={isRoot ? 12 : 11}
                              fontWeight={isSelected || isRoot ? 600 : 500}
                            >
                              {n.label}
                            </text>
                          </g>
                        </g>
                      </g>
                    );
                  })}

                  {/* Animated Mouse Cursor in 6.0-6.3s window */}
                  {cursorVisible && (
                    <g
                      className="pointer-events-none"
                      style={{
                        transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`,
                        opacity: cursorOpacity,
                        transition: "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease",
                      }}
                    >
                      <path
                        d="M 0 0 L 0 16 L 4.5 12.5 L 8 19.5 L 10.5 18 L 7 11.5 L 12.5 11.5 Z"
                        fill="#ffffff"
                        stroke="#08090c"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </g>
              ) : (
                <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
                {/* ── Directed Links from API (Progressively Revealed) ── */}
                {visibleLinks.map((l, idx) => {
                  const s = l.source as SimNode;
                  const t = l.target as SimNode;
                  if (s.x == null || s.y == null || t.x == null || t.y == null) return null;

                  const isDimmed =
                    filteredNodeIds && (!filteredNodeIds.has(s.id) || !filteredNodeIds.has(t.id));
                  const isBridge = l.edge.source_type === "CROSS_CASE";
                  const isConnectedToSelected =
                    selectedNodeId && (s.id === selectedNodeId || t.id === selectedNodeId);

                  // High-contrast edge styling: Slate-500/600 (#64748b) & rich amber (#d97706) in light mode
                  let strokeColor = isBridge
                    ? (isDark ? "#f59e0b" : "#d97706")
                    : (isDark ? "#52525b" : "#64748b");
                  let strokeWidth = (isBridge ? 2.8 : 1.9) * linkThickness;
                  let strokeOpacity = isDimmed ? 0.08 : isBridge ? 0.98 : isDark ? 0.75 : 0.85;

                  if (selectedNodeId) {
                    if (isConnectedToSelected) {
                      strokeColor = isBridge
                        ? (isDark ? "#fbbf24" : "#b45309")
                        : (isDark ? "#f59e0b" : "#ea580c");
                      strokeWidth = (isBridge ? 3.4 : 2.5) * linkThickness;
                      strokeOpacity = 1.0;
                    } else {
                      strokeOpacity = isDark ? 0.15 : 0.10;
                    }
                  }

                  return (
                    <line
                      key={l.edge.id || `${s.id}-${t.id}-${idx}`}
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      strokeDasharray={isBridge ? "5 3" : undefined}
                      className="edge-connect"
                      markerEnd={
                        arrows && (transform.k > 0.55 || isConnectedToSelected || isBridge)
                          ? isConnectedToSelected
                            ? "url(#obs-arrow-selected)"
                            : isBridge
                            ? "url(#obs-arrow-bridge)"
                            : "url(#obs-arrow-exact)"
                          : undefined
                      }
                    />
                  );
                })}

                {/* ── Real Case Nodes from API (Progressively Revealed) ── */}
                {visibleNodes.map((n) => {
                  if (n.x == null || n.y == null) return null;

                  const isFiltered = filteredNodeIds ? filteredNodeIds.has(n.id) : true;
                  const isHovered = hoverNodeId === n.id;
                  const isSelected = selectedNodeId === n.id;
                  const isNodeHub = isHub(n);

                  // Comfortable node radii
                  const r = (isNodeHub ? 20 : n.is_broker ? 16 : n.category === "FACT" ? 13 : 11) * nodeSize;

                  const opacity = isFiltered
                    ? selectedNodeId
                      ? isSelected || neighbors.get(selectedNodeId)?.has(n.id)
                        ? 1
                        : 0.35
                      : 1
                    : 0.15;
                  const circleColor = isSelected ? "#ffffff" : getNodeColor(n);

                  // Root node check for CBI syndicate graph
                  const isRootInIdle = false;
                  const isInteractive = isSelected || isHovered;
                  const isHighPriority = isNodeHub || Boolean(n.is_broker);
                  const showText =
                    isInteractive ||
                    labelMode === "all" ||
                    (labelMode === "hubs" && isHighPriority) ||
                    (labelMode === "smart" && (isHighPriority ? transform.k > 0.22 : transform.k > 0.85));
                  const shouldShowText = isRootInIdle || showText;

                  const handleNodePointerDown = (e: React.PointerEvent) => {
                    e.stopPropagation();
                    dragRef.current = { id: n.id };
                    didDragNodeRef.current = false;
                    pointerDownPosRef.current = { id: n.id, x: e.clientX, y: e.clientY, time: Date.now() };
                    try {
                      (e.target as Element).setPointerCapture?.(e.pointerId);
                    } catch {}
                  };

                  const handleNodePointerUp = (e: React.PointerEvent) => {
                    e.stopPropagation();
                    try {
                      (e.target as Element).releasePointerCapture?.(e.pointerId);
                    } catch {}
                    if (!didDragNodeRef.current) {
                      if (isTimelinePlaying) {
                        skipAnimation();
                      }
                      focusNode(n.id);
                    }
                    dragRef.current = null;
                    pointerDownPosRef.current = null;
                    didDragNodeRef.current = false;
                  };

                  const handleNodeClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (isTimelinePlaying) {
                      skipAnimation();
                    }
                    focusNode(n.id);
                  };

                  return (
                    <g
                      key={n.id}
                      opacity={opacity}
                      onPointerEnter={() => setHoverNodeId(n.id)}
                      onPointerLeave={() => setHoverNodeId(null)}
                      onClick={handleNodeClick}
                      onDoubleClick={() => {
                        if (isTimelinePlaying) {
                          skipAnimation();
                        }
                        focusNode(n.id);
                      }}
                      className={`cursor-pointer ${isRootInIdle ? "node-idle-breathing" : "node-pop"}`}
                      style={{
                        transformOrigin: `${n.x}px ${n.y}px`,
                      }}
                    >
                      {/* Transparent hit area for effortless clicking */}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={r + 14}
                        fill="transparent"
                        className="cursor-pointer"
                        onPointerDown={handleNodePointerDown}
                        onPointerUp={handleNodePointerUp}
                        onClick={handleNodeClick}
                      />

                      {/* Selection ring & animated pulse */}
                      {isSelected && (
                        <>
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r={r + 8}
                            fill="none"
                            stroke="#e5851d"
                            strokeWidth={2.5}
                            strokeOpacity={0.9}
                            className="animate-pulse"
                          />
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r={r + 14}
                            fill="none"
                            stroke="#e5851d"
                            strokeWidth={1.2}
                            strokeDasharray="4 3"
                            strokeOpacity={0.5}
                          />
                        </>
                      )}

                      {/* Hub concentric ring */}
                      {isNodeHub && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={r + 6}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth={2}
                          strokeOpacity={0.75}
                        />
                      )}

                      {/* Primary Node Circle */}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={r}
                        fill={circleColor}
                        stroke={isSelected ? "#e5851d" : isNodeHub ? "#f5f3ff" : "#1e1e24"}
                        strokeWidth={isSelected ? 3 : isNodeHub ? 2.5 : 1.5}
                        className="cursor-pointer"
                        onPointerDown={handleNodePointerDown}
                        onPointerUp={handleNodePointerUp}
                        onClick={handleNodeClick}
                      />

                      {/* Clean Text Label with backdrop pill & truncation */}
                      {shouldShowText && (() => {
                        const lbl = n.label || "";
                        const truncated = lbl.length > 22 ? `${lbl.slice(0, 21)}…` : lbl;
                        return (
                          <g className="pointer-events-none select-none">
                            <rect
                              x={n.x - Math.min(lbl.length, 22) * 3.3 - 6}
                              y={n.y + r + 5}
                              width={Math.min(lbl.length, 22) * 6.6 + 12}
                              height={isNodeHub ? 18 : 16}
                              rx={4}
                              fill={isDark ? "#0c0c10" : "#ffffff"}
                              fillOpacity={isInteractive ? 0.95 : 0.88}
                              stroke={isSelected ? "#e5851d" : isNodeHub ? (isDark ? "#a855f7" : "#7c3aed") : isDark ? "#27272a" : "#ede9df"}
                              strokeWidth={isSelected ? 1.2 : 0.8}
                            />
                            <text
                              x={n.x}
                              y={n.y + r + (isNodeHub ? 18 : 17)}
                              textAnchor="middle"
                              fill={isSelected ? (isDark ? "#ffffff" : "#1c1d22") : isHovered ? (isDark ? "#38bdf8" : "#0284c7") : isDark ? (isNodeHub ? "#f5f3ff" : "#d4d4d8") : (isNodeHub ? "#4c1d95" : "#1c1d22")}
                              fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                              fontSize={isNodeHub ? 11.5 : n.is_broker ? 11 : 10}
                              fontWeight={isSelected || isNodeHub || n.is_broker ? 700 : 500}
                              className="select-none"
                            >
                              {truncated}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

            {/* ── On-Screen Zoom Controls HUD (Bottom Left) ── */}
            <div
              className={`absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-xl border p-1 text-xs shadow-xl backdrop-blur-md transition-colors ${
                isDark
                  ? "border-[#26262e] bg-[#141418]/95 text-[#d4d4d8]"
                  : "border-[#e8e4da] bg-white/95 text-[#1c1d22]"
              }`}
            >
              <button
                onClick={() => {
                  if (graphMode === "doc-build") {
                    setDocTransform((t) => ({ ...t, k: Math.min(3.5, t.k * 1.25) }));
                  } else {
                    setTransform((t) => ({ ...t, k: Math.min(4.0, t.k * 1.25) }));
                  }
                }}
                title="Zoom In"
                className={`flex size-7 items-center justify-center rounded transition-colors ${
                  isDark ? "hover:bg-[#25252e] hover:text-white text-[#d4d4d8]" : "hover:bg-[#f4efe4] hover:text-[#1c1d22] text-[#4a4b52]"
                }`}
              >
                <ZoomIn className="size-4" />
              </button>
              <button
                onClick={() => {
                  if (graphMode === "doc-build") {
                    setDocTransform((t) => ({ ...t, k: Math.max(0.3, t.k / 1.25) }));
                  } else {
                    setTransform((t) => ({ ...t, k: Math.max(0.10, t.k / 1.25) }));
                  }
                }}
                title="Zoom Out"
                className={`flex size-7 items-center justify-center rounded transition-colors ${
                  isDark ? "hover:bg-[#25252e] hover:text-white text-[#d4d4d8]" : "hover:bg-[#f4efe4] hover:text-[#1c1d22] text-[#4a4b52]"
                }`}
              >
                <ZoomOut className="size-4" />
              </button>
              <div className={`h-4 w-px ${isDark ? "bg-[#26262e]" : "bg-[#e8e4da]"}`} />
              <button
                onClick={() => {
                  if (graphMode === "doc-build") {
                    setDocTransform({ x: 0, y: 0, k: 1.0 });
                  } else {
                    fitView();
                  }
                }}
                title={graphMode === "doc-build" ? "Reset to 100% Zoom" : "Fit Graph to Screen (Default 28% [25-30% range])"}
                className={`flex items-center gap-1 rounded px-2 py-1 font-semibold transition-colors ${
                  isDark ? "hover:bg-[#25252e] hover:text-white text-[#d4d4d8]" : "hover:bg-[#f4efe4] hover:text-[#1c1d22] text-[#1c1d22]"
                }`}
              >
                <Maximize2 className="size-3.5" />
                <span>{graphMode === "doc-build" ? "Fit 100%" : "Fit 28%"}</span>
              </button>
              <button
                onClick={() => {
                  if (graphMode === "doc-build") {
                    setDocTransform({ x: 0, y: 0, k: 1.0 });
                  } else {
                    fitView();
                  }
                }}
                title={graphMode === "doc-build" ? "Reset to 100% Zoom" : "Reset to Default 28% Zoom"}
                className={`rounded px-2 py-1 font-mono text-[11px] transition-colors ${
                  isDark ? "text-[#8c8c96] hover:bg-[#25252e] hover:text-white" : "text-[#7a7b83] hover:bg-[#f4efe4] hover:text-[#1c1d22]"
                }`}
              >
                {Math.round((graphMode === "doc-build" ? docTransform.k : transform.k) * 100)}%
              </button>
              <div className={`h-4 w-px ${isDark ? "bg-zinc-800" : "bg-[#e8e4da]"}`} />
              {/* Label Density Mode Selector */}
              <div
                className={`flex items-center rounded-lg p-0.5 border transition-colors ${
                  isDark ? "bg-zinc-950/80 border-zinc-800" : "bg-[#f4efe4] border-[#e8e4da]"
                }`}
              >
                {(["smart", "hubs", "all"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setLabelMode(mode)}
                    className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold transition-all cursor-pointer ${
                      labelMode === mode
                        ? "bg-purple-600 text-white shadow-xs"
                        : isDark
                        ? "text-zinc-400 hover:text-white"
                        : "text-[#7a7b83] hover:text-[#1c1d22]"
                    }`}
                    title={`Label Density: ${mode.toUpperCase()} (LOD)`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* 6.3s Cinematic Sequence Controller in Bottom HUD */}
              <div className={`h-4 w-px ${isDark ? "bg-[#26262e]" : "bg-[#e8e4da]"}`} />
              {graphMode === "doc-build" ? (
                isPlaying6s ? (
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                    </span>
                    <span className={`text-[11px] font-mono font-bold ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                      {docPhase === "idle" ? "0.0s Idle" : `Step ${docStep}/8`}
                    </span>
                    <button
                      onClick={skipDocAnimation}
                      title="Skip sequence to fully interactive view"
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                        isDark
                          ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      Skip
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={replayDocAnimation}
                    title="Replay 6.3-Second Build-Out Sequence"
                    className={`flex items-center gap-1.5 rounded px-2 py-1 font-semibold text-[11px] transition-colors ${
                      isDark
                        ? "hover:bg-[#25252e] hover:text-amber-400 text-[#8c8c96]"
                        : "hover:bg-[#f4efe4] hover:text-amber-700 text-[#7a7b83]"
                    }`}
                  >
                    <Play className="size-3 text-amber-500 fill-amber-500" />
                    <span>Replay 6.3s Build-Out</span>
                  </button>
                )
              ) : (
                <button
                  onClick={() => fitView()}
                  title="Fit Syndicate Network"
                  className={`flex items-center gap-1.5 rounded px-2 py-1 font-semibold text-[11px] transition-colors ${
                    isDark
                      ? "hover:bg-[#25252e] hover:text-purple-400 text-[#8c8c96]"
                      : "hover:bg-[#f4efe4] hover:text-purple-700 text-[#7a7b83]"
                  }`}
                >
                  <Network className="size-3 text-purple-500" />
                  <span>Fit Syndicate</span>
                </button>
              )}
            </div>

            {/* ── Reopen Right HUD Toggle Button (when closed) ── */}
            {!settingsPanelOpen && (
              <button
                onClick={() => {
                  setSettingsPanelOpen(true);
                  setRightHudMode("details");
                }}
                className={`absolute right-5 top-5 z-20 flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-md transition-all cursor-pointer ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900/95 text-white hover:bg-zinc-800 hover:border-purple-500/50"
                    : "border-[#e8e4da] bg-white/95 text-[#1c1d22] hover:bg-[#faf8f2]"
                }`}
              >
                <Info className="size-4 text-purple-500" />
                <span>Node Dossier {selectedNode ? `(${selectedNode.label})` : ""}</span>
              </button>
            )}

            {/* ── 3. RIGHT HUD: DUAL MODE (Details / Graph Settings) ── */}
            {settingsPanelOpen && (
              <div
                className={`absolute right-4 top-4 bottom-4 w-[390px] xl:w-[420px] z-30 overflow-y-auto rounded-2xl border p-5 text-xs shadow-2xl backdrop-blur-xl font-sans transition-colors ${
                  isDark
                    ? "border-zinc-800/80 bg-[#14141c]/98 text-zinc-300"
                    : "border-[#e8e4da] bg-white/98 text-[#1c1d22]"
                }`}
              >
                {/* Mode Switcher Tabs + Header Icons */}
                <div
                  className={`flex items-center justify-between border-b pb-3 mb-4 transition-colors ${
                    isDark ? "border-zinc-800/80" : "border-[#ede9df]"
                  }`}
                >
                  <div
                    className={`flex items-center gap-1 p-1 rounded-xl border transition-colors ${
                      isDark ? "bg-zinc-950/80 border-zinc-800/80" : "bg-[#f4efe4] border-[#e8e4da]"
                    }`}
                  >
                    <button
                      onClick={() => setRightHudMode("details")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                        rightHudMode === "details"
                          ? isDark
                            ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                            : "bg-white text-[#1c1d22] shadow-xs border border-[#ded8cb]"
                          : isDark
                          ? "text-zinc-400 hover:text-white"
                          : "text-[#7a7b83] hover:text-[#1c1d22]"
                      }`}
                    >
                      <Info className="size-3.5 text-purple-500" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => setRightHudMode("settings")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                        rightHudMode === "settings"
                          ? isDark
                            ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                            : "bg-white text-[#1c1d22] shadow-xs border border-[#ded8cb]"
                          : isDark
                          ? "text-zinc-400 hover:text-white"
                          : "text-[#7a7b83] hover:text-[#1c1d22]"
                      }`}
                    >
                      <Sliders className="size-3.5 text-sky-500" />
                      <span>Settings</span>
                    </button>
                  </div>

                  <div className={`flex items-center gap-1.5 ${isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"}`}>
                    {rightHudMode === "settings" && (
                      <button
                        onClick={resetToDefaults}
                        title="Restore default settings"
                        className="p-1 hover:text-white transition-colors"
                      >
                        <RotateCcw className="size-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setSettingsPanelOpen(false)}
                      title="Close panel"
                      className="p-1 hover:text-white transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {/* ── MODE 1: NODE / CASE DOSSIER DETAILS ── */}
                {rightHudMode === "details" && (
                  <div className="space-y-4">
                    {selectedDocId && DOC_MARKDOWN_CONTENT[selectedDocId] && graphMode === "doc-build" ? (() => {
                      const docMeta = DOC_NODES.find((d) => d.id === selectedDocId);
                      const docData = DOC_MARKDOWN_CONTENT[selectedDocId];
                      return (
                        <div className="space-y-4">
                          {/* Title & Badge Header */}
                          <div className={`border-b pb-3 ${isDark ? "border-[#23232a]" : "border-[#ede9df]"}`}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-black bg-amber-400 shadow-sm">
                                {docMeta?.category || "DOC"} NOTE
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[11px] text-[#71717a]">
                                  {docMeta?.filename}
                                </span>
                                <button
                                  onClick={() => copyNodeId(docMeta?.filename || "")}
                                  title="Copy filename"
                                  className="p-1 text-[#71717a] hover:text-white"
                                >
                                  {copiedId ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                                </button>
                              </div>
                            </div>

                            <h3 className={`text-base font-bold leading-snug ${isDark ? "text-white" : "text-[#1c1d22]"}`}>
                              {docData.title}
                            </h3>
                            <p className={`mt-1 text-xs font-medium ${isDark ? "text-[#a1a1aa]" : "text-[#65666e]"}`}>
                              {docData.subtitle}
                            </p>

                            {/* Tags */}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {docData.tags.map((t) => (
                                <span
                                  key={t}
                                  className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-semibold ${
                                    isDark
                                      ? "border-zinc-800 bg-zinc-900 text-amber-400/90"
                                      : "border-[#e8e4da] bg-amber-50 text-amber-800"
                                  }`}
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Formatted Markdown Content Card */}
                          <div
                            className={`rounded-xl border p-4 font-mono text-xs leading-relaxed max-h-[380px] overflow-y-auto whitespace-pre-wrap ${
                              isDark
                                ? "border-zinc-800/80 bg-zinc-950/70 text-zinc-300"
                                : "border-[#e8e4da] bg-white text-zinc-800 shadow-inner"
                            }`}
                          >
                            {docData.content}
                          </div>

                          {/* Graph Relationships / WikiLinks */}
                          <div className={`border-t pt-3 ${isDark ? "border-[#23232a]" : "border-[#ede9df]"}`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"}`}>
                              Note Graph Connections
                            </span>
                            <div className="mt-2 space-y-2">
                              {docMeta?.parentId && (
                                <div
                                  className={`flex items-center justify-between p-2 rounded-lg border ${
                                    isDark ? "bg-[#181820] border-[#26262e]" : "bg-[#f9f8f4] border-[#eeeae0]"
                                  }`}
                                >
                                  <span className="text-xs text-zinc-400">Parent Note:</span>
                                  <button
                                    onClick={() => focusDocNode(docMeta.parentId!)}
                                    className="font-mono text-xs font-bold text-amber-500 hover:underline cursor-pointer"
                                  >
                                    [[{docMeta.parentId}]]
                                  </button>
                                </div>
                              )}
                              {DOC_NODES.filter((d) => d.parentId === selectedDocId).length > 0 && (
                                <div
                                  className={`p-2 rounded-lg border space-y-1.5 ${
                                    isDark ? "bg-[#181820] border-[#26262e]" : "bg-[#f9f8f4] border-[#eeeae0]"
                                  }`}
                                >
                                  <span className="text-xs text-zinc-400">Child Notes:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {DOC_NODES.filter((d) => d.parentId === selectedDocId).map((ch) => (
                                      <button
                                        key={ch.id}
                                        onClick={() => focusDocNode(ch.id)}
                                        className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-800/80 text-sky-400 hover:bg-zinc-700 cursor-pointer"
                                      >
                                        [[{ch.id}]]
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })() : selectedNode ? (
                      <div>
                        {/* Title & Badge Header */}
                        <div className="border-b border-[#23232a] pb-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                              style={{ background: getNodeColor(selectedNode) }}
                            >
                              {isHub(selectedNode)
                                ? "CASE / FIR HUB"
                                : selectedNode.is_broker
                                ? "CENTRAL BROKER"
                                : selectedNode.category}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[11px] text-[#71717a]">
                                {selectedNode.id}
                              </span>
                              <button
                                onClick={() => copyNodeId(selectedNode.id)}
                                title="Copy ID"
                                className="p-1 text-[#71717a] hover:text-white"
                              >
                                {copiedId ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                              </button>
                            </div>
                          </div>

                          <h3
                            className={`text-base font-bold leading-snug ${
                              isDark ? "text-white" : "text-[#1c1d22]"
                            }`}
                          >
                            {selectedNode.label}
                          </h3>

                          {selectedNode.sublabel && (
                            <p
                              className={`mt-1 text-xs font-medium ${
                                isDark ? "text-[#a1a1aa]" : "text-[#65666e]"
                              }`}
                            >
                              {selectedNode.sublabel}
                            </p>
                          )}

                          {/* Connected Case Tags */}
                          {(() => {
                            const d = (selectedNode.details ?? {}) as Record<string, unknown>;
                            const sc = Array.isArray(d["source_cases"])
                              ? (d["source_cases"] as string[])
                              : d["case_id"]
                              ? [String(d["case_id"])]
                              : [];
                            if (sc.length === 0) return null;
                            return (
                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider ${
                                    isDark ? "text-[#71717a]" : "text-[#8c8c96]"
                                  }`}
                                >
                                  Cases:
                                </span>
                                {sc.map((cid) => {
                                  const targetHub = nodes.find(
                                    (n) => isHub(n) && (n.id.includes(cid) || ((n.details as Record<string, unknown>)?.case_id === cid))
                                  );
                                  return (
                                    <button
                                      key={cid}
                                      onClick={() => {
                                        if (targetHub) focusNode(targetHub.id);
                                      }}
                                      className={`rounded border px-2 py-0.5 text-[10px] font-mono font-semibold transition-colors ${
                                        isDark
                                          ? "bg-[#202028] border-[#2a2a34] text-[#c084fc] hover:bg-[#282834] hover:text-white"
                                          : "bg-[#f4efe4] border-[#e8e4da] text-[#7d2db8] hover:bg-[#ede8dc] hover:text-[#1c1d22]"
                                      }`}
                                    >
                                      {cid.replace("CASE_", "FIR_")}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Metadata Details Table */}
                        <div className="mt-3 space-y-2.5">
                          {(() => {
                            const d = (selectedNode.details ?? {}) as Record<string, unknown>;
                            const rows: [string, string][] = [];

                            if (d["fir_number"]) rows.push(["FIR Number", String(d["fir_number"])]);
                            if (d["case_id"]) rows.push(["Case ID", String(d["case_id"])]);
                            if (d["police_station"]) rows.push(["Police Station", String(d["police_station"])]);
                            if (d["full_description"]) rows.push(["Allegation / Modus", String(d["full_description"])]);
                            if (d["location"]) rows.push(["Location", String(d["location"])]);
                            if (d["timestamp"]) rows.push(["Timestamp", String(d["timestamp"])]);
                            if (d["occupation"]) rows.push(["Occupation / Role", String(d["occupation"])]);
                            if (d["residence"]) rows.push(["Residence / Address", String(d["residence"])]);
                            if (d["bank_name"]) rows.push(["Bank Name", String(d["bank_name"])]);
                            if (d["account_number"]) rows.push(["Account No.", String(d["account_number"])]);
                            if (d["ifsc"]) rows.push(["IFSC Code", String(d["ifsc"])]);
                            if (d["mobile_number"]) rows.push(["Mobile Number", String(d["mobile_number"])]);
                            if (d["imei"]) rows.push(["IMEI Hardware ID", String(d["imei"])]);
                            if (d["upi_id"]) rows.push(["UPI Handle", String(d["upi_id"])]);

                            for (const [k, v] of Object.entries(d)) {
                              if (
                                [
                                  "fir_number",
                                  "case_id",
                                  "police_station",
                                  "full_description",
                                  "location",
                                  "timestamp",
                                  "occupation",
                                  "residence",
                                  "bank_name",
                                  "account_number",
                                  "ifsc",
                                  "mobile_number",
                                  "imei",
                                  "upi_id",
                                  "source_cases",
                                  "is_case_hub",
                                  "evidence_ids",
                                ].includes(k)
                              )
                                continue;
                              if (v == null || typeof v === "object") continue;
                              if (rows.length >= 8) break;
                              rows.push([k.replace(/_/g, " "), String(v)]);
                            }

                            return rows.map(([label, val], idx) => (
                              <div
                                key={`${label}-${idx}`}
                                className={`flex flex-col gap-1 border-b pb-2 ${
                                  isDark ? "border-[#23232a]" : "border-[#ede9df]"
                                }`}
                              >
                                <span
                                  className={`text-[10px] uppercase font-bold tracking-wider ${
                                    isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"
                                  }`}
                                >
                                  {label}
                                </span>
                                <span
                                  className={`text-xs font-semibold p-2 rounded-lg border break-words ${
                                    isDark
                                      ? "text-white bg-[#181820] border-[#26262e]"
                                      : "text-[#1c1d22] bg-[#f9f8f4] border-[#eeeae0]"
                                  }`}
                                >
                                  {val}
                                </span>
                              </div>
                            ));
                          })()}
                        </div>

                        {/* Blockchain Status Chip */}
                        <div
                          className={`mt-3 flex items-center gap-2 text-xs font-bold p-2.5 rounded-lg border ${
                            isDark
                              ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                              : "bg-emerald-50 border-emerald-200 text-emerald-800"
                          }`}
                        >
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span>BSA 63(4) Blockchain Anchored</span>
                            <span
                              className={`font-mono text-[10px] truncate ${
                                isDark ? "text-emerald-400/80" : "text-emerald-700"
                              }`}
                            >
                              SHA256: 0x{selectedNode.id.slice(0, 8)}...anchored
                            </span>
                          </div>
                        </div>

                        {/* Direct Connections / Neighbors */}
                        <div
                          className={`mt-4 border-t pt-3 ${
                            isDark ? "border-[#23232a]" : "border-[#ede9df]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-xs font-bold uppercase tracking-wider ${
                                isDark ? "text-white" : "text-[#1c1d22]"
                              }`}
                            >
                              Direct Connections
                            </span>
                            <span className="font-mono text-xs text-[#a855f7] font-bold">
                              {selectedNeighbors.length} Links
                            </span>
                          </div>

                          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                            {selectedNeighbors.map((nb) => (
                              <div
                                key={nb.id}
                                onClick={() => focusNode(nb.id)}
                                className={`flex items-center justify-between rounded-lg border p-2 cursor-pointer transition-all ${
                                  isDark
                                    ? "border-[#26262e] bg-[#181820] hover:border-[#a855f7] hover:bg-[#20202a]"
                                    : "border-[#e8e4da] bg-[#f9f8f4] hover:border-[#a855f7] hover:bg-[#faf8f2]"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="size-2.5 rounded-full shrink-0"
                                    style={{ background: getNodeColor(nb) }}
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span
                                      className={`truncate text-xs font-semibold ${
                                        isDark ? "text-white" : "text-[#1c1d22]"
                                      }`}
                                    >
                                      {nb.label}
                                    </span>
                                    {nb.sublabel && (
                                      <span
                                        className={`truncate text-[10px] ${
                                          isDark ? "text-[#71717a]" : "text-[#8c8c96]"
                                        }`}
                                      >
                                        {nb.sublabel}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight
                                  className={`size-3.5 shrink-0 ${
                                    isDark ? "text-[#71717a]" : "text-[#8c8c96]"
                                  }`}
                                />
                              </div>
                            ))}

                            {selectedNeighbors.length === 0 && (
                              <div
                                className={`py-4 text-center text-xs ${
                                  isDark ? "text-[#71717a]" : "text-[#8c8c96]"
                                }`}
                              >
                                No direct connections recorded.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex flex-col gap-2">
                          <button
                            onClick={() => focusNode(selectedNode.id)}
                            className="flex items-center justify-center gap-2 rounded-lg bg-[#a855f7] hover:bg-[#9333ea] py-2 text-xs font-bold text-white transition-colors shadow-lg cursor-pointer"
                          >
                            <Maximize2 className="size-3.5" />
                            <span>Center Camera On Node</span>
                          </button>

                          {onOpenCaseExplorer && (
                            <button
                              onClick={() => {
                                const cid = (selectedNode.details?.case_id as string) || (selectedNode.id.startsWith("case_") ? selectedNode.id.replace("case_", "") : undefined);
                                onOpenCaseExplorer(cid);
                              }}
                              className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-colors cursor-pointer ${
                                isDark
                                  ? "border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#60a5fa] hover:bg-[#3b82f6]/20"
                                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                              }`}
                            >
                              <ExternalLink className="size-3.5" />
                              <span>Open in FIR / Cases Explorer</span>
                            </button>
                          )}

                          {onOpenChat && (
                            <button
                              onClick={() => {
                                const cid = (selectedNode.details?.case_id as string) || (selectedNode.id.startsWith("case_") ? selectedNode.id.replace("case_", "") : undefined);
                                onOpenChat(cid, selectedNode.label);
                              }}
                              className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-colors cursor-pointer ${
                                isDark
                                  ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#34d399] hover:bg-[#10b981]/20"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              <MessageSquare className="size-3.5" />
                              <span>Interrogate Case in AI Chat</span>
                            </button>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyNodeId(selectedNode.id)}
                              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                isDark
                                  ? "border-[#2a2a33] bg-[#18181d] text-[#d4d4d8] hover:border-[#3f3f4a] hover:text-white"
                                  : "border-[#e8e4da] bg-white text-[#4a4b52] hover:bg-[#faf8f2] hover:text-[#1c1d22]"
                              }`}
                            >
                              {copiedId ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                              <span>{copiedId ? "Copied" : "Copy ID"}</span>
                            </button>
                            <button
                              onClick={() => copyNodeJson(selectedNode)}
                              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                isDark
                                  ? "border-[#2a2a33] bg-[#18181d] text-[#d4d4d8] hover:border-[#3f3f4a] hover:text-white"
                                  : "border-[#e8e4da] bg-white text-[#4a4b52] hover:bg-[#faf8f2] hover:text-[#1c1d22]"
                              }`}
                            >
                              {copiedJson ? <Check className="size-3.5 text-emerald-500" /> : <FileCode className="size-3.5" />}
                              <span>{copiedJson ? "Copied JSON" : "Copy JSON"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`py-8 text-center space-y-3 ${
                          isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"
                        }`}
                      >
                        <Info className="size-8 mx-auto opacity-60" />
                        <div>
                          <p
                            className={`font-bold text-[13px] ${
                              isDark ? "text-white" : "text-[#1c1d22]"
                            }`}
                          >
                            Select Node to Inspect
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isDark ? "text-[#71717a]" : "text-[#8c8c96]"
                            }`}
                          >
                            Click any node on the graph or document in the left explorer.
                          </p>
                        </div>
                        {/* Quick Shortcut Buttons */}
                        <div className="pt-2 text-left space-y-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isDark ? "text-[#71717a]" : "text-[#8c8c96]"
                            }`}
                          >
                            Quick Access:
                          </span>
                          {nodes.slice(0, 4).map((quickNode) => (
                            <button
                              key={quickNode.id}
                              onClick={() => focusNode(quickNode.id)}
                              className={`flex w-full items-center justify-between rounded-lg border p-2 text-left transition-colors cursor-pointer ${
                                isDark
                                  ? "border-[#26262e] bg-[#181820] hover:border-[#a855f7] hover:bg-[#202028]"
                                  : "border-[#e8e4da] bg-[#f9f8f4] hover:border-[#a855f7] hover:bg-[#faf8f2]"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="size-2 rounded-full shrink-0"
                                  style={{ background: getNodeColor(quickNode) }}
                                />
                                <span
                                  className={`truncate text-xs font-semibold ${
                                    isDark ? "text-white" : "text-[#1c1d22]"
                                  }`}
                                >
                                  {quickNode.label}
                                </span>
                              </div>
                              <ChevronRight
                                className={`size-3 shrink-0 ${
                                  isDark ? "text-[#71717a]" : "text-[#8c8c96]"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── MODE 2: OBSIDIAN GRAPH SETTINGS ── */}
                {rightHudMode === "settings" && (
                  <div>
                    {/* ── SECTION 1: FILTERS ── */}
                    <div className="mb-4">
                      <button
                        onClick={() => setFiltersOpen((o) => !o)}
                        className={`flex w-full items-center gap-2 font-bold text-[13px] mb-3 transition-colors ${
                          isDark ? "text-[#e4e4e7]" : "text-[#1c1d22]"
                        }`}
                      >
                        <div className="size-4 border border-current rounded-sm flex items-center justify-center text-xs">
                          {filtersOpen ? "−" : "+"}
                        </div>
                        <span>Filters</span>
                      </button>

                      {filtersOpen && (
                        <div className="space-y-3.5 pl-1">
                          <div className="relative">
                            <Search
                              className={`absolute left-3 top-2.5 size-4 ${
                                isDark ? "text-[#71717a]" : "text-[#9e9ea5]"
                              }`}
                            />
                            <input
                              type="text"
                              value={searchFiles}
                              onChange={(e) => setSearchFiles(e.target.value)}
                              placeholder="Search files..."
                              className={`h-8.5 w-full rounded-lg border pl-9 pr-3 text-xs outline-none font-medium transition ${
                                isDark
                                  ? "border-[#2a2a33] bg-[#18181d] text-white placeholder-[#71717a] focus:border-[#4b4b58]"
                                  : "border-[#e4dfd3] bg-white text-[#1c1d22] placeholder-[#9e9ea5] focus:border-[#d29b28]"
                              }`}
                            />
                          </div>

                          <div
                            className={`flex items-center justify-between text-xs font-medium ${
                              isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                            }`}
                          >
                            <span>Tags</span>
                            <button
                              onClick={() => setFilterTags((t) => !t)}
                              className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${
                                filterTags ? "bg-[#e5851d]" : isDark ? "bg-[#2b2b33]" : "bg-[#ded8cb]"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                                  filterTags ? "right-0.5" : "left-0.5"
                                }`}
                              />
                            </button>
                          </div>

                          <div
                            className={`flex items-center justify-between text-xs font-medium ${
                              isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                            }`}
                          >
                            <span>Attachments</span>
                            <button
                              onClick={() => setFilterAttachments((t) => !t)}
                              className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${
                                filterAttachments ? "bg-[#e5851d]" : isDark ? "bg-[#2b2b33]" : "bg-[#ded8cb]"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                                  filterAttachments ? "right-0.5" : "left-0.5"
                                }`}
                              />
                            </button>
                          </div>

                          <div
                            className={`flex items-center justify-between text-xs font-medium ${
                              isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                            }`}
                          >
                            <span>Existing files only</span>
                            <button
                              onClick={() => setFilterExistingFilesOnly((t) => !t)}
                              className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${
                                filterExistingFilesOnly ? "bg-[#e5851d]" : isDark ? "bg-[#2b2b33]" : "bg-[#ded8cb]"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                                  filterExistingFilesOnly ? "right-0.5" : "left-0.5"
                                }`}
                              />
                            </button>
                          </div>

                          <div
                            className={`flex items-center justify-between text-xs font-medium ${
                              isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                            }`}
                          >
                            <span>Orphans</span>
                            <button
                              onClick={() => setFilterOrphans((t) => !t)}
                              className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${
                                filterOrphans ? "bg-[#e5851d]" : isDark ? "bg-[#2b2b33]" : "bg-[#ded8cb]"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                                  filterOrphans ? "right-0.5" : "left-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── SECTION 2: GROUPS ── */}
                    <div className="mb-4">
                      <button
                        onClick={() => setGroupsOpen((o) => !o)}
                        className={`flex w-full items-center gap-2 font-bold text-[13px] mb-3 transition-colors ${
                          isDark ? "text-[#e4e4e7]" : "text-[#1c1d22]"
                        }`}
                      >
                        <div className="size-4 border border-current rounded-sm flex items-center justify-center text-xs">
                          {groupsOpen ? "−" : "+"}
                        </div>
                        <span>Groups</span>
                      </button>

                      {groupsOpen && (
                        <div className="space-y-2.5 pl-1">
                          {[
                            { label: "Case Hubs", color: CATEGORY_COLORS.HUB },
                            { label: "Crime Facts", color: CATEGORY_COLORS.FACT },
                            { label: "Central Brokers", color: "#ef4444" },
                            { label: "Suspects & Mules", color: CATEGORY_COLORS.PERSON },
                            { label: "Financial Accounts", color: CATEGORY_COLORS.BANK_ACCOUNT },
                            { label: "Telephony / SIMs", color: CATEGORY_COLORS.PHONE },
                          ].map((grp) => (
                            <div
                              key={grp.label}
                              className={`flex items-center justify-between text-xs ${
                                isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="size-3 rounded-full" style={{ background: grp.color }} />
                                <span className="font-semibold">{grp.label}</span>
                              </div>
                              <span className={`text-[10px] font-mono ${isDark ? "text-[#71717a]" : "text-[#8c8c96]"}`}>
                                tag:#{grp.label.split(" ")[0]}
                              </span>
                            </div>
                          ))}
                          <button
                            className={`w-full mt-2.5 rounded-lg border py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                              isDark
                                ? "border-[#2a2a33] bg-[#18181d] text-[#d4d4d8] hover:border-[#3f3f4a] hover:text-white"
                                : "border-[#e8e4da] bg-white text-[#4a4b52] hover:bg-[#faf8f2] hover:text-[#1c1d22]"
                            }`}
                          >
                            New group
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── SECTION 3: DISPLAY ── */}
                    <div className="mb-4">
                      <button
                        onClick={() => setDisplayOpen((o) => !o)}
                        className={`flex w-full items-center gap-2 font-bold text-[13px] mb-3 transition-colors ${
                          isDark ? "text-[#e4e4e7]" : "text-[#1c1d22]"
                        }`}
                      >
                        <div className="size-4 border border-current rounded-sm flex items-center justify-center text-xs">
                          {displayOpen ? "−" : "+"}
                        </div>
                        <span>Display</span>
                      </button>

                      {displayOpen && (
                        <div className="space-y-4 pl-1">
                          <div
                            className={`flex items-center justify-between text-xs font-medium ${
                              isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                            }`}
                          >
                            <span>Arrows</span>
                            <button
                              onClick={() => setArrows((a) => !a)}
                              className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${
                                arrows ? "bg-[#e5851d]" : isDark ? "bg-[#2b2b33]" : "bg-[#ded8cb]"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                                  arrows ? "right-0.5" : "left-0.5"
                                }`}
                              />
                            </button>
                          </div>

                          <div>
                            <div
                              className={`flex items-center justify-between text-xs font-medium mb-1.5 ${
                                isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                              }`}
                            >
                              <span>Label Density (LOD)</span>
                              <span className="font-mono text-[10px] text-[#a855f7] uppercase font-bold">{labelMode}</span>
                            </div>
                            <div
                              className={`grid grid-cols-3 gap-1 p-1 rounded-lg border transition-colors ${
                                isDark ? "bg-[#18181d] border-[#2a2a33]" : "bg-[#f4efe4] border-[#e8e4da]"
                              }`}
                            >
                              {(["smart", "hubs", "all"] as const).map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setLabelMode(m)}
                                  className={`py-1 text-[11px] rounded font-semibold uppercase transition-colors cursor-pointer ${
                                    labelMode === m
                                      ? "bg-[#a855f7] text-white shadow-xs"
                                      : isDark
                                      ? "text-[#8c8c96] hover:text-white"
                                      : "text-[#7a7b83] hover:text-[#1c1d22]"
                                  }`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div
                              className={`flex items-center justify-between text-xs font-medium mb-1.5 ${
                                isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                              }`}
                            >
                              <span>Text fade threshold</span>
                              <span className={`font-mono ${isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"}`}>
                                {textFadeThreshold.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-3.0"
                              max="3.0"
                              step="0.05"
                              value={textFadeThreshold}
                              onChange={(e) => setTextFadeThreshold(parseFloat(e.target.value))}
                              className={`h-1.5 w-full rounded-lg cursor-pointer ${
                                isDark ? "bg-[#2b2b33] accent-white" : "bg-[#ded8cb] accent-[#202126]"
                              }`}
                            />
                          </div>

                          <div>
                            <div
                              className={`flex items-center justify-between text-xs font-medium mb-1.5 ${
                                isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                              }`}
                            >
                              <span>Node size</span>
                              <span className={`font-mono ${isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"}`}>
                                {nodeSize.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.4"
                              max="3.0"
                              step="0.05"
                              value={nodeSize}
                              onChange={(e) => setNodeSize(parseFloat(e.target.value))}
                              className={`h-1.5 w-full rounded-lg cursor-pointer ${
                                isDark ? "bg-[#2b2b33] accent-white" : "bg-[#ded8cb] accent-[#202126]"
                              }`}
                            />
                          </div>

                          <div>
                            <div
                              className={`flex items-center justify-between text-xs font-medium mb-1.5 ${
                                isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                              }`}
                            >
                              <span>Link thickness</span>
                              <span className={`font-mono ${isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"}`}>
                                {linkThickness.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.4"
                              max="3.0"
                              step="0.05"
                              value={linkThickness}
                              onChange={(e) => setLinkThickness(parseFloat(e.target.value))}
                              className={`h-1.5 w-full rounded-lg cursor-pointer ${
                                isDark ? "bg-[#2b2b33] accent-white" : "bg-[#ded8cb] accent-[#202126]"
                              }`}
                            />
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={triggerAnimate}
                              className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                isDark
                                  ? "border-[#2a2a33] bg-[#18181d] text-[#d4d4d8] hover:border-[#3f3f4a] hover:text-white"
                                  : "border-[#e8e4da] bg-white text-[#4a4b52] hover:bg-[#faf8f2] hover:text-[#1c1d22]"
                              }`}
                            >
                              Animate
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── SECTION 4: FORCES ── */}
                    <div>
                      <button
                        onClick={() => setForcesOpen((o) => !o)}
                        className={`flex w-full items-center gap-2 font-bold text-[13px] mb-3 transition-colors ${
                          isDark ? "text-[#e4e4e7]" : "text-[#1c1d22]"
                        }`}
                      >
                        <div className="size-4 border border-current rounded-sm flex items-center justify-center text-xs">
                          {forcesOpen ? "−" : "+"}
                        </div>
                        <span>Forces</span>
                      </button>

                      {forcesOpen && (
                        <div className="space-y-4 pl-1">
                          <div>
                            <div
                              className={`flex items-center justify-between text-xs font-medium mb-1.5 ${
                                isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                              }`}
                            >
                              <span>Center force</span>
                              <span className={`font-mono ${isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"}`}>
                                {centerForce.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.0"
                              max="1.0"
                              step="0.01"
                              value={centerForce}
                              onChange={(e) => setCenterForce(parseFloat(e.target.value))}
                              className={`h-1.5 w-full rounded-lg cursor-pointer ${
                                isDark ? "bg-[#2b2b33] accent-white" : "bg-[#ded8cb] accent-[#202126]"
                              }`}
                            />
                          </div>

                          <div>
                            <div
                              className={`flex items-center justify-between text-xs font-medium mb-1.5 ${
                                isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                              }`}
                            >
                              <span>Repel force</span>
                              <span className={`font-mono ${isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"}`}>
                                {repelForce.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.0"
                              max="25.0"
                              step="0.2"
                              value={repelForce}
                              onChange={(e) => setRepelForce(parseFloat(e.target.value))}
                              className={`h-1.5 w-full rounded-lg cursor-pointer ${
                                isDark ? "bg-[#2b2b33] accent-white" : "bg-[#ded8cb] accent-[#202126]"
                              }`}
                            />
                          </div>

                          <div>
                            <div
                              className={`flex items-center justify-between text-xs font-medium mb-1.5 ${
                                isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                              }`}
                            >
                              <span>Link force</span>
                              <span className={`font-mono ${isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"}`}>
                                {linkForce.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.0"
                              max="2.0"
                              step="0.05"
                              value={linkForce}
                              onChange={(e) => setLinkForce(parseFloat(e.target.value))}
                              className={`h-1.5 w-full rounded-lg cursor-pointer ${
                                isDark ? "bg-[#2b2b33] accent-white" : "bg-[#ded8cb] accent-[#202126]"
                              }`}
                            />
                          </div>

                          <div>
                            <div
                              className={`flex items-center justify-between text-xs font-medium mb-1.5 ${
                                isDark ? "text-[#d4d4d8]" : "text-[#3a3b44]"
                              }`}
                            >
                              <span>Link distance</span>
                              <span className={`font-mono ${isDark ? "text-[#8c8c96]" : "text-[#7a7b83]"}`}>
                                {Math.round(linkDistance)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="500"
                              step="5"
                              value={linkDistance}
                              onChange={(e) => setLinkDistance(parseInt(e.target.value))}
                              className={`h-1.5 w-full rounded-lg cursor-pointer ${
                                isDark ? "bg-[#2b2b33] accent-white" : "bg-[#ded8cb] accent-[#202126]"
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Toggle icon to reopen HUD if closed */}
            {!settingsPanelOpen && (
              <button
                onClick={() => setSettingsPanelOpen(true)}
                title="Open Node Details / Settings"
                className={`absolute right-4 top-4 flex size-9 items-center justify-center rounded-xl border shadow-xl transition-colors cursor-pointer ${
                  isDark
                    ? "border-[#26262e] bg-[#141418] text-[#8c8c96] hover:text-white"
                    : "border-[#e8e4da] bg-white text-[#7a7b83] hover:text-[#1c1d22]"
                }`}
              >
                <Info className="size-4" />
              </button>
            )}

            {/* Obsidian Logo glyph at bottom center */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="size-4 rotate-45 border border-[#a855f7] bg-[#7c3aed]/20 shadow-[0_0_8px_rgba(168,85,247,0.3)] flex items-center justify-center">
                <div className="size-1.5 bg-[#a855f7] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

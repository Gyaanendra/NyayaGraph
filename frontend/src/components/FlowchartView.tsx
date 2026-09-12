"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FlowChapter, FlowNode } from '@/data/cyberlifeData';
import { soundFx } from '@/lib/audio';

interface FlowchartViewProps {
  chapters: FlowChapter[];
  onSelectNode: (node: FlowNode, chapter: FlowChapter) => void;
  onOpenLegend: () => void;
}

export const FlowchartView: React.FC<FlowchartViewProps> = ({
  chapters,
  onSelectNode,
  onOpenLegend
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('chapter-1');
  const [showStats, setShowStats] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isAnimatingScroll, setIsAnimatingScroll] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIndexRef = useRef<number>(0);
  const [activePaths, setActivePaths] = useState<string[]>([]);

  const chapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

  // Mouse wheel and trackpad scroll listener (horizontal & vertical)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      setIsAnimatingScroll(false);

      // Determine horizontal scroll intent: trackpad deltaX, or shiftKey + deltaY, or vertical deltaY
      const isHorizontalTrackpad = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const dx = isHorizontalTrackpad ? e.deltaX : (e.shiftKey ? e.deltaY : e.deltaY * 0.9);
      const dy = isHorizontalTrackpad ? 0 : (!e.shiftKey ? e.deltaY * 0.4 : 0);

      setPanOffset(prev => {
        const containerWidth = el.clientWidth || 1100;
        const containerHeight = el.clientHeight || 650;
        const maxPanX = 120;
        const minPanX = -Math.max(0, chapter.canvasWidth - containerWidth + 120);
        const maxPanY = 80;
        const minPanY = -Math.max(0, chapter.canvasHeight - containerHeight + 80);

        const newX = Math.min(maxPanX, Math.max(minPanX, prev.x - dx * 1.3));
        const newY = Math.min(maxPanY, Math.max(minPanY, prev.y - dy * 1.1));
        return { x: newX, y: newY };
      });
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, [chapter]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on canvas background
    if ((e.target as HTMLElement).closest('.flow-node')) return;
    setIsDragging(true);
    setIsAnimatingScroll(false);
    dragStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = () => {
    soundFx.play('click');
    setZoomLevel(prev => (prev === 1.0 ? 1.25 : prev === 1.25 ? 0.8 : 1.0));
  };

  // SCROLL HUD button: Smoothly pans through the chapter clusters
  const handleScrollClick = () => {
    soundFx.play('click');
    setIsAnimatingScroll(true);

    const containerWidth = containerRef.current?.clientWidth || 1100;
    const maxScroll = Math.max(0, chapter.canvasWidth - containerWidth + 80);

    // 3 cluster stops: Start, Middle (Deviant encounter/Server room), Climax (Negotiation/Broadcast)
    const stops = [
      0,
      -Math.round(maxScroll * 0.5),
      -Math.round(maxScroll)
    ];

    scrollIndexRef.current = (scrollIndexRef.current + 1) % stops.length;
    const targetX = stops[scrollIndexRef.current];

    setPanOffset({
      x: targetX,
      y: 0
    });
  };

  const handleContinueSim = () => {
    soundFx.play('chime');
    chapter.connections.forEach((conn, idx) => {
      setTimeout(() => {
        setActivePaths(prev => [...prev, `${conn.from}-${conn.to}`]);
        soundFx.play('click');
      }, idx * 220);
    });
  };

  const nodesMap: Record<string, FlowNode> = {};
  chapter.nodes.forEach(n => {
    nodesMap[n.id] = n;
  });

  return (
    <section className="view-panel active">
      <div className={`flowchart-view-wrapper ${showStats ? 'show-stats' : ''}`}>
        
        {/* Flowchart Top Header Bar (Image 4) */}
        <div className="flowchart-header-bar">
          <div className="flowchart-completion-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={15} height={15}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
            <span>{chapter.completionNote}</span>
          </div>

          {/* Chapter Switcher Tabs */}
          <div className="flowchart-chapter-switcher">
            {chapters.map(ch => (
              <button
                key={ch.id}
                className={`btn-chapter-tab ${selectedChapterId === ch.id ? 'active' : ''}`}
                onClick={() => {
                  soundFx.play('click');
                  setSelectedChapterId(ch.id);
                  setActivePaths([]);
                  setPanOffset({ x: 0, y: 0 });
                }}
              >
                {ch.code} {ch.title}
              </button>
            ))}
          </div>
        </div>

        {/* Spacious Pan & Zoom Canvas */}
        <div
          ref={containerRef}
          className="flowchart-canvas-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className={`flowchart-world-stage ${isAnimatingScroll ? 'animating' : ''}`}
            style={{
              width: `${chapter.canvasWidth}px`,
              height: `${chapter.canvasHeight}px`,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`
            }}
          >
            {/* Cluster Bounding Frames with Corner HUD Brackets (Image 4) */}
            {chapter.clusters.map(cluster => (
              <div
                key={cluster.id}
                className="flow-cluster-box"
                style={{
                  left: `${cluster.x}px`,
                  top: `${cluster.y}px`,
                  width: `${cluster.w}px`,
                  height: `${cluster.h}px`
                }}
              >
                <div className="cluster-corner-bracket tl"></div>
                <div className="cluster-corner-bracket tr"></div>
                <div className="cluster-corner-bracket bl"></div>
                <div className="cluster-corner-bracket br"></div>
                <div className="cluster-label-header">
                  <span className="cluster-bracket-left">[</span>
                  <span>{cluster.label}</span>
                  <span className="cluster-bracket-right">]</span>
                </div>
              </div>
            ))}

            {/* SVG Directional Circuit Lines */}
            <svg
              className="flowchart-svg-lines"
              style={{ width: `${chapter.canvasWidth}px`, height: `${chapter.canvasHeight}px` }}
            >
              <defs>
                <marker
                  id="flow-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 1, 7 4, 0 7" fill="#8da2b5" />
                </marker>
                <marker
                  id="flow-arrow-active"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 1, 7 4, 0 7" fill="#00e5ff" />
                </marker>
              </defs>

              {chapter.connections.map((conn, idx) => {
                const fromNode = nodesMap[conn.from];
                const toNode = nodesMap[conn.to];
                if (!fromNode || !toNode) return null;

                const fromW = fromNode.w || (fromNode.type === 'parallelogram-thumbnail' ? 280 : 180);
                const fromH = fromNode.h || 36;
                const toH = toNode.h || 36;

                const x1 = fromNode.x + fromW;
                const y1 = fromNode.y + fromH / 2;
                const x2 = toNode.x - 4;
                const y2 = toNode.y + toH / 2;

                const midX = x1 + Math.max(30, (x2 - x1) * 0.5);
                const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                const isActive = activePaths.includes(`${conn.from}-${conn.to}`);

                return (
                  <g key={idx}>
                    {/* Origin Junction Dot */}
                    <circle cx={x1} cy={y1} r="2.5" fill={isActive ? '#00e5ff' : '#8da2b5'} />
                    {/* Orthogonal Circuit Path */}
                    <path
                      d={d}
                      className={`flow-circuit-path ${isActive ? 'active' : ''}`}
                      markerEnd={isActive ? 'url(#flow-arrow-active)' : 'url(#flow-arrow)'}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Nodes Layer */}
            {chapter.nodes.map(n => {
              const nodeWidth = n.w || (n.type === 'parallelogram-thumbnail' ? 280 : 190);
              const nodeHeight = n.h || 36;

              return (
                <div
                  key={n.id}
                  className="flow-node"
                  style={{
                    left: `${n.x}px`,
                    top: `${n.y}px`,
                    width: `${nodeWidth}px`,
                    height: `${nodeHeight}px`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.play('click');
                    onSelectNode(n, chapter);
                  }}
                >
                  {n.type === 'parallelogram-thumbnail' ? (
                    <div className="node-parallelogram">
                      {/* Live Camera Feed Hologram Box */}
                      <div className="parallelogram-thumb-wrapper">
                        <div className={`procedural-scene-thumb ${n.sceneTheme || 'default'}`}>
                          <div className="scene-reticle-scan"></div>
                          <span className="scene-cam-tag">LIVE // CAM.01</span>
                        </div>
                      </div>
                      <div className="node-label-box">{n.label}</div>
                      {showStats && <span className="node-stat-pill">{n.worldStat}</span>}
                    </div>
                  ) : n.type === 'locked' ? (
                    <div className="node-locked">
                      <span className="lock-icon">🔒</span>
                      <span className="locked-label">{n.label}</span>
                      {showStats && <span className="node-stat-pill">{n.worldStat}</span>}
                    </div>
                  ) : n.type === 'connector-badge' ? (
                    <div className="node-connector-badge">
                      <span>{n.label}</span>
                      <span className="badge-arrow">➔</span>
                      {showStats && <span className="node-stat-pill">{n.worldStat}</span>}
                    </div>
                  ) : (
                    <div className={`node-action ${n.type === 'warning' ? 'warning-node' : ''}`}>
                      <span className="node-icon">{n.icon || '▪'}</span>
                      <span className="node-text">{n.label}</span>
                      {showStats && <span className="node-stat-pill">{n.worldStat}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Horizontal Timeline Scrubber */}
        <div 
          className="flowchart-timeline-scrubber"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const containerWidth = containerRef.current?.clientWidth || 1100;
            const maxScroll = Math.max(0, chapter.canvasWidth - containerWidth + 80);
            setIsAnimatingScroll(true);
            setPanOffset(prev => ({
              x: -Math.round(clickRatio * maxScroll),
              y: prev.y
            }));
            soundFx.play('hover');
          }}
          title="Click to Scrub Decision Timeline"
        >
          <div className="scrubber-track-line">
            <div 
              className="scrubber-thumb" 
              style={{
                left: `${Math.max(0, Math.min(100, (Math.abs(panOffset.x) / Math.max(1, chapter.canvasWidth - (containerRef.current?.clientWidth || 1100))) * 100))}%`
              }}
            >
              <div className="scrubber-thumb-indicator"></div>
            </div>
          </div>
          <span className="scrubber-label">
            TIMELINE CHRONOMETER // {Math.round(Math.max(0, Math.min(100, (Math.abs(panOffset.x) / Math.max(1, chapter.canvasWidth - (containerRef.current?.clientWidth || 1100))) * 100)))}%
          </span>
        </div>

        {/* Bottom HUD Bar (Image 4) */}
        <div className="flowchart-bottom-hud-bar">
          <button
            className={`hud-bar-action-item ${showStats ? 'active' : ''}`}
            onClick={() => {
              soundFx.play('click');
              setShowStats(!showStats);
            }}
          >
            <span className="hud-bar-icon-symbol">△</span>
            <span>WORLD&apos;S STATS</span>
          </button>

          <button
            className="hud-bar-action-item"
            onClick={() => {
              soundFx.play('click');
              onOpenLegend();
            }}
          >
            <span className="hud-bar-icon-symbol">[▣]</span>
            <span>SHOW LEGEND</span>
          </button>

          <button className="hud-bar-action-item" onClick={handleScrollClick} title="Cycle Through Decision Clusters">
            <span className="hud-bar-icon-symbol hud-bar-icon-circle">⏱</span>
            <span>SCROLL</span>
          </button>

          <button className="hud-bar-action-item" onClick={handleZoom} title="Toggle Zoom Scale">
            <span className="hud-bar-icon-symbol hud-bar-icon-circle">◎</span>
            <span>ZOOM</span>
          </button>

          <button className="hud-bar-action-item" onClick={handleContinueSim} title="Simulate Chapter Decisions">
            <span className="hud-bar-icon-symbol hud-bar-icon-circle">◯</span>
            <span>CONTINUE</span>
          </button>
        </div>

      </div>
    </section>
  );
};

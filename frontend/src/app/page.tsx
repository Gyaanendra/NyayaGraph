"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CYBERLIFE_DATA, FlowNode, FlowChapter, LegendItem } from '@/data/cyberlifeData';
import { fetchFlowchartChapters } from '@/lib/api';
import { Header } from '@/components/Header';
import { BlueprintOverlay } from '@/components/BlueprintOverlay';
import { CharactersView } from '@/components/CharactersView';
import { LoreView } from '@/components/LoreView';
import { FlowchartView } from '@/components/FlowchartView';
import { RightMenu } from '@/components/RightMenu';
import { BottomBar } from '@/components/BottomBar';
import { PanoramaModal, NodeInspectorModal, LegendModal } from '@/components/Modals';

export default function Home() {
  const [currentView, setCurrentView] = useState<string>('characters');
  const [blueprintActive, setBlueprintActive] = useState<boolean>(false);
  const [lang, setLang] = useState<string>('EN');
  const [charIdx, setCharIdx] = useState<number>(0);
  const [loreIdx, setLoreIdx] = useState<number>(0);
  const lastWheelTimeRef = useRef<number>(0);

  // ── Live flowchart data from the database ──────────────────────────────────
  const [dbChapters, setDbChapters] = useState<FlowChapter[] | null>(null);
  const [dbLegend, setDbLegend]     = useState<LegendItem[]>(CYBERLIFE_DATA.flowcharts.legend);
  const [chaptersLoading, setChaptersLoading] = useState<boolean>(false);
  const [chaptersError, setChaptersError]     = useState<string | null>(null);

  useEffect(() => {
    if (currentView !== 'flowchart') return;
    if (dbChapters !== null) return; // already loaded
    setChaptersLoading(true);
    setChaptersError(null);
    fetchFlowchartChapters()
      .then(data => {
        if (data && data.chapters?.length) {
          setDbChapters(data.chapters as FlowChapter[]);
          if (data.legend?.length) setDbLegend(data.legend as LegendItem[]);
        } else {
          setChaptersError('No cases in database. Ingest a FIR PDF to populate the flowchart.');
        }
      })
      .catch(() => setChaptersError('Backend unreachable. Start the FastAPI server.'))
      .finally(() => setChaptersLoading(false));
  }, [currentView, dbChapters]);

  // Active chapters: live DB data if available, else static fallback
  const activeChapters = dbChapters ?? CYBERLIFE_DATA.flowcharts.chapters;

  // Modals state
  const [panoramaState, setPanoramaState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    description: ''
  });

  const [inspectNode, setInspectNode] = useState<{
    node: FlowNode | null;
    chapter: FlowChapter | null;
  }>({
    node: null,
    chapter: null
  });

  const [legendOpen, setLegendOpen] = useState<boolean>(false);

  // View order for page numbering (Image 1: 0/0 or 1/3)
  const viewOrder = ['characters', 'lore', 'flowchart'];
  const curViewIndex = viewOrder.indexOf(currentView);
  const pageNum = (curViewIndex >= 0 ? curViewIndex + 1 : 1).toString().padStart(2, '0');
  const pageNumberString = `${pageNum} / 03`;

  // Search handler
  const handleSearch = () => {
    const query = prompt('[CYBERLIFE OS] Enter search keyword (e.g., Chloe, Markus, Connor, Hostage, Lore):');
    if (query) {
      const q = query.toLowerCase();
      if (q.includes('chloe') || q.includes('rt600') || q.includes('kara') || q.includes('connor') || q.includes('markus')) {
        setCurrentView('characters');
      } else if (q.includes('hostage') || q.includes('stratford') || q.includes('flowchart') || q.includes('decision')) {
        setCurrentView('flowchart');
      } else if (q.includes('detroit') || q.includes('city') || q.includes('lore')) {
        setCurrentView('lore');
      } else {
        alert(`Query "${query}" resolved in CyberLife records.`);
      }
    }
  };

  const handleProfile = () => {
    alert(`CYBERLIFE OPERATOR TERMINAL\nStatus: Authorized Personnel Level 5\nBiometric Hash: #CYB-992-DETROIT`);
  };

  const currentLore = CYBERLIFE_DATA.lore[loreIdx] || CYBERLIFE_DATA.lore[0];

  const handlePrevItem = () => {
    if (currentView === 'characters') {
      setCharIdx((charIdx - 1 + CYBERLIFE_DATA.characters.length) % CYBERLIFE_DATA.characters.length);
    } else if (currentView === 'lore') {
      setLoreIdx((loreIdx - 1 + CYBERLIFE_DATA.lore.length) % CYBERLIFE_DATA.lore.length);
    }
  };

  const handleNextItem = () => {
    if (currentView === 'characters') {
      setCharIdx((charIdx + 1) % CYBERLIFE_DATA.characters.length);
    } else if (currentView === 'lore') {
      setLoreIdx((loreIdx + 1) % CYBERLIFE_DATA.lore.length);
    }
  };

  // Mouse wheel scroll navigation for Characters and Lore views
  const handleContentWheel = (e: React.WheelEvent) => {
    if (currentView === 'flowchart') return; // Flowchart has dedicated canvas wheel panning
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 350) return;

    if (e.deltaY > 25) {
      lastWheelTimeRef.current = now;
      handleNextItem();
    } else if (e.deltaY < -25) {
      lastWheelTimeRef.current = now;
      handlePrevItem();
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto">
      {/* Low-Poly Faceted Backdrop */}
      <div className="bg-faceted-backdrop">
        <div className="poly-layer"></div>
      </div>

      {/* 12-Column Blueprint Overlay (Image 1) */}
      <BlueprintOverlay active={blueprintActive} />

      {/* Main App Container */}
      <div className="app-container">
        
        {/* Top Header */}
        <Header
          currentView={currentView}
          onSelectView={setCurrentView}
          blueprintActive={blueprintActive}
          onToggleBlueprint={() => setBlueprintActive(!blueprintActive)}
          onSearchClick={handleSearch}
          onProfileClick={handleProfile}
        />

        {/* Viewports & Layout */}
        <div className="main-viewport-row">
          <main className="main-content" onWheel={handleContentWheel}>
            {currentView === 'characters' && (
              <CharactersView
                characters={CYBERLIFE_DATA.characters}
                currentIndex={charIdx}
                onPrev={handlePrevItem}
                onNext={handleNextItem}
                lang={lang}
              />
            )}

            {currentView === 'lore' && (
              <LoreView
                loreItems={CYBERLIFE_DATA.lore}
                currentIndex={loreIdx}
                onPrev={handlePrevItem}
                onNext={handleNextItem}
                onOpenPanorama={() => {
                  setPanoramaState({
                    isOpen: true,
                    title: currentLore.panoramaTitle,
                    description: currentLore.panoramaDescription
                  });
                }}
                onPlayVideo={() => {
                  setPanoramaState({
                    isOpen: true,
                    title: `${currentLore.name} // 3D CINEMATIC SCAN`,
                    description: "High-resolution telemetry stream of Detroit's automated corridors and CyberLife spires."
                  });
                }}
                onExplore={() => setCurrentView('flowchart')}
                lang={lang}
              />
            )}

            {currentView === 'flowchart' && (
              chaptersLoading ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '60vh', gap: '16px',
                  color: '#00b4d8', fontFamily: 'monospace'
                }}>
                  <div style={{
                    width: 48, height: 48, border: '3px solid #00b4d8',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span style={{ fontSize: 13, letterSpacing: 2, opacity: 0.8 }}>
                    LOADING CASE DATABASE…
                  </span>
                </div>
              ) : chaptersError ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '60vh', gap: '12px',
                  color: '#e63946', fontFamily: 'monospace', textAlign: 'center', padding: '0 40px'
                }}>
                  <span style={{ fontSize: 22 }}>⚠</span>
                  <span style={{ fontSize: 13, letterSpacing: 1, maxWidth: 520, lineHeight: 1.6 }}>
                    {chaptersError}
                  </span>
                  <button
                    onClick={() => { setDbChapters(null); setChaptersError(null); }}
                    style={{
                      marginTop: 8, padding: '6px 20px', background: 'transparent',
                      border: '1px solid #e63946', color: '#e63946',
                      cursor: 'pointer', fontFamily: 'monospace', fontSize: 11, letterSpacing: 1
                    }}
                  >
                    RETRY
                  </button>
                </div>
              ) : (
                <FlowchartView
                  chapters={activeChapters}
                  onSelectNode={(node, chapter) => setInspectNode({ node, chapter })}
                  onOpenLegend={() => setLegendOpen(true)}
                />
              )
            )}
          </main>

          {/* Right Sub-Menu: Exact match to Reference Image 2 & Image 3 */}
          {currentView !== 'flowchart' && (
            <RightMenu
              onPrev={handlePrevItem}
              onNext={handleNextItem}
              viewType={currentView as 'characters' | 'lore'}
            />
          )}
        </div>

        {/* Bottom Bar: Rendered only for Characters & Lore (Flowchart has its own dedicated bottom HUD bar matching Image 4) */}
        {currentView !== 'flowchart' && (
          <BottomBar
            pageNumber={pageNumberString}
            lang={lang}
            onSelectLang={setLang}
            timelineTimecode={currentView === 'lore' ? currentLore.timelineMarker : '00.0'}
            blueprintActive={blueprintActive}
            onToggleBlueprint={() => setBlueprintActive(!blueprintActive)}
          />
        )}

      </div>

      {/* Modals */}
      <PanoramaModal
        isOpen={panoramaState.isOpen}
        onClose={() => setPanoramaState(prev => ({ ...prev, isOpen: false }))}
        title={panoramaState.title}
        image=""
        description={panoramaState.description}
      />

      <NodeInspectorModal
        node={inspectNode.node}
        chapter={inspectNode.chapter}
        onClose={() => setInspectNode({ node: null, chapter: null })}
      />

      <LegendModal
        isOpen={legendOpen}
        onClose={() => setLegendOpen(false)}
        legend={dbLegend}
      />
    </div>
  );
}

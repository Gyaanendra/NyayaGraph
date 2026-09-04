'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, User, ChevronUp, ChevronDown, Download, Eye, 
  ArrowRight, ShieldCheck, Activity, Check, X, FileText, CheckCircle2
} from 'lucide-react';
import { StatusDiode, DiodeState } from '../components/StatusDiode';
import { DetroitBrand } from '../components/DetroitBrand';
import { TimelineScrubber } from '../components/TimelineScrubber';
import { CompactCard, CompactCardData } from '../components/CompactCard';
import { CalibratingText, ScrollReveal, ScrollHairline } from '../components/MotionComponents';

export default function MarketingLandingPage() {
  const [activeSection2Tab, setActiveSection2Tab] = useState<'INFO' | 'SPEC'>('INFO');
  const [diodeState, setDiodeState] = useState<DiodeState>('blue');
  const [walkthroughOpen, setWalkthroughOpen] = useState<boolean>(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);

  // Compact Cards Data (from docs/IDEA.md & docs/PRD.md)
  const compactCards: CompactCardData[] = [
    {
      id: 'card_1',
      badgeId: 'IDBROKER // 01.4',
      coordinate: '85.9',
      title: 'VIKRAM MALHOTRA',
      subtitle: 'Central structural broker (BC:0.842) bridging Call Center ops with mule layering rings.',
      imageSrc: '/images/card-broker.jpg',
      ctaText: 'INSPECT DOSSIER',
      ctaHref: '/dashboard',
      pagination: '1/3',
    },
    {
      id: 'card_2',
      badgeId: 'IDOPERATOR // 02.1',
      coordinate: '43.7',
      title: 'MOHD. TARIQ @ CHOTU',
      subtitle: 'Prime call center caller with 14 burst calls on night of crime pinging Tower KP2-T04.',
      imageSrc: '/images/card-terminal.jpg',
      ctaText: 'VIEW TELEMETRY',
      ctaHref: '/dashboard',
      pagination: '2/3',
    },
    {
      id: 'card_3',
      badgeId: 'IDSMARTPHONE // 12.5',
      coordinate: '12.5',
      title: 'CARL MANFRED // #45',
      subtitle: 'Interstate syndicate associate identified across historical FIR 45/2024 PS Surajpur.',
      imageSrc: '/images/card-manfred.jpg',
      ctaText: 'EXPLORE ARCHIVE',
      ctaHref: '/dashboard',
      pagination: '3/3',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F2F0] text-[#1A1A1A] flex flex-col justify-between select-none font-body">
      
      {/* =========================================================================
          TOP NAV BAR (Exact Reference Pattern)
          ========================================================================= */}
      <header className="h-16 border-b border-[#DADAD8] bg-[#F2F2F0] px-8 flex items-center justify-between sticky top-0 z-40">
        {/* Left: DETROIT BECOME HUMAN (Two-weight lockup) */}
        <div className="flex items-center gap-6">
          <DetroitBrand subtitle="BECOME HUMAN" size="md" href="/" />
          
          <div className="h-4 w-[1px] bg-[#DADAD8]" />

          <div className="text-[11px] font-mono tracking-[0.14em] text-[#8A8A8A] uppercase">
            NYAYAGRAPH-GN : DIEGETIC SCHEMATIC WORKBENCH
          </div>
        </div>

        {/* Center: Nav links spaced apart (~40px gap) */}
        <nav className="hidden md:flex items-center gap-10 text-xs font-mono tracking-[0.14em] uppercase text-[#8A8A8A]">
          {/* Active Lore with bracket selection marks */}
          <div className="relative px-3 py-1 text-[#1A1A1A] font-semibold flex items-center gap-1">
            <span className="text-[#00D1FF]">[</span>
            <span>LORE</span>
            <span className="text-[#00D1FF]">]</span>
          </div>

          <a href="#characters" className="nav-link-slide hover:text-[#1A1A1A] transition-colors py-1">
            CHARACTERS
          </a>

          <a href="#cards" className="nav-link-slide hover:text-[#1A1A1A] transition-colors py-1">
            GALLERY
          </a>

          <Link href="/dashboard" className="nav-link-slide text-[#00D1FF] font-semibold py-1">
            WORKBENCH →
          </Link>
        </nav>

        {/* Right: Search, Profile, Diode */}
        <div className="flex items-center gap-5 text-[#8A8A8A]">
          <Link href="/dashboard" className="hover:text-[#1A1A1A] transition-colors">
            <Search className="w-4 h-4" />
          </Link>
          <Link href="/dashboard" className="hover:text-[#1A1A1A] transition-colors">
            <User className="w-4 h-4" />
          </Link>
          <StatusDiode state={diodeState} size="md" interactive={true} bootPulse={true} />
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTAINER (12-column grid, 1240px max-width, ~60px below nav)
          ========================================================================= */}
      <main className="flex-1 w-full max-w-[1240px] mx-auto px-6 py-12 flex flex-col gap-24">

        {/* =======================================================================
            SECTION 1: HERO (Matches Reference Image 1 Exactly)
            ======================================================================= */}
        <section className="relative w-full pt-4 pb-8">
          {/* Faint Background Shards / Coordinates */}
          <div className="absolute top-2 right-12 text-[10px] font-mono text-[#B8B8B6] tracking-widest pointer-events-none">
            <CalibratingText finalText="05.05 // LAT 42.3314 N" duration={800} />
          </div>

          <div className="grid grid-cols-12 gap-5 items-center">
            
            {/* LEFT COLUMN (5-6 cols): Product Name, Copy, CTA */}
            <div className="col-span-12 lg:col-span-5 flex flex-col justify-center z-10">
              {/* Eyebrow / Kicker */}
              <div className="text-[10px] font-mono tracking-[0.18em] text-[#00D1FF] uppercase font-semibold mb-3">
                MHA SIH26189 // AI CRIMINAL NETWORK PROFILER
              </div>

              {/* H1: Gotham Ultra / Display 60px with subtle fade-up */}
              <h1 className="font-display text-[50px] lg:text-[60px] font-black tracking-tight text-[#1A1A1A] uppercase leading-[0.95] mb-5 animate-headline-up">
                NYAYAGRAPH
              </h1>

              {/* First paragraph: short, dark, high contrast */}
              <p className="text-[14px] text-[#1A1A1A] font-medium leading-relaxed max-w-[420px] mb-3">
                NyayaGraph-GN is an AI-powered detective intelligence system engineered to transform raw, 
                fragmented law enforcement data into an actionable, court-admissible criminal relationship network.
              </p>

              {/* Second paragraph: smaller, greyer, authentic docs copy */}
              <p className="text-[12.5px] text-[#8A8A8A] leading-relaxed max-w-[420px] mb-6">
                Unlike generic link-analysis tools that demand clean spreadsheets, NyayaGraph-GN attacks 
                the real-world bottleneck: robust entity extraction from messy, handwritten, and code-switched 
                Devanagari FIRs to spotlight the central criminal broker under Bharatiya Sakshya Adhiniyam (BSA) 
                2023 Section 63(4).
              </p>

              {/* Icon + Label Row: WATCH PANORAMA Pattern */}
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setWalkthroughOpen(true)}
                  className="flex items-center gap-2 text-[11px] font-mono tracking-[0.14em] text-[#1A1A1A] hover:text-[#00D1FF] uppercase font-semibold transition-colors"
                >
                  <div className="w-4 h-4 bg-[#FFF500] rounded-full flex items-center justify-center text-[#1A1A1A]">
                    <Eye className="w-2.5 h-2.5 stroke-[2.5]" />
                  </div>
                  <span>WATCH WALKTHROUGH &amp; PITCH</span>
                </button>
              </div>

              {/* Primary CTA Button with Subtle Triangle-Fold Corner */}
              <div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-3.5 btn-folded-triangle font-mono font-bold text-xs tracking-[0.18em] uppercase text-white shadow-none"
                >
                  <span>EXPLORE WORKBENCH</span>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN (6-7 cols): Multi-Triangle Diagonal Faceted Composition with Inverted Triangle & Diminishing Mirrored Trail */}
            <div className="col-span-12 lg:col-span-7 relative flex items-center justify-center min-h-[480px]">
              
              {/* Faint Background Geometric Shard Outlines along Diagonal Vector */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <svg className="w-full h-full" viewBox="0 0 620 480" fill="none">
                  {/* Diagonal Trailing Axis Line */}
                  <line x1="60" y1="420" x2="560" y2="40" stroke="#00D1FF" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 4" />
                  
                  {/* Faceted Shard Polygons */}
                  <polygon points="175,40 435,40 305,400" stroke="#00D1FF" strokeOpacity="0.3" strokeWidth="1" />
                  <polygon points="305,20 515,20 410,320" stroke="#C7CDD2" strokeWidth="0.8" strokeDasharray="3 3" />
                  <polygon points="410,60 570,60 490,290" stroke="#DADAD8" strokeWidth="0.8" />
                </svg>
              </div>

              {/* Floating Faint Coordinate Numbers */}
              <div className="absolute top-2 left-6 text-[11px] font-mono text-[#00D1FF] tracking-widest z-20">
                <CalibratingText finalText="85.9 // VECTOR 45°" duration={800} />
              </div>
              <div className="absolute bottom-6 left-16 text-[9px] font-mono text-[#8A8A8A] tracking-widest z-20">
                <CalibratingText finalText="REFLECT.MIRROR // 02.4" duration={800} />
              </div>

              {/* Multi-Triangle Geometric Composition Container with Clip-Path Wipe */}
              <div className="relative w-[580px] h-[440px] flex items-center justify-center animate-triangle-wipe">

                {/* -------------------------------------------------------------
                    MIRRORED FADED REFLECTION SHADOW (Beneath Baseline)
                    ------------------------------------------------------------- */}
                <div 
                  className="absolute top-[280px] left-[20px] w-[420px] h-[180px] pointer-events-none select-none z-0"
                  style={{
                    transform: 'scaleY(-1)',
                    opacity: 0.22,
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 85%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 85%)',
                  }}
                >
                  {/* Mirrored Upright Triangle */}
                  <div className="absolute left-[20px] top-0 w-[240px] h-[180px] triangle-up overflow-hidden bg-[#1E3A5F]">
                    <Image
                      src="/images/hero-skyline.jpg"
                      alt="Reflection"
                      fill
                      className="object-cover object-center duotone-cyberlife"
                    />
                  </div>
                  {/* Mirrored Inverted Triangle */}
                  <div className="absolute left-[150px] top-0 w-[200px] h-[180px] triangle-down overflow-hidden bg-[#1E3A5F]">
                    <Image
                      src="/images/hero-skyline.jpg"
                      alt="Reflection Inverted"
                      fill
                      className="object-cover object-center duotone-cyberlife scale-x-[-1]"
                    />
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    5. FIFTH TRIANGLE SHARD (Far Diagonal Echo - 10% Diminishing Opacity)
                    ------------------------------------------------------------- */}
                <div 
                  className="absolute right-[10px] top-[70px] w-[130px] h-[180px] z-5 pointer-events-none select-none"
                  style={{ opacity: 0.12 }}
                >
                  <div className="relative w-full h-full triangle-up overflow-hidden border border-dashed border-[#00D1FF] bg-[#F7F7F5]">
                    <Image
                      src="/images/hero-skyline.jpg"
                      alt="Diagonal Echo 5"
                      fill
                      className="object-cover object-center duotone-cyberlife"
                    />
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    4. FOURTH TRIANGLE SHARD (Diagonal Ghost - 25% Diminishing Opacity)
                    ------------------------------------------------------------- */}
                <div 
                  className="absolute right-[65px] top-[45px] w-[160px] h-[230px] z-10 pointer-events-none select-none"
                  style={{ opacity: 0.28 }}
                >
                  <div className="relative w-full h-full triangle-down overflow-hidden bg-[#1E3A5F]">
                    <Image
                      src="/images/hero-skyline.jpg"
                      alt="Diagonal Echo 4"
                      fill
                      className="object-cover object-center duotone-cyberlife scale-x-[-1]"
                    />
                    <div className="absolute inset-0 bg-[#00D1FF]/15 mix-blend-overlay" />
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    3. THIRD TRIANGLE SHARD (Diagonal Step - 55% Diminishing Opacity)
                    ------------------------------------------------------------- */}
                <div 
                  className="absolute right-[130px] top-[20px] w-[200px] h-[290px] z-15 select-none"
                  style={{ opacity: 0.58 }}
                >
                  {/* Subtle Faint Border Shadow */}
                  <div className="absolute inset-0 bg-[#E7E7E5] triangle-up scale-102 pointer-events-none" />
                  <div className="relative w-full h-full triangle-up overflow-hidden bg-[#1E3A5F]">
                    <Image
                      src="/images/hero-skyline.jpg"
                      alt="Diagonal Step 3"
                      fill
                      className="object-cover object-center duotone-cyberlife"
                    />
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    2. UPSIDE-DOWN / INVERTED TRIANGLE (Directly Beside Current Triangle)
                    Fits along the right diagonal slope of Triangle 1 (95% Visibility)
                    ------------------------------------------------------------- */}
                <div className="absolute left-[180px] top-[30px] w-[260px] h-[370px] z-20 select-none">
                  {/* Hairline Border Backing */}
                  <div 
                    className="absolute inset-0 bg-[#E7E7E5] triangle-down pointer-events-none"
                    style={{ transform: 'scale(1.025)' }}
                  />

                  {/* Inverted Triangle Body */}
                  <div className="relative w-full h-full triangle-down overflow-hidden bg-[#1E3A5F] shadow-sm">
                    <Image
                      src="/images/hero-skyline.jpg"
                      alt="Upside-down Cityscape Shard"
                      fill
                      priority
                      className="object-cover object-center duotone-cyberlife scale-x-[-1]"
                      style={{ objectPosition: '80% 20%' }}
                    />

                    {/* Faint CyberLife Blueprint Overlay Grid */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#1E3A5F]/40" />

                    {/* Subtle Corner Coordinate Tag inside inverted triangle */}
                    <div className="absolute top-2 right-4 text-[8px] font-mono text-[#00D1FF] tracking-widest uppercase">
                      INVERT // 02
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    1. PRIMARY UPRIGHT TRIANGLE (Current Triangle - 100% Visibility)
                    ------------------------------------------------------------- */}
                <div className="absolute left-[20px] top-[30px] w-[310px] h-[370px] z-30 select-none">
                  {/* Hairline Border Backing */}
                  <div 
                    className="absolute inset-0 bg-[#E7E7E5] triangle-up pointer-events-none"
                    style={{ transform: 'scale(1.025)' }}
                  />

                  {/* Main Triangle-Masked Image */}
                  <div className="relative w-full h-full triangle-up overflow-hidden bg-[#1E3A5F] shadow-sm">
                    <Image
                      src="/images/hero-skyline.jpg"
                      alt="CyberLife Primary Detective Grid"
                      fill
                      priority
                      className="object-cover object-center duotone-cyberlife scale-105"
                      style={{ objectPosition: '30% 50%' }}
                    />

                    {/* Corner Tag */}
                    <div className="absolute bottom-2 left-6 text-[8px] font-mono text-[#FFF500] tracking-widest uppercase">
                      PRIMARY // 01
                    </div>
                  </div>
                </div>

              </div>

              {/* Right-Edge Vertical Mini-Nav (Stacked Up/Down Buttons from Reference) */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-30">
                <span className="text-[8px] font-mono tracking-[0.2em] text-[#00D1FF] uppercase mb-1 -rotate-90">
                  SECTIONS
                </span>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-7 h-7 bg-[#1A1A1A] hover:bg-[#1E3A5F] text-white flex items-center justify-center rounded-[1px] transition-colors"
                  title="Scroll Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('characters');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-7 h-7 bg-[#1A1A1A] hover:bg-[#1E3A5F] text-white flex items-center justify-center rounded-[1px] transition-colors"
                  title="Scroll Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Hero Bottom Scrubber Bar (Full-width Barcode Graphic + Yellow Marker with left-to-right draw-in) */}
          <div className="mt-12 pt-4">
            <TimelineScrubber markerColor="yellow" timestamp="01.34" initialMarkerPos={44} drawIn={true} />

            {/* Sub-Hero Strip */}
            <div className="mt-3 flex items-center justify-between text-[9px] font-mono tracking-[0.14em] text-[#8A8A8A] uppercase">
              <span className="font-semibold text-[#1A1A1A]">CYBERLIFE // NYAYAGRAPH-GN</span>
              <button onClick={() => setWalkthroughOpen(true)} className="hover:text-[#1A1A1A] transition-colors">
                [ PLAY DEMO ]
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[#8A8A8A]">RU</span>
                <span className="font-bold text-[#1A1A1A]">EN</span>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================================
            SECTION 2: CONTENT / DETAIL (Chloe Split Layout Reference Pattern)
            ======================================================================= */}
        <section id="characters" className="relative w-full pt-8 pb-12">
          {/* Scroll-triggered Hairline Divider (Draws left-to-right) */}
          <ScrollHairline className="mb-8" />

          <div className="grid grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Headline, Copy, Action Link, 2-Tab Component with ScrollReveal */}
            <div className="col-span-12 lg:col-span-6 flex flex-col justify-center z-10">
              <ScrollReveal duration={450}>
                {/* Eyebrow */}
                <div className="text-[10px] font-mono tracking-[0.18em] text-[#8A8A8A] uppercase mb-2">
                  SUBSYSTEM // ENTITY EXTRACTION &amp; FUSION
                </div>

                {/* Headline: Large, Regular Weight (Not Heavy Display Font) */}
                <h2 className="text-[38px] lg:text-[44px] font-light tracking-[0.02em] text-[#1A1A1A] uppercase leading-[1.05] mb-5">
                  DETECTIVE INTELLIGENCE
                </h2>

                {/* Dark first sentence */}
                <p className="text-[14px] text-[#1A1A1A] font-medium leading-relaxed max-w-[440px] mb-3">
                  Autonomous entity extraction engine with closed-world verbatim span verification for Indian criminal proceedings.
                </p>

                {/* Grey second paragraph from docs */}
                <p className="text-[12.5px] text-[#8A8A8A] leading-relaxed max-w-[440px] mb-5">
                  Engineered specifically for the Ministry of Home Affairs mandate (SIH26189), NyayaGraph parses multi-page 
                  Devanagari FIRs in a single forward pass without token truncation, fusing phone numbers, state vehicle plates, 
                  and bank accounts directly with Call Detail Records (CDRs) to expose structural criminal syndicates.
                </p>

                {/* Download Action Link Pattern */}
                <div className="mb-6">
                  <button
                    onClick={() => setDownloadModalOpen(true)}
                    className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.14em] text-[#1A1A1A] hover:text-[#00D1FF] uppercase font-semibold transition-colors"
                  >
                    <div className="w-4 h-4 bg-[#FFF500] rounded-full flex items-center justify-center text-[#1A1A1A]">
                      <Download className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                    <span>DOWNLOAD BSA 63(4) SPECIFICATION</span>
                  </button>
                </div>

              {/* Two-Tab Toggle Component (Exact Reference Pattern) */}
              <div className="flex items-center gap-3 mt-2">
                {/* Tab 1: INFORMATION (Active Filled Navy with Triangle Fold Accent) */}
                <button
                  onClick={() => setActiveSection2Tab('INFO')}
                  className={`px-6 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] font-semibold transition-all ${
                    activeSection2Tab === 'INFO'
                      ? 'tab-folded-active shadow-none'
                      : 'tab-caught-mid-select text-[#8A8A8A] hover:text-[#1A1A1A]'
                  }`}
                >
                  INFORMATION
                </button>

                {/* Tab 2: SPECIFICATIONS (Caught Mid-Select Outline with Corner Handles) */}
                <button
                  onClick={() => setActiveSection2Tab('SPEC')}
                  className={`px-6 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] font-semibold transition-all ${
                    activeSection2Tab === 'SPEC'
                      ? 'tab-folded-active shadow-none'
                      : 'tab-caught-mid-select text-[#8A8A8A] hover:text-[#1A1A1A]'
                  }`}
                >
                  SPECIFICATIONS
                </button>
              </div>

              {/* Tab Content Panels */}
              <div className="mt-5 p-4 bg-white border border-[#DADAD8] rounded-[1px] max-w-[480px]">
                {activeSection2Tab === 'INFO' ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-[9px] font-mono tracking-wider text-[#00D1FF] uppercase font-bold">
                      <span>OPERATIONAL CAPABILITY // AIR-GAP READY</span>
                      <span>100% OFFLINE</span>
                    </div>
                    <p className="text-[11.5px] text-[#8A8A8A] leading-relaxed">
                      Runs locally on standard police workstation hardware with Baidu Unlimited-OCR, Ollama, 
                      and an embedded sovereign cryptographic ledger. Requires zero external cloud connectivity.
                    </p>
                    <div className="pt-2 border-t border-[#E7E7E5] flex items-center gap-4 text-[9px] font-mono text-[#1A1A1A]">
                      <span>✓ HINDI-ENGLISH R-SWA</span>
                      <span>✓ ZERO HALLUCINATION</span>
                      <span>✓ BSA SEC 63(4)</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-[9px] tracking-wider text-[#1E3A5F] uppercase font-bold">
                      <span>ALGORITHMIC ARCHITECTURE</span>
                      <span>METRIC RATIOS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div className="p-2 bg-[#F7F7F5] border border-[#DADAD8]">
                        <span className="text-[8px] text-[#8A8A8A] block">MODULARITY</span>
                        <span className="font-bold text-[#1A1A1A]">LOUVAIN PARTITION</span>
                      </div>
                      <div className="p-2 bg-[#F7F7F5] border border-[#DADAD8]">
                        <span className="text-[8px] text-[#8A8A8A] block">CENTRALITY</span>
                        <span className="font-bold text-[#1A1A1A]">BETWEENNESS &gt; 0.8</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Full-Bleed Portrait + Ghost-Echo Effect with ScrollReveal */}
            <div className="col-span-12 lg:col-span-6 relative flex items-center justify-center min-h-[500px]">
              <ScrollReveal delay={80} duration={500} className="w-full flex items-center justify-center relative">
                {/* Faint Floating Coordinates that calibrate on scroll */}
                <div className="absolute top-4 right-10 text-[10px] font-mono text-[#00D1FF] tracking-widest z-20">
                  <CalibratingText finalText="0.1 // 00010263" triggerOnScroll={true} duration={800} />
                </div>

                {/* 1. DUPLICATED GHOST-ECHO SILHOUETTE (Scaled larger and faded behind) */}
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 scale-125 z-0 select-none filter blur-[1px]"
                  aria-hidden="true"
                >
                  <div className="relative w-[340px] h-[450px]">
                    <Image
                      src="/images/chloe-portrait.jpg"
                      alt="Echo silhouette"
                      fill
                      className="object-contain object-center duotone-cyberlife"
                    />
                  </div>
                </div>

                {/* 2. FOREGROUND CRISP PORTRAIT */}
                <div className="relative z-10 w-[300px] h-[440px] select-none">
                  <Image
                    src="/images/chloe-portrait.jpg"
                    alt="Detective Chloe RT600"
                    fill
                    priority
                    className="object-contain object-center duotone-cyberlife drop-shadow-sm"
                  />
                </div>
              </ScrollReveal>

              {/* Right-Edge Vertical Mini-Nav (Stacked Up/Down Buttons) */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-20">
                <button 
                  onClick={() => {
                    const el = document.getElementById('characters');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-7 h-7 bg-[#1A1A1A] hover:bg-[#1E3A5F] text-white flex items-center justify-center rounded-[1px] transition-colors"
                  title="Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('cards');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-7 h-7 bg-[#1A1A1A] hover:bg-[#1E3A5F] text-white flex items-center justify-center rounded-[1px] transition-colors"
                  title="Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2 Bottom Scrubber */}
          <div className="mt-12 pt-4">
            <TimelineScrubber markerColor="cyan" timestamp="00.0" initialMarkerPos={18} />

            <div className="mt-3 flex items-center justify-between text-[9px] font-mono tracking-[0.14em] text-[#8A8A8A] uppercase">
              <span className="font-semibold text-[#1A1A1A]">CYBERLIFE // ARCHIVE INDEX 02</span>
              <span>CONFIDENTIAL LAW ENFORCEMENT RECORD</span>
              <div className="flex items-center gap-2">
                <span className="text-[#8A8A8A]">RU</span>
                <span className="font-bold text-[#1A1A1A]">EN</span>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================================
            SECTION 3: MOBILE / COMPACT CARD ROW (Manfred Reference Pattern)
            ======================================================================= */}
        <section id="cards" className="relative w-full pt-8 pb-12">
          {/* Scroll-triggered Hairline Divider */}
          <ScrollHairline className="mb-8" />

          <ScrollReveal duration={400}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-[10px] font-mono tracking-[0.18em] text-[#00D1FF] uppercase font-semibold">
                  ACTIVE INVESTIGATIONS // CASE PROFILES
                </div>
                <h3 className="text-2xl font-light tracking-[0.02em] text-[#1A1A1A] uppercase mt-1">
                  KEY SYNDICATE ENTITY DOSSIERS
                </h3>
              </div>

              <div className="text-right text-[10px] font-mono text-[#8A8A8A] uppercase">
                <span>VIEWPORT: ~320PX COMPACT PROPORTION</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Horizontal Card Row: 3 Reusable Compact Phone-Frame Cards with 80ms Stagger */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            {compactCards.map((card, idx) => (
              <ScrollReveal key={card.id} delay={idx * 80} duration={450}>
                <CompactCard card={card} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      </main>

      {/* =========================================================================
          SECTION 4: SITE-WIDE FOOTER (Exact Reference Pattern)
          ========================================================================= */}
      <footer className="w-full border-t border-[#DADAD8] bg-[#F2F2F0] px-8 py-6 select-none">
        <div className="max-w-[1240px] mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            {/* Wordmark Left (Two-weight lockup) */}
            <DetroitBrand subtitle="BECOME HUMAN // CYBERLIFE" size="sm" href="/" />

            {/* Language / Locale Toggle Right (Plain text, no button chrome) */}
            <div className="text-[10px] font-mono tracking-widest text-[#8A8A8A] uppercase">
              <span>RU </span>
              <strong className="text-[#1A1A1A]">EN</strong>
            </div>
          </div>

          {/* Full-width Literal Barcode Graphic Centered */}
          <div className="w-full">
            <div className="h-3 w-full barcode-strip opacity-85" />
            <div className="text-[8.5px] font-mono text-center text-[#8A8A8A] tracking-[0.25em] uppercase mt-1">
              07-923 // 1/5 • BSA 2023 SEC 63(4) CERTIFIED EVIDENCE LEDGER
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          WALKTHROUGH MODAL (Triggered by WATCH WALKTHROUGH)
          ========================================================================= */}
      {walkthroughOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-[1px]">
          <div className="relative w-full max-w-2xl bg-white border border-[#DADAD8] p-6 shadow-none rounded-[2px] font-mono text-xs">
            <div className="corner-bracket-tl" />
            <div className="corner-bracket-tr" />
            <div className="corner-bracket-bl" />
            <div className="corner-bracket-br" />

            <div className="flex items-center justify-between border-b border-[#E7E7E5] pb-3 mb-4">
              <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#1A1A1A]">
                CYBERLIFE // 3-MINUTE HACKATHON LIVE DEMO WALKTHROUGH
              </span>
              <button 
                onClick={() => setWalkthroughOpen(false)}
                className="text-[#8A8A8A] hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[11px] leading-relaxed text-[#1A1A1A]">
              <div className="p-3 bg-[#F7F7F5] border border-[#DADAD8]">
                <strong className="text-[#00D1FF] uppercase block mb-1">0:00 - 0:45 // THE INGESTION BREAKTHROUGH</strong>
                Drag &amp; drop 4-page scanned Hindi-English FIR. Baidu Unlimited-OCR transcribes all Devanagari 
                and English text in one forward pass. Closed-world verifier validates all character spans against raw text.
              </div>

              <div className="p-3 bg-[#F7F7F5] border border-[#DADAD8]">
                <strong className="text-[#00D1FF] uppercase block mb-1">0:45 - 1:45 // UNCOVERING THE BROKER</strong>
                Multi-source fusion merges FIR with 300 rows of CDRs. Louvain community detection segments call centers from mule rings. 
                Betweenness Centrality highlights <strong>Vikram Malhotra @ Vicky (BC:0.842)</strong> as the Structural Hole Spanner.
              </div>

              <div className="p-3 bg-[#F7F7F5] border border-[#DADAD8]">
                <strong className="text-[#00D1FF] uppercase block mb-1">1:45 - 3:00 // BSA 63(4) BLOCKCHAIN CERTIFICATE</strong>
                File hashes anchored on EvidenceLedger.sol. 1-click generation of court-admissible Section 63(4) certificate 
                carrying officer credentials and tamper-proof cryptographic verification.
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E7E7E5] flex items-center justify-between">
              <Link
                href="/dashboard"
                onClick={() => setWalkthroughOpen(false)}
                className="px-5 py-2 bg-[#1E3A5F] text-white font-mono text-[10.5px] uppercase tracking-wider hover:bg-[#152B47] transition-colors"
              >
                LAUNCH WORKBENCH NOW →
              </Link>
              <button
                onClick={() => setWalkthroughOpen(false)}
                className="px-4 py-2 border border-[#DADAD8] text-[#8A8A8A] hover:text-[#1A1A1A] font-mono text-[10.5px] uppercase"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DOWNLOAD SPECIFICATION MODAL
          ========================================================================= */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-[1px]">
          <div className="relative w-full max-w-lg bg-white border border-[#DADAD8] p-6 shadow-none rounded-[2px] font-mono text-xs">
            <div className="corner-bracket-tl" />
            <div className="corner-bracket-tr" />
            <div className="corner-bracket-bl" />
            <div className="corner-bracket-br" />

            <div className="flex items-center justify-between border-b border-[#E7E7E5] pb-3 mb-3">
              <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#1A1A1A]">
                BSA 2023 SEC 63(4) CERTIFICATE SPECIFICATION
              </span>
              <button 
                onClick={() => setDownloadModalOpen(false)}
                className="text-[#8A8A8A] hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11.5px] text-[#8A8A8A] leading-relaxed mb-4">
              Under Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023, digital case extractions require 
              tamper-proof cryptographic hashes and officer certification before presentation in court.
            </p>

            <div className="p-3 bg-[#FAF9F7] border border-[#DADAD8] text-[10px] space-y-1.5 mb-4">
              <div><strong className="text-[#1A1A1A]">STANDARD:</strong> Bharatiya Sakshya Adhiniyam, 2023 Section 63(4)</div>
              <div><strong className="text-[#1A1A1A]">HASH DIGEST:</strong> SHA-256 Sovereign Cryptographic Signature</div>
              <div><strong className="text-[#1A1A1A]">SMART CONTRACT:</strong> EvidenceLedger.sol (Local/Web3 Ledger)</div>
              <div><strong className="text-[#1A1A1A]">STATUS:</strong> Court-Admissible Format Verified</div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E7E7E5]">
              <Link
                href="/dashboard"
                onClick={() => setDownloadModalOpen(false)}
                className="px-4 py-2 bg-[#00D1FF] text-[#1A1A1A] font-bold text-[10px] uppercase tracking-wider hover:bg-[#00B8E0] transition-colors"
              >
                ACCESS VIA WORKBENCH
              </Link>
              <button
                onClick={() => setDownloadModalOpen(false)}
                className="px-4 py-2 border border-[#DADAD8] text-[#8A8A8A] hover:text-[#1A1A1A] text-[10px] uppercase"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

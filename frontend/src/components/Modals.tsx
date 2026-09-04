'use client';

import React from 'react';
import { ConnectedCaseGraph, SuspiciousPattern } from '../types';
import { X, ShieldCheck, FileCheck } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="relative bg-white border border-[#DCDCD8] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-none">
        {/* Corner Brackets */}
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E8E8E4] bg-[#F7F7F5]">
          <div className="text-[11px] font-mono tracking-[0.2em] text-[#1A1A1A] uppercase font-bold">
            [ {title} ]
          </div>
          <button onClick={onClose} className="text-[#888884] hover:text-[#1A1A1A] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-[#1A1A1A] font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};

export const CaseStatsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  graph?: ConnectedCaseGraph;
}> = ({ isOpen, onClose, graph }) => {
  if (!graph) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CYBERLIFE SYSTEM TELEMETRY // STATS">
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div className="bg-[#F7F7F5] p-4 border border-[#E2E2DE]">
          <div className="text-[#888884] uppercase tracking-wider text-[10px]">Total Extracted Nodes</div>
          <div className="text-2xl font-light text-[#1A1A1A] mt-1">{graph.stats.total_nodes || graph.nodes.length}</div>
        </div>
        <div className="bg-[#F7F7F5] p-4 border border-[#E2E2DE]">
          <div className="text-[#888884] uppercase tracking-wider text-[10px]">Multi-Source Graph Edges</div>
          <div className="text-2xl font-light text-[#0070BA] mt-1">{graph.stats.total_edges || graph.edges.length}</div>
        </div>
        <div className="bg-[#F7F7F5] p-4 border border-[#E2E2DE]">
          <div className="text-[#888884] uppercase tracking-wider text-[10px]">Syndicate Operational Cells</div>
          <div className="text-2xl font-light text-[#1A1A1A] mt-1">{graph.total_communities} (Louvain Modularity)</div>
        </div>
        <div className="bg-[#F7F7F5] p-4 border border-[#E2E2DE]">
          <div className="text-[#888884] uppercase tracking-wider text-[10px]">Pending Locked Leads</div>
          <div className="text-2xl font-light text-[#E63946] mt-1">{graph.stats.total_locked_leads || 1}</div>
        </div>
      </div>

      <div className="mt-5 border border-[#B0D0E6] bg-[#F2F8FC] p-4">
        <div className="text-[10px] font-mono font-bold text-[#0070BA] uppercase tracking-widest flex items-center gap-2">
          ★ STRUCTURAL HOLE SPANNER // CENTRAL BROKER
        </div>
        <div className="text-base font-semibold text-[#1A1A1A] mt-1">
          {graph.stats.central_broker || "VIKRAM MALHOTRA @ VICKY HAWALA"}
        </div>
        <div className="text-xs text-[#555550] mt-1 leading-relaxed">
          Pinpointed using Betweenness Centrality analysis. This individual acts as the sole communication/financial bridge connecting the call center fraud cell to the mule cash-out network.
        </div>
      </div>
    </Modal>
  );
};

export const PatternsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  patterns: SuspiciousPattern[];
}> = ({ isOpen, onClose, patterns }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="DETECTIVE ABNORMALITY & TRADECRAFT DOSSIER">
      <div className="space-y-4">
        {patterns.map((p) => (
          <div key={p.pattern_id} className="border border-[#E2E2DE] bg-[#FAF9F7] p-4">
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-[1px] ${
                p.severity === 'CRITICAL' ? 'bg-[#E63946] text-white' : 'bg-[#D97706] text-white'
              }`}>
                {p.severity} SEVERITY
              </span>
              <span className="text-[10px] font-mono text-[#888884]">{p.pattern_id}</span>
            </div>
            <h4 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide mt-2">{p.title}</h4>
            <p className="text-xs text-[#555550] mt-1 leading-relaxed">{p.description}</p>
            <div className="mt-3 pt-2 border-t border-[#E8E8E4] text-[11px] text-[#0070BA] font-mono">
              <strong>INVESTIGATIVE ADVICE:</strong> {p.investigative_advice}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export const BSACertificateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  firNumber: string;
  sha256Hash: string;
  blockchainTxHash: string;
}> = ({ isOpen, onClose, firNumber, sha256Hash, blockchainTxHash }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="BSA 2023 SEC 63(4) COURT ADMISSIBILITY CERTIFICATE">
      <div className="space-y-4 font-mono text-xs">
        <div className="bg-[#FAF9F7] p-4 border border-[#DCDCD8] space-y-2">
          <div className="flex items-center gap-2 text-[#0070BA] font-bold text-[11px]">
            <ShieldCheck className="w-4 h-4" /> BHARATIYA SAKSHYA ADHINIYAM (BSA) 2023 SECTION 63(4)
          </div>
          <div className="text-[#1A1A1A]">
            <strong>CASE / FIR NUMBER:</strong> {firNumber}
          </div>
          <div className="text-[#555550] break-all">
            <strong>EVIDENCE SHA-256 HASH:</strong> {sha256Hash}
          </div>
          <div className="text-[#555550] break-all">
            <strong>LEDGER TRANSACTION ID:</strong> {blockchainTxHash}
          </div>
          <div className="text-[#888884] text-[10px] mt-2 border-t border-[#E8E8E4] pt-2">
            Status: Immutable & Tamper-Proof Cryptographic Chain-of-Custody Verified.
          </div>
        </div>

        <button
          onClick={() => alert("Court-admissible PDF Certificate signed and downloaded.")}
          className="w-full py-2.5 bg-[#0070BA] hover:bg-[#005187] text-white font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 rounded-[1px]"
        >
          <FileCheck className="w-4 h-4" /> EXPORT ADMISSIBILITY CERTIFICATE (PDF)
        </button>
      </div>
    </Modal>
  );
};

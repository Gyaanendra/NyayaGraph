"use client";

import React from 'react';
import { FlowChapter, FlowNode, LegendItem } from '@/data/cyberlifeData';

interface PanoramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  image?: string;
  description: string;
}

export const PanoramaModal: React.FC<PanoramaModalProps> = ({
  isOpen,
  onClose,
  title,
  description
}) => {
  if (!isOpen) return null;

  return (
    <div className="cyber-modal-backdrop" onClick={onClose}>
      <div className="cyber-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {/* High-Tech Procedural CyberLife Surveillance Viewport */}
          <div className="panorama-preview-viewport">
            <div className="procedural-surveillance-feed">
              <div className="radar-sweep-beam"></div>
              <div className="hud-corner-caliper tl"></div>
              <div className="hud-corner-caliper tr"></div>
              <div className="hud-corner-caliper bl"></div>
              <div className="hud-corner-caliper br"></div>
              <div className="surveillance-center-reticle"></div>
              <div className="surveillance-telemetry-text">
                <span>REC // 2038.11.08</span>
                <span>LAT: 42.3314° N, LON: 83.0458° W</span>
                <span>CYBERLIFE SECURITY SATELLITE 04</span>
              </div>
            </div>
          </div>
          <p className="character-bio-text" style={{ marginTop: '14px', fontSize: '13px' }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

interface NodeInspectorModalProps {
  node: FlowNode | null;
  chapter: FlowChapter | null;
  onClose: () => void;
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  node,
  chapter,
  onClose
}) => {
  if (!node || !chapter) return null;

  return (
    <div className="cyber-modal-backdrop" onClick={onClose}>
      <div className="cyber-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {chapter.code} {'//'} {node.label}
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="node-detail-field">
            <div className="node-detail-label">STAGE / CLUSTER</div>
            <div className="node-detail-value">{node.cluster}</div>
          </div>
          <div className="node-detail-field">
            <div className="node-detail-label">NODE STATUS</div>
            <div
              className="node-detail-value"
              style={{
                color: node.status === 'locked' ? '#ff2a5f' : '#00b4d8',
                fontWeight: 700
              }}
            >
              {(node.status || 'ACTIVE').toUpperCase()}
            </div>
          </div>
          <div className="node-detail-field">
            <div className="node-detail-label">NARRATIVE & INVESTIGATION ANALYSIS</div>
            <div className="node-detail-value">
              {node.details || node.req || 'Event documented in primary CyberLife case log.'}
            </div>
          </div>
          <div className="node-detail-field">
            <div className="node-detail-label">GLOBAL DECISION STATS</div>
            <div
              className="node-detail-value"
              style={{
                fontFamily: 'var(--font-hud)',
                fontWeight: 800,
                fontSize: '18px',
                color: 'var(--color-hud-cyan)'
              }}
            >
              {node.worldStat || '100%'} OF OPERATORS CHOSE THIS PATH
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
  legend: LegendItem[];
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose, legend }) => {
  if (!isOpen) return null;

  return (
    <div className="cyber-modal-backdrop" onClick={onClose}>
      <div className="cyber-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">FLOWCHART PROTOCOL // LEGEND</div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="legend-grid-list">
            {legend.map((item, idx) => (
              <div key={idx} className="legend-item-row">
                <div className="legend-color-box" style={{ background: item.color }}></div>
                <div>
                  <div style={{ fontFamily: 'var(--font-hud)', fontSize: '12px', fontWeight: 700 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

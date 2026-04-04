/**
 * StudyMap — Semantic Nebula Discovery Page
 *
 * GPS radar has been removed. Users are now grouped by academic subject
 * in a real-time 3D Three.js visualization. No location data is collected,
 * stored, or displayed. Privacy-first by design.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Globe, Shield } from 'lucide-react';
import SemanticNebula from '../components/ui/SemanticNebula';

const FONT = "'Plus Jakarta Sans','Inter',sans-serif";

export default function StudyMap() {
  return (
    <div style={{
      height: 'calc(100vh - 72px)',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #070b14 0%, #0d1117 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: FONT,
    }}>
      {/* Ambient noise overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 60%),
                          radial-gradient(circle at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 60%)`,
      }} />

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative', zIndex: 10,
          padding: '16px 24px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(7,11,20,0.8)',
          backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Globe size={17} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: 'white', letterSpacing: -0.5 }}>
              Semantic Nebula
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              Discover scholars by subject — not location
            </div>
          </div>
        </div>

        {/* Privacy indicators */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 999, padding: '5px 12px',
          }}>
            <Lock size={11} color="#10b981" />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', letterSpacing: 0.5 }}>
              No GPS Data
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 999, padding: '5px 12px',
          }}>
            <Shield size={11} color="#6366f1" />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#6366f1', letterSpacing: 0.5 }}>
              Privacy-First
            </span>
          </div>
        </div>
      </motion.div>

      {/* Nebula canvas */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1, minHeight: 0 }}>
        <SemanticNebula />
      </div>

      {/* Bottom instruction bar */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '10px 24px',
        background: 'rgba(7,11,20,0.9)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
          🌌 Click any glowing cluster to explore scholars in that subject
        </span>
        <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
          🔒 Your physical location is never collected or shared
        </span>
      </div>
    </div>
  );
}

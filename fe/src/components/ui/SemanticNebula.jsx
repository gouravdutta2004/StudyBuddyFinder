/**
 * SemanticNebula — 3D Subject Cluster Map
 *
 * Replaces the GPS radar. Groups users by academic subject into
 * glowing 3D node clusters. No geolocation. No privacy compromise.
 *
 * Uses Three.js (already in vendor-three chunk).
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, Zap, X, MessageSquare, UserPlus } from 'lucide-react';

const FONT = "'Plus Jakarta Sans','Inter',sans-serif";

// Subject → colour mapping
const SUBJECT_COLORS = {
  'Computer Science': { color: '#6366f1', glow: 'rgba(99,102,241,0.5)' },
  'Mathematics':      { color: '#3b82f6', glow: 'rgba(59,130,246,0.5)' },
  'Physics':          { color: '#8b5cf6', glow: 'rgba(139,92,246,0.5)' },
  'Chemistry':        { color: '#06b6d4', glow: 'rgba(6,182,212,0.5)' },
  'Biology':          { color: '#10b981', glow: 'rgba(16,185,129,0.5)' },
  'Medicine':         { color: '#22c55e', glow: 'rgba(34,197,94,0.5)' },
  'Law':              { color: '#eab308', glow: 'rgba(234,179,8,0.5)'  },
  'Economics':        { color: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
  'History':          { color: '#ef4444', glow: 'rgba(239,68,68,0.5)'  },
  'Literature':       { color: '#ec4899', glow: 'rgba(236,72,153,0.5)' },
  'Psychology':       { color: '#a78bfa', glow: 'rgba(167,139,250,0.5)' },
  'Engineering':      { color: '#38bdf8', glow: 'rgba(56,189,248,0.5)' },
  'Business':         { color: '#fb923c', glow: 'rgba(251,146,60,0.5)'  },
  'Arts':             { color: '#f472b6', glow: 'rgba(244,114,182,0.5)' },
  'Other':            { color: '#94a3b8', glow: 'rgba(148,163,184,0.5)' },
};

function getSubjectColor(subject = '') {
  const lc = subject.toLowerCase();
  for (const [key, val] of Object.entries(SUBJECT_COLORS)) {
    if (lc.includes(key.toLowerCase())) return val;
  }
  return SUBJECT_COLORS.Other;
}

// Lay subjects out in a fixed spiral arrangement
function getClusterPositions(subjects) {
  const positions = {};
  const n = subjects.length;
  subjects.forEach((sub, i) => {
    const angle = (i / n) * Math.PI * 2;
    const radius = 120 + (i % 3) * 40;
    positions[sub] = {
      x: Math.cos(angle) * radius,
      y: (Math.sin(i * 1.3) * 30),
      z: Math.sin(angle) * radius,
    };
  });
  return positions;
}

export default function SemanticNebula() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rafRef = useRef(null);

  const [clusters, setClusters] = useState([]); // [{subject, users:[]}]
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch users and group by subject
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/search?query=&limit=100');
        const users = Array.isArray(data) ? data : (data.users || []);
        // Group by primary subject
        const map = {};
        users.forEach(u => {
          const subj = u.subjects?.[0] || 'Other';
          if (!map[subj]) map[subj] = [];
          map[subj].push(u);
        });
        const clusterList = Object.entries(map)
          .map(([subject, users]) => ({ subject, users }))
          .sort((a, b) => b.users.length - a.users.length);
        setClusters(clusterList);
      } catch { /* silently handle */ }
      finally { setLoading(false); }
    })();
  }, []);

  // Three.js scene
  useEffect(() => {
    if (!containerRef.current || clusters.length === 0) return;

    const W = containerRef.current.clientWidth;
    const H = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 2000);
    camera.position.set(0, 80, 350);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // ── Cluster positions
    const subjects = clusters.map(c => c.subject);
    const positions = getClusterPositions(subjects);

    const clusterMeshes = [];

    clusters.forEach(({ subject, users }) => {
      const pos = positions[subject];
      const { color: colorHex } = getSubjectColor(subject);
      const color = new THREE.Color(colorHex);

      // Core sphere
      const sphereGeo = new THREE.SphereGeometry(8 + Math.min(users.length * 1.5, 18), 24, 24);
      const sphereMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(pos.x, pos.y, pos.z);
      sphere.userData = { subject, users, baseY: pos.y };
      scene.add(sphere);
      clusterMeshes.push(sphere);

      // Inner glow (larger, transparent)
      const glowGeo = new THREE.SphereGeometry((8 + Math.min(users.length * 1.5, 18)) * 1.6, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, side: THREE.BackSide });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(sphere.position);
      scene.add(glow);

      // Orbiting user particles
      const particleCount = Math.min(users.length * 3, 60);
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(particleCount * 3);
      const orbitR = 14 + Math.min(users.length * 1.2, 20);
      for (let i = 0; i < particleCount; i++) {
        const t = (i / particleCount) * Math.PI * 2;
        const offset = (Math.random() - 0.5) * 8;
        pPos[i * 3]     = pos.x + Math.cos(t) * (orbitR + offset);
        pPos[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 14;
        pPos[i * 3 + 2] = pos.z + Math.sin(t) * (orbitR + offset);
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color, size: 2.5, transparent: true, opacity: 0.7 });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);
    });

    // Star field background
    const starsGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(3000);
    for (let i = 0; i < 3000; i++) {
      starPos[i] = (Math.random() - 0.5) * 1200;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.35 });
    scene.add(new THREE.Points(starsGeo, starsMat));

    // Raycaster for click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const handleClick = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clusterMeshes);
      if (hits.length > 0) {
        const { subject, users } = hits[0].object.userData;
        setSelectedCluster({ subject, users });
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    // Auto-rotate camera
    let camAngle = 0;
    const animate = () => {
      if (document.hidden) { rafRef.current = requestAnimationFrame(animate); return; }
      rafRef.current = requestAnimationFrame(animate);
      camAngle += 0.002;
      camera.position.x = Math.sin(camAngle) * 350;
      camera.position.z = Math.cos(camAngle) * 350;
      camera.lookAt(0, 0, 0);

      // Bob clusters gently
      clusterMeshes.forEach((m, i) => {
        m.position.y = m.userData.baseY + Math.sin(Date.now() * 0.001 + i) * 4;
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    sceneRef.current = { scene, renderer, camera, clusterMeshes, starsGeo, starsMat };

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', handleClick);
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      sphereGeoCleanup(scene);
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [clusters]);

  function sphereGeoCleanup(scene) {
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }

  const totalUsers = clusters.reduce((s, c) => s + c.users.length, 0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'transparent', fontFamily: FONT, overflow: 'hidden' }}>
      {/* Legend */}
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 10,
        background: 'rgba(10,15,28,0.85)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px',
        maxWidth: 220,
      }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
          Semantic Nebula
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginBottom: 12, lineHeight: 1.5 }}>
          {totalUsers} scholars across {clusters.length} subjects
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {clusters.slice(0, 6).map(({ subject, users }) => {
            const { color } = getSubjectColor(subject);
            return (
              <button key={subject} onClick={() => setSelectedCluster({ subject, users })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0', textAlign: 'left' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subject}</span>
                <span style={{ fontSize: '0.65rem', color, fontWeight: 700 }}>{users.length}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
          🔒 No location data used
        </div>
      </div>

      {/* Stats top right */}
      <div style={{
        position: 'absolute', top: 20, right: 20, zIndex: 10,
        background: 'rgba(10,15,28,0.85)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Zap size={14} color="#6366f1" />
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>Click a cluster to explore scholars</span>
      </div>

      {/* Three.js Canvas */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 700 }}>Mapping the Nebula…</div>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Selected Cluster Side Panel */}
      <AnimatePresence>
        {selectedCluster && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 370, damping: 32 }}
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 320,
              background: 'rgba(10,15,28,0.96)', backdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', flexDirection: 'column', zIndex: 20,
            }}
          >
            {/* Panel header */}
            <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: getSubjectColor(selectedCluster.subject).color,
                    boxShadow: `0 0 10px ${getSubjectColor(selectedCluster.subject).color}`,
                  }} />
                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'white' }}>
                    {selectedCluster.subject}
                  </span>
                </div>
                <button onClick={() => setSelectedCluster(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Users size={12} color="rgba(255,255,255,0.35)" />
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                  {selectedCluster.users.length} scholars in this cluster
                </span>
              </div>
            </div>

            {/* User list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
              {selectedCluster.users.map((u) => (
                <div key={u._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                    {u.avatar
                      ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: getSubjectColor(selectedCluster.subject).color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.9rem' }}>{u.name?.[0]}</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                      {u.university || u.educationLevel || 'Scholar'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => navigate(`/messages?with=${u._id}`)}
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: '#6366f1', display: 'flex' }}>
                      <MessageSquare size={13} />
                    </button>
                    <button onClick={() => navigate(`/profile/${u._id}`)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                      <UserPlus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

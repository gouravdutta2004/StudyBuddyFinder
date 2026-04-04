import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * NeonShader — Full-screen WebGL GLSL shader with a "gaming vibe" aesthetic.
 *
 * Renders rotating, warping concentric rings in electric blue → magenta,
 * with subtle grain texture. Fills the parent container completely.
 *
 * Props:
 *  - className  {string}  — Extra CSS classes for the wrapper div.
 *  - style      {object}  — Extra inline styles for the wrapper div.
 *  - speed      {number}  — Animation speed multiplier (default 1).
 */
export function NeonShader({ className = '', style = {}, speed = 1 }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── Vertex Shader (passthrough) ────────────────────────────────────────
    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    // ─── Fragment Shader — Neon Rotating Rings ───────────────────────────────
    const fragmentShader = `
      precision highp float;
      uniform vec2  resolution;
      uniform float time;

      mat2 rotate2d(float angle) {
        return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      }

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.1;

        // Warp & breathe
        uv += vec2(sin(uv.y * 4.0 + t * 2.0), cos(uv.x * 4.0 + t * 2.0)) * 0.1;
        uv = rotate2d(t * 0.25) * uv;

        float intensity = 0.0;
        float lineWidth = 0.02;

        for (int i = 0; i < 7; i++) {
          float i_f = float(i);
          float wave = sin(t * 2.0 + i_f * 0.5) * 0.5 + 0.5;
          intensity += lineWidth / abs(wave - length(uv) + sin(uv.x + uv.y) * 0.1);
        }

        // Electric Blue → Magenta gradient
        vec3 color1   = vec3(0.0, 0.5, 1.0);
        vec3 color2   = vec3(1.0, 0.2, 0.5);
        vec3 baseColor = mix(color1, color2, sin(length(uv) * 2.0 - t) * 0.5 + 0.5);

        vec3 finalColor = baseColor * intensity;

        // Subtle grain
        finalColor += (random(uv + t) - 0.5) * 0.08;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // ─── Three.js Scene Setup ────────────────────────────────────────────────
    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene    = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time:       { type: 'f',  value: 1.0 },
      resolution: { type: 'v2', value: new THREE.Vector2() },
    };

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    scene.add(new THREE.Mesh(geometry, material));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ─── Resize Handler ──────────────────────────────────────────────────────
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    };
    onResize();
    window.addEventListener('resize', onResize, false);

    // ─── Animation Loop ──────────────────────────────────────────────────────
    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      uniforms.time.value += 0.05 * speed;
      renderer.render(scene, camera);
      if (sceneRef.current) sceneRef.current.animationId = rafId;
    };

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 };
    animate();

    // ─── Pause RAF when tab is hidden ────────────────────────────────────────
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(rafId); }
      else { animate(); }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // ─── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(rafId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{ background: '#000', overflow: 'hidden', ...style }}
    />
  );
}

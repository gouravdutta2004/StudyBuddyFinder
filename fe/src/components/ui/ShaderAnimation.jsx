import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ShaderAnimation — Full-screen WebGL GLSL shader rendered via Three.js.
 *
 * Renders a mesmerising coloured concentric-ripple light field.
 * Drop it inside a relative-positioned container; it fills 100% width/height.
 *
 * Props:
 *  - className  {string}  — Extra Tailwind / CSS classes for the wrapper div.
 *  - style      {object}  — Extra inline styles for the wrapper div.
 *  - speed      {number}  — Multiplier for animation speed (default 1).
 */
export function ShaderAnimation({ className = '', style = {}, speed = 1 }) {
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

    // ─── Fragment Shader (concentric coloured ripples) ──────────────────────
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        float lineWidth = 0.002;

        vec3 color = vec3(0.0);
        for (int j = 0; j < 3; j++) {
          for (int i = 0; i < 5; i++) {
            color[j] += lineWidth * float(i * i) /
              abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0
                  - length(uv) + mod(uv.x + uv.y, 0.2));
          }
        }

        gl_FragColor = vec4(color[0], color[1], color[2], 1.0);
      }
    `;

    // ─── Three.js Scene Setup ────────────────────────────────────────────────
    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time:       { type: 'f',  value: 1.0 },
      resolution: { type: 'v2', value: new THREE.Vector2() },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

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

    // ─── Pause when tab hidden (save GPU/CPU) ───────────────────────────────
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

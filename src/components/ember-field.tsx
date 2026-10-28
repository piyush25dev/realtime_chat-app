"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Embers drifting up from the bottom edge. Decorative only.
 * - `burning` speeds the embers up (used while a room is being created).
 * - Respects prefers-reduced-motion (renders one still frame).
 * - Falls back to nothing if WebGL isn't available.
 */
export function EmberField({
  burning = false,
  className = "",
}: {
  burning?: boolean;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const burningRef = useRef(burning);

  useEffect(() => {
    burningRef.current = burning;
  }, [burning]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return; // no WebGL: the page still looks fine without the embers
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 50);
    camera.position.z = 6;

    // Soft round sprite so particles glow instead of showing as squares
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(spriteCanvas);

    const COUNT = window.innerWidth < 640 ? 120 : 260;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    // Per-particle state
    const nx = new Float32Array(COUNT); // horizontal position, -1..1
    const prog = new Float32Array(COUNT); // vertical progress, 0..1
    const speed = new Float32Array(COUNT);
    const phase = new Float32Array(COUNT);
    const sway = new Float32Array(COUNT);
    const depth = new Float32Array(COUNT);
    const tint = new Float32Array(COUNT); // 0 = ember, 1 = pale gold

    const respawn = (i: number, initial: boolean) => {
      nx[i] = Math.random() * 2 - 1;
      prog[i] = initial ? Math.random() : 0;
      speed[i] = 0.035 + Math.random() * 0.07;
      phase[i] = Math.random() * Math.PI * 2;
      sway[i] = 0.1 + Math.random() * 0.3;
      depth[i] = -3 + Math.random() * 5;
      tint[i] = Math.random() < 0.25 ? 1 : Math.random() * 0.4;
    };
    for (let i = 0; i < COUNT; i++) respawn(i, true);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.16,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const ember = new THREE.Color("#FF7A45");
    const gold = new THREE.Color("#FFD2A8");
    const mix = new THREE.Color();

    let viewW = 1;
    let viewH = 1;
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      viewW = viewH * camera.aspect;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Gentle parallax following the pointer
    let targetX = 0;
    let targetY = 0;
    const onPointer = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduceMotion) window.addEventListener("pointermove", onPointer, { passive: true });

    const smoothstep = (a: number, b: number, x: number) => {
      const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
      return t * t * (3 - 2 * t);
    };

    let boost = 1;
    let time = 0;

    const update = (dt: number) => {
      boost += ((burningRef.current ? 3.2 : 1) - boost) * Math.min(dt * 3, 1);
      time += dt;

      for (let i = 0; i < COUNT; i++) {
        prog[i] += speed[i] * boost * dt;
        if (prog[i] > 1) respawn(i, false);

        const p = prog[i];
        const x = nx[i] * (viewW / 2) * 1.1 + Math.sin(time * 0.8 + phase[i]) * sway[i];
        const y = -viewH / 2 + p * viewH * 1.05;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = depth[i];

        // Fade in just above the edge, burn out toward the top
        const a = smoothstep(0, 0.08, p) * Math.pow(1 - p, 1.6);
        mix.copy(ember).lerp(gold, tint[i]).multiplyScalar(a);
        colors[i * 3] = mix.r;
        colors[i * 3 + 1] = mix.g;
        colors[i * 3 + 2] = mix.b;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;

      camera.position.x += (targetX * 0.5 - camera.position.x) * Math.min(dt * 2, 1);
      camera.position.y += (-targetY * 0.3 - camera.position.y) * Math.min(dt * 2, 1);
      camera.lookAt(0, 0, 0);
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      update(dt);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };

    if (reduceMotion) {
      update(0);
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      geometry.dispose();
      material.dispose();
      sprite.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className={`pointer-events-none ${className}`} />;
}
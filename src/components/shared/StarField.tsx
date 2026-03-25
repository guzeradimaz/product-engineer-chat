"use client";

import { useEffect, useRef } from "react";

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 120;
    const stars = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.015 + 0.005,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.08,
    }));

    // A few shooting stars
    const shoots: { x: number; y: number; len: number; speed: number; alpha: number; angle: number; active: boolean; timer: number }[] = [];
    const spawnShoot = () => {
      shoots.push({
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.4,
        len: Math.random() * 120 + 60,
        speed: Math.random() * 6 + 4,
        alpha: 1,
        angle: Math.PI / 5 + (Math.random() - 0.5) * 0.3,
        active: true,
        timer: 0,
      });
    };

    let shootTimer = 0;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Stars
      for (const s of stars) {
        s.phase += s.speed;
        s.x += s.drift;
        if (s.x > canvas.width + 2) s.x = -2;
        if (s.x < -2) s.x = canvas.width + 2;
        const a = s.alpha * (0.5 + 0.5 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }

      // Shooting stars
      shootTimer++;
      if (shootTimer > 220) { shootTimer = 0; spawnShoot(); }

      for (const sh of shoots) {
        if (!sh.active) continue;
        sh.x += Math.cos(sh.angle) * sh.speed;
        sh.y += Math.sin(sh.angle) * sh.speed;
        sh.timer++;
        sh.alpha = Math.max(0, 1 - sh.timer / 40);
        if (sh.alpha <= 0) { sh.active = false; continue; }
        const grad = ctx.createLinearGradient(
          sh.x, sh.y,
          sh.x - Math.cos(sh.angle) * sh.len,
          sh.y - Math.sin(sh.angle) * sh.len
        );
        grad.addColorStop(0, `rgba(255,255,255,${sh.alpha})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - Math.cos(sh.angle) * sh.len, sh.y - Math.sin(sh.angle) * sh.len);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.55 }}
    />
  );
}

/**
 * Minimales Canvas-Konfetti in Grün/Gold – wird bei 100 % Map-Completion
 * abgefeuert. Bewusst ohne Dependency (~60 Zeilen), räumt sich selbst auf.
 */
const COLORS = ['#4ade80', '#22c55e', '#fbbf24', '#f59e0b', '#e5e7eb'];

export function fireConfetti(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);

  const pieces = Array.from({ length: 160 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.4,
    y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -6 - Math.random() * 9,
    size: 5 + Math.random() * 6,
    rotation: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  const started = performance.now();
  const DURATION = 2600;

  const tick = (now: number) => {
    const elapsed = now - started;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION);

    for (const piece of pieces) {
      piece.vy += 0.25; // Gravitation
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.vr;
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
      ctx.restore();
    }

    if (elapsed < DURATION) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(tick);
}

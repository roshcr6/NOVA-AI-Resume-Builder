import { useEffect, useRef, useCallback } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const trailCanvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const trail = useRef([]);
  const isHovering = useRef(false);
  const raf = useRef(0);

  const animate = useCallback(() => {
    const cursor = cursorRef.current;
    const canvas = trailCanvasRef.current;
    if (!cursor || !canvas) return;

    // Smooth follow
    cursorPos.current.x += (mousePos.current.x - cursorPos.current.x) * 0.15;
    cursorPos.current.y += (mousePos.current.y - cursorPos.current.y) * 0.15;

    cursor.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0)`;

    // Draw marker trail on canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new trail point
      trail.current.push({
        x: mousePos.current.x,
        y: mousePos.current.y,
        age: 0,
      });

      // Keep only recent points
      if (trail.current.length > 80) {
        trail.current.shift();
      }

      // Age all points
      trail.current.forEach((p) => (p.age += 1));

      // Draw marker stroke trail
      if (trail.current.length > 2) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < trail.current.length; i++) {
          const p = trail.current[i];
          const prev = trail.current[i - 1];
          const opacity = Math.max(0, 1 - p.age / 80);
          const width = Math.max(1.5, (1 - p.age / 80) * 8);

          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${opacity * 0.4})`; // Primary color trail
          ctx.lineWidth = width;
          ctx.stroke();
        }
      }

      // Remove dead points
      trail.current = trail.current.filter((p) => p.age < 80);
    }

    raf.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 768) return;

    const canvas = trailCanvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const onMove = (e) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
    };

    const onResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    // Hover detection
    const onMouseOver = (e) => {
      const target = e.target;
      const cursor = cursorRef.current;
      if (!cursor) return;

      const interactive = target.closest('a, button, input, textarea, select, .btn-primary, .btn-secondary, .card');

      if (interactive) {
        cursor.classList.add('cursor--hover');
        isHovering.current = true;
      } else {
        cursor.classList.remove('cursor--hover');
        isHovering.current = false;
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);
    document.addEventListener('mouseover', onMouseOver);

    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(raf.current);
    };
  }, [animate]);

  if (typeof window !== 'undefined' && window.innerWidth <= 768) return null;

  return (
    <>
      <canvas ref={trailCanvasRef} className="cursor-trail-canvas" />
      <div ref={cursorRef} className="cursor">
        <div className="cursor__outline" />
      </div>
    </>
  );
}

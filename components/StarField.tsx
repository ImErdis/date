import React, { useEffect, useRef } from 'react';

const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const stars: { x: number; y: number; size: number; opacity: number; speed: number }[] = [];
    const numStars = 200;

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2,
        opacity: Math.random(),
        speed: 0.05 + Math.random() * 0.05
      });
    }

    // Shooting star variables
    let shootingStar: { x: number; y: number; len: number; speed: number; life: number } | null = null;
    let nextShootingStarTime = Date.now() + Math.random() * 10000;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw Gradient Background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#020617'); // slate-950
      gradient.addColorStop(1, '#1e1b4b'); // indigo-950
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw Static(ish) Stars
      ctx.fillStyle = 'white';
      stars.forEach((star) => {
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Twinkle
        star.opacity += (Math.random() - 0.5) * 0.05;
        if (star.opacity < 0.1) star.opacity = 0.1;
        if (star.opacity > 1) star.opacity = 1;

        // Slow drift
        star.x -= star.speed;
        if (star.x < 0) star.x = width;
      });

      // Handle Shooting Star
      if (!shootingStar && Date.now() > nextShootingStarTime) {
        shootingStar = {
          x: Math.random() * width * 0.8 + width * 0.1,
          y: 0,
          len: Math.random() * 80 + 20,
          speed: Math.random() * 10 + 10,
          life: 1.0
        };
      }

      if (shootingStar) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${shootingStar.life})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(shootingStar.x - shootingStar.len, shootingStar.y + shootingStar.len); // Diagonal down-left
        ctx.stroke();

        shootingStar.x -= shootingStar.speed;
        shootingStar.y += shootingStar.speed;
        shootingStar.life -= 0.02;

        if (shootingStar.life <= 0 || shootingStar.x < 0 || shootingStar.y > height) {
          shootingStar = null;
          nextShootingStarTime = Date.now() + Math.random() * 20000 + 5000; // Next one in 5-25s
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};

export default StarField;

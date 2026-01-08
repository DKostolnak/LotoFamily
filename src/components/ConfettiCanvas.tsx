'use client';

import React, { useEffect, useRef } from 'react';

interface ConfettiCanvasProps {
    colors?: string[];
    count?: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    size: number;
}

export default function ConfettiCanvas({
    colors = ['#ffc107', '#e53935', '#43a047', '#2196f3', '#9c27b0'],
    count = 150
}: ConfettiCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationIdRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.pointerEvents = 'none'; // Click through
            canvas.style.zIndex = '0'; // Behind content but visible
        };

        window.addEventListener('resize', resize);
        resize();

        // Initialize particles
        particlesRef.current = Array.from({ length: count }, () => createParticle(canvas.width, canvas.height, colors));

        // Animation Loop
        const animate = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((p) => {
                // Physics
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15; // Gravity
                p.rotation += p.rotationSpeed;

                // Wall bounce (left/right)
                if (p.x < 0 || p.x > canvas.width) p.vx *= -0.8;

                // Render
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();

                // Reset if fell off screen
                if (p.y > canvas.height + 20) {
                    // Reuse existing object
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                    p.vx = Math.random() * 4 - 2;
                    p.vy = Math.random() * 5 + 2;
                }
            });

            animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
        };
    }, [colors, count]);

    return <canvas ref={canvasRef} />;
}

function createParticle(w: number, h: number, colors: string[], initialY?: number): Particle {
    return {
        x: Math.random() * w,
        y: initialY ?? Math.random() * h - h, // Start above screen randomly
        vx: Math.random() * 4 - 2, // Random horizontal drift
        vy: Math.random() * 5 + 2, // Downward velocity
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 5 + 8, // 8-13px squares
    };
}

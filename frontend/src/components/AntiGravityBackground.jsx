import React, { useEffect, useRef } from 'react';

const AntiGravityBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Configuration
        const PARTICLE_COUNT = 150;
        const CONNECTION_DISTANCE = 100;
        const MOUSE_RADIUS = 150;
        const GRAVITY = -0.05; // Negative for anti-gravity (upwards)
        const FRICTION = 0.99;

        let width = window.innerWidth;
        let height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;

        const mouse = { x: null, y: null };

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1; // Random horizontal drift
                this.vy = (Math.random() - 0.5) * 1 - 0.5; // Initial upward tendency
                this.radius = Math.random() * 2 + 1;
                this.baseColor = `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.2})`; // Tailwind Blue-500 equivalent
            }

            update() {
                // Apply "Anti-Gravity"
                this.vy += GRAVITY * 0.5; // Constant upward acceleration
                this.vx *= FRICTION;
                // this.vy *= FRICTION; // Don't dampen Y too much or they stop floating up

                // Limit speed
                const maxSpeed = 2;
                if (this.vx > maxSpeed) this.vx = maxSpeed;
                if (this.vx < -maxSpeed) this.vx = -maxSpeed;
                if (this.vy < -maxSpeed) this.vy = -maxSpeed; // Upward speed cap

                // Mouse Interaction (Repulsion)
                if (mouse.x != null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < MOUSE_RADIUS) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
                        const directionX = forceDirectionX * force * 2; // Strength
                        const directionY = forceDirectionY * force * 2;

                        this.vx -= directionX;
                        this.vy -= directionY;
                    }
                }

                // Update Position
                this.x += this.vx;
                this.y += this.vy;

                // Reset if out of bounds (Top/Sides)
                if (this.y < -50) {
                    this.y = height + 50;
                    this.x = Math.random() * width;
                    this.vy = (Math.random() - 0.5) * 1 - 0.5;
                }
                if (this.x < -50) this.x = width + 50;
                if (this.x > width + 50) this.x = -50;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.baseColor;
                ctx.fill();
            }
        }

        const particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            // Clear with trail effect for smoothness? Or plain clear.
            // Plain clear for sharp "black" background
            ctx.fillStyle = 'rgba(0, 0, 0, 1)'; 
            ctx.fillRect(0, 0, width, height);

            particles.forEach((particle) => {
                particle.update();
                particle.draw();
            });

            // Connect particles
            for (let a = 0; a < particles.length; a++) {
                for (let b = a + 1; b < particles.length; b++) { // Optimize loop
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < CONNECTION_DISTANCE) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(59, 130, 246, ${1 - distance / CONNECTION_DISTANCE})`; // Fade out line
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
            
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed top-0 left-0 w-full h-full -z-10 bg-black"
        />
    );
};

export default AntiGravityBackground;

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------
    // 1. PACMAN CUSTOM CURSOR LOGIC
    // --------------------------------------------------------
    const cursorDot = document.querySelector('.cursor-dot');
    const pacman = document.querySelector('.pacman-chaser');
    
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    
    // Store mouse history for the 1.5-second delay mechanic
    const mouseHistory = [];

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // Immediately update user's green dot cursor
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Record coordinates into history timeline
        mouseHistory.push({ x: posX, y: posY, time: Date.now() });
    });

    function animatePacman() {
        let now = Date.now();

        // Shift out old coordinates, seeking the moment exactly 0.5 seconds ago (500ms)
        while (mouseHistory.length > 1 && mouseHistory[1].time < now - 500) {
            mouseHistory.shift();
        }

        // If the oldest mouse position is 0.5s+ old, assign the delayed target
        if (mouseHistory.length > 0 && now - mouseHistory[0].time >= 500) {
            targetX = mouseHistory[0].x;
            targetY = mouseHistory[0].y;
        }

        let dx = targetX - currentX;
        let dy = targetY - currentY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 2) {
            // Even slower speed limit (0.015 down from 0.03)
            currentX += dx * 0.015;
            currentY += dy * 0.015;
            
            // Snap the rotation to exactly 4 directions (Up, Down, Left, Right)
            let rawAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            let snappedAngle = Math.round(rawAngle / 90) * 90;
            
            if(pacman) {
                // Snap the visual position to a retro 24px grid
                const gridSize = 24;
                let snappedX = Math.round(currentX / gridSize) * gridSize;
                let snappedY = Math.round(currentY / gridSize) * gridSize;
                
                pacman.style.left = `${snappedX}px`;
                pacman.style.top = `${snappedY}px`;
                pacman.style.transform = `translate(-50%, -50%) rotate(${snappedAngle}deg)`;
            }
        }
        requestAnimationFrame(animatePacman);
    }
    animatePacman();

    // --------------------------------------------------------
    // 2. SMOOTH SCROLLING
    // --------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --------------------------------------------------------
    // 3. FADE-IN INTERSECTION OBSERVERS
    // --------------------------------------------------------
    const sections = document.querySelectorAll('section, .process-item, .stat-card');
    const options = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, options);

    sections.forEach(section => {
        if(!section.id || section.id !== "hero") { // skip hero so it loads instantly
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(section);
        }
    });

    // --------------------------------------------------------
    // 4. JAVASCRIPT GAMEIFIED PARTICLE SYSTEM (INTERACTIVE)
    // --------------------------------------------------------
    // Creates a glowing interactive particle network on the background via Canvas API
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-2'; // Behind everything but above background color
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = '0.4';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const mouse = { x: null, y: null, radius: 100 };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = (Math.random() * 2) - 1;
            this.speedY = (Math.random() * 2) - 1;
            this.color = '#39ff14'; // Neon Green
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce off walls
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

            // Mouse collision interaction
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouse.radius) {
                // Repel particles from mouse
                const force = (mouse.radius - distance) / mouse.radius;
                const dX = (dx / distance) * force * 5;
                const dY = (dy / distance) * force * 5;
                this.x -= dX;
                this.y -= dY;
            }
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
    }

    function initParticles() {
        particlesArray = [];
        let numberOfParticles = (canvas.width * canvas.height) / 15000;
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
            
            // Connect nearby points
            for (let j = i; j < particlesArray.length; j++) {
                let dx = particlesArray[i].x - particlesArray[j].x;
                let dy = particlesArray[i].y - particlesArray[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(57, 255, 20, ${1 - distance/100})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();
});

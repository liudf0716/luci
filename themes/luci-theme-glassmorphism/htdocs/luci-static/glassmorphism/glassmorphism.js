/**
 * Glassmorphism Theme - Interactive JavaScript
 * Modern liquid glass theme with smooth interactions
 * Copyright 2025 LuCI Project
 */

(function() {
    'use strict';

    // Theme configuration
    const THEME_CONFIG = {
        sidebarWidth: 280,
        animationDuration: 300,
        particleCount: 50,
        enableParticles: window.innerWidth > 768,
        enableAnimations: !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };

    // Theme state
    let themeState = {
        sidebarOpen: window.innerWidth > 1024,
        isInitialized: false,
        particles: []
    };

    /**
     * Initialize the theme
     */
    function initTheme() {
        if (themeState.isInitialized) return;
        
        console.log('🌊 Initializing Glassmorphism Theme');
        
        setupNavigation();
        setupScrollEffects();
        setupFormEnhancements();
        setupParticleSystem();
        setupKeyboardNavigation();
        setupTooltips();
        setupIntersectionObserver();
        initializeLogo();
        
        themeState.isInitialized = true;
        
        // Add theme-ready class to body
        document.body.classList.add('glass-theme-ready');
    }

    /**
     * Initialize logo with animation
     */
    function initializeLogo() {
        const logo = document.querySelector('.glass-logo img, .glass-logo svg');
        if (!logo) return;
        
        // Add loading class for initial animation
        logo.parentElement.classList.add('loading');
        
        // Remove loading class after animation
        setTimeout(() => {
            logo.parentElement.classList.remove('loading');
        }, 2000);
        
        // Add dynamic effects based on system status
        if (THEME_CONFIG.enableAnimations) {
            setupDynamicLogo(logo);
        }
    }

    /**
     * Setup dynamic logo effects
     */
    function setupDynamicLogo(logo) {
        let glowLevel = 0;
        
        // Simulate system activity glow
        setInterval(() => {
            // Simple activity simulation - in real implementation, 
            // this could be based on actual system metrics
            const activity = Math.random();
            
            if (activity > 0.8) {
                glowLevel = Math.min(glowLevel + 0.1, 1);
            } else {
                glowLevel = Math.max(glowLevel - 0.05, 0);
            }
            
            // Apply glow effect
            const glowIntensity = 0.3 + (glowLevel * 0.4);
            const shadowSpread = 8 + (glowLevel * 8);
            
            logo.style.filter = `brightness(${1.2 + (glowLevel * 0.3)}) drop-shadow(0 2px ${shadowSpread}px rgba(233, 69, 96, ${glowIntensity}))`;
        }, 1000);
        
        // Add click animation
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add pulse animation class
            this.parentElement.style.animation = 'none';
            requestAnimationFrame(() => {
                this.parentElement.style.animation = 'logoPulse 0.6s ease-out';
            });
            
            // Reset animation
            setTimeout(() => {
                this.parentElement.style.animation = '';
            }, 600);
        });
        
        // Add hover effects for interactive feel
        logo.addEventListener('mouseenter', function() {
            if (THEME_CONFIG.enableAnimations) {
                this.style.transform = 'scale(1.1) rotate(5deg)';
                this.style.transition = 'transform 0.3s ease';
            }
        });
        
        logo.addEventListener('mouseleave', function() {
            if (THEME_CONFIG.enableAnimations) {
                this.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    }

    /**
     * Setup navigation functionality
     */
    function setupNavigation() {
        const navToggle = document.getElementById('nav-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        if (!navToggle || !sidebar || !overlay) return;

        // Toggle sidebar
        navToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', closeSidebar);
        
        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && themeState.sidebarOpen && window.innerWidth <= 1024) {
                closeSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', debounce(handleResize, 250));
    }

    /**
     * Toggle sidebar visibility
     */
    function toggleSidebar() {
        if (themeState.sidebarOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    /**
     * Open sidebar
     */
    function openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const navToggle = document.getElementById('nav-toggle');
        
        if (!sidebar || !overlay || !navToggle) return;
        
        themeState.sidebarOpen = true;
        
        if (window.innerWidth <= 1024) {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('active');
        }
        
        navToggle.classList.add('active');
        
        // Focus management for accessibility
        const firstLink = sidebar.querySelector('.glass-menu-link');
        if (firstLink) firstLink.focus();
    }

    /**
     * Close sidebar
     */
    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const navToggle = document.getElementById('nav-toggle');
        
        if (!sidebar || !overlay || !navToggle) return;
        
        themeState.sidebarOpen = false;
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        navToggle.classList.remove('active');
    }

    /**
     * Handle window resize
     */
    function handleResize() {
        if (window.innerWidth > 1024) {
            themeState.sidebarOpen = true;
            closeSidebar(); // Reset mobile states
        } else {
            themeState.sidebarOpen = false;
        }
        
        // Update particle system
        if (THEME_CONFIG.enableParticles) {
            updateParticleSystem();
        }
    }

    // Scroll throttling variable
    let scrollTicking = false;

    /**
     * Setup scroll effects
     */
    function setupScrollEffects() {
        if (!THEME_CONFIG.enableAnimations) return;
        
        window.addEventListener('scroll', function() {
            if (!scrollTicking) {
                requestAnimationFrame(updateScrollEffects);
                scrollTicking = true;
            }
        });
    }

    /**
     * Update scroll-based effects
     */
    function updateScrollEffects() {
        const scrollY = window.scrollY;
        const header = document.querySelector('.glass-header');
        
        if (header) {
            // Add/remove scrolled class for header styling
            if (scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        // Parallax effect for background orbs
        const orbs = document.querySelectorAll('.glass-orb');
        orbs.forEach((orb, index) => {
            const speed = 0.1 + (index * 0.05);
            orb.style.transform = `translateY(${scrollY * speed}px)`;
        });
        
        scrollTicking = false;
    }

    /**
     * Setup form enhancements
     */
    function setupFormEnhancements() {
        // Add glass classes to existing form elements
        const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="number"], select, textarea');
        inputs.forEach(input => {
            input.classList.add('glass-form-input');
            
            // Add floating label effect
            setupFloatingLabel(input);
        });

        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], .btn');
        buttons.forEach(button => {
            button.classList.add('glass-btn');
            
            // Add ripple effect
            setupRippleEffect(button);
        });
    }

    /**
     * Setup floating label effect
     */
    function setupFloatingLabel(input) {
        if (input.placeholder) {
            const wrapper = document.createElement('div');
            wrapper.className = 'glass-floating-label';
            
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            
            const label = document.createElement('label');
            label.textContent = input.placeholder;
            label.className = 'glass-floating-text';
            wrapper.appendChild(label);
            
            input.placeholder = '';
            
            // Handle focus/blur events
            input.addEventListener('focus', () => label.classList.add('active'));
            input.addEventListener('blur', () => {
                if (!input.value) label.classList.remove('active');
            });
            
            // Check initial value
            if (input.value) label.classList.add('active');
        }
    }

    /**
     * Setup ripple effect for buttons
     */
    function setupRippleEffect(button) {
        if (!THEME_CONFIG.enableAnimations) return;
        
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
                z-index: 1;
            `;
            
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    }

    /**
     * Setup particle system for enhanced visual effects
     */
    function setupParticleSystem() {
        if (!THEME_CONFIG.enableParticles || !THEME_CONFIG.enableAnimations) return;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'glass-particles';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.3;
        `;
        
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        resizeCanvas();
        initParticles();
        animateParticles();
        
        window.addEventListener('resize', resizeCanvas);
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        function initParticles() {
            themeState.particles = [];
            for (let i = 0; i < THEME_CONFIG.particleCount; i++) {
                themeState.particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        }
        
        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            themeState.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
                ctx.fill();
            });
            
            requestAnimationFrame(animateParticles);
        }
    }

    /**
     * Update particle system
     */
    function updateParticleSystem() {
        const canvas = document.getElementById('glass-particles');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }

    /**
     * Setup keyboard navigation
     */
    function setupKeyboardNavigation() {
        document.addEventListener('keydown', function(e) {
            // Alt + M to toggle menu
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                toggleSidebar();
            }
            
            // Alt + H to go to home
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                const homeLink = document.querySelector('.glass-menu-link[href*="admin"]');
                if (homeLink) homeLink.click();
            }
        });
    }

    /**
     * Setup tooltips
     */
    function setupTooltips() {
        const elementsWithTitle = document.querySelectorAll('[title]');
        elementsWithTitle.forEach(element => {
            const title = element.getAttribute('title');
            element.removeAttribute('title');
            element.setAttribute('data-tooltip', title);
            
            element.addEventListener('mouseenter', showTooltip);
            element.addEventListener('mouseleave', hideTooltip);
        });
    }

    /**
     * Show tooltip
     */
    function showTooltip(e) {
        const tooltip = document.createElement('div');
        tooltip.className = 'glass-tooltip';
        tooltip.textContent = e.target.getAttribute('data-tooltip');
        document.body.appendChild(tooltip);
        
        const rect = e.target.getBoundingClientRect();
        tooltip.style.cssText = `
            position: absolute;
            top: ${rect.top - tooltip.offsetHeight - 8}px;
            left: ${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px;
            background: var(--glass-bg-alpha);
            backdrop-filter: var(--glass-blur-sm);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-sm);
            padding: var(--spacing-xs) var(--spacing-sm);
            font-size: 0.75rem;
            color: var(--glass-text-primary);
            z-index: var(--z-tooltip);
            opacity: 0;
            transform: translateY(4px);
            transition: var(--transition-fast);
            pointer-events: none;
        `;
        
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        });
        
        e.target._tooltip = tooltip;
    }

    /**
     * Hide tooltip
     */
    function hideTooltip(e) {
        if (e.target._tooltip) {
            e.target._tooltip.remove();
            delete e.target._tooltip;
        }
    }

    /**
     * Setup intersection observer for animations
     */
    function setupIntersectionObserver() {
        if (!THEME_CONFIG.enableAnimations) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('glass-animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });
        
        // Observe cards and content sections
        document.querySelectorAll('.glass-card, .glass-page-content').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Debounce utility function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Add CSS animations
     */
    function addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .glass-animate-in {
                animation: slideInUp 0.6s ease-out forwards;
            }
            
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .glass-floating-label {
                position: relative;
                margin-bottom: var(--spacing-lg);
            }
            
            .glass-floating-text {
                position: absolute;
                left: var(--spacing-md);
                top: var(--spacing-md);
                color: var(--glass-text-muted);
                font-size: 1rem;
                transition: var(--transition-fast);
                pointer-events: none;
                background: transparent;
                padding: 0 var(--spacing-xs);
            }
            
            .glass-floating-text.active {
                top: -8px;
                font-size: 0.75rem;
                color: var(--glass-accent);
                background: var(--glass-primary);
            }
            
            .glass-header.scrolled {
                background: var(--glass-bg-alpha-dark);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            }
            
            .glass-theme-ready * {
                transition: var(--transition-fast);
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize theme when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            addAnimationStyles();
            initTheme();
        });
    } else {
        addAnimationStyles();
        initTheme();
    }

    // Expose theme API for external use
    window.GlassmorphismTheme = {
        init: initTheme,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        config: THEME_CONFIG,
        state: themeState
    };

})();
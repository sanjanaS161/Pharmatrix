import React from 'react';
import { motion } from 'framer-motion';

// Common SVG filters for the "Soft 3D Matte Plastic" look
const Defs = () => (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
            {/* Soft Drop Shadow for overall depth */}
            <filter id="soft-shadow" x="-20%" y="-20%" width="150%" height="150%">
                <feDropShadow dx="0" dy="15" stdDeviation="20" floodColor="#000000" floodOpacity="0.8" />
                <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
            </filter>

            {/* Inner glow/highlight for plastic material feel */}
            <filter id="inner-glow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                <feFlood floodColor="#ffffff" floodOpacity="0.15" result="glowColor" />
                <feComposite in="glowColor" in2="blur" operator="in" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>

            {/* Pill Gradients */}
            <radialGradient id="pill-orange" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="var(--accent-secondary)" />
                <stop offset="60%" stopColor="var(--accent-primary)" />
                <stop offset="100%" stopColor="#B34A00" />
            </radialGradient>

            <radialGradient id="pill-black" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#2A2A2A" />
                <stop offset="60%" stopColor="rgba(211,234,255,0.72)" />
                <stop offset="100%" stopColor="#050505" />
            </radialGradient>

            <radialGradient id="tablet-white" cx="30%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#E0E0E0" />
                <stop offset="100%" stopColor="#9E9E9E" />
            </radialGradient>

            {/* Foil gradient for blister pack */}
            <linearGradient id="foil" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A4A4A" />
                <stop offset="25%" stopColor="#8A8A8A" />
                <stop offset="50%" stopColor="#3A3A3A" />
                <stop offset="75%" stopColor="#6A6A6A" />
                <stop offset="100%" stopColor="#2A2A2A" />
            </linearGradient>

            {/* Blister bubble specular highlight */}
            <radialGradient id="bubble-shine" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
        </defs>
    </svg>
);

// 1. Two-tone Capsule Pill
export const Pill3D = ({ style, animate, transition }) => (
    <motion.div style={{ ...style, filter: 'url(#soft-shadow)' }} animate={animate} transition={transition}>
        <svg viewBox="0 0 100 240" width="100%" height="100%">
            {/* Top Half (Orange) */}
            <path d="M 10,120 L 10,50 A 40,40 0 0,1 90,50 L 90,120 Z" fill="url(#pill-orange)" filter="url(#inner-glow)" />
            {/* Bottom Half (Black) */}
            <path d="M 10,120 L 10,190 A 40,40 0 0,0 90,190 L 90,120 Z" fill="url(#pill-black)" filter="url(#inner-glow)" />
            {/* Specular highlight overlay for uniform cylinder look */}
            <rect x="20" y="20" width="15" height="200" rx="7.5" fill="rgba(255,255,255,0.15)" style={{ filter: 'blur(4px)' }} />
        </svg>
    </motion.div>
);

// 2. Round White Tablet with score line
export const Tablet3D = ({ style, animate, transition }) => (
    <motion.div style={{ ...style, filter: 'url(#soft-shadow)' }} animate={animate} transition={transition}>
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <circle cx="60" cy="60" r="50" fill="url(#tablet-white)" filter="url(#inner-glow)" />
            {/* Score line (indentation shadow and highlight) */}
            <path d="M 25,60 L 95,60" stroke="#888" strokeWidth="4" strokeLinecap="round" />
            <path d="M 25,62 L 95,62" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </svg>
    </motion.div>
);

// 3. Modern Blister Pack (Foil with 4 pills)
export const Blister3D = ({ style, animate, transition }) => (
    <motion.div style={{ ...style, filter: 'url(#soft-shadow)' }} animate={animate} transition={transition}>
        <svg viewBox="0 0 160 220" width="100%" height="100%">
            {/* Foil Base */}
            <rect x="10" y="10" width="140" height="200" rx="15" fill="url(#foil)" />
            {/* Inner Border Detail */}
            <rect x="18" y="18" width="124" height="184" rx="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

            {/* 4 Pill Bubbles */}
            <g transform="translate(45, 50)">
                <circle cx="0" cy="0" r="22" fill="rgba(211,234,255,0.72)" stroke="#222" strokeWidth="2" />
                <circle cx="0" cy="0" r="20" fill="url(#bubble-shine)" />

                <circle cx="70" cy="0" r="22" fill="rgba(211,234,255,0.72)" stroke="#222" strokeWidth="2" />
                <circle cx="70" cy="0" r="20" fill="url(#bubble-shine)" />

                <circle cx="0" cy="120" r="22" fill="rgba(211,234,255,0.72)" stroke="#222" strokeWidth="2" />
                <circle cx="0" cy="120" r="20" fill="url(#bubble-shine)" />

                <circle cx="70" cy="120" r="22" fill="rgba(211,234,255,0.72)" stroke="#222" strokeWidth="2" />
                <circle cx="70" cy="120" r="20" fill="url(#bubble-shine)" />
            </g>
        </svg>
    </motion.div>
);

// 4. Matte Medicine Bottle with Glowing Cap
export const Bottle3D = ({ style, animate, transition }) => (
    <motion.div style={{ ...style, filter: 'url(#soft-shadow)' }} animate={animate} transition={transition}>
        <svg viewBox="0 0 140 240" width="100%" height="100%">
            {/* Bottle Body */}
            <rect x="20" y="70" width="100" height="150" rx="20" fill="url(#pill-black)" filter="url(#inner-glow)" />
            {/* Label */}
            <rect x="20" y="100" width="100" height="80" fill="#1A1A1A" />
            <rect x="40" y="120" width="60" height="8" rx="4" fill="var(--accent-primary)" opacity="0.8" />
            <rect x="40" y="140" width="40" height="6" rx="3" fill="#666" />
            <rect x="40" y="155" width="50" height="6" rx="3" fill="#666" />

            {/* Glowing Orange Cap */}
            <path d="M 30,70 L 30,25 C 30,15 40,10 50,10 L 90,10 C 100,10 110,15 110,25 L 110,70 Z" fill="url(#pill-orange)" filter="url(#inner-glow)" />
            {/* Cap Ridges */}
            <rect x="40" y="10" width="6" height="60" fill="rgba(0,0,0,0.2)" />
            <rect x="55" y="10" width="6" height="60" fill="rgba(0,0,0,0.2)" />
            <rect x="70" y="10" width="6" height="60" fill="rgba(0,0,0,0.2)" />
            <rect x="85" y="10" width="6" height="60" fill="rgba(0,0,0,0.2)" />

            {/* Specular highlight */}
            <rect x="35" y="15" width="15" height="200" rx="7.5" fill="rgba(255,255,255,0.08)" style={{ filter: 'blur(3px)' }} />
        </svg>
    </motion.div>
);

export default Defs;

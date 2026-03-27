import React, { useEffect, useMemo } from 'react';
import './Intro.css';

const Intro = ({ onComplete }) => {
    const text = 'PHARMATRIX';
    const particles = useMemo(
        () => Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: `${Math.random() * 100 - 50}vw`,
            y: `${Math.random() * 100 - 50}vh`
        })),
        []
    );

    useEffect(() => {
        // Reduced animation duration to ~1.8 secs
        const timer = setTimeout(() => {
            onComplete();
        }, 1800);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="intro-container">
            {/* Particles background layer */}
            <div className="particles-layer">
                {particles.map((p) => (
                    <div key={p.id} className="particle" style={{
                        '--i': p.id,
                        '--x': p.x,
                        '--y': p.y
                    }}></div>
                ))}
            </div>

            <div className="intro-text">
                {text.split('').map((char, index) => (
                    <span key={index} className="intro-char" style={{ '--char-index': index }}>
                        {char}
                    </span>
                ))}
            </div>

            <div className="light-streak"></div>
        </div>
    );
};

export default Intro;

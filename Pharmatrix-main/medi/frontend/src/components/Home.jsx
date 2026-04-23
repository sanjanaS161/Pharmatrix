import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, Search, BriefcaseMedical, Sparkles, Shield, Clock, ChevronRight, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';

function Home() {
    const navigate = useNavigate();
    const { user, setShowLoginPrompt } = useAuth();

    const handleExplore = (route) => {
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }
        navigate(route);
    };

    const features = [
        {
            icon: <Scan size={32} />,
            title: "Medicine Scanner",
            description: "Scan medicine packages instantly with AI-powered OCR and get detailed information about dosage, usage, and warnings.",
            route: "/scanner"
        },
        {
            icon: <Search size={32} />,
            title: "AI Health Assistant",
            description: "Describe your symptoms and get personalized medicine recommendations from our intelligent AI doctor.",
            route: "/search"
        },
        {
            icon: <BriefcaseMedical size={32} />,
            title: "Smart Cabinet",
            description: "Track your medicine inventory, get low-stock alerts, and never run out of critical medications.",
            route: "/cabinet"
        },
        {
            icon: <Sparkles size={32} />,
            title: "Smart Diet Planner",
            description: "Get personalized, AI-powered diet recommendations based on your age, health conditions, or current medications.",
            route: "/diet-planner"
        },
        {
            icon: <BarChart3 size={32} />,
            title: "Analytics Dashboard",
            description: "Monitor medicine usage, expiry risk, interaction alerts, and adherence score with one clean overview.",
            route: "/analytics"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0, scale: 0.9 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 100, damping: 12 }
        }
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>

            {/* HERo SECTION */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{ marginBottom: '5rem', paddingTop: '0.5rem' }}
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '2.25rem',
                    alignItems: 'center'
                }}>
                    <div style={{ textAlign: 'left', maxWidth: '690px' }}>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: '800',
                            letterSpacing: '0.22em',
                            color: '#e8f4ff',
                            textShadow: '0 0 5px var(--accent-primary), 0 0 10px var(--accent-primary)',
                            marginBottom: '1.2rem'
                        }}>
                            PHARMATRIX
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(47,128,237,0.10)',
                                padding: '0.6rem 1.25rem',
                                borderRadius: 'var(--radius-full)',
                                marginBottom: '1.5rem',
                                border: '1px solid rgba(47,128,237,0.22)',
                                boxShadow: '0 0 20px rgba(47,128,237,0.12)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Next-Generation Healthcare
                            </span>
                        </motion.div>

                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 5.8vw, 4.5rem)',
                            fontWeight: '800',
                            color: 'var(--text-primary)',
                            marginBottom: '1.2rem',
                            lineHeight: '1.08',
                            letterSpacing: '-0.04em',
                            textShadow: '0 0 30px rgba(208,232,255,0.35)'
                        }}>
                            Your Personal
                            <br />
                            <span style={{
                                background: 'linear-gradient(135deg, #8ec5ff 18%, var(--accent-primary) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                filter: 'drop-shadow(0 0 20px rgba(47,128,237,0.3))'
                            }}>
                                Medicine Assistant
                            </span>
                        </h1>

                        <p style={{
                            fontSize: '1.15rem',
                            color: 'var(--text-secondary)',
                            maxWidth: '620px',
                            margin: '0 0 2rem 0',
                            lineHeight: '1.7',
                            fontWeight: '400'
                        }}>
                            Scan, analyze, and manage your medications with the power of advanced AI. Experience the future of personal healthcare today.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '0.85rem', flexWrap: 'wrap' }}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleExplore('/scanner')}
                                className="btn-accent"
                                style={{ padding: '1rem 2.2rem', fontSize: '1.03rem' }}
                            >
                                Start Scanning <Scan size={20} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleExplore('/search')}
                                className="btn-black-outlined"
                                style={{ padding: '1rem 2.2rem', fontSize: '1.03rem' }}
                            >
                                Ask AI Assistant
                            </motion.button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, x: 12 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 0.85, ease: 'easeOut' }}
                            whileHover={{ scale: 1.02, rotate: -0.5 }}
                            style={{
                                width: 'min(100%, 620px)',
                                aspectRatio: '1 / 1',
                                position: 'relative',
                                borderRadius: '62% 38% 55% 45% / 46% 58% 42% 54%',
                                background: 'linear-gradient(145deg, rgba(234,244,255,0.85), rgba(206,229,252,0.55))',
                                border: '2px solid rgba(47,128,237,0.26)',
                                boxShadow: '0 20px 44px rgba(25,79,138,0.2)',
                                padding: '16px',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                width: '180px',
                                height: '180px',
                                right: '-36px',
                                top: '-40px',
                                borderRadius: '50%',
                                background: 'rgba(86,204,242,0.24)',
                                filter: 'blur(2px)'
                            }} />
                            <img
                                src="/hero-img.png"
                                alt="Healthcare hero"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '62% 38% 55% 45% / 46% 58% 42% 54%',
                                    border: '1px solid rgba(47,128,237,0.22)'
                                }}
                            />
                            <motion.div
                                animate={{ y: ['-125%', '130%'] }}
                                transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    top: 0,
                                    height: '24%',
                                    background: 'linear-gradient(180deg, transparent, rgba(86,204,242,0.28), transparent)',
                                    boxShadow: '0 0 18px rgba(86,204,242,0.3)',
                                    pointerEvents: 'none',
                                    zIndex: 3
                                }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        gap: '3rem',
                        flexWrap: 'wrap',
                        marginTop: '2.75rem',
                        paddingTop: '2rem',
                        borderTop: '1px solid var(--glass-border)'
                    }}
                >
                    {[
                        { icon: <Shield size={22} style={{ color: 'var(--text-primary)' }} />, text: "Secure & Private" },
                        { icon: <Sparkles size={22} style={{ color: 'var(--accent-primary)' }} />, text: "AI-Powered Analysis" },
                        { icon: <Clock size={22} style={{ color: 'var(--text-primary)' }} />, text: "Real-time Processing" }
                    ].map((badge, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                            <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                {badge.icon}
                            </div>
                            <span style={{ fontSize: '1rem', fontWeight: '500', letterSpacing: '0.02em' }}>{badge.text}</span>
                        </div>
                    ))}
                </motion.div>
            </motion.div>

            {/* FEATURE CARDS */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.1rem',
                    marginBottom: '6rem',
                    overflow: 'visible',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem'
                }}
            >
                {features.map((feature, index) => (
                    <motion.div
                        variants={itemVariants}
                        key={index}
                        onClick={() => handleExplore(feature.route)}
                        className="glass-card flex-card"
                        whileHover={{
                            scale: 1.02,
                            y: -4,
                            boxShadow: "0 25px 50px rgba(47,128,237,0.35)",
                            borderColor: "var(--accent-primary)",
                            transition: { type: "spring", stiffness: 300 }
                        }}
                        style={{
                            width: '100%',
                            minWidth: '0',
                            maxWidth: '100%',
                            minHeight: '360px',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            padding: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            transformStyle: 'preserve-3d',
                            perspective: '1000px',
                            borderRadius: '26px',
                            boxSizing: 'border-box'
                        }}
                    >
                        {/* Soft background glow */}
                        <div style={{
                            position: 'absolute',
                            top: '-50px',
                            right: '-50px',
                            width: '150px',
                            height: '150px',
                            background: 'var(--accent-glow)',
                            filter: 'blur(60px)',
                            opacity: 0.5,
                            borderRadius: '50%',
                            zIndex: 0,
                            pointerEvents: 'none'
                        }}></div>

                        {/* Icon */}
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-primary)',
                            marginBottom: '2rem',
                            position: 'relative',
                            zIndex: 1,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}>
                            {feature.icon}
                        </div>

                        {/* Content */}
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            marginBottom: '1rem',
                            color: 'var(--text-primary)',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            {feature.title}
                        </h3>

                        <p style={{
                            color: 'var(--text-secondary)',
                            lineHeight: '1.7',
                            marginBottom: '2.5rem',
                            fontSize: '1.05rem',
                            position: 'relative',
                            zIndex: 1,
                            flex: 1
                        }}>
                            {feature.description}
                        </p>

                        {/* CTA */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--text-primary)',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            marginTop: 'auto',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            Explore tool
                            <ChevronRight size={18} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Footer Note */}
            <motion.div
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                style={{
                    textAlign: 'center',
                    padding: '2rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--glass-border)'
                }}
            >
                <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    margin: 0,
                    fontStyle: 'italic'
                }}>
                    <strong>Disclaimer:</strong> This application provides informational AI-generated content only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
                </p>
            </motion.div>
        </div >
    );
}

export default Home;

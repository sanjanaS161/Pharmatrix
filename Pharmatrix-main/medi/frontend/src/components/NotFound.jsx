import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchX, Home as HomeIcon, HeartPulse } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    background: 'var(--bg-surface)',
                    padding: '3rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--shadow-lg)',
                    maxWidth: '500px',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative background pulse */}
                <motion.div
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ 
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut"
                    }}
                    style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '150px',
                        height: '150px',
                        background: 'var(--accent-primary)',
                        borderRadius: '50%',
                        filter: 'blur(60px)',
                        zIndex: 0
                    }}
                />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(57, 153, 255, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'var(--accent-primary)'
                    }}>
                        <SearchX size={40} />
                    </div>

                    <h1 style={{ 
                        fontSize: '4rem', 
                        margin: '0 0 0.5rem', 
                        color: 'var(--accent-primary)',
                        fontWeight: '800',
                        letterSpacing: '-2px'
                    }}>404</h1>
                    
                    <h2 style={{ 
                        fontSize: '1.5rem', 
                        margin: '0 0 1rem', 
                        color: 'var(--text-primary)' 
                    }}>Diagnosis: Page Not Found</h2>
                    
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        marginBottom: '2rem',
                        lineHeight: '1.6'
                    }}>
                        It seems the resource you are looking for has been moved or doesn't exist. 
                        Let's get you back to the main clinic.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-accent"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '0.75rem 1.5rem'
                            }}
                        >
                            <HomeIcon size={18} />
                            Return Home
                        </button>
                    </div>
                </div>

                {/* Footer medical icon */}
                <div style={{ 
                    marginTop: '2rem', 
                    paddingTop: '1.5rem', 
                    borderTop: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem'
                }}>
                    <HeartPulse size={16} />
                    <span>MediScan Digital Assistant</span>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;

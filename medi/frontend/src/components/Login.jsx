import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Phone, User, ShieldCheck, ShieldAlert, CheckCircle2, Loader2, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'https://pharmatrix-backend.onrender.com';

const COUNTRY_CODES = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+1', country: 'USA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
];

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    // After login, go back to where user came from (or home)
    const from = location.state?.from?.pathname || '/';

    const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
    const [animationState, setAnimationState] = useState('form'); // 'form' | 'authenticating' | 'success' | 'error'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Form Data
    const [loginId, setLoginId] = useState(''); // Username or Email
    const [password, setPassword] = useState('');
    
    // Signup specific fields
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
    const [signupPassword, setSignupPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setAnimationState('authenticating');

        try {
           const res = await axios.post(`${API_URL}/login`, {
                login_id: loginId.trim(),
                password: password
            });

            // Fast transition to success
            setAnimationState('success');
            login(res.data.user);
            
            // Navigate back to where user came from
            setTimeout(() => navigate(from, { replace: true }), 600);
        } catch (err) {
            setAnimationState('error');
            setError(err.response?.data?.detail || 'Invalid login credentials.');
            setTimeout(() => setAnimationState('form'), 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        
        if (signupPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            // Ensure phone is just digits
            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length < 10) {
                setError('Please enter a valid 10-digit phone number.');
                setLoading(false);
                return;
            }

            const fullPhone = selectedCountry.code + cleanPhone;
            console.log({ username, email, fullPhone, signupPassword });
            const res = await axios.post(`${API_URL}/register`, {
                username: username.trim(),
                email: email.trim(),
                phone_number: fullPhone,
                password: signupPassword
            });

            setAnimationState('success');
            login(res.data.user);
            setTimeout(() => navigate(from, { replace: true }), 600);
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const isAuthenticating = animationState === 'authenticating';

    // Generate static particles for background animation
    const particles = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 5,
        size: 1 + Math.random() * 2
    }));

    return (
        <div style={{
            minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', backgroundColor: 'var(--bg-base)', position: 'relative', overflow: 'hidden',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Global Background Glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(47,128,237,0.08) 0%, transparent 60%)',
                pointerEvents: 'none', zIndex: 0
            }} />

            {/* Main Premium Card */}
            <motion.div
                initial={{ y: 0 }}
                animate={{ y: animationState === 'form' ? [0, -8, 0] : 0 }}
                transition={{ duration: 6, repeat: animationState === 'form' ? Infinity : 0, ease: "easeInOut" }}
                whileHover={animationState === 'form' ? { y: -5, transition: { duration: 0.4 } } : {}}
                style={{
                    width: '100%', maxWidth: '420px', background: 'rgba(225,241,255,0.8)', borderRadius: '16px',
                    border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden', zIndex: 10,
                    boxShadow: 'var(--shadow-soft)',
                }}
            >
                {/* ── INTERNAL CARD ANIMATIONS ── */}

                {/* 1. Rotating Orbital Ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: isAuthenticating ? 3 : 20, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute', top: '50%', left: '50%', width: '150%', height: '150%',
                        marginLeft: '-75%', marginTop: '-75%', borderRadius: '50%',
                        border: '1px solid rgba(47,128,237,0.10)', pointerEvents: 'none',
                        background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(47,128,237,0.16) 360deg)'
                    }}
                />

                {/* 2. Particle Motion */}
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ x: `${p.x}%`, y: '110%', opacity: 0 }}
                        animate={{ y: '-10%', opacity: [0, 0.5, 0] }}
                        transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
                        style={{
                            position: 'absolute', width: p.size, height: p.size, borderRadius: '50%',
                            background: 'var(--accent-primary)', pointerEvents: 'none',
                            boxShadow: '0 0 8px var(--accent-primary)', zIndex: 1
                        }}
                    />
                ))}

                {/* 3. Light Scan Line */}
                <motion.div
                    animate={{ top: ['-20%', '120%'] }}
                    transition={{ duration: isAuthenticating ? 1.5 : 4, repeat: Infinity, ease: "linear", delay: 1 }}
                    style={{
                        position: 'absolute', left: 0, width: '100%', height: '2px',
                        background: 'linear-gradient(90deg, transparent, rgba(47,128,237,0.45), transparent)',
                        boxShadow: '0 0 20px rgba(47,128,237,0.28)', pointerEvents: 'none', zIndex: 2,
                        opacity: isAuthenticating ? 0.8 : 0.3
                    }}
                />

                {/* 4. Glow Pulse Border Effect */}
                <motion.div
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: 'absolute', inset: 0, borderRadius: '16px', pointerEvents: 'none', zIndex: 3,
                        boxShadow: 'inset 0 0 20px rgba(47,128,237,0.08), inset 0 0 2px rgba(47,128,237,0.12)'
                    }}
                />


                {/* ── INTERFACE CONTENT ── */}
                <div style={{ position: 'relative', zIndex: 10, padding: '3rem 2.5rem' }}>

                    <AnimatePresence mode="wait">
                        {animationState === 'form' || animationState === 'error' ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
                                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
                                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                            >
                                {/* Header Section */}
                                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                                    <h1 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                        Pharma<span style={{ color: 'var(--accent-primary)' }}>trix</span>
                                    </h1>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                                        <button 
                                            onClick={() => { setActiveTab('signin'); setError(''); }}
                                            style={{ 
                                                flex: 1, padding: '0.75rem', borderRadius: '8px', 
                                                background: activeTab === 'signin' ? 'rgba(47,128,237,0.12)' : 'transparent',
                                                border: activeTab === 'signin' ? '1px solid var(--accent-primary)' : '1px solid rgba(0,0,0,0.12)',
                                                color: activeTab === 'signin' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                cursor: 'pointer', transition: 'all 0.3s'
                                            }}
                                        >Login</button>
                                        <button 
                                            onClick={() => { setActiveTab('signup'); setError(''); }}
                                            style={{ 
                                                flex: 1, padding: '0.75rem', borderRadius: '8px', 
                                                background: activeTab === 'signup' ? 'rgba(47,128,237,0.12)' : 'transparent',
                                                border: activeTab === 'signup' ? '1px solid var(--accent-primary)' : '1px solid rgba(0,0,0,0.12)',
                                                color: activeTab === 'signup' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                cursor: 'pointer', transition: 'all 0.3s'
                                            }}
                                        >Signup</button>
                                    </div>

                                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', marginBottom: '1.5rem' }}>
                                        {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
                                    </p>
                                </div>

                                {/* Error Box */}
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
                                        background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', padding: '0.75rem 1rem',
                                        borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.8rem', letterSpacing: '0.5px',
                                        borderLeft: '2px solid #ef4444', display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        <ShieldAlert size={14} /> {error}
                                    </motion.div>
                                )}

                                {/* Form Section */}
                                <AnimatePresence mode="wait">
                                    {activeTab === 'signin' ? (
                                        <motion.form 
                                            key="login-form"
                                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                            onSubmit={handleLogin} 
                                            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                                            autoComplete="off"
                                        >
                                            <div className="input-wrap">
                                                <User size={16} className="input-icon" />
                                                <input type="text" required value={loginId}
                                                    placeholder="Enter username or email"
                                                    onChange={e => setLoginId(e.target.value)}
                                                    className="minimal-input"
                                                    autoComplete="new-password"
                                                />
                                                <label className={`minimal-label ${loginId ? 'shifted' : ''}`}>Username or Email</label>
                                                <div className="input-glow" />
                                            </div>

                                            <div className="input-wrap">
                                                <ShieldCheck size={16} className="input-icon" />
                                                <input type="password" required value={password}
                                                    placeholder="Enter your password"
                                                    onChange={e => setPassword(e.target.value)}
                                                    className="minimal-input"
                                                    autoComplete="new-password"
                                                />
                                                <label className={`minimal-label ${password ? 'shifted' : ''}`}>Password</label>
                                                <div className="input-glow" />
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.01, boxShadow: '0 0 20px rgba(47,128,237,0.28)', borderColor: 'rgba(47,128,237,0.55)' }}
                                                whileTap={{ scale: 0.99 }}
                                                type="submit"
                                                disabled={loading}
                                                className="btn-auth"
                                            >
                                                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {loading ? <Loader2 size={18} className="spin" /> : 'Login'}
                                                </span>
                                                <div className="btn-hover-effect" />
                                            </motion.button>
                                        </motion.form>
                                    ) : (
                                        <motion.form 
                                            key="signup-form"
                                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            onSubmit={handleSignup} 
                                            style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
                                            autoComplete="off"
                                        >
                                            <div className="input-wrap">
                                                <User size={16} className="input-icon" />
                                                <input type="text" required value={username}
                                                    placeholder="Enter your name"
                                                    onChange={e => setUsername(e.target.value)}
                                                    className="minimal-input"
                                                    autoComplete="new-password"
                                                />
                                                <label className={`minimal-label ${username ? 'shifted' : ''}`}>Username</label>
                                                <div className="input-glow" />
                                            </div>

                                            <div className="input-wrap">
                                                <Globe size={16} className="input-icon" />
                                                <input type="email" required value={email}
                                                    placeholder="example@gmail.com"
                                                    onChange={e => setEmail(e.target.value)}
                                                    className="minimal-input"
                                                    autoComplete="new-password"
                                                />
                                                <label className={`minimal-label ${email ? 'shifted' : ''}`}>Email Address</label>
                                                <div className="input-glow" />
                                            </div>

                                            <div className="input-wrap">
                                                <Phone size={16} className="input-icon" />
                                                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', position: 'relative' }}>
                                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer', paddingLeft: '2rem' }}>
                                                        <select 
                                                            value={selectedCountry.code}
                                                            onChange={(e) => setSelectedCountry(COUNTRY_CODES.find(c => c.code === e.target.value))}
                                                            style={{
                                                                background: 'none', border: 'none', color: 'var(--accent-primary)', 
                                                                fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                                                                appearance: 'none', paddingRight: '12px'
                                                            }}
                                                        >
                                                            {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                                        </select>
                                                        <ChevronDown size={12} color="var(--accent-primary)" style={{ position: 'absolute', right: 0 }} />
                                                    </div>
                                                    <input type="tel" required value={phone}
                                                        placeholder="10-digit number"
                                                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                        className="minimal-input"
                                                        style={{ paddingLeft: '10px', borderBottom: 'none' }}
                                                        autoComplete="new-password"
                                                    />
                                                </div>
                                                <label className={`minimal-label ${phone ? 'shifted' : ''}`} style={{ left: '6.5rem' }}>Phone Number</label>
                                                <div className="input-glow" />
                                            </div>

                                            <div className="input-wrap">
                                                <ShieldCheck size={16} className="input-icon" />
                                                <input type="password" required value={signupPassword}
                                                    placeholder="Min. 6 characters"
                                                    onChange={e => setSignupPassword(e.target.value)}
                                                    className="minimal-input"
                                                    autoComplete="new-password"
                                                />
                                                <label className={`minimal-label ${signupPassword ? 'shifted' : ''}`}>Password</label>
                                                <div className="input-glow" />
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.01, boxShadow: '0 0 20px rgba(47,128,237,0.28)', borderColor: 'rgba(47,128,237,0.55)' }}
                                                whileTap={{ scale: 0.99 }}
                                                type="submit"
                                                disabled={loading}
                                                className="btn-auth"
                                            >
                                                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {loading ? <Loader2 size={18} className="spin" /> : 'Create Account'}
                                                </span>
                                                <div className="btn-hover-effect" />
                                            </motion.button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                        ) : animationState === 'authenticating' ? (

                            /* Authenticating State */
                            <motion.div
                                key="authenticating"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}
                            >
                                <div style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '2rem' }}>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        style={{
                                            position: 'absolute', inset: 0, borderRadius: '50%',
                                            border: '2px solid transparent', borderTopColor: 'var(--accent-primary)', borderRightColor: 'var(--accent-secondary)',
                                            boxShadow: '0 0 20px rgba(47,128,237,0.35)'
                                        }}
                                    />
                                    <motion.div
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                        style={{
                                            position: 'absolute', inset: '8px', borderRadius: '50%',
                                            border: '1px solid transparent', borderBottomColor: 'var(--accent-primary)',
                                            opacity: 0.6
                                        }}
                                    />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '4px', height: '4px', background: 'var(--accent-primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-primary)' }} />
                                    </div>
                                </div>

                                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '500' }}>
                                        Authenticating
                                    </h3>
                                </motion.div>
                                <motion.div
                                    initial={{ width: 0 }} animate={{ width: '60px' }} transition={{ duration: 2, ease: "linear" }}
                                    style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)', marginTop: '1rem' }}
                                />
                            </motion.div>

                        ) : (

                            /* Success State */
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}
                            >
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                                    style={{
                                        width: '60px', height: '60px', borderRadius: '50%',
                                        background: 'rgba(47,128,237,0.10)', color: 'var(--accent-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '2rem', border: '1px solid rgba(47,128,237,0.22)',
                                        boxShadow: '0 0 30px rgba(47,128,237,0.28), inset 0 0 15px rgba(47,128,237,0.12)'
                                    }}
                                >
                                    <CheckCircle2 size={28} strokeWidth={1.5} />
                                </motion.div>
                                <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-secondary)', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '500' }}>
                                    Access Granted
                                </h3>
                                <div style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, transparent, var(--accent-secondary), transparent)', marginTop: '1rem' }} />

                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 2, opacity: 0 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid var(--accent-primary)', borderRadius: '16px', pointerEvents: 'none' }}
                                />
                            </motion.div>

                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <style>{`
                .input-wrap {
                    position: relative;
                    margin-bottom: 0.5rem;
                }
                .input-icon {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                    transition: color 0.3s ease;
                }
                .minimal-input {
                    width: 100%;
                    padding: 0.75rem 0 0.75rem 2rem;
                    background: transparent;
                    border: none;
                    border-bottom: 1px solid var(--glass-border);
                    color: var(--text-primary);
                    font-size: 0.85rem;
                    outline: none !important;
                    box-shadow: none !important;
                    transition: border-color 0.3s ease;
                    position: relative;
                    z-index: 2;
                }
                /* Kill browser autofill blue/yellow box */
                .minimal-input:-webkit-autofill,
                .minimal-input:-webkit-autofill:hover,
                .minimal-input:-webkit-autofill:focus {
                    -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
                    box-shadow: 0 0 0px 1000px transparent inset !important;
                    -webkit-text-fill-color: var(--text-primary) !important;
                    background-color: transparent !important;
                    transition: background-color 9999s ease-in-out 0s;
                }
                .minimal-label {
                    position: absolute;
                    left: 2rem;
                    top: -10px;
                    transform: translateY(0);
                    color: var(--text-secondary);
                    font-size: 0.70rem;
                    pointer-events: none;
                    transition: color 0.3s ease;
                    z-index: 1;
                    letter-spacing: 0.5px;
                }
                .input-glow {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 0%;
                    height: 1px;
                    background: var(--accent-primary);
                    box-shadow: 0 0 10px var(--accent-primary);
                    transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                    z-index: 3;
                }
                
                /* Input Focus States */
                .minimal-input:focus ~ .input-icon {
                    color: var(--accent-primary);
                }
                .minimal-input:focus ~ .minimal-label,
                .minimal-label.shifted {
                    color: var(--accent-primary);
                }
                
                /* Custom styles for select option dropdowns */
                select option {
                    background-color: rgba(229,243,255,0.92);
                    color: var(--text-primary);
                }
                .minimal-input:focus ~ .input-glow {
                    width: 100%;
                }
                
                .btn-auth {
                    width: 100%;
                    padding: 1rem;
                    margin-top: 1rem;
                    background: var(--bg-base);
                    color: var(--text-primary);
                    border: 1px solid rgba(47,128,237,0.28);
                    border-radius: 4px;
                    font-weight: 500;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .btn-hover-effect {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(47,128,237,0.12), transparent);
                    transform: translateX(-100%);
                    transition: transform 0.5s ease;
                }
                
                button.btn-auth:hover .btn-hover-effect {
                    transform: translateX(100%);
                }
                
                ::placeholder {
                    color: var(--text-secondary);
                    opacity: 0.55;
                    font-size: 0.78rem;
                }
            `}</style>
        </div>
    );
}

export default Login;

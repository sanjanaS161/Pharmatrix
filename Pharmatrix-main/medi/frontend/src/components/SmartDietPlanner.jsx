import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { 
    Utensils, Calendar, Baby, Pill, Activity, 
    CheckCircle2, AlertCircle, Loader2, ChevronRight,
    Apple, Ban, Lightbulb, User, Scale, Ruler, 
    Heart, Coffee, Sun, Moon, Droplets, Save, RefreshCw,
    Check
} from 'lucide-react';

const API_URL = 'http://pharmatrix-backend.onrender.com';

const CATEGORIES = [
    {
        id: 'Age',
        title: 'Age Based Diet',
        description: 'Get diet suggestions based on your age group.',
        icon: <Calendar size={32} />,
        color: 'var(--accent-primary)'
    },
    {
        id: 'Pregnancy',
        title: 'Pregnancy Diet',
        description: 'Nutritional guidance for expectant mothers.',
        icon: <Baby size={32} />,
        color: 'var(--accent-primary)'
    },
    {
        id: 'Medicine',
        title: 'Medicine Based Diet',
        description: 'Food suggestions related to your current medicines.',
        icon: <Pill size={32} />,
        color: 'var(--accent-primary)'
    },
    {
        id: 'Health',
        title: 'Health Condition Diet',
        description: 'Specialized diet plans for specific health needs.',
        icon: <Activity size={32} />,
        color: 'var(--accent-primary)'
    }
];

const HEALTH_CONDITIONS = [
    'General Health', 'Diabetes', 'High Blood Pressure', 'Cholesterol', 
    'Weight Loss', 'Weight Gain', 'PCOS/PCOD', 'Thyroid', 'Pregnancy'
];

const DIETARY_PREFERENCES = ['Vegetarian', 'Non-Vegetarian', 'Vegan'];
const ACTIVITY_LEVELS = ['Low (Sedentary)', 'Moderate (Active)', 'High (Athlete)'];

function SmartDietPlanner() {
    const { user } = useAuth();
    const [step, setStep] = useState('categories'); // 'categories' | 'form' | 'loading' | 'plan'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [savedPlan, setSavedPlan] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        age: '',
        gender: 'Male',
        height: '',
        weight: '',
        condition: 'General Health',
        preference: 'Vegetarian',
        allergies: '',
        activity_level: 'Moderate (Active)'
    });

    const fetchLatestPlan = async () => {
        try {
            const res = await axios.get(`${API_URL}/diet-plan/latest/${user.id}`);
            if (res.data.plan) {
                setSavedPlan(res.data.plan);
            }
        } catch (err) {
            console.error("Error fetching latest plan:", err);
        }
    };

    useEffect(() => {
        if (user?.id && step === 'categories') {
            fetchLatestPlan();
        }
    }, [user?.id, step]);

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setFormData(prev => ({
            ...prev,
            condition: category.id === 'Pregnancy' ? 'Pregnancy' : prev.condition
        }));
        setStep('form');
    };

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        setStep('loading');

        try {
            const res = await axios.post(`${API_URL}/diet-plan/generate`, {
                user_id: user.id,
                ...formData,
                age: parseInt(formData.age),
                height: parseFloat(formData.height),
                weight: parseFloat(formData.weight)
            });
            setSavedPlan(res.data.plan);
            setStep('plan');
            setSuccessMsg('Plan generated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            setStep('form');
        }
    };

    const cardVariants = {
        hover: { 
            y: -8, 
            boxShadow: '0 10px 25px rgba(47,128,237,0.2)',
            borderColor: 'var(--accent-primary)',
            transition: { type: 'spring', stiffness: 300, damping: 15 }
        },
        tap: { scale: 0.98 }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ 
                    fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px'
                }}>
                    <Utensils size={36} color="var(--accent-primary)" /> Pharmatrix Diet Planner
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Personalized nutritional guidance for your health and lifestyle.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {step === 'categories' && (
                    <motion.div key="categories" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.95 }}>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(2, 1fr)', 
                            gap: '1.5rem',
                            marginBottom: '3rem'
                        }}>
                            {CATEGORIES.map((cat) => (
                                <motion.div
                                    key={cat.id}
                                    variants={cardVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => handleCategorySelect(cat)}
                                    className="glass-card"
                                    style={{
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        background: 'var(--bg-base)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div style={{ 
                                        color: 'var(--accent-primary)', 
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        justifyContent: 'center'
                                    }}>
                                        {cat.icon}
                                    </div>
                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{cat.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>{cat.description}</p>
                                </motion.div>
                            ))}
                        </div>

                        {savedPlan && (
                            <div style={{ textAlign: 'center' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setStep('plan')}
                                    style={{
                                        background: 'var(--bg-surface-elevated)',
                                        color: 'var(--accent-primary)',
                                        border: '1px solid var(--accent-primary)',
                                        padding: '0.8rem 2rem',
                                        borderRadius: 'var(--radius-full)',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        boxShadow: '0 4px 15px var(--accent-glow)'
                                    }}
                                >
                                    <Save size={18} /> View My Latest Saved Plan
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                )}

                {step === 'form' && (
                    <motion.div key="form" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, x: -20 }}>
                        <div className="glass-card" style={{ padding: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', borderBottom: '1px solid rgba(0,0,0,0.12)', paddingBottom: '0.5rem', flex: 1 }}>
                                    Your Health Profile - {selectedCategory?.title}
                                </h2>
                                <button onClick={() => setStep('categories')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.9rem' }}>Back to Categories</button>
                            </div>
                            
                            <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                {/* Left Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Age</label>
                                        <div style={{ position: 'relative' }}>
                                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
                                            <input type="number" required placeholder="Years" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})}
                                                style={{ width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.5rem', background: 'rgba(226,241,255,0.88)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Gender</label>
                                        <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(226,241,255,0.88)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                                            <option>Male</option><option>Female</option><option>Other</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="input-group">
                                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Height (cm)</label>
                                            <input type="number" required value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})}
                                                style={{ width: '100%', padding: '0.8rem', background: 'rgba(226,241,255,0.88)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Weight (kg)</label>
                                            <input type="number" required value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})}
                                                style={{ width: '100%', padding: '0.8rem', background: 'rgba(226,241,255,0.88)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Health Condition</label>
                                        <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}
                                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(226,241,255,0.88)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                                            {HEALTH_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Dietary Preference</label>
                                        <select value={formData.preference} onChange={e => setFormData({...formData, preference: e.target.value})}
                                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(226,241,255,0.88)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                                            {DIETARY_PREFERENCES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Allergies / Restrictions</label>
                                        <input type="text" placeholder="e.g. Peanuts, Lactose" value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})}
                                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(226,241,255,0.88)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Daily Activity Level</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {ACTIVITY_LEVELS.map(level => (
                                            <button key={level} type="button" onClick={() => setFormData({...formData, activity_level: level})}
                                                style={{ 
                                                    flex: 1, padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s',
                                                    background: formData.activity_level === level ? 'var(--accent-glow)' : 'rgba(226,241,255,0.88)',
                                                    border: formData.activity_level === level ? '1px solid var(--accent-primary)' : '1px solid rgba(0,0,0,0.12)',
                                                    color: formData.activity_level === level ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                                }}>
                                                {level.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" style={{ 
                                    gridColumn: 'span 2', marginTop: '1rem',
                                    background: 'var(--accent-primary)', border: 'none', color: '#FFF', padding: '1rem', 
                                    borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s',
                                    textTransform: 'uppercase', letterSpacing: '1px',
                                    boxShadow: '0 4px 15px var(--accent-glow)'
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    Generate Personalized Diet Plan
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {step === 'loading' && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '5rem 0' }}>
                        <div className="loader-orbit" style={{ margin: '0 auto 2rem' }}>
                            <Loader2 size={48} className="spin" color="var(--accent-primary)" />
                        </div>
                        <h2 style={{ color: 'var(--text-primary)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '1rem' }}>Crafting Your Nutrition Plan</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Analyzing health markers and dietary preferences...</p>
                    </motion.div>
                )}

                {step === 'plan' && savedPlan && (
                    <motion.div key="plan" variants={containerVariants} initial="hidden" animate="visible">
                        {successMsg && (
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} 
                                style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <Check size={18} style={{ marginRight: '8px' }} /> {successMsg}
                            </motion.div>
                        )}

                        <div className="glass-card" style={{ padding: '2.5rem', borderTop: '4px solid var(--accent-primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <h2 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', margin: 0 }}>{savedPlan.title}</h2>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={() => setStep('categories')} style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--text-secondary)', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <RefreshCw size={16} /> New Plan
                                    </button>
                                    <button onClick={handleGenerate} style={{ background: 'var(--accent-primary)', border: 'none', color: '#FFF', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', boxShadow: '0 2px 10px var(--accent-glow)' }}>
                                        <RefreshCw size={16} /> Regenerate
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                                {/* Meal Cards */}
                                {[
                                    { label: 'Breakfast', items: savedPlan.breakfast, icon: <Sun size={20} color="var(--accent-primary)" />, time: '7:00 - 9:00 AM' },
                                    { label: 'Lunch', items: savedPlan.lunch, icon: <Activity size={20} color="var(--accent-primary)" />, time: '1:00 - 2:00 PM' },
                                    { label: 'Dinner', items: savedPlan.dinner, icon: <Moon size={20} color="var(--accent-primary)" />, time: '7:30 - 8:30 PM' }
                                ].map(meal => (
                                    <div key={meal.label} style={{ background: 'var(--bg-base)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                            {meal.icon}
                                            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>{meal.label}</h3>
                                        </div>
                                        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                            {meal.items.map((item, i) => (
                                                <li key={i} style={{ color: 'var(--text-secondary)', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>• {item}</li>
                                            ))}
                                        </ul>
                                        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{meal.time}</div>
                                    </div>
                                ))}

                                {/* Snacks & Hydration */}
                                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                                    <div style={{ background: 'rgba(47,128,237,0.08)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <h3 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', marginBottom: '1rem' }}>
                                            <Coffee size={20} /> Healthy Snacks
                                        </h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {savedPlan.snacks.map((snack, i) => (
                                                <span key={i} style={{ background: 'rgba(228,242,255,0.9)', padding: '4px 12px', borderRadius: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem', border: '1px solid var(--glass-border)' }}>{snack}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(0,150,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,150,255,0.1)' }}>
                                        <h3 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', marginBottom: '1rem' }}>
                                            <Droplets size={20} /> Hydration Guide
                                        </h3>
                                        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                            {savedPlan.hydration.map((h, i) => (
                                                <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '6px' }}>✓ {h}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Health Notes */}
                                <div style={{ gridColumn: 'span 2', background: 'rgba(226,241,255,0.9)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-primary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.8rem' }}>
                                        <Lightbulb size={20} color="var(--accent-primary)" />
                                        <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem' }}>Nutritionist's Note</h3>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                                        {savedPlan.health_notes}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SmartDietPlanner;

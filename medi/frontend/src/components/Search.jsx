import React, { useState } from 'react';
import axios from 'axios';
import { Search as SearchIcon, AlertTriangle, ArrowRight, Activity, CalendarDays, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:8000';

function Search() {
    const [step, setStep] = useState('initial'); // 'initial', 'details', or 'results'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        symptoms: '',
        age: '',
        gender: '',
        duration: '',
        pregnancy_status: 'Not Applicable',
        other_conditions: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Send to the recommend endpoint which expects all this info
            const payload = {
                query: formData.symptoms,
                age: formData.age,
                gender: formData.gender,
                pregnancy_status: formData.pregnancy_status,
                duration: formData.duration + ' days',
                other_conditions: formData.other_conditions
            };

            const res = await axios.post(`${API_URL}/chat/recommend`, payload);
            setResults(res.data);
            setStep('results');
        } catch (err) {
            console.error("Failed to fetch recommendation", err);
            setError("Failed to analyze your symptoms. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const resetSearch = () => {
        setStep('initial');
        setResults(null);
        setFormData({
            symptoms: '',
            age: '',
            gender: '',
            duration: '',
            pregnancy_status: 'Not Applicable',
            other_conditions: ''
        });
    };

    // Derived flags
    const isDurationLong = parseInt(formData.duration) > 3;

    return (
        <div style={{ position: 'relative', minHeight: 'calc(100vh - 80px)', width: '100%', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 10, maxWidth: '860px', margin: '1.5rem auto 2.5rem', padding: '1rem', display: 'flex', flexDirection: 'column' }}>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '2.55rem', letterSpacing: '-0.01em', textShadow: '0 10px 24px rgba(30,84,140,0.2)' }}>
                        Symptom Analysis
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
                        Enter your details below to get AI-powered medicine recommendations and advice.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'initial' ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass-card hover-glow-up"
                            style={{ padding: '2.4rem', backdropFilter: 'blur(20px)', background: 'linear-gradient(160deg, rgba(236,247,255,0.94), rgba(218,237,255,0.9))', borderRadius: '20px', boxShadow: '0 20px 42px rgba(24,77,134,0.16)' }}
                            key="initial"
                        >
                            <form onSubmit={(e) => { e.preventDefault(); setStep('details'); }}>
                                <div className="input-group">
                                    <label><Activity size={16} style={{ display: 'inline', marginRight: '6px' }} /> Primary Symptom (e.g. Fever, Headache)</label>
                                    <input
                                        type="text"
                                        name="symptoms"
                                        value={formData.symptoms}
                                        onChange={handleChange}
                                        required
                                        placeholder="What are you experiencing?"
                                    />
                                </div>
                                <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
                                    <button
                                        type="submit"
                                        disabled={!formData.symptoms.trim()}
                                        className="btn-accent"
                                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                                    >
                                        Next <ArrowRight size={20} style={{ display: 'inline', marginLeft: '8px' }} />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : step === 'details' ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass-card hover-glow-up"
                            style={{ padding: '2.4rem', backdropFilter: 'blur(20px)', background: 'linear-gradient(160deg, rgba(236,247,255,0.94), rgba(218,237,255,0.9))', borderRadius: '20px', boxShadow: '0 20px 42px rgba(24,77,134,0.16)' }}
                            key="details"
                        >
                            <form onSubmit={handleSubmit}>
                                {/* Summary Header */}
                                <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Symptom</p>
                                            <h4 style={{ color: 'var(--text-primary)', margin: '0.25rem 0 0 0', fontSize: '1.2rem' }}>{formData.symptoms}</h4>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStep('initial')}
                                            className="btn-secondary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>

                                {/* Warnings will only appear on the results page */}

                                {error && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        ⚠️ {error}
                                    </div>
                                )}



                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label><CalendarDays size={16} style={{ display: 'inline', marginRight: '6px' }} /> Duration (Days)</label>
                                        <input
                                            type="number"
                                            name="duration"
                                            min="1"
                                            value={formData.duration}
                                            onChange={handleChange}
                                            required
                                            placeholder="How many days?"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label><User size={16} style={{ display: 'inline', marginRight: '6px' }} /> Age</label>
                                        <input
                                            type="number"
                                            name="age"
                                            min="0"
                                            max="120"
                                            value={formData.age}
                                            onChange={handleChange}
                                            required
                                            placeholder="Your age"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label>Gender</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} required style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
                                            <option value="" disabled style={{ background: 'rgba(230,243,255,0.98)', color: 'var(--text-primary)' }}>Select Gender</option>
                                            <option value="Male" style={{ background: 'rgba(230,243,255,0.98)', color: 'var(--text-primary)' }}>Male</option>
                                            <option value="Female" style={{ background: 'rgba(230,243,255,0.98)', color: 'var(--text-primary)' }}>Female</option>
                                            <option value="Other" style={{ background: 'rgba(230,243,255,0.98)', color: 'var(--text-primary)' }}>Other</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Pregnancy / Breastfeeding Status</label>
                                        <select name="pregnancy_status" value={formData.pregnancy_status} onChange={handleChange} required style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
                                            <option value="Not Applicable" style={{ background: 'rgba(230,243,255,0.98)', color: 'var(--text-primary)' }}>Not Applicable</option>
                                            <option value="Pregnant" style={{ background: 'rgba(230,243,255,0.98)', color: 'var(--text-primary)' }}>Pregnant</option>
                                            <option value="Breastfeeding" style={{ background: 'rgba(230,243,255,0.98)', color: 'var(--text-primary)' }}>Breastfeeding</option>
                                            <option value="Unknown" style={{ background: 'rgba(230,243,255,0.98)', color: 'var(--text-primary)' }}>Unknown</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Other Pre-existing Conditions (Optional)</label>
                                    <input
                                        type="text"
                                        name="other_conditions"
                                        value={formData.other_conditions}
                                        onChange={handleChange}
                                        placeholder="e.g. Diabetes, Hypertension, Asthma"
                                    />
                                </div>

                                <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.symptoms}
                                        className="btn-accent"
                                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                                    >
                                        {loading ? (
                                            <><Loader2 size={20} className="pulse" style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
                                        ) : (
                                            <><SearchIcon size={20} /> Get Recommendation</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card"
                            style={{ padding: '2.4rem', backdropFilter: 'blur(20px)', background: 'linear-gradient(160deg, rgba(236,247,255,0.95), rgba(216,235,255,0.92))', borderRadius: '20px', boxShadow: '0 20px 44px rgba(24,77,134,0.18)' }}
                            key="results"
                        >
                            {/* Summary Headers */}
                            <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Analysis Complete</h3>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                        Based on: <strong>{formData.symptoms}</strong> ({formData.duration} days)
                                    </p>
                                </div>
                                <button onClick={resetSearch} className="btn-black-outlined" style={{ borderColor: 'var(--accent-primary)' }}>
                                    New Search
                                </button>
                            </div>

                            {/* If doctor recommendation is triggered */}
                            {(isDurationLong || results?.urgency === 'High' || results?.urgent) && (
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error-color)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '2rem' }}>
                                    <h4 style={{ color: 'var(--error-color)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                        <AlertTriangle size={20} /> Urgent Medical Advice
                                    </h4>
                                    <p style={{ color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                                        Due to the duration of your symptoms ({formData.duration} days) or severity of the analysis, we highly recommend scheduling an appointment with a certified medical professional and avoiding self-medication.
                                    </p>
                                </div>
                            )}

                            {/* Rendering the Groq JSON Response */}
                            {results && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                    {results.assessment && (
                                        <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                                            <h4 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.75rem', fontSize: '1.1rem' }}>Clinical Assessment</h4>
                                            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{results.assessment}</p>
                                        </div>
                                    )}

                                    <div>
                                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>Suggested Medicines</h4>
                                        {results.recommendations && results.recommendations.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                                {results.recommendations.map((rec, idx) => (
                                                    <div key={idx} className="hover-glow-up" style={{ background: 'linear-gradient(155deg, rgba(234,245,255,0.95), rgba(220,238,255,0.92))', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(47,128,237,0.24)', boxShadow: '0 10px 24px rgba(24,77,134,0.1)' }}>
                                                        <h5 style={{ color: 'var(--accent-primary)', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>{rec.name}</h5>
                                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}><strong>Dosage:</strong> {rec.dosage}</p>
                                                        {rec.food_instruction && (
                                                            <p style={{
                                                                background: 'rgba(245, 158, 11, 0.15)',
                                                                color: 'var(--warning-color)',
                                                                padding: '0.4rem 0.8rem',
                                                                borderRadius: '4px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '700',
                                                                display: 'inline-block',
                                                                margin: '0 0 0.5rem 0',
                                                                borderLeft: '3px solid var(--warning-color)'
                                                            }}>
                                                                🍽️ {rec.food_instruction} {rec.timing && `| 🕒 ${rec.timing}`}
                                                            </p>
                                                        )}
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{rec.reason}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: 'var(--text-secondary)' }}>No specific over-the-counter medicines recommended. Please see a doctor.</p>
                                        )}
                                    </div>

                                    {results.medical_advice && results.medical_advice.length > 0 && (
                                        <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                                            <h4 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Additional Advice</h4>
                                            <ul style={{ color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                                                {results.medical_advice.map((advice, idx) => (
                                                    <li key={idx} style={{ marginBottom: '0.5rem' }}>{advice}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {results.when_to_see_doctor && (
                                        <div style={{ background: 'var(--bg-base)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--error-color)' }}>
                                            <h4 style={{ color: 'var(--error-color)', marginTop: 0, marginBottom: '0.75rem', fontSize: '1.1rem' }}>When to see a doctor</h4>
                                            <p style={{ color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>{results.when_to_see_doctor}</p>
                                        </div>
                                    )}

                                    {results.action_plan && (
                                        <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                                            <h4 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.75rem', fontSize: '1.1rem' }}>Action Plan</h4>
                                            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{results.action_plan}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '2rem', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--error-color)' }}>
                                <strong>Disclaimer:</strong> This AI provides general information, not medical advice. Always consult a doctor for serious conditions.
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default Search;

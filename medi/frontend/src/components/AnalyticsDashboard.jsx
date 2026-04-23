import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import {
    BarChart3,
    Boxes,
    AlertTriangle,
    Shield,
    CalendarClock,
    Sparkles,
    Activity,
    RefreshCw,
    Pill,
    ClipboardList,
} from 'lucide-react';

const API_URL = 'http://pharmatrix-backend.onrender.com';

const TYPE_COLORS = {
    Tablet: '#2f80ed',
    Capsule: '#56ccf2',
    Syrup: '#27ae60',
    Injection: '#d69c2f',
    Drops: '#9b8cf4',
    Cream: '#f2994a',
    Other: '#6b7280',
};

function StatCard({ icon, label, value, tone = 'primary', detail }) {
    const tones = {
        primary: { border: 'rgba(47,128,237,0.28)', bg: 'rgba(47,128,237,0.08)', color: 'var(--accent-primary)' },
        success: { border: 'rgba(39,174,96,0.28)', bg: 'rgba(39,174,96,0.08)', color: 'var(--success-color)' },
        warn: { border: 'rgba(214,156,47,0.28)', bg: 'rgba(214,156,47,0.08)', color: 'var(--warning-color)' },
        danger: { border: 'rgba(228,88,88,0.28)', bg: 'rgba(228,88,88,0.08)', color: 'var(--error-color)' },
    };
    const t = tones[tone] || tones.primary;

    return (
        <div className="glass-card" style={{ padding: '1.25rem', border: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
                    <h3 style={{ margin: '0.45rem 0 0.2rem', fontSize: '1.9rem', lineHeight: 1.1 }}>{value}</h3>
                    {detail ? <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>{detail}</p> : null}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function AnalyticsDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [medicines, setMedicines] = useState([]);
    const [interactions, setInteractions] = useState({ status: 'safe', interactions: [] });
    const [dietPlan, setDietPlan] = useState(null);

    const fetchAnalytics = async () => {
        if (!user?.id) return;
        setLoading(true);
        setError('');
        try {
            const [medRes, interactionRes, planRes] = await Promise.all([
                axios.get(`${API_URL}/cabinet`, { params: { user_id: user.id } }),
                axios.get(`${API_URL}/drug-safety-check`, { params: { user_id: user.id } }),
                axios.get(`${API_URL}/diet-plan/latest/${user.id}`),
            ]);

            setMedicines(Array.isArray(medRes.data) ? medRes.data : []);
            setInteractions({
                status: interactionRes.data?.status || 'safe',
                interactions: interactionRes.data?.interactions || [],
            });
            setDietPlan(planRes.data?.plan || null);
        } catch {
            setError('Unable to load analytics right now. Please try refresh.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [user?.id]);

    const computed = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalMeds = medicines.length;
        const totalUnits = medicines.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
        const lowStock = medicines.filter((m) => Number(m.quantity) <= 5).length;

        let expired = 0;
        let expiring7 = 0;
        let expiring30 = 0;
        let healthy = 0;

        medicines.forEach((m) => {
            if (!m.expiry_date) {
                healthy += 1;
                return;
            }
            const d = new Date(m.expiry_date);
            d.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((d - today) / 86400000);
            if (diffDays < 0) expired += 1;
            else if (diffDays <= 7) expiring7 += 1;
            else if (diffDays <= 30) expiring30 += 1;
            else healthy += 1;
        });

        const highRiskInteractions = interactions.interactions.filter((x) => x.severity === 'High').length;
        const mediumRiskInteractions = interactions.interactions.filter((x) => x.severity !== 'High').length;

        const adherenceScore = Math.max(
            0,
            Math.min(
                100,
                100 - expired * 18 - lowStock * 7 - highRiskInteractions * 12 - mediumRiskInteractions * 6
            )
        );

        const typeMap = {};
        medicines.forEach((m) => {
            const type = m.type || 'Other';
            typeMap[type] = (typeMap[type] || 0) + 1;
        });
        const typeData = Object.entries(typeMap)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count);

        return {
            totalMeds,
            totalUnits,
            lowStock,
            expired,
            expiring7,
            expiring30,
            healthy,
            typeData,
            interactionCount: interactions.interactions.length,
            highRiskInteractions,
            adherenceScore,
        };
    }, [medicines, interactions]);

    const maxTypeCount = Math.max(1, ...computed.typeData.map((d) => d.count));

    if (loading) {
        return (
            <div className="glass-card" style={{ maxWidth: '1100px', margin: '1rem auto', padding: '2.2rem', textAlign: 'center' }}>
                <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
                <p style={{ marginTop: '0.8rem', color: 'var(--text-secondary)' }}>Building your analytics dashboard...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '1rem', display: 'grid', gap: '1rem' }}>
            <div
                className="glass-card"
                style={{
                    padding: '1.25rem 1.3rem',
                    border: '1px solid rgba(47,128,237,0.22)',
                    background: 'linear-gradient(135deg, rgba(240,248,255,0.94), rgba(226,242,255,0.9))',
                }}
            >
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                        <p style={{ margin: 0, color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.07em', fontSize: '0.78rem' }}>ANALYTICS DASHBOARD</p>
                        <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.7rem' }}>Health Intelligence Overview</h2>
                        <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                            Inventory, expiry risk, safety interactions, and adherence readiness in one place.
                        </p>
                    </div>
                    <button className="btn-black-outlined" onClick={fetchAnalytics} style={{ height: 'fit-content' }}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
                {error ? <p style={{ marginTop: '0.75rem', color: 'var(--error-color)', fontSize: '0.9rem' }}>{error}</p> : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem' }}>
                <StatCard icon={<Pill size={18} />} label="Total Medicines" value={computed.totalMeds} detail={`${computed.totalUnits} total units`} tone="primary" />
                <StatCard icon={<CalendarClock size={18} />} label="Expiry Risk (30d)" value={computed.expiring7 + computed.expiring30} detail={`${computed.expired} already expired`} tone={computed.expired > 0 ? 'danger' : 'warn'} />
                <StatCard icon={<Shield size={18} />} label="Interaction Alerts" value={computed.interactionCount} detail={computed.highRiskInteractions > 0 ? `${computed.highRiskInteractions} high risk` : 'No high-risk alerts'} tone={computed.highRiskInteractions > 0 ? 'danger' : 'success'} />
                <StatCard icon={<Activity size={18} />} label="Adherence Score" value={`${computed.adherenceScore}%`} detail={computed.adherenceScore >= 75 ? 'Stable monitoring posture' : 'Needs intervention'} tone={computed.adherenceScore >= 75 ? 'success' : 'warn'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem' }}>
                        <Boxes size={18} color="var(--accent-primary)" />
                        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Inventory Composition</h3>
                    </div>
                    {computed.typeData.length === 0 ? (
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>No medicine data available yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                            {computed.typeData.map((row) => {
                                const width = `${(row.count / maxTypeCount) * 100}%`;
                                return (
                                    <div key={row.type} style={{ display: 'grid', gridTemplateColumns: '86px 1fr 34px', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>{row.type}</span>
                                        <div style={{ background: 'rgba(12,28,52,0.06)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                                            <div style={{ width, height: '100%', borderRadius: 999, background: TYPE_COLORS[row.type] || TYPE_COLORS.Other }} />
                                        </div>
                                        <span style={{ textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem' }}>{row.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="glass-card" style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem' }}>
                        <BarChart3 size={18} color="var(--accent-primary)" />
                        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Expiry Distribution</h3>
                    </div>
                    <div style={{ display: 'grid', gap: '0.55rem' }}>
                        {[
                            { label: 'Expired', value: computed.expired, color: 'var(--error-color)' },
                            { label: '0-7 Days', value: computed.expiring7, color: 'var(--warning-color)' },
                            { label: '8-30 Days', value: computed.expiring30, color: '#3b82f6' },
                            { label: 'Healthy', value: computed.healthy, color: 'var(--success-color)' },
                        ].map((item) => {
                            const total = Math.max(1, computed.totalMeds);
                            const width = `${(item.value / total) * 100}%`;
                            return (
                                <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '95px 1fr 34px', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                    <div style={{ background: 'rgba(12,28,52,0.06)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                                        <div style={{ width, height: '100%', borderRadius: 999, background: item.color }} />
                                    </div>
                                    <span style={{ textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem' }}>{item.value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem' }}>
                        <AlertTriangle size={18} color={computed.highRiskInteractions > 0 ? 'var(--error-color)' : 'var(--warning-color)'} />
                        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Safety Insights</h3>
                    </div>
                    {interactions.status === 'warning' && interactions.interactions.length > 0 ? (
                        <div style={{ display: 'grid', gap: '0.7rem' }}>
                            {interactions.interactions.slice(0, 3).map((x, idx) => (
                                <div key={`${x.medicines}-${idx}`} style={{ padding: '0.8rem', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.72)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
                                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{x.medicines}</p>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.22rem 0.5rem', borderRadius: 999, color: x.severity === 'High' ? 'var(--error-color)' : 'var(--warning-color)', background: x.severity === 'High' ? 'rgba(228,88,88,0.12)' : 'rgba(214,156,47,0.12)' }}>
                                            {x.severity}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{x.risk}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            No active interaction warnings. Safety profile looks stable.
                        </p>
                    )}
                </div>

                <div className="glass-card" style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem' }}>
                        <ClipboardList size={18} color="var(--accent-primary)" />
                        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Diet Plan Snapshot</h3>
                    </div>
                    {dietPlan ? (
                        <>
                            <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>{dietPlan.title || 'Personalized Plan'}</p>
                            <div style={{ marginTop: '0.7rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.55rem' }}>
                                <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, padding: '0.55rem' }}>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.74rem' }}>Breakfast</p>
                                    <p style={{ margin: '0.22rem 0 0', fontWeight: 700 }}>{Array.isArray(dietPlan.breakfast) ? dietPlan.breakfast.length : 0}</p>
                                </div>
                                <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, padding: '0.55rem' }}>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.74rem' }}>Lunch</p>
                                    <p style={{ margin: '0.22rem 0 0', fontWeight: 700 }}>{Array.isArray(dietPlan.lunch) ? dietPlan.lunch.length : 0}</p>
                                </div>
                                <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, padding: '0.55rem' }}>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.74rem' }}>Dinner</p>
                                    <p style={{ margin: '0.22rem 0 0', fontWeight: 700 }}>{Array.isArray(dietPlan.dinner) ? dietPlan.dinner.length : 0}</p>
                                </div>
                            </div>
                            <p style={{ margin: '0.8rem 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                                {dietPlan.health_notes ? `${String(dietPlan.health_notes).slice(0, 110)}...` : 'Plan available in Diet Planner.'}
                            </p>
                        </>
                    ) : (
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            No saved plan yet. Generate one in Diet Planner to unlock more nutrition analytics.
                        </p>
                    )}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem 1.15rem', border: '1px solid rgba(47,128,237,0.18)', display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
                <Sparkles size={16} color="var(--accent-primary)" />
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                    Portfolio highlight: this dashboard combines inventory intelligence, safety analytics, and nutrition context from multiple backend services.
                </p>
            </div>
        </div>
    );
}

export default AnalyticsDashboard;

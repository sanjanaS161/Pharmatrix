import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import {
    BriefcaseMedical, Plus, X, AlertTriangle, Edit2, Trash2,
    Loader2, Search, Pill, Package, FlaskConical, Droplets,
    Syringe, Shield, Clock, Bell, Activity, ChevronDown,
    CheckCircle2, RefreshCw
} from 'lucide-react';

const API_URL = 'http://pharmatrix-backend.onrender.com';

const MEDICINE_TYPES = ['All', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Other'];

const TYPE_ICONS = {
    Tablet:    <Pill size={18} />,
    Capsule:   <Package size={18} />,
    Syrup:     <FlaskConical size={18} />,
    Injection: <Syringe size={18} />,
    Drops:     <Droplets size={18} />,
    Cream:     <Shield size={18} />,
    Other:     <Activity size={18} />,
};

// ─── Delete Confirmation Dialog ────────────────────────────────────────────────
function DeleteDialog({ medName, onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(8px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div className="glass-card" style={{
                width: '100%', maxWidth: '420px', margin: '1rem',
                padding: '2rem', borderTop: '2px solid var(--error-color)',
                animation: 'slideUp 0.25s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <Trash2 size={20} color="var(--error-color)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Delete Medicine</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>This action cannot be undone</p>
                    </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Are you sure you want to remove <strong style={{ color: 'var(--text-primary)' }}>{medName}</strong> from your cabinet?
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{
                        background: 'var(--bg-surface-elevated)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s'
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                        color: 'var(--error-color)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s'
                    }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.28)'; }}
                        onMouseOut={e  => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                    >Delete</button>
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, glow }) {
    return (
        <div className="glass-card" style={{
            padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center',
            gap: '1rem', borderLeft: `3px solid ${color}`, transition: 'all 0.3s ease'
        }}>
            <div style={{
                width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
                background: glow, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, color: color
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
function Cabinet() {
    const [medicines, setMedicines]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [successMsg, setSuccessMsg]   = useState('');
    const [mode, setMode]               = useState('view'); // 'view' | 'add' | 'edit'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingMed, setEditingMed]   = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [interactions, setInteractions] = useState({ interactions: [], status: 'safe', loading: false });
    const [expandedInteraction, setExpandedInteraction] = useState(null);

    // Structured form — assembled into flat strings before sending to backend
    const emptyForm = {
        name: '',
        type: 'Tablet',
        quantity: '',
        expiry_date: '',
        // dosage structured
        dose_amount: '',
        dose_unit: 'mg',
        dose_frequency: 'Once daily',
        // reminder structured
        reminder_hour: '8',
        reminder_minute: '00',
        reminder_period: 'AM',
        reminder_enabled: false,
        notes: '',
    };
    const [formData, setFormData] = useState(emptyForm);

    const { user } = useAuth();

    // Build backend strings from structured fields
    const buildPayload = (fd) => ({
        user_id: user?.id || 0, // Include the logged-in user ID
        name: fd.name.trim(),
        type: fd.type,
        quantity: parseInt(fd.quantity) || 0,
        expiry_date: fd.expiry_date,
        dosage_instructions: fd.dose_amount
            ? `${fd.dose_amount}${fd.dose_unit} — ${fd.dose_frequency}`
            : '',
        reminder_time: fd.reminder_enabled
            ? `${fd.reminder_hour}:${fd.reminder_minute} ${fd.reminder_period}`
            : '',
        reminder_enabled: fd.reminder_enabled ? 1 : 0,
        notes: fd.notes || '',
    });

    useEffect(() => { 
        if (user?.id) {
            fetchData(); 
        }
    }, [user?.id]);

    const fetchData = async () => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_URL}/cabinet`, {
                params: { user_id: user.id }
            });
            setMedicines(res.data);
            if (res.data.length >= 2) {
                checkInteractions();
            } else {
                setInteractions({ interactions: [], status: 'safe', loading: false });
            }
        } catch {
            setError('Failed to load cabinet data. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const checkInteractions = async () => {
        if (!user?.id) return;
        setInteractions(prev => ({ ...prev, loading: true }));
        try {
            const res = await axios.get(`${API_URL}/drug-safety-check`, {
                params: { user_id: user.id }
            });
            setInteractions({ 
                interactions: res.data.interactions || [], 
                status: res.data.status || 'safe', 
                message: res.data.message,
                loading: false 
            });
        } catch (err) {
            console.error("Failed to check interactions", err);
            setInteractions(prev => ({ ...prev, loading: false }));
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const formatDate = (d) => {
        if (!d) return 'N/A';
        try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
        catch { return d; }
    };

    const getExpiryInfo = (dateStr) => {
        if (!dateStr) return { days: Infinity, label: 'No Expiry', color: 'var(--text-muted)', bg: 'transparent', border: 'var(--glass-border)', badgeBg: 'rgba(226,241,255,0.2)', badgeColor: 'var(--text-muted)' };
        const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / 86400000);
        if (diff < 0)   return { days: diff, label: 'Expired',       color: 'var(--error-color)',   bg: 'rgba(239,68,68,0.04)',   border: 'var(--error-color)',   badgeBg: 'rgba(239,68,68,0.14)',  badgeColor: 'var(--error-color)' };
        if (diff <= 7)  return { days: diff, label: `${diff}d left`, color: 'var(--error-color)',   bg: 'rgba(239,68,68,0.04)',   border: 'var(--error-color)',   badgeBg: 'rgba(239,68,68,0.14)',  badgeColor: 'var(--error-color)' };
        if (diff <= 30) return { days: diff, label: `${diff}d left`, color: 'var(--warning-color)', bg: 'rgba(245,158,11,0.04)',  border: 'var(--warning-color)', badgeBg: 'rgba(245,158,11,0.14)', badgeColor: 'var(--warning-color)' };
        if (diff <= 90) return { days: diff, label: 'Exp. Soon',     color: '#3b82f6',              bg: 'rgba(59,130,246,0.04)',  border: '#3b82f6',              badgeBg: 'rgba(59,130,246,0.14)', badgeColor: '#3b82f6' };
        return             { days: diff, label: 'Good',              color: 'var(--success-color)', bg: 'rgba(16,185,129,0.04)',  border: 'var(--glass-border)', badgeBg: 'rgba(16,185,129,0.14)', badgeColor: 'var(--success-color)' };
    };

    // ── Summary Stats ──────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total       = medicines.length;
        const expiringSoon = medicines.filter(m => { const d = getExpiryInfo(m.expiry_date).days; return d >= 0 && d <= 30; }).length;
        const expired     = medicines.filter(m => getExpiryInfo(m.expiry_date).days < 0).length;
        const lowStock    = medicines.filter(m => Number(m.quantity) <= 5).length;
        return { total, expiringSoon, expired, lowStock };
    }, [medicines]);

    // ── Alert meds (expiring ≤30d or expired) ─────────────────────────────────
    const alertMeds = useMemo(() =>
        medicines
            .filter(m => getExpiryInfo(m.expiry_date).days <= 30)
            .sort((a, b) => getExpiryInfo(a.expiry_date).days - getExpiryInfo(b.expiry_date).days),
        [medicines]
    );

    // ── Filtered List ──────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return medicines.filter(m => {
            // Backend returns flat fields: name, type, quantity, expiry_date, etc.
            const matchSearch = !q ||
                (m.name || '').toLowerCase().includes(q) ||
                (m.dosage_instructions || '').toLowerCase().includes(q) ||
                (m.notes || '').toLowerCase().includes(q);
            const matchFilter = activeFilter === 'All' || (m.type || 'Tablet') === activeFilter;
            return matchSearch && matchFilter;
        });
    }, [medicines, searchQuery, activeFilter]);

    // ── Helpers: flash success ─────────────────────────────────────────────────
    const flash = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const resetForm = () => { setFormData(emptyForm); setEditingMed(null); setError(null); };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.quantity || parseInt(formData.quantity) < 0) {
            setError('Please enter a valid quantity.');
            return;
        }
        if (!formData.expiry_date) {
            setError('Please select an expiry date.');
            return;
        }
        setIsSubmitting(true); setError(null);
        try {
            await axios.post(`${API_URL}/cabinet`, buildPayload(formData));
            resetForm(); setMode('view'); fetchData(); flash('Medicine added successfully!');
        } catch (err) {
            const detail = err?.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to add medicine. Please check your inputs.');
        } finally { setIsSubmitting(false); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); setError(null);
        try {
            await axios.put(`${API_URL}/cabinet/${editingMed.id}`, buildPayload(formData));
            resetForm(); setMode('view'); fetchData(); flash('Medicine updated successfully!');
        } catch (err) {
            const detail = err?.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to update medicine. Please try again.');
        } finally { setIsSubmitting(false); }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await axios.delete(`${API_URL}/cabinet/${deleteTarget.id}`);
            setDeleteTarget(null); fetchData(); flash('Medicine removed from cabinet.');
        } catch { setError('Failed to delete medicine.'); setDeleteTarget(null); }
    };

    // Parse stored strings back to structured fields when editing
    const openEdit = (med) => {
        setEditingMed(med);
        // Parse dosage: "500mg — Twice daily"
        let dose_amount = '', dose_unit = 'mg', dose_frequency = 'Once daily';
        if (med.dosage_instructions) {
            const m = med.dosage_instructions.match(/^([\d.]+)(mg|ml|tablet|capsule|drop|g|mcg|IU)\s*[—-]\s*(.+)$/i);
            if (m) { dose_amount = m[1]; dose_unit = m[2]; dose_frequency = m[3].trim(); }
            else   { dose_amount = med.dosage_instructions; }
        }
        // Parse reminder: "8:00 AM"
        let reminder_hour = '8', reminder_minute = '00', reminder_period = 'AM', reminder_enabled = false;
        if (med.reminder_time) {
            reminder_enabled = med.reminder_enabled === 1 || !!med.reminder_time;
            const r = med.reminder_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (r) { reminder_hour = r[1]; reminder_minute = r[2]; reminder_period = r[3].toUpperCase(); }
        }
        setFormData({
            name: med.name || '',
            type: med.type || 'Tablet',
            quantity: String(med.quantity ?? ''),
            expiry_date: med.expiry_date || '',
            dose_amount, dose_unit, dose_frequency,
            reminder_hour, reminder_minute, reminder_period, reminder_enabled,
            notes: med.notes || '',
        });
        setMode('edit');
    };

    // ── Form field styles ──────────────────────────────────────────────────────
    const fieldStyle = {
        width: '100%', padding: '0.75rem 1rem',
        background: 'rgba(226,241,255,0.32)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-primary)', fontSize: '0.95rem',
        outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
    };
    const labelStyle = {
        display: 'block', marginBottom: '0.4rem',
        color: 'var(--text-secondary)', fontSize: '0.83rem',
        fontWeight: 600, letterSpacing: '0.03em',
        textTransform: 'uppercase',
    };
    const focusIn  = e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 2px var(--accent-glow)'; };
    const focusOut = e => { e.target.style.borderColor = 'var(--glass-border)';  e.target.style.boxShadow = 'none'; };

    // ──────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(15,23,42,0.18) 100%)',
                    mixBlendMode: 'multiply',
                }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>

            {/* Delete Confirmation */}
            {deleteTarget && (
                <DeleteDialog
                    medName={deleteTarget.name}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '2rem', color: 'var(--text-primary)' }}>
                        <BriefcaseMedical size={28} style={{ color: 'var(--accent-primary)' }} />
                        My Medicine Cabinet
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.4rem 0 0', fontSize: '0.95rem' }}>
                        Track inventory, get expiry alerts &amp; manage your medicines
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    {mode === 'view' && (
                        <button onClick={fetchData} title="Refresh" style={{
                            background: 'var(--bg-surface-elevated)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)', padding: '0.65rem', borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                        }}
                            onMouseOver={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                            onMouseOut={e  => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                        ><RefreshCw size={16} /></button>
                    )}
                    {mode === 'view' ? (
                        <button className="btn-accent" onClick={() => { resetForm(); setMode('add'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> Add Medicine
                        </button>
                    ) : (
                        <button onClick={() => { setMode('view'); resetForm(); }} style={{
                            background: 'var(--bg-surface-elevated)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)', padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-full)',
                            cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <X size={16} /> Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* ── Success Banner ─────────────────────────────────────────────── */}
            {successMsg && (
                <div style={{
                    background: 'rgba(16,185,129,0.09)', color: 'var(--success-color)',
                    padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem',
                    border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: '8px',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <CheckCircle2 size={16} /> {successMsg}
                </div>
            )}

            {/* ── Error Banner ────────────────────────────────────────────────── */}
            {error && (
                <div style={{
                    background: 'rgba(239,68,68,0.08)', color: 'var(--error-color)',
                    padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem',
                    border: '1px solid rgba(239,68,68,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer' }}><X size={16} /></button>
                </div>
            )}

            {/* ── Loading ─────────────────────────────────────────────────────── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                    <Loader2 size={40} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                    <p>Loading your cabinet...</p>
                </div>

            ) : mode === 'view' ? (
                <>
                    {/* ── Summary Stats ─────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <StatCard icon={<BriefcaseMedical size={20} />} label="Total Medicines" value={stats.total}        color="var(--accent-primary)" glow="rgba(47,128,237,0.12)" />
                        <StatCard icon={<AlertTriangle size={20} />}    label="Expiring Soon"   value={stats.expiringSoon}  color="var(--warning-color)"  glow="rgba(245,158,11,0.12)" />
                        <StatCard icon={<Trash2 size={20} />}           label="Expired"          value={stats.expired}      color="var(--error-color)"    glow="rgba(239,68,68,0.12)" />
                        <StatCard icon={<Package size={20} />}          label="Low Stock (≤5)"   value={stats.lowStock}     color="var(--success-color)"  glow="rgba(16,185,129,0.12)" />
                    </div>

                    {/* ── Drug Safety Check ───────────────────────────────────── */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Shield size={22} style={{ color: interactions.status === 'warning' ? 'var(--accent-primary)' : 'var(--success-color)' }} />
                                Drug Safety Check
                            </h3>
                            {interactions.loading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <Loader2 size={14} className="spin" /> Checking safety...
                                </div>
                            )}
                        </div>

                        {interactions.status === 'warning' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {interactions.interactions.map((inter, idx) => (
                                    <div key={idx} className="glass-card" style={{
                                        padding: '1.5rem',
                                        border: '1px solid var(--accent-primary)',
                                        borderLeft: '4px solid var(--accent-primary)',
                                        background: 'rgba(226,241,255,0.82)',
                                        boxShadow: '0 0 15px rgba(47,128,237,0.12)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => setExpandedInteraction(expandedInteraction === idx ? null : idx)}
                                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 0 25px rgba(47,128,237,0.2)'}
                                    onMouseOut={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(47,128,237,0.12)'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    background: 'rgba(47,128,237,0.12)', border: '1px solid rgba(47,128,237,0.28)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                }}>
                                                    <AlertTriangle size={20} color="var(--accent-primary)" />
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Drug Interaction Warning</h4>
                                                    <p style={{ margin: '4px 0 0', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                                                        {inter.medicines}
                                                    </p>
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                                                fontSize: '0.75rem', fontWeight: 700,
                                                background: inter.severity === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                color: inter.severity === 'High' ? 'var(--error-color)' : 'var(--warning-color)',
                                                border: `1px solid ${inter.severity === 'High' ? 'var(--error-color)' : 'var(--warning-color)'}40`
                                            }}>
                                                {inter.severity} Risk
                                            </span>
                                        </div>

                                        <div style={{ marginTop: '1.25rem' }}>
                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                                <strong style={{ color: 'var(--text-primary)' }}>Risk:</strong> {inter.risk}
                                            </p>
                                        </div>

                                        {expandedInteraction === idx && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                style={{ overflow: 'hidden', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)' }}
                                            >
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <label style={{ ...labelStyle, color: 'var(--accent-primary)', fontSize: '0.75rem' }}>Explanation</label>
                                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{inter.explanation}</p>
                                                </div>
                                                <div style={{ background: 'rgba(47,128,237,0.08)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-primary)' }}>
                                                    <label style={{ ...labelStyle, color: 'var(--accent-primary)', fontSize: '0.75rem' }}>Recommendation</label>
                                                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>{inter.recommendation}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                        
                                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
                                            <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: expandedInteraction === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : interactions.status === 'safe' && medicines.length >= 2 ? (
                            <div className="glass-card" style={{
                                padding: '1.5rem',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                background: 'rgba(226,241,255,0.82)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.25rem',
                                animation: 'fadeIn 0.5s ease'
                            }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <CheckCircle2 size={24} color="var(--success-color)" />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>No Drug Interactions Detected</h4>
                                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Your medicines appear safe to take together.
                                    </p>
                                </div>
                            </div>
                        ) : medicines.length < 2 ? (
                            <div style={{ padding: '1.5rem', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Add at least two medicines to enable automatic interaction checking.
                            </div>
                        ) : null}
                    </div>

                    {/* ── Expiry Warning Banner ─────────────────────────────── */}
                    {alertMeds.length > 0 && (
                        <div style={{ marginBottom: '2rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.9rem 0', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                                <AlertTriangle size={17} /> Attention Required — {alertMeds.length} medicine{alertMeds.length > 1 ? 's' : ''} need{alertMeds.length === 1 ? 's' : ''} attention
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                {alertMeds.map(m => {
                                    const info = getExpiryInfo(m.expiry_date);
                                    return (
                                        <span key={m.id} style={{ padding: '0.28rem 0.85rem', borderRadius: 'var(--radius-full)', fontSize: '0.79rem', fontWeight: 600, background: info.badgeBg, color: info.badgeColor, border: `1px solid ${info.color}35` }}>
                                            {m.name || 'Unknown'} · {info.label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Search + Filter ───────────────────────────────────── */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: '1 1 220px', position: 'relative' }}>
                            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by name, dosage, notes…"
                                style={{ ...fieldStyle, paddingLeft: '38px' }}
                                onFocus={focusIn} onBlur={focusOut}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                            {MEDICINE_TYPES.map(type => (
                                <button key={type} onClick={() => setActiveFilter(type)} style={{
                                    padding: '0.42rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 600,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    background: activeFilter === type ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                                    color:      activeFilter === type ? '#fff' : 'var(--text-secondary)',
                                    border:     activeFilter === type ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                                    boxShadow:  activeFilter === type ? '0 0 12px var(--accent-glow)' : 'none'
                                }}>{type}</button>
                            ))}
                        </div>
                    </div>

                    {/* ── Inventory Count ───────────────────────────────────── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>
                            Inventory <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({filtered.length} of {medicines.length})</span>
                        </h3>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                                Clear search
                            </button>
                        )}
                    </div>

                    {/* ── Medicine Grid ─────────────────────────────────────── */}
                    {filtered.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed' }}>
                            <BriefcaseMedical size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.35 }} />
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                {medicines.length === 0 ? 'Your cabinet is empty' : 'No medicines match your search'}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                                {medicines.length === 0
                                    ? 'Add medicines manually or scan them using the AI Scanner.'
                                    : 'Try a different name or change the type filter.'}
                            </p>
                            {medicines.length === 0 && (
                                <button className="btn-accent" onClick={() => { resetForm(); setMode('add'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <Plus size={18} /> Add Your First Medicine
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(305px, 1fr))', gap: '1.25rem' }}>
                            {filtered.map((med, i) => {
                                const info     = getExpiryInfo(med.expiry_date);
                                const typeIcon = TYPE_ICONS[med.type] || TYPE_ICONS.Other;
                                const lowStock = Number(med.quantity) <= 5;
                                return (
                                    <div key={med.id} className="glass-card" style={{
                                        position: 'relative', overflow: 'hidden', padding: '1.25rem',
                                        borderLeft: `3px solid ${info.color}`,
                                        display: 'flex', flexDirection: 'column',
                                        animation: `fadeIn 0.35s ease-out forwards ${Math.min(i * 0.05, 0.4)}s`, opacity: 0,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                    }}
                                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)'; }}
                                        onMouseOut={e  => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
                                    >
                                        {/* Top row: icon + name + badge */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: info.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color, flexShrink: 0 }}>
                                                    {typeIcon}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {med.name || 'Unknown'}
                                                    </h3>
                                                    <span style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>{med.type || 'Tablet'}</span>
                                                </div>
                                            </div>
                                            <span style={{ padding: '0.22rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.71rem', fontWeight: 700, background: info.badgeBg, color: info.badgeColor, border: `1px solid ${info.color}40`, flexShrink: 0, marginLeft: '8px' }}>
                                                {info.label}
                                            </span>
                                        </div>

                                        {/* Detail grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', border: '1px solid var(--glass-border)', marginBottom: '0.85rem' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.69rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2px' }}>Quantity</span>
                                                <strong style={{ color: lowStock ? 'var(--error-color)' : 'var(--text-primary)', fontSize: '0.93rem' }}>
                                                    {med.quantity ?? '—'} units{lowStock && <span style={{ fontSize: '0.7rem', marginLeft: '4px', verticalAlign: 'middle' }}>⚠️</span>}
                                                </strong>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.69rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2px' }}>Expires</span>
                                                <strong style={{ color: 'var(--text-primary)', fontSize: '0.93rem' }}>{formatDate(med.expiry_date)}</strong>
                                            </div>
                                            {med.dosage_instructions && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <span style={{ display: 'block', fontSize: '0.69rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2px' }}>Dosage</span>
                                                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{med.dosage_instructions}</strong>
                                                </div>
                                            )}
                                            {med.reminder_time && (
                                                <div>
                                                    <span style={{ display: 'block', fontSize: '0.69rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2px' }}>Reminder</span>
                                                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Bell size={12} />{med.reminder_time}</strong>
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        {med.notes && (
                                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.81rem', color: 'var(--text-secondary)', padding: '0.55rem', background: 'rgba(226,241,255,0.28)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--glass-border)', wordBreak: 'break-word' }}>
                                                {med.notes}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
                                            <button onClick={() => openEdit(med)} title="Edit" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '0.38rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }}
                                                onMouseOver={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                                                onMouseOut={e  => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                                            >
                                                <Edit2 size={13} /> Edit
                                            </button>
                                            <button onClick={() => setDeleteTarget({ id: med.id, name: med.name || 'this medicine' })} title="Delete" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error-color)', padding: '0.38rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }}
                                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
                                                onMouseOut={e  => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                                            >
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>

            ) : (
                /* ── Add / Edit Form ──────────────────────────────────────────── */
                <div className="glass-card" style={{ maxWidth: '660px', margin: '0 auto', padding: '2rem', borderTop: '2px solid var(--accent-primary)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {mode === 'edit'
                            ? <><Edit2 size={20} color="var(--accent-primary)" /> Edit Medicine</>
                            : <><Plus  size={20} color="var(--accent-primary)" /> Add New Medicine</>}
                    </h3>

                    <form onSubmit={mode === 'edit' ? handleUpdate : handleAdd}>

                        {/* Name */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={labelStyle}>Medicine Name *</label>
                            <input required type="text" value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Amoxicillin 500mg"
                                style={fieldStyle} onFocus={focusIn} onBlur={focusOut} />
                        </div>

                        {/* Type */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={labelStyle}>Medicine Type</label>
                            <div style={{ position: 'relative' }}>
                                <select value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    style={{ ...fieldStyle, appearance: 'none', paddingRight: '2.5rem' }}
                                    onFocus={focusIn} onBlur={focusOut}>
                                    {MEDICINE_TYPES.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        {/* Quantity + Expiry */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Quantity *</label>
                                <input required type="number" min="0" value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    placeholder="Number of units"
                                    style={fieldStyle} onFocus={focusIn} onBlur={focusOut} />
                            </div>
                            <div>
                                <label style={labelStyle}>Expiry Date *</label>
                                <input required type="date" value={formData.expiry_date}
                                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                    style={{ ...fieldStyle, colorScheme: 'dark' }}
                                    onFocus={focusIn} onBlur={focusOut} />
                            </div>
                        </div>

                        {/* Dosage — structured: amount number + unit dropdown + frequency dropdown */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={labelStyle}><Pill size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Dosage (optional)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '90px 110px 1fr', gap: '0.6rem' }}>
                                <input type="number" min="0" step="any" value={formData.dose_amount}
                                    onChange={e => setFormData({ ...formData, dose_amount: e.target.value })}
                                    placeholder="Amount"
                                    style={{ ...fieldStyle, textAlign: 'center' }} onFocus={focusIn} onBlur={focusOut} />
                                <div style={{ position: 'relative' }}>
                                    <select value={formData.dose_unit}
                                        onChange={e => setFormData({ ...formData, dose_unit: e.target.value })}
                                        style={{ ...fieldStyle, appearance: 'none', paddingRight: '1.8rem' }}
                                        onFocus={focusIn} onBlur={focusOut}>
                                        {['mg','ml','g','mcg','IU','tablet','capsule','drop'].map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <select value={formData.dose_frequency}
                                        onChange={e => setFormData({ ...formData, dose_frequency: e.target.value })}
                                        style={{ ...fieldStyle, appearance: 'none', paddingRight: '1.8rem' }}
                                        onFocus={focusIn} onBlur={focusOut}>
                                        {['Once daily','Twice daily','3× daily','4× daily','Every 6 hrs','Every 8 hrs','Every 12 hrs','As needed','With meals','Before meals','After meals','At bedtime'].map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                    <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                </div>
                            </div>
                            {formData.dose_amount && (
                                <p style={{ margin: '0.35rem 0 0', fontSize: '0.79rem', color: 'var(--text-muted)' }}>
                                    Preview: <strong style={{ color: 'var(--accent-primary)' }}>{formData.dose_amount}{formData.dose_unit} — {formData.dose_frequency}</strong>
                                </p>
                            )}
                        </div>

                        {/* Reminder — toggle + hour (1–12) + minute dropdown + AM/PM buttons */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={labelStyle}><Bell size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Reminder (optional)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: formData.reminder_enabled ? '0.65rem' : '0' }}>
                                <button type="button" onClick={() => setFormData({ ...formData, reminder_enabled: !formData.reminder_enabled })} style={{
                                    width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.25s',
                                    background: formData.reminder_enabled ? 'var(--accent-primary)' : 'rgba(226,241,255,0.44)',
                                }}>
                                    <span style={{ position: 'absolute', width: '18px', height: '18px', background: 'rgba(232,245,255,0.98)', borderRadius: '50%', top: '3px', transition: 'left 0.25s', left: formData.reminder_enabled ? '23px' : '3px' }} />
                                </button>
                                <span style={{ fontSize: '0.87rem', color: formData.reminder_enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    {formData.reminder_enabled ? 'Reminder on' : 'No reminder'}
                                </span>
                            </div>
                            {formData.reminder_enabled && (
                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input type="number" min="1" max="12" value={formData.reminder_hour}
                                        onChange={e => setFormData({ ...formData, reminder_hour: e.target.value })}
                                        style={{ ...fieldStyle, width: '76px', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                                        onFocus={focusIn} onBlur={focusOut} />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>:</span>
                                    <div style={{ position: 'relative', width: '86px' }}>
                                        <select value={formData.reminder_minute}
                                            onChange={e => setFormData({ ...formData, reminder_minute: e.target.value })}
                                            style={{ ...fieldStyle, appearance: 'none', textAlign: 'center', fontWeight: 700, fontSize: '1.05rem', paddingRight: '1.6rem' }}
                                            onFocus={focusIn} onBlur={focusOut}>
                                            {['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <ChevronDown size={12} style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    </div>
                                    {['AM','PM'].map(p => (
                                        <button key={p} type="button" onClick={() => setFormData({ ...formData, reminder_period: p })} style={{
                                            padding: '0.65rem 1.1rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.18s',
                                            background: formData.reminder_period === p ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                                            color:      formData.reminder_period === p ? '#fff' : 'var(--text-secondary)',
                                            border:     formData.reminder_period === p ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                                        }}>{p}</button>
                                    ))}
                                    <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 600 }}>→ {formData.reminder_hour}:{formData.reminder_minute} {formData.reminder_period}</span>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>Notes (Optional)</label>
                            <textarea value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any special warnings or notes…"
                                rows={2}
                                style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }}
                                onFocus={focusIn} onBlur={focusOut} />
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                            <button type="button" onClick={() => { setMode('view'); resetForm(); }} style={{
                                background: 'var(--bg-surface-elevated)', border: '1px solid var(--glass-border)',
                                color: 'var(--text-primary)', padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-full)',
                                cursor: 'pointer', fontWeight: 600
                            }}>Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="btn-accent" style={{ minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {isSubmitting
                                    ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                                    : mode === 'edit' ? 'Update Medicine' : 'Save Medicine'
                                }
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <style>{`
                @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                select option { background: rgba(230,243,255,0.98); color: var(--text-primary); }
            `}</style>
            </div>
        </div>
    );
}

export default Cabinet;

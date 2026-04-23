import React, { useRef, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Camera, Upload, RefreshCw, Volume2, VolumeX, BriefcaseMedical, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = 'http://pharmatrix-backend.onrender.com';

function Scanner() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const lastSpeakTime = useRef(0);
    const fileInputRef = useRef(null);

    const [capturedImage, setCapturedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isAddingToCabinet, setIsAddingToCabinet] = useState(false);
    const [addSuccess, setAddSuccess] = useState(false);

    // ─── Camera Setup ─────────────────────────────────────
    const startCamera = useCallback(async () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => setCameraReady(true);
            }
            setError(null);
        } catch {
            setError('❌ Camera access denied. Please allow camera permissions and refresh.');
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, [startCamera]);

    // ─── Send to backend /scan ─────────────────────────────
    const processImage = useCallback(async (file) => {
        setLoading(true);
        setResult(null);
        setError(null);

        const formData = new FormData();
        formData.append('file', file, file.name || 'scan.jpg');

        try {
            const response = await axios.post(`${API_URL}/scan`, formData);
            const data = response.data;

            // Non-medicine image detected
            if (data.not_medicine) {
                setError(`🚫 Not a medicine: ${data.error}`);
                setResult(null);
            } else {
                setResult(data);
                setTimeout(() => readResult(data), 300);
            }
        } catch (err) {
            const detail = err.response?.data?.detail || err.message || 'Unknown error';
            setError(`❌ Scan failed: ${detail}`);
        } finally {
            setLoading(false);
        }
    }, []);


    // ─── Capture from Camera ───────────────────────────────
    const handleCapture = async () => {
        unlockAudio();
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth === 0) { setError('Camera not ready yet. Please wait.'); return; }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            const preview = URL.createObjectURL(blob);
            setCapturedImage(preview);
            processImage(file);
        }, 'image/jpeg', 0.95);
    };

    // ─── Upload Image ──────────────────────────────────────
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        unlockAudio();
        setCapturedImage(URL.createObjectURL(file));
        processImage(file);
        e.target.value = '';
    };

    // ─── Drag and Drop ─────────────────────────────────────
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        unlockAudio();
        setCapturedImage(URL.createObjectURL(file));
        processImage(file);
    };

    // ─── Text-to-Speech ────────────────────────────────────
    const unlockAudio = () => {
        if (window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance('');
            u.volume = 0;
            window.speechSynthesis.speak(u);
        }
    };

    const readResult = (data) => {
        const now = Date.now();
        if (now - lastSpeakTime.current < 2000) return;
        lastSpeakTime.current = now;
        if (!data) return;

        let text = '';
        if (data.medicine_data?.name) {
            text += `${data.medicine_data.name}. `;
            if (data.medicine_data.purpose) text += `Used for ${data.medicine_data.purpose}. `;
            if (data.medicine_data.dosage) text += `Dosage: ${data.medicine_data.dosage}. `;
            text += 'Please consult a doctor.';
        } else {
            text = 'Medicine not identified. Please try again with a clearer image.';
        }

        if (!('speechSynthesis' in window)) return;

        const speak = () => {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'en-US';
            utter.rate = 1.0;
            utter.volume = 1.0;
            const voices = window.speechSynthesis.getVoices();
            const eng = voices.find(v => v.lang.startsWith('en')) || voices[0];
            if (eng) utter.voice = eng;
            utter.onstart = () => setIsSpeaking(true);
            utter.onend = () => setIsSpeaking(false);
            utter.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utter);
        };

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) { speak(); return; }
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null;
            speak();
        };
        setTimeout(speak, 300);
    };

    const stopSpeaking = () => {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
    };

    const addToCabinet = async () => {
        if (!result?.medicine_data) return;
        setIsAddingToCabinet(true);
        setError(null);
        try {
            const med = result.medicine_data;
            await axios.post(`${API_URL}/cabinet`, {
                name: med.name,
                type: 'Tablet', // Defaulting to Tablet for scanned meds
                quantity: 10,   // Default starter quantity
                expiry_date: med.expiry_date || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
                dosage_instructions: med.dosage || '',
                notes: `Added from scan. Generic: ${med.generic_name || 'Unknown'}`
            });
            setAddSuccess(true);
            setTimeout(() => setAddSuccess(false), 3000);
        } catch (err) {
            setError(`❌ Failed to add to cabinet: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsAddingToCabinet(false);
        }
    };

    // ─── Reset ─────────────────────────────────────────────
    const reset = () => {
        stopSpeaking();
        setCapturedImage(null);
        setResult(null);
        setError(null);
        startCamera();
    };

    return (
        <div
            className="scanner-container glass-card"
            style={{
                position: 'relative',
                zIndex: 10,
                maxWidth: '760px',
                margin: '1.5rem auto 2.5rem',
                padding: '2.25rem',
                border: isDragging ? '2px dashed var(--accent-primary)' : '1px solid var(--glass-border)',
                borderRadius: '20px',
                transition: 'border 0.3s ease',
                backdropFilter: 'blur(16px)',
                background: 'linear-gradient(160deg, rgba(236,247,255,0.92), rgba(218,237,255,0.9))',
                boxShadow: '0 18px 42px rgba(22,76,133,0.16)'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div style={{
                position: 'absolute',
                right: '-70px',
                top: '-70px',
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(86,204,242,0.24), transparent 70%)',
                pointerEvents: 'none'
            }} />

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '2.1rem', letterSpacing: '-0.01em' }}>
                    Medicine Scanner
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                    Point your camera at a medicine package or upload an image
                </p>
            </div>

            {error && (
                <div style={{
                    background: error.startsWith('🚫') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: error.startsWith('🚫') ? 'var(--warning-color)' : 'var(--error-color)',
                    border: `1px solid ${error.startsWith('🚫') ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem',
                    fontSize: '0.95rem', fontWeight: '500', backdropFilter: 'blur(10px)'
                }}>
                    {error}
                    {error.startsWith('🚫') && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(245, 158, 11, 0.8)' }}>
                            💡 Only medicine strips, tablet boxes, syrup bottles, and similar pharmaceutical products are supported.
                        </p>
                    )}
                </div>
            )}

            {/* ── Camera View ── */}
            {!capturedImage && (
                <div className="camera-container" style={{ height: '320px', marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <video
                        ref={videoRef}
                        autoPlay playsInline muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className="scan-overlay" />

                    {/* HUD Elements */}
                    <div style={{ position: 'absolute', top: 20, left: 20, width: 30, height: 30, borderTop: '2px solid var(--accent-primary)', borderLeft: '2px solid var(--accent-primary)', zIndex: 11 }}></div>
                    <div style={{ position: 'absolute', top: 20, right: 20, width: 30, height: 30, borderTop: '2px solid var(--accent-primary)', borderRight: '2px solid var(--accent-primary)', zIndex: 11 }}></div>
                    <div style={{ position: 'absolute', bottom: 20, left: 20, width: 30, height: 30, borderBottom: '2px solid var(--accent-primary)', borderLeft: '2px solid var(--accent-primary)', zIndex: 11 }}></div>
                    <div style={{ position: 'absolute', bottom: 20, right: 20, width: 30, height: 30, borderBottom: '2px solid var(--accent-primary)', borderRight: '2px solid var(--accent-primary)', zIndex: 11 }}></div>

                    {!cameraReady && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(234,245,255,0.9)', zIndex: 12 }}>
                            Starting camera initialization...
                        </div>
                    )}
                </div>
            )}

            {/* ── Captured / Uploaded Image Preview moved below buttons ── */}

            {/* ── Buttons ── */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                {/* Capture */}
                <button
                    className="btn-accent"
                    onClick={handleCapture}
                    disabled={loading || !cameraReady || !!capturedImage}
                    style={{ flex: 1, minWidth: '160px', opacity: (loading || !cameraReady || !!capturedImage) ? 0.5 : 1 }}
                >
                    <Camera size={20} />
                    Capture
                </button>

                {/* Upload */}
                <div style={{ position: 'relative', display: 'inline-block', flex: 1, minWidth: '160px' }}>
                    <button
                        className="btn-primary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        style={{ width: '100%', opacity: loading ? 0.5 : 1 }}
                    >
                        <Upload size={20} />
                        Upload
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Reset */}
                {(capturedImage || result || error) && (
                    <button
                        onClick={reset}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '0.875rem 1.75rem', borderRadius: 'var(--radius-full)', fontWeight: '600',
                            border: '1px solid var(--glass-border)', background: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', cursor: 'pointer',
                            flex: '1 1 100%', transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(226,241,255,0.44)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                        }}
                    >
                        <RefreshCw size={18} /> Scan Again
                    </button>
                )}
            </div>

            {/* ── Captured / Uploaded Image Preview ── */}
            {capturedImage && (
                <div style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-md)' }}>
                    <img src={capturedImage} alt="Preview" style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', background: 'var(--bg-base)' }} />
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div className="glass-card pulse" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '1rem', border: '1px solid rgba(47,128,237,0.3)', background: 'linear-gradient(160deg, rgba(236,247,255,0.95), rgba(222,240,255,0.92))' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(47,128,237,0.35))' }}>🔬</div>
                    <p style={{ fontWeight: '700', color: 'var(--accent-primary)', marginBottom: '0.5rem', fontSize: '1.2rem', letterSpacing: '0.02em' }}>Smart Medicine Analysis...</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Reading image metrics → Identifying components → Extracting data</p>
                </div>
            )}

            {/* ── Result ── */}
            {result && !loading && (
                <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(160deg, rgba(236,247,255,0.94), rgba(219,238,255,0.9))' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Scan Results</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className={`status-badge ${result.is_expired ? 'status-expired' : 'status-valid'}`}>
                                {result.expiry_message}
                            </span>
                            <button
                                onClick={() => isSpeaking ? stopSpeaking() : readResult(result)}
                                style={{
                                    background: isSpeaking ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface-elevated)',
                                    color: isSpeaking ? 'var(--success-color)' : 'var(--text-primary)',
                                    border: '1px solid var(--glass-border)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {isSpeaking ? <><VolumeX size={16} /> <span style={{ fontSize: '0.85rem' }}>Stop</span></> : <><Volume2 size={16} /> <span style={{ fontSize: '0.85rem' }}>Speech</span></>}
                            </button>
                        </div>
                    </div>

                    {/* AI Error */}
                    {result.error && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error-color)', border: '1px solid rgba(239,68,68,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                            <strong>⚠️ Processing Error:</strong> {result.error}
                            <br /><small style={{ color: 'var(--text-secondary)' }}>Diagnostic: Input image clarity insufficient. Readability threshold not met.</small>
                        </div>
                    )}

                    {/* Medicine Details */}
                    {result.medicine_data ? (
                        <div style={{ background: 'rgba(229,243,255,0.82)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', boxShadow: '0 10px 28px rgba(22,79,138,0.1)' }}>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                                {result.medicine_data.name}
                            </h4>
                            <p style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: '500' }}>
                                Generic Component: <strong style={{ color: 'var(--text-primary)' }}>{result.medicine_data.generic_name}</strong>
                            </p>

                            <div style={{ display: 'grid', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                                <p><strong style={{ color: 'var(--text-primary)' }}>Purpose:</strong> {result.medicine_data.purpose}</p>
                                <p><strong style={{ color: 'var(--text-primary)' }}>Demographic:</strong> {result.medicine_data.who_can_take}</p>
                                <p><strong style={{ color: 'var(--text-primary)' }}>Dosage:</strong> {result.medicine_data.dosage}</p>
                            </div>

                            {result.medicine_data.food_instruction && (
                                <div style={{ background: 'rgba(245,158,11,0.05)', borderLeft: '2px solid var(--warning-color)', padding: '0.75rem 1rem', margin: '1.5rem 0 1rem', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                    <strong style={{ color: 'var(--warning-color)' }}>Dietary Constraint:</strong> {result.medicine_data.food_instruction}
                                </div>
                            )}

                            {result.medicine_data.warnings && (
                                <div style={{ background: 'rgba(239,68,68,0.05)', borderLeft: '2px solid var(--error-color)', padding: '0.75rem 1rem', margin: '1rem 0', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                    <strong style={{ color: 'var(--error-color)' }}>Safety Warning:</strong> {result.medicine_data.warnings}
                                </div>
                            )}

                            {result.medicine_data.doctor_consultation_required && (
                                <div style={{ background: 'var(--text-primary)', color: 'var(--bg-base)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontWeight: '700', marginTop: '1.5rem', fontSize: '0.95rem' }}>
                                    MEDICAL CONSULTATION ADVISED
                                </div>
                            )}

                            {/* Add to Cabinet Button */}
                            <button
                                onClick={addToCabinet}
                                disabled={isAddingToCabinet || addSuccess}
                                style={{
                                    width: '100%', marginTop: '1.5rem', padding: '1rem',
                                    borderRadius: 'var(--radius-md)', border: 'none',
                                    background: addSuccess ? 'var(--success-color)' : 'var(--accent-primary)',
                                    color: '#fff', fontWeight: '700', fontSize: '1rem',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: addSuccess ? '0 0 15px rgba(16, 185, 129, 0.4)' : '0 0 15px var(--accent-glow)'
                                }}
                            >
                                {isAddingToCabinet ? <Loader2 size={20} className="spin" /> : addSuccess ? <CheckCircle2 size={20} /> : <BriefcaseMedical size={20} />}
                                {isAddingToCabinet ? 'Adding to Cabinet...' : addSuccess ? 'Added Successfully!' : 'Add to My Cabinet'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: 'rgba(229,243,255,0.86)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                            <p style={{ fontWeight: '600', marginBottom: '1rem', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ⚠️ Identification Unsuccessful
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Raw OCR metrics parsed:</p>
                            <pre style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '0.5rem', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                {result.ocr_text || 'NULL'}
                            </pre>
                            <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginTop: '1rem' }}>
                                Action: Optimize ambient lighting. Re-align optics. Verify subject legibility.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}

export default Scanner;

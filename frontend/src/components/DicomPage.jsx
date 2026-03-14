import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Viewer from './Viewer';

const API_BASE = 'http://localhost:8000/api/dicom/analyze/';

const DicomPage = () => {
    const navigate = useNavigate();
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [idx, setIdx]         = useState(0);

    useEffect(() => {
        const fetchDicom = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}?idx=${idx}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || `HTTP ${res.status}`);
                }
                const json = await res.json();
                setData(json);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDicom();
    }, [idx]);

    // ── Layout ──────────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: '100vh',
            background: '#000',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* ── Header ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(15,20,25,0.95)',
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                    }}
                >
                    <ArrowLeft size={16} />
                    Retour
                </button>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                    DICOM Viewer — Cerebro
                </h1>
                {data && (
                    <span style={{ color: '#6b7280', fontSize: '13px', marginLeft: 'auto' }}>
                        Fichier {data.current + 1} / {data.total} — {data.filename}
                    </span>
                )}
            </div>

            {/* ── Content ── */}
            <div style={{ flex: 1, padding: '32px 24px' }}>
                {loading && (
                    <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280', fontSize: '18px' }}>
                        <div style={{ marginBottom: '12px', fontSize: '32px' }}>⏳</div>
                        Chargement du fichier DICOM...
                    </div>
                )}

                {error && (
                    <div style={{
                        maxWidth: '600px',
                        margin: '60px auto',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: 'center',
                    }}>
                        <p style={{ color: '#ef4444', fontWeight: 600, margin: '0 0 8px 0' }}>Erreur</p>
                        <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>
                    </div>
                )}

                {!loading && !error && data && (
                    <Viewer data={data} />
                )}
            </div>

            {/* ── Navigation ── */}
            {data && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(15,20,25,0.95)',
                }}>
                    <button
                        onClick={() => setIdx(data.prev_idx)}
                        disabled={idx === 0}
                        style={{
                            background: idx === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.2)',
                            border: `1px solid ${idx === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(59,130,246,0.4)'}`,
                            color: idx === 0 ? '#4b5563' : '#60a5fa',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s',
                        }}
                    >
                        <ChevronLeft size={18} /> Précédent
                    </button>

                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#9ca3af',
                        fontSize: '14px',
                        minWidth: '80px',
                        justifyContent: 'center',
                    }}>
                        {data.current + 1} / {data.total}
                    </span>

                    <button
                        onClick={() => setIdx(data.next_idx)}
                        disabled={idx === data.total - 1}
                        style={{
                            background: idx === data.total - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.2)',
                            border: `1px solid ${idx === data.total - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(59,130,246,0.4)'}`,
                            color: idx === data.total - 1 ? '#4b5563' : '#60a5fa',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: idx === data.total - 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s',
                        }}
                    >
                        Suivant <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default DicomPage;

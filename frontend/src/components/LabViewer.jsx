import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Activity, ActivitySquare, BrainCircuit } from 'lucide-react';
import pako from 'pako';
import API from '../api';
import CinematicKidney from './CinematicKidney';
import MprPane from './MprPane';

export default function LabViewer({ studyId, seriesId, maskBase64, maskShape, onExit }) {
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState(null);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Managed Interaction State (Ref-based for 60FPS)
    const focalPointRef = useRef({ x: 0, y: 0, z: 0 });
    // This state is used for the header/stats UI and is throttled
    const [uiFocalPoint, setUiFocalPoint] = useState({ x: 0, y: 0, z: 0 });
    const [isLinked, setIsLinked] = useState(true);

    const broadcastFocalChange = (newPoint, source = 'interaction') => {
        if (!newPoint) return;
        focalPointRef.current = newPoint;
        window.dispatchEvent(new CustomEvent('dicom-lab-focal-move', { 
            detail: { point: newPoint, source } 
        }));
    };

    // Synchronize UI statistics only when the interaction is finished
    // to prevent heavy re-renders during the drag.
    useEffect(() => {
        const handleDragEnd = () => {
            setUiFocalPoint({ ...focalPointRef.current });
        };
        window.addEventListener('pointerup', handleDragEnd);
        return () => window.removeEventListener('pointerup', handleDragEnd);
    }, []);

    // Decompress the mask film in memory for the MprPane overlay
    const maskFilm = useMemo(() => {
        if (!maskBase64) return null;
        try {
            const binary = atob(maskBase64);
            const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
            return pako.inflate(bytes);
        } catch { return null; }
    }, [maskBase64]);

    useEffect(() => {
        const generate = async () => {
            setLoading(true);
            try {
                const { data } = await API.post('/api/dicom/generate-lab/', {
                    study_id: studyId,
                    series_id: seriesId,
                    mask_base64: maskBase64,
                    shape: maskShape
                });
                setAssets(data.urls);
                if (data.urls.stats) {
                    const sr = await API.get(data.urls.stats);
                    setStats(sr.data);
                }
            } catch (err) {
                setError(err.response?.data?.detail || err.message);
            } finally {
                setLoading(false);
            }
        };
        generate();
    }, [studyId, seriesId, maskBase64, maskShape]);

    // Initialize focal point once maskShape or totals are known
    useEffect(() => {
        if (maskShape && !isInitialized) {
            const startPoint = {
                x: Math.floor(maskShape[2] / 2),
                y: Math.floor(maskShape[1] / 2),
                z: Math.floor(maskShape[0] / 2)
            };
            focalPointRef.current = startPoint;
            setUiFocalPoint(startPoint);
            setIsInitialized(true);
        }
    }, [maskShape, isInitialized]);

    /* ── Loading ── */
    if (loading) return (
        <div className="absolute inset-0 bg-[#050507] z-50 flex flex-col items-center justify-center text-white">
            <Activity className="text-cyan-500 animate-pulse w-16 h-16 mb-6" />
            <h1 className="text-2xl font-black uppercase tracking-widest text-cyan-500">
                {maskBase64 ? 'Initializing Lab Station' : 'Syncing Patient Anatomy'}
            </h1>
            <p className="text-[10px] text-white/30 mt-4 italic font-mono uppercase tracking-[0.2em] animate-pulse">
                {maskBase64
                    ? 'Loading volumetric data & mapping radiomics layers…'
                    : 'Extracting 3D torso from DICOM series…'}
            </p>
        </div>
    );

    /* ── Error ── */
    if (error) return (
        <div className="absolute inset-0 bg-[#050507] z-50 flex flex-col items-center justify-center text-red-500 font-mono">
            <p className="mb-4 text-xl">Lab Backend Error</p>
            <p className="max-w-xl text-center text-sm">{error}</p>
            <button onClick={onExit} className="mt-8 px-6 py-2 border border-red-500/50 hover:bg-red-500/10 rounded uppercase text-xs tracking-widest text-white transition-all">
                Return to Simple Viewer
            </button>
        </div>
    );

    /* ── Main UI ── */
    return (
        <div className="absolute inset-0 bg-[#020203] z-[3000] flex flex-col overflow-hidden text-slate-300 font-sans selection:bg-cyan-500/30">

            {/* ── Header ── */}
            <header className="h-16 shrink-0 border-b border-white/5 bg-[#09090b] flex items-center px-8 justify-between shadow-2xl">
                <div className="flex items-center gap-6">
                    <button onClick={onExit} className="p-2 text-slate-500 hover:text-white transition-all rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="h-8 w-px bg-white/5" />
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
                            <ActivitySquare className="text-cyan-400" size={20} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white">DICOM LAB <span className="text-cyan-500">PRO</span></h1>
                            <p className="text-[10px] text-white/20 font-mono tracking-wider italic">V13 Precision Workstation</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-1 shadow-inner">
                        <button 
                            onClick={() => setIsLinked(!isLinked)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isLinked ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-white/30 hover:text-white/60'}`}
                            title={isLinked ? "Views are linked: Clicking JUMPS all slices" : "Views are independent: Slices remain fixed unless clicked"}
                        >
                            {isLinked ? 'Linked' : 'Independent'}
                        </button>
                        <button 
                            onClick={() => broadcastFocalChange({ ...focalPointRef.current }, 'jump')}
                            className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
                            title="Center all navigation planes to the current 3D crosshair position"
                        >
                            Sync To Crosshair
                        </button>
                    </div>

                    <div className="flex flex-col items-end text-[9px] font-mono text-white/10 uppercase tracking-[0.2em] leading-tight border-r border-white/5 pr-4 mr-0">
                        <span>SERIES: {seriesId?.slice(-8).toUpperCase()}</span>
                        <span className="text-cyan-500">XYZ: {uiFocalPoint.x}, {uiFocalPoint.y}, {uiFocalPoint.z}</span>
                    </div>
                    <div className="bg-emerald-500/10 px-3 py-1.5 rounded border border-emerald-500/20 text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                        AI Synchronized
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* ── Radiomics Sidebar ── */}
                <aside className="w-80 border-r border-white/5 bg-[#070708] flex flex-col overflow-y-auto custom-scrollbar shadow-2xl">
                    <div className="p-6 space-y-8">
                        {/* Session Stats */}
                        <div>
                            <h2 className="text-[10px] font-black tracking-[0.2em] text-cyan-500 uppercase mb-4 flex items-center gap-2">
                                <BrainCircuit size={14} className="text-cyan-400" />
                                Advanced Radiomics
                            </h2>

                            {stats ? (
                                <div className="space-y-6">
                                    {/* Shape Metrics */}
                                    <div>
                                        <h3 className="text-[9px] font-mono tracking-widest text-white/40 uppercase mb-2 border-b border-white/5 pb-1">Shape & Volumetrics</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Volume</span>
                                                <span className="text-xs font-bold text-emerald-400">{((stats.volume_mesh || stats.volume_voxels || 0) * 0.001).toFixed(1)} cm³</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Surface</span>
                                                <span className="text-xs font-bold text-emerald-400">{((stats.surface_area || 0) * 0.01).toFixed(1)} cm²</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Sphericity</span>
                                                <span className="text-xs font-bold text-pink-400">{(stats.sphericity || 0).toFixed(3)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">SVR Ratio</span>
                                                <span className="text-xs font-bold text-pink-400">{(stats.svr || 0).toFixed(3)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* First-Order Intensity */}
                                    <div>
                                        <h3 className="text-[9px] font-mono tracking-widest text-white/40 uppercase mb-2 border-b border-white/5 pb-1">1st Order Statistics</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Mean HU</span>
                                                <span className="text-xs font-bold text-cyan-400">{(stats.mean || 0).toFixed(1)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Median HU</span>
                                                <span className="text-xs font-bold text-cyan-400">{(stats.median || 0).toFixed(1)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Variance</span>
                                                <span className="text-xs font-bold text-white/60">{(stats.var || 0).toFixed(0)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Entropy</span>
                                                <span className="text-xs font-bold text-amber-400">{(stats.entropy || 0).toFixed(3)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">RMS</span>
                                                <span className="text-xs font-bold text-cyan-400">{(stats.rms || 0).toFixed(1)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">MAD</span>
                                                <span className="text-xs font-bold text-amber-400">{(stats.mad || 0).toFixed(1)}</span>
                                            </div>
                                            <div className="col-span-2 p-2 bg-white/[0.02] border border-white/5 rounded-lg flex justify-between">
                                                <div>
                                                    <span className="text-[8px] font-mono text-white/30 uppercase block">Skewness</span>
                                                    <span className="text-xs font-bold text-white/80">{(stats.skewness || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[8px] font-mono text-white/30 uppercase block">Kurtosis</span>
                                                    <span className="text-xs font-bold text-white/80">{(stats.kurtosis || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Texture (GLCM) */}
                                    <div>
                                        <h3 className="text-[9px] font-mono tracking-widest text-white/40 uppercase mb-2 border-b border-white/5 pb-1">Texture (GLCM)</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Contrast</span>
                                                <span className="text-xs font-bold text-purple-400">{(stats.glcm_contrast || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Homogeneity</span>
                                                <span className="text-xs font-bold text-purple-400">{(stats.glcm_homogeneity || 0).toFixed(3)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Energy</span>
                                                <span className="text-xs font-bold text-indigo-400">{(stats.glcm_energy || 0).toFixed(3)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Correlation</span>
                                                <span className="text-xs font-bold text-indigo-400">{(stats.glcm_correlation || 0).toFixed(3)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">Dissimilarity</span>
                                                <span className="text-xs font-bold text-indigo-400">{(stats.glcm_dissimilarity || 0).toFixed(3)}</span>
                                            </div>
                                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <span className="text-[8px] font-mono text-white/30 uppercase block">ASM</span>
                                                <span className="text-xs font-bold text-indigo-400">{(stats.glcm_asm || 0).toFixed(3)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center text-[10px] text-white/10 uppercase italic">
                                    Radiomics unavailable<br />Run AI Segmentation first
                                </div>
                            )}
                        </div>

                        {/* Histogram */}
                        {assets?.histogram && (
                            <div>
                                <h2 className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase mb-4">HU Distribution</h2>
                                <div className="rounded-2xl overflow-hidden border border-white/5 bg-black p-2">
                                    <img src={`http://localhost:8000${assets.histogram}`} alt="Histogram" className="w-full h-auto opacity-80" />
                                </div>
                            </div>
                        )}

                        {/* Export Module */}
                        <div className="pt-4">
                            <button className="w-full p-4 bg-cyan-600/10 hover:bg-cyan-500 hover:text-white border border-cyan-500/20 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all uppercase">
                                Export DICOM-SR
                            </button>
                        </div>
                    </div>
                </aside>

                {/* ── 2 × 2 Main Grid ── */}
                <div className="flex-1 p-1 bg-[#020203] overflow-hidden">
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 bg-white/5">

                        {/* Pane 1 – Axial */}
                        <MprPane
                            studyId={studyId}
                            seriesId={seriesId}
                            plane="axial"
                            onFocalPointChange={broadcastFocalChange}
                            isLinked={isLinked}
                            maskFilm={maskFilm}
                            maskShape={maskShape}
                        />

                        {/* Pane 2 – Coronal */}
                        <MprPane
                            studyId={studyId}
                            seriesId={seriesId}
                            plane="coronal"
                            focalPoint={focalPointRef.current}
                            onFocalPointChange={broadcastFocalChange}
                            isLinked={isLinked}
                            maskFilm={maskFilm}
                            maskShape={maskShape}
                        />

                        {/* Pane 3 – Sagittal */}
                        <MprPane
                            studyId={studyId}
                            seriesId={seriesId}
                            plane="sagittal"
                            focalPoint={focalPointRef.current}
                            onFocalPointChange={broadcastFocalChange}
                            isLinked={isLinked}
                            maskFilm={maskFilm}
                            maskShape={maskShape}
                        />

                        {/* Pane 4 – 3D Cinematic Viewer */}
                        <div className="bg-[#050507] rounded-sm overflow-hidden relative border border-white/[0.03] group">
                            <CinematicKidney
                                torsoUrl={assets?.torso ? `http://localhost:8000${assets.torso}` : null}
                                boneUrl={assets?.bone ? `http://localhost:8000${assets.bone}` : null}
                                kidneyUrl={assets?.kidney ? `http://localhost:8000${assets.kidney}` : null}
                                onFocusChange={() => { }}
                            />

                            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur text-[9px] uppercase tracking-widest text-cyan-400 rounded font-bold border border-white/10 z-10 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                                Cinematic 3D
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

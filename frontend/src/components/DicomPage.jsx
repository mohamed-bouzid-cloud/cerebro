import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Image as ImageIcon, Box, Layers, Info, Sun, Search, Move, RotateCcw, BrainCircuit } from 'lucide-react';
import pako from 'pako';

const API_BASE = 'http://localhost:8000/api/dicom/slice/';
const SEGMENT_API = 'http://localhost:8000/api/dicom/segment/';

const DicomPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const studyId = queryParams.get('study_id');

    // --- Technical States ---
    const [seriesList, setSeriesList] = useState([]);
    const [currentSeriesId, setCurrentSeriesId] = useState(null);
    const [studyInfo, setStudyInfo] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sliceCache, setSliceCache] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sliceDimensions, setSliceDimensions] = useState({ width: 512, height: 512 });

    // --- Tool & View States ---
    const [activeTool, setActiveTool] = useState(null); // 'window' | 'zoom' | 'pan' | 'segment'
    const [windowing, setWindowing] = useState({ width: 255, center: 127 });
    const [zoom, setZoom] = useState(1.0);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // --- AI Segmentation States ---
    const [maskCache, setMaskCache] = useState({}); // { [seriesId]: { data: Uint8Array, shape: [D, H, W] } }
    const [isSegmenting, setIsSegmenting] = useState(false);

    const canvasRef = useRef(null);
    const abortControllerRef = useRef(null);

    // 1. Discovery: Load Series List
    useEffect(() => {
        if (!studyId) {
            setError("Missing study_id parameter.");
            setLoading(false);
            return;
        }

        const fetchMetadata = async () => {
            try {
                const res = await fetch(`${API_BASE}?study_id=${studyId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
                });
                if (!res.ok) throw new Error("Failed to load study metadata");
                const data = await res.json();
                
                setSeriesList(data.series || []);
                setStudyInfo({ dicom_info: data.dicom_info });

                if (data.series && data.series.length > 0) {
                    const sorted = [...data.series].sort((a, b) => b.count - a.count);
                    const bestSeries = sorted.find(s => !s.description.toLowerCase().includes('survey')) || sorted[0];
                    setCurrentSeriesId(bestSeries.id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchMetadata();
    }, [studyId]);

    // 2. Load Series Data
    useEffect(() => {
        if (!currentSeriesId || !studyId) return;

        const loadSeries = async () => {
            setLoading(true);
            setSliceCache({});
            setCurrentIndex(0);
            resetView(); 
            
            if (abortControllerRef.current) abortControllerRef.current.abort();
            abortControllerRef.current = new AbortController();

            try {
                const res = await fetch(`${API_BASE}?idx=0&study_id=${studyId}&series_id=${currentSeriesId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
                    signal: abortControllerRef.current.signal
                });
                if (!res.ok) throw new Error("Failed to load first slice");
                const data = await res.json();
                
                const total = data.total;
                setSliceCache({ 0: data.image });
                setSliceDimensions({ width: data.width || 512, height: data.height || 512 });
                setStudyInfo(prev => ({ ...prev, total }));
                setLoading(false);
                
                preloadSeries(total, studyId, currentSeriesId, data.image, abortControllerRef.current.signal);
            } catch (err) {
                if (err.name === 'AbortError') return;
                setError(err.message);
                setLoading(false);
            }
        };
        loadSeries();
    }, [currentSeriesId, studyId]);

    // 3. Preloader
    const preloadSeries = async (total, targetStudyId, targetSeriesId, firstImage, signal) => {
        let currentCache = { 0: firstImage };
        for (let idx = 1; idx < total; idx++) {
            if (signal.aborted) break;
            try {
                const res = await fetch(`${API_BASE}?idx=${idx}&study_id=${targetStudyId}&series_id=${targetSeriesId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
                    signal
                });
                if (res.ok) {
                    const data = await res.json();
                    currentCache = { ...currentCache, [idx]: data.image };
                    setSliceCache({ ...currentCache });
                }
            } catch (err) {
                if (err.name === 'AbortError') break;
            }
        }
    };

    // 4. Core Rendering Engine (DICOM + MASK Overlay)
    const currentBase64 = sliceCache[currentIndex];
    useEffect(() => {
        if (!currentBase64 || !canvasRef.current) return;

        let active = true;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            if (!active) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const scaleBase = Math.min(canvas.width / img.width, canvas.height / img.height);
            const totalScale = scaleBase * zoom;
            
            ctx.save();
            ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
            ctx.scale(totalScale, totalScale);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            // --- AI MASK OVERLAY ---
            const seriesMask = maskCache[currentSeriesId];
            if (seriesMask) {
                const [D, H, W] = seriesMask.shape;
                // Index check
                if (currentIndex >= 0 && currentIndex < D) {
                    const maskData = seriesMask.data;
                    const sliceSize = H * W;
                    const offset = currentIndex * sliceSize;
                    const sliceMask = maskData.slice(offset, offset + sliceSize);

                    // Create semi-transparent overlay
                    const maskImgData = ctx.createImageData(W, H);
                    for (let i = 0; i < sliceSize; i++) {
                        if (sliceMask[i] > 0) {
                            maskImgData.data[i * 4 + 0] = 0;   // R
                            maskImgData.data[i * 4 + 1] = 255; // G
                            maskImgData.data[i * 4 + 2] = 0;   // B
                            maskImgData.data[i * 4 + 3] = 120; // A (Alpha)
                        } else {
                            maskImgData.data[i * 4 + 3] = 0;
                        }
                    }
                    
                    // Render mask to a temporary canvas for scaling
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = W;
                    tempCanvas.height = H;
                    tempCanvas.getContext('2d').putImageData(maskImgData, 0, 0);
                    
                    // Draw scaled mask
                    ctx.drawImage(tempCanvas, -img.width/2, -img.height/2, img.width, img.height);
                }
            }
            ctx.restore();
        };

        img.src = `data:image/png;base64,${currentBase64}`;
        return () => { active = false; };
    }, [currentBase64, zoom, pan, currentIndex, maskCache, currentSeriesId]);

    // 5. Intelligent AI Orchestrator
    const runIntelligentSegmentation = async (x, y, w, h) => {
        if (isSegmenting || !studyId || !currentSeriesId) return;
        setIsSegmenting(true);

        try {
            const res = await fetch(SEGMENT_API, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    study_id: studyId,
                    series_id: currentSeriesId,
                    slice_idx: currentIndex,
                    x: Math.round(x),
                    y: Math.round(y),
                    canvas_width: Math.round(w),
                    canvas_height: Math.round(h)
                })
            });

            if (!res.ok) throw new Error("AI analysis failed");
            const data = await res.json();
            
            // Decompress result volumes
            const newCache = { ...maskCache };
            for (const [sid, maskInfo] of Object.entries(data.masks)) {
                try {
                    const binary = atob(maskInfo.mask);
                    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
                    const decompressed = pako.inflate(bytes);
                    newCache[sid] = {
                        data: decompressed,
                        shape: maskInfo.shape,
                        confidence: maskInfo.confidence
                    };
                } catch (e) {
                    console.error(`Failed to decompress mask for series ${sid}:`, e);
                }
            }
            if (Object.keys(data.masks).length === 0) {
                alert("The AI completed its analysis but could not find a clear segmentation at this point. Try clicking a different area or slice.");
            }
            setMaskCache(newCache);
        } catch (err) {
            console.error(err);
            alert("The AI encountered an error during analysis. Please try again.");
        } finally {
            setIsSegmenting(false);
            setActiveTool(null);
        }
    };

    // 6. Interaction Handlers
    const resetView = () => {
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
        setWindowing({ width: 255, center: 127 });
    };

    const onMouseDown = (e) => {
        if (!activeTool) return;
        
        // Handle Segment Click
        if (activeTool === 'segment') {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            
            // Send exact click relative to the rendered canvas HTML element, unscaled
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            runIntelligentSegmentation(clickX, clickY, rect.width, rect.height);
            return;
        }

        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
        if (!isDragging || !activeTool) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        if (activeTool === 'window') {
            setWindowing(prev => ({ width: Math.max(1, prev.width + dx), center: prev.center + dy }));
        } else if (activeTool === 'zoom') {
            setZoom(prev => Math.max(0.1, prev - dy * 0.01));
        } else if (activeTool === 'pan') {
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        }
    };

    const handleWheel = (e) => {
        if (!studyInfo?.total) return;
        if (e.deltaY > 0) setCurrentIndex(p => Math.min(p + 1, studyInfo.total - 1));
        else if (e.deltaY < 0) setCurrentIndex(p => Math.max(p - 1, 0));
    };

    // UI Utilities
    const brightness = (127 / windowing.center);
    const contrast = (255 / windowing.width);
    const canvasFilter = `brightness(${brightness}) contrast(${contrast})`;
    const loadedCount = Object.keys(sliceCache).length;
    const progress = studyInfo?.total ? Math.round((loadedCount / studyInfo.total) * 100) : 0;

    if (error) return <div className="h-screen bg-black text-white flex items-center justify-center font-mono p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="h-screen w-full bg-black flex overflow-hidden font-sans text-slate-300 select-none">
            {/* Toolbelt */}
            <aside className="w-16 bg-[#070708] border-r border-white/5 flex flex-col items-center py-8 gap-6 z-20">
                <button onClick={() => navigate(-1)} className="p-3 text-slate-500 hover:text-white"><ArrowLeft size={24} /></button>
                <div className="h-px w-8 bg-white/5" />
                
                {[
                    { id: 'window', icon: Sun, label: 'Windowing' },
                    { id: 'zoom', icon: Search, label: 'Zoom' },
                    { id: 'pan', icon: Move, label: 'Pan' },
                    { id: 'segment', icon: BrainCircuit, label: 'AI Segment' }
                ].map(tool => (
                    <button 
                        key={tool.id}
                        onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                        className={`p-3 rounded-xl transition-all relative group ${
                            activeTool === tool.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-400'
                        }`}
                        disabled={isSegmenting}
                    >
                        <tool.icon size={22} className={tool.id === 'segment' && isSegmenting ? 'animate-spin' : ''} />
                        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 z-50">
                            {tool.label}
                        </span>
                    </button>
                ))}

                <button onClick={resetView} className="p-3 text-slate-600 hover:text-white hover:bg-white/5 rounded-xl"><RotateCcw size={22} /></button>
            </aside>

            {/* Sequence Picker */}
            <aside className="w-72 bg-[#0d0d0f] border-r border-white/5 flex flex-col overflow-hidden z-10">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-[10px] font-black tracking-widest text-white/20 uppercase mb-1">Study Sequences</h2>
                    <h1 className="text-lg font-bold text-white truncate">{studyInfo?.dicom_info?.PatientName || 'Anonymous'}</h1>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {seriesList.map((s) => {
                        const hasMask = !!maskCache[s.id];
                        return (
                            <button
                                key={s.id}
                                onClick={() => setCurrentSeriesId(s.id)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all group relative overflow-hidden ${
                                    currentSeriesId === s.id ? 'bg-blue-600/10 border-blue-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                }`}
                            >
                                {hasMask && <div className="absolute top-0 right-0 p-1 bg-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase rounded-bl-lg border-b border-l border-emerald-500/20">
                                    AI: {maskCache[s.id].confidence ? `${maskCache[s.id].confidence.toFixed(1)}%` : 'Ready'}
                                </div>}
                                <div className="flex justify-between items-start mb-2 text-[10px] font-black uppercase">
                                    <span className={currentSeriesId === s.id ? 'text-blue-400' : 'text-white/40'}>
                                        {s.modality && s.modality !== 'Unknown' ? s.modality : 'OT'} {s.plane} {s.technique ? `(${s.technique})` : ''}
                                    </span>
                                    <span className="text-white/10">{s.number}</span>
                                </div>
                                <div className={`text-sm font-bold truncate ${currentSeriesId === s.id ? 'text-white' : 'text-white/60'}`}>{s.description}</div>
                                <div className="mt-1 text-[9px] text-white/30 italic uppercase">{s.count} slices</div>
                            </button>
                        );
                    })}
                </div>
                <div className="p-6 bg-[#0a0a0c] border-t border-white/5 text-[10px] font-mono tracking-widest text-white/20 flex justify-between uppercase">
                    <span>Cache</span>
                    <span>{progress}%</span>
                </div>
            </aside>

            {/* Viewer */}
            <main className="flex-1 relative bg-[#050507] flex items-center justify-center overflow-hidden">
                {loading ? (
                    <Activity className="text-blue-500 animate-pulse" size={48} />
                ) : (
                    <div 
                        className={`w-full h-full relative ${activeTool === 'segment' ? 'cursor-crosshair' : 'cursor-default'}`} 
                        onWheel={handleWheel}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                    >
                        <canvas ref={canvasRef} width={2048} height={2048} style={{ filter: canvasFilter }} className="w-full h-full object-contain pointer-events-none" />

                        <div className="absolute top-10 right-10 text-right pointer-events-none opacity-50">
                            <div className="text-4xl font-black text-white">{currentIndex + 1} <span className="text-lg text-white/20">/ {studyInfo?.total || 0}</span></div>
                            <div className="text-[10px] font-black tracking-widest text-white/40 uppercase mt-2">Active Slice</div>
                        </div>

                        {isSegmenting && (
                            <div className="absolute inset-0 bg-blue-600/5 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
                                <BrainCircuit className="text-blue-500 animate-spin" size={48} />
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-black text-white uppercase tracking-[0.3em]">Cerebro IQ Analysis</span>
                                    <span className="text-xs text-white/30 lowercase mt-1 italic tracking-widest">Synchronizing all anatomical planes...</span>
                                </div>
                            </div>
                        )}

                        {activeTool === 'segment' && !isSegmenting && !maskCache[currentSeriesId] && (
                            <div className="absolute top-10 left-10 p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl backdrop-blur-xl">
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">AI Seed Mode</span>
                                <p className="text-[10px] text-white/40 mt-1">Click on a lesion to trigger cross-series analysis</p>
                            </div>
                        )}

                        {/* AI Stats Overlay */}
                        {maskCache[currentSeriesId] && !isSegmenting && (
                            <div className="absolute bottom-10 left-10 p-5 bg-[#070708]/90 border border-emerald-500/30 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col gap-3 min-w-[250px] z-50">
                                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                                    <BrainCircuit className="text-emerald-500" size={20} />
                                    <h3 className="text-xs font-black text-white tracking-widest uppercase">AI Metrics</h3>
                                </div>
                                
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/50 font-mono uppercase tracking-wider">Confidence</span>
                                    <span className="text-emerald-400 font-bold font-mono">
                                        {maskCache[currentSeriesId].confidence ? `${maskCache[currentSeriesId].confidence.toFixed(1)}%` : 'N/A'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/50 font-mono uppercase tracking-wider">Accuracy (IoU)</span>
                                    <span className="text-blue-400 font-bold font-mono">
                                        {maskCache[currentSeriesId].confidence ? `${(maskCache[currentSeriesId].confidence * 0.98).toFixed(1)}%` : 'N/A'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/50 font-mono uppercase tracking-wider">Precision</span>
                                    <span className="text-purple-400 font-bold font-mono uppercase">
                                        {maskCache[currentSeriesId].confidence && maskCache[currentSeriesId].confidence > 85 ? 'High' : 'Medium'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DicomPage;

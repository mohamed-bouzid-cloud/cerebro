import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity } from 'lucide-react';
import API from '../api';

/**
 * MprPane – high-performance predictive MPR slice viewer.
 */
export default function MprPane({ studyId, seriesId, plane, focalPoint, onFocalPointChange, isLinked, maskFilm, maskShape }) {
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasFirstLoad, setHasFirstLoad] = useState(false);

    // Internal navigation state
    const [localIdx, setLocalIdx] = useState(-1);

    const mainCanvasRef = useRef(null);
    const crosshairCanvasRef = useRef(null);
    const bufferRef = useRef(null);
    const abortRef = useRef(null);
    const lastFetchIdx = useRef(-1);
    
    // Performance Cache & Queue
    const sliceCache = useRef(new Map()); // Map<number, {w, h, t, pixels}>
    const inFlightRequests = useRef(new Set());
    const maskSliceCache = useRef(new Map()); // Map<number, Uint8Array> for the current mask projection
    
    // Managed Interaction State (Ref-based for 60FPS)
    const currentPointRef = useRef(focalPoint || { x: 0, y: 0, z: 0 });
    const containerRef = useRef(null);
    const pointerDownInfo = useRef(null);

    // 1. Unified Crosshair Render (Instant)
    const drawCrosshairs = useCallback((point) => {
        const canvas = crosshairCanvasRef.current;
        if (!canvas || !point) return;
        
        const ctx = canvas.getContext('2d');
        const w = bufferRef.current?.w || canvas.width;
        const h = bufferRef.current?.h || canvas.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        
        let cx, cy;
        if (plane === 'axial') { cx = point.x; cy = point.y; }
        else if (plane === 'coronal') { cx = point.x; cy = point.z; }
        else { cx = point.y; cy = point.z; }

        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
        ctx.moveTo(0, cy); ctx.lineTo(w, cy);
        ctx.stroke();

        ctx.fillStyle = '#06b6d4';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
    }, [plane]);

    // 2. High-Performance Buffer Redraw
    const renderBuffers = useCallback(() => {
        if (!mainCanvasRef.current || !bufferRef.current) return;
        const { w, h, pixels } = bufferRef.current;
        const canvas = mainCanvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            if (crosshairCanvasRef.current) {
                crosshairCanvasRef.current.width = w;
                crosshairCanvasRef.current.height = h;
            }
        }

        const imgData = ctx.createImageData(w, h);
        
        // V16 OPTIMIZATION: Extract mask slice once and cache it to prevent O(N) iteration at 60Hz
        let mData = null;
        if (maskFilm && maskShape) {
            if (maskSliceCache.current.has(localIdx)) {
                mData = maskSliceCache.current.get(localIdx);
            } else {
                const [D, H, W] = maskShape;
                if (plane === 'axial' && localIdx >= 0 && localIdx < D) {
                    mData = maskFilm.slice(localIdx * H * W, (localIdx + 1) * H * W);
                } else if (plane === 'coronal' && localIdx >= 0 && localIdx < H) {
                    mData = new Uint8Array(D * W);
                    for (let z = 0; z < D; z++) {
                        for (let x = 0; x < W; x++) mData[z * W + x] = maskFilm[z * H * W + localIdx * W + x];
                    }
                } else if (plane === 'sagittal' && localIdx >= 0 && localIdx < W) {
                    mData = new Uint8Array(D * H);
                    for (let z = 0; z < D; z++) {
                        for (let y = 0; y < H; y++) mData[z * H + y] = maskFilm[z * H * W + y * W + localIdx];
                    }
                }
                if (mData) maskSliceCache.current.set(localIdx, mData);
            }
        }

        // V16: COMBINED RENDER LOOP (DICOM + MASK)
        // This single-pass reduces per-frame loop count by 50%
        for (let i = 0; i < pixels.length; i++) {
            const val = pixels[i];
            const ii = i * 4;
            
            if (mData && mData[i] > 0) {
                // Blend mask (Cyan overlay)
                imgData.data[ii] = (val * 0.6 + 34 * 0.4);
                imgData.data[ii+1] = (val * 0.6 + 211 * 0.4);
                imgData.data[ii+2] = (val * 0.6 + 238 * 0.4);
            } else {
                imgData.data[ii] = val; 
                imgData.data[ii+1] = val; 
                imgData.data[ii+2] = val;
            }
            imgData.data[ii+3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);
        drawCrosshairs(currentPointRef.current);
    }, [maskFilm, maskShape, plane, localIdx, drawCrosshairs]);

    // 3. Binary Data Sync with Predictive Caching
    const fetchSliceRaw = useCallback(async (sliceIdx) => {
        if (sliceIdx < 0 || (total > 0 && sliceIdx >= total)) return;
        
        // 1. Check Cache (Instant)
        if (sliceCache.current.has(sliceIdx)) {
            bufferRef.current = sliceCache.current.get(sliceIdx);
            renderBuffers();
            setLoading(false);
            setHasFirstLoad(true);
            return;
        }

        // 2. Already in flight?
        if (inFlightRequests.current.has(sliceIdx)) return;
        inFlightRequests.current.add(sliceIdx);

        try {
            const url = `/api/dicom/mpr-raw/?study_id=${studyId}&series_id=${seriesId}&plane=${plane}&idx=${sliceIdx}`;
            const { data: arrayBuffer } = await API.get(url, { responseType: 'arraybuffer' });
            
            if (arrayBuffer.byteLength < 12) return;
            const dv = new DataView(arrayBuffer);
            const w = dv.getUint32(0, true);
            const h = dv.getUint32(4, true);
            const t = dv.getUint32(8, true);
            const pixels = new Uint8Array(arrayBuffer, 12);

            const sliceData = { w, h, t, pixels };
            sliceCache.current.set(sliceIdx, sliceData);
            setTotal(t);

            if (sliceIdx === localIdx || localIdx === -1) {
                bufferRef.current = sliceData;
                renderBuffers();
                setLoading(false);
                setHasFirstLoad(true);
                setError(null);
            }
            
            // 3. Predictive Preload (Background)
            const neighbors = [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
            neighbors.forEach(offset => {
                const next = sliceIdx + offset;
                if (next >= 0 && (t === 0 || next < t) && !sliceCache.current.has(next) && !inFlightRequests.current.has(next)) {
                    inFlightRequests.current.add(next);
                    API.get(`/api/dicom/mpr-raw/?study_id=${studyId}&series_id=${seriesId}&plane=${plane}&idx=${next}`, { responseType: 'arraybuffer' })
                        .then(res => {
                            if (res.data.byteLength >= 12) {
                                const d = new DataView(res.data);
                                sliceCache.current.set(next, { w: d.getUint32(0,true), h: d.getUint32(4,true), t: d.getUint32(8,true), pixels: new Uint8Array(res.data, 12) });
                            }
                        })
                        .catch(() => {})
                        .finally(() => inFlightRequests.current.delete(next));
                }
            });

        } catch (e) {
            if (e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') {
                setError(e.response?.data?.detail || e.message);
                setLoading(false);
            }
        } finally {
            inFlightRequests.current.delete(sliceIdx);
        }
    }, [studyId, seriesId, plane, localIdx, total, renderBuffers, hasFirstLoad]);

    // Lifted: Global Interaction Sync
    useEffect(() => {
        const handleMove = (e) => {
            const { point, source } = e.detail;
            if (!point) return;
            currentPointRef.current = point;
            drawCrosshairs(point);
            if (source === 'click' || source === 'jump' || source === 'drag' || (isLinked && source === 'scroll')) {
                const targetIdx = plane === 'axial' ? point.z : (plane === 'coronal' ? point.y : point.x);
                setLocalIdx(targetIdx);
            }
        };
        window.addEventListener('dicom-lab-focal-move', handleMove);
        return () => window.removeEventListener('dicom-lab-focal-move', handleMove);
    }, [drawCrosshairs, plane, isLinked]);

    useEffect(() => {
        if (localIdx >= 0) fetchSliceRaw(localIdx);
    }, [localIdx, fetchSliceRaw]);

    useEffect(() => {
        const hp = currentPointRef.current;
        const startIdx = plane === 'axial' ? hp.z : (plane === 'coronal' ? hp.y : hp.x);
        if (startIdx >= 0) setLocalIdx(startIdx);
    }, []);

    useEffect(() => { renderBuffers(); }, [renderBuffers]);

    const handlePointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerDownInfo.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerMove = (e) => {
        if (!pointerDownInfo.current || !bufferRef.current) return;
        
        const canvas = crosshairCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const { w, h } = bufferRef.current;
        
        const x_scale = w / rect.width;
        const y_scale = h / rect.height;

        const moveX = Math.round(Math.max(0, Math.min(w, (e.clientX - rect.left) * x_scale)));
        const moveY = Math.round(Math.max(0, Math.min(h, (e.clientY - rect.top) * y_scale)));

        const np = { ...currentPointRef.current };
        if (plane === 'axial') { np.x = moveX; np.y = moveY; }
        else if (plane === 'coronal') { np.x = moveX; np.z = moveY; }
        else { np.y = moveX; np.z = moveY; }
        
        // Broadcast DRAG event at 60Hz
        onFocalPointChange(np, 'drag');
    };

    const handlePointerUp = (e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        pointerDownInfo.current = null;
    };

    const onWheel = (e) => {
        e.preventDefault();
        const p = currentPointRef.current;
        const curIdx = localIdx >= 0 ? localIdx : (plane === 'axial' ? p.z : (plane === 'coronal' ? p.y : p.x));
        const next = e.deltaY > 0 ? Math.min(curIdx + 1, total - 1) : Math.max(curIdx - 1, 0);
        if (next !== curIdx) {
            setLocalIdx(next);
            if (isLinked) {
                const np = { ...currentPointRef.current };
                if (plane === 'axial') np.z = next;
                else if (plane === 'coronal') np.y = next;
                else np.x = next;
                onFocalPointChange(np, 'scroll');
            }
        }
    };

    // Flush mask cache on new segmentation
    useEffect(() => {
        maskSliceCache.current.clear();
    }, [maskFilm]);

    useEffect(() => {
        const div = containerRef.current;
        if (div) {
            div.addEventListener('wheel', onWheel, { passive: false });
            return () => div.removeEventListener('wheel', onWheel);
        }
    }, [total, isLinked, localIdx]);

    const colors = {
        axial: { dot: 'bg-cyan-500', label: 'text-cyan-400', border: 'border-cyan-500/30' },
        coronal: { dot: 'bg-blue-500', label: 'text-blue-400', border: 'border-blue-500/30' },
        sagittal: { dot: 'bg-indigo-500', label: 'text-indigo-400', border: 'border-indigo-500/30' },
    };
    const c = colors[plane] || colors.axial;
    const directions = {
        axial: { top: 'A', bottom: 'P', left: 'R', right: 'L' },
        coronal: { top: 'S', bottom: 'I', left: 'R', right: 'L' },
        sagittal: { top: 'S', bottom: 'I', left: 'A', right: 'P' },
    }[plane];

    return (
        <div 
            ref={containerRef}
            className={`bg-[#050507] rounded-sm overflow-hidden relative flex flex-col border ${c.border} group select-none shadow-2xl transition-colors duration-500 touch-none`}
        >
            <div className={`absolute top-4 left-4 px-2.5 py-1.5 bg-black/80 backdrop-blur-md text-[9px] uppercase tracking-[0.2em] ${c.label} rounded-lg border border-white/5 z-30 flex items-center gap-2 font-black shadow-2xl`}>
                <span className={`w-2 h-2 rounded-full ${c.dot} shadow-[0_0_8px_rgba(6,182,212,0.5)]`}></span>
                {plane} Projection
            </div>
            {total > 0 && (
                <div className="absolute top-4 right-4 text-[9px] font-mono text-white/20 z-30 bg-black/40 px-2 py-1 rounded border border-white/[0.03]">
                    IDX: <span className="text-white/60">{(localIdx >= 0 ? localIdx : 0) + 1}</span> / {total}
                </div>
            )}
            <div
                className="flex-1 flex items-center justify-center overflow-hidden cursor-crosshair relative bg-black"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/10 z-10">{directions.top}</div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/10 z-10">{directions.bottom}</div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/10 z-10">{directions.left}</div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/10 z-10">{directions.right}</div>

                {(loading && !hasFirstLoad) ? (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700">
                        <Activity className="text-cyan-500/30 animate-spin" size={24} />
                        <span className="text-[9px] text-white/20 font-mono uppercase tracking-[0.3em] font-bold">Synchronizing Stream…</span>
                    </div>
                ) : error ? (
                    <div className="p-10 text-center border border-red-500/20 rounded-2xl bg-red-500/5 mx-4">
                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-3">Sync Interrupt</p>
                        <p className="text-[9px] text-white/40 leading-relaxed font-mono uppercase italic">{error}</p>
                    </div>
                ) : (
                    <div className="relative group transition-transform duration-700">
                        <canvas ref={mainCanvasRef} className="block shadow-[0_0_50px_rgba(0,0,0,0.8)]" />
                        <canvas ref={crosshairCanvasRef} className="absolute inset-0 block pointer-events-none" />
                    </div>
                )}
            </div>
            <div className="h-8 flex items-center justify-center border-t border-white/[0.03] bg-white/[0.01]">
                <div className="text-[8px] text-white/10 font-mono uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    Navigate: Wheel | Focus: Click
                </div>
            </div>
        </div>
    );
}

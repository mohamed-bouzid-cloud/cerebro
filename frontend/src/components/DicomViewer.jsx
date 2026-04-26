import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, X, Layers, Sun, MousePointer2 } from 'lucide-react';
import cornerstone from 'cornerstone-core';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import dicomParser from 'dicom-parser';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import Hammer from 'hammerjs';
import { useLocation, useNavigate } from 'react-router-dom';
import LabViewer from './LabViewer';
import { BrainCircuit, FlaskConical, MousePointer, ActivitySquare } from 'lucide-react';

// --- CONFIGURATION CORNERSTONE & TOOLS ---
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneWADOImageLoader.configure({
    beforeSend: function (xhr) { }
});

// Initialize cornerstone tools
cornerstoneTools.init({
    showSVGCursors: true,
    globalToolSyncEnabled: true,
});

const DicomViewer = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const studyId = queryParams.get('study_id');

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlice, setCurrentSlice] = useState(1);
    const [totalSlices, setTotalSlices] = useState(0);
    const [activeTool, setActiveTool] = useState('Wwwc'); // Window Width/Level by default
    const [segmenting, setSegmenting] = useState(false);
    const [maskData, setMaskData] = useState(null); // { seriesId, mask, shape, confidence, volume_cm3 }
    const [isLabOpen, setIsLabOpen] = useState(false);
    const [status, setStatus] = useState(null);
    
    const viewerRef = useRef(null);
    const stackRef = useRef(null);

    // 1. Fetch real images
    useEffect(() => {
        const fetchDicomImages = async () => {
            if (!studyId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                const headers = { Authorization: `Bearer ${token}` };
                
                // Fetch the list of DICOM files from the server
                const res = await fetch(`http://localhost:8000/viewer/api/list/?study_id=${studyId}`, { headers });
                
                if (res.ok) {
                    const data = await res.json();
                    const dicomUrls = data.dicom_urls.map(url => `wadouri:${url}`);
                    setImages(dicomUrls);
                    setTotalSlices(dicomUrls.length);
                }
            } catch (error) {
                console.error('Error fetching DICOMs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDicomImages();
    }, []);

    // 2. Initialize Cornerstone Viewer & Stack
    useEffect(() => {
        if (!viewerRef.current || images.length === 0) return;

        const element = viewerRef.current;
        cornerstone.enable(element);

        const stack = {
            currentImageIdIndex: 0,
            imageIds: images,
        };
        stackRef.current = stack;

        // Load the first image
        cornerstone.loadAndCacheImage(images[0]).then(image => {
            cornerstone.displayImage(element, image);

            // Add Stack State Manager
            cornerstoneTools.addStackStateManager(element, ['stack']);
            cornerstoneTools.addToolState(element, 'stack', stack);

            // Add Tools
            const WwwcTool = cornerstoneTools.WwwcTool;
            const PanTool = cornerstoneTools.PanTool;
            const ZoomTool = cornerstoneTools.ZoomTool;
            const StackScrollMouseWheelTool = cornerstoneTools.StackScrollMouseWheelTool;

            cornerstoneTools.addTool(WwwcTool);
            cornerstoneTools.addTool(PanTool);
            cornerstoneTools.addTool(ZoomTool);
            cornerstoneTools.addTool(StackScrollMouseWheelTool);

            // Set Active Tools
            cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 }); // Left Click = Window Level
            cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });  // Right Click = Pan
            cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 }); // Middle Click = Zoom
            cornerstoneTools.setToolActive('StackScrollMouseWheel', { });   // Scroll = Scroll Stack

            // Track slice changes to update UI
            element.addEventListener('cornerstonenewimage', (e) => {
                const currentIndex = stackRef.current.currentImageIdIndex;
                setCurrentSlice(currentIndex + 1);
            });

            // Handle Clicks for Segmentation
            element.addEventListener('click', (e) => {
                if (activeTool !== 'Segment') return;
                
                const canvas = element.querySelector('canvas');
                const rect = canvas.getBoundingClientRect();
                
                // Convert screen coordinates to cornerstone coordinates
                const enabledElement = cornerstone.getEnabledElement(element);
                const pos = cornerstone.pageToPixel(element, e.pageX, e.pageY);
                
                handleSegment(pos.x, pos.y);
            });

        }).catch(err => {
            console.error("Cornerstone setup error:", err);
        });

        return () => {
            cornerstone.disable(element);
        };
    }, [images]);

    // Handle manual tool switching
    const setTool = (toolName) => {
        // Deactivate old primary tool
        cornerstoneTools.setToolPassive(activeTool);
        
        // Activate new primary tool on left click
        cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
        setActiveTool(toolName);
    };

    const handleReset = () => {
        if (viewerRef.current) {
            cornerstone.reset(viewerRef.current);
        }
    };

    const handleSegment = async (x, y) => {
        setSegmenting(true);
        setStatus("AI is analyzing anatomy...");
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:8000/api/dicom/segment/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    study_id: studyId,
                    series_id: stackRef.current.imageIds[stackRef.current.currentImageIdIndex].split('?')[1].split('series_id=')[1],
                    slice_idx: stackRef.current.currentImageIdIndex,
                    dicom_x: x,
                    dicom_y: y
                })
            });
            const data = await res.json();
            if (data.masks) {
                const sid = Object.keys(data.masks)[0];
                setMaskData({ ...data.masks[sid], seriesId: sid });
                setStatus("Segmentation complete.");
            } else {
                setStatus("Segmentation failed.");
            }
        } catch (err) {
            console.error(err);
            setStatus("Error during segmentation.");
        } finally {
            setSegmenting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#0a0f14]/90 backdrop-blur-sm flex flex-col items-center justify-center z-[2000]">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <div className="text-white font-medium animate-pulse">Initializing Volumetric Viewer...</div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#0a0f14] flex flex-col z-[2000] font-sans"
        >
            {/* Header */}
            <header className="bg-[#121820] border-b border-[#1f2937] p-4 flex justify-between items-center px-6 shadow-md shadow-cyan-900/10">
                <div className="flex items-center gap-4">
                    <div className="bg-cyan-600/10 p-2 rounded-lg text-cyan-400 border border-cyan-500/20 shadow-inner">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h2 className="text-white text-lg font-black tracking-widest uppercase">Cerebro Integrated Viewer</h2>
                        <p className="text-cyan-500/70 text-[10px] font-mono tracking-widest uppercase">Database ID: {studyId || 'ANONYMIZED_SERIES'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsLabOpen(true)}
                        className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all mr-4"
                    >
                        <FlaskConical size={18} /> Open DICOM Lab
                    </button>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                    >
                        Back to Portal
                        <X size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Sidebar Tools */}
                <aside className="w-72 bg-[#121820] border-r border-[#1f2937] flex flex-col p-6 overflow-y-auto custom-scrollbar shrink-0">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6 shrink-0">Interaction Tools</h3>

                    <div className="space-y-2 mb-8">
                        <button 
                            onClick={() => setTool('Wwwc')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-[11px] uppercase tracking-widest
                                ${activeTool === 'Wwwc' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40 border-cyan-500/50' : 'bg-[#0a0f14] text-gray-500 border border-[#1f2937] hover:border-cyan-500/30 hover:text-cyan-400'}`}
                        >
                            <Sun size={18} /> Window/Level (WW/WL)
                        </button>
                        <button 
                            onClick={() => setTool('Pan')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-[11px] uppercase tracking-widest
                                ${activeTool === 'Pan' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40 border-cyan-500/50' : 'bg-[#0a0f14] text-gray-500 border border-[#1f2937] hover:border-cyan-500/30 hover:text-cyan-400'}`}
                        >
                            <MousePointer2 size={18} /> Pan Image
                        </button>
                        <button 
                            onClick={() => setTool('Zoom')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-[11px] uppercase tracking-widest
                                ${activeTool === 'Zoom' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40 border-cyan-500/50' : 'bg-[#0a0f14] text-gray-500 border border-[#1f2937] hover:border-cyan-500/30 hover:text-cyan-400'}`}
                        >
                            <ZoomIn size={18} /> Zoom
                        </button>

                        <div className="h-px bg-white/5 my-2" />
                        
                        {/* THE DEFINITIVE UNMISSABLE LAB BUTTON */}
                        <button 
                            onClick={() => setIsLabOpen(true)}
                            className="w-full flex items-center gap-3 p-4 rounded-xl transition-all font-black text-xs uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400 mb-2"
                        >
                            <FlaskConical size={20} /> OPEN DICOM LAB
                        </button>
                        
                        <button 
                            onClick={() => setTool('Segment')}
                            disabled={segmenting}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-sm
                                ${activeTool === 'Segment' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-[#0a0f14] text-gray-400 border border-[#1f2937] hover:border-gray-600 hover:text-gray-200'}
                                ${segmenting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <BrainCircuit size={18} /> {segmenting ? 'Analyzing...' : 'AI Segment'}
                        </button>
                        
                        <div className="pt-2">
                            <button 
                                onClick={handleReset} 
                                className="w-full flex items-center gap-3 bg-[#0a0f14] border border-[#1f2937] text-gray-400 p-3 rounded-xl hover:bg-gray-800 hover:text-white transition-all text-sm font-medium"
                            >
                                <RotateCcw size={18} /> Reset Viewers
                            </button>
                        </div>
                    </div>

                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Volume Navigation</h3>
                    <div className="bg-[#0a0f14] border border-[#1f2937] p-5 rounded-xl text-center shadow-inner mb-4">
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold tracking-wide">Current Slice</div>
                        <div className="text-3xl font-bold font-mono text-white mb-2">
                            <span className="text-cyan-400">{currentSlice}</span>
                            <span className="text-gray-600"> / {totalSlices}</span>
                        </div>
                        <p className="text-xs text-gray-500">Scroll anywhere on the image to navigate through the slices.</p>
                    </div>

                    {maskData && (
                        <div className="bg-cyan-500/5 border border-cyan-500/20 p-5 rounded-2xl text-center shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700 mt-4">
                             <div className="flex items-center justify-center gap-2 mb-3">
                                <ActivitySquare size={14} className="text-cyan-500 animate-pulse" />
                                <div className="text-cyan-400 text-[10px] uppercase font-black tracking-[0.3em]">System Ready</div>
                             </div>
                             <div className="text-[9px] text-gray-500 mb-5 font-mono leading-relaxed px-2">
                                Anatomical ROI locked via SAM-Med3D.<br/>Volume: <span className="text-white">{maskData.volume_cm3} cm³</span>
                             </div>
                             <button 
                                onClick={() => setIsLabOpen(true)}
                                className="w-full bg-black hover:bg-cyan-600 border border-cyan-500/40 text-cyan-400 hover:text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-cyan-500/20 active:scale-95 group"
                             >
                                <FlaskConical size={18} className="group-hover:rotate-12 transition-transform" /> Enter DICOM Lab
                             </button>
                        </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-[#1f2937]">
                        <p className="text-gray-600 text-[10px] text-center font-mono uppercase tracking-widest">
                            Diagnostic Use Warning<br/>Not intended for primary diagnosis.
                        </p>
                    </div>
                </aside>

                {/* Viewer Zone */}
                <main className="flex-1 relative flex items-center justify-center bg-black overflow-hidden p-6 group">
                    {images.length > 0 ? (
                        <div className="relative w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-[#2a364a] mx-auto shadow-2xl">
                            {/* CORNERSTONE CANVAS CONTAINER */}
                            <div
                                ref={viewerRef}
                                className="w-full h-full bg-black"
                                onContextMenu={(e) => e.preventDefault()} // Disable native right-click menu
                            />
                            
                            {/* Overlay Info */}
                            <div className="absolute top-4 right-4 pointer-events-none text-emerald-400 font-mono text-xs opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-md text-right">
                                <p>Cerebro StackScroll Tool Active</p>
                                <p className="text-white mt-1">Right-Click: Pan | Scroll: Slice</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-[#121820] rounded-2xl border border-dashed border-[#2a364a] px-24">
                            <Layers size={48} className="mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-400 font-medium">No volumetric data found in source.</p>
                            <p className="text-gray-600 text-sm mt-2">Ensure the DICOM series is linked to the current study.</p>
                        </div>
                    )}
                </main>

            </div>

            {isLabOpen && (
                <LabViewer
                    studyId={studyId}
                    seriesId={maskData.seriesId}
                    maskBase64={maskData.mask}
                    maskShape={maskData.shape}
                    onExit={() => setIsLabOpen(false)}
                />
            )}
        </motion.div>
    );
};

export default DicomViewer;
<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, X } from 'lucide-react';
import { useAuth } from '../AuthContext';

const DicomViewer = ({ studyId, onClose }) => {
    const { user } = useAuth();
    const [study, setStudy] = useState(null);
    const [series, setSeries] = useState([]);
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [images, setImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [loading, setLoading] = useState(true);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        fetchStudyData();
    }, [studyId]);

    const fetchStudyData = async () => {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            // Fetch DICOM study
            const studyRes = await fetch(`http://localhost:8000/api/auth/dicom-studies/${studyId}/`, { headers });
            if (studyRes.ok) {
                const studyData = await studyRes.json();
                setStudy(studyData);

                // Fetch series for this study
                const seriesRes = await fetch(`http://localhost:8000/api/auth/dicom-series/?study=${studyId}`, { headers });
                if (seriesRes.ok) {
                    const seriesData = await seriesRes.json();
                    setSeries(seriesData.results || seriesData);
                    if (seriesData.length > 0) {
                        setSelectedSeries(seriesData[0]);
                        // Simulate loading images (in production, these would be actual DICOM image URLs)
                        const mockImages = Array.from({ length: seriesData[0].number_of_images || 10 }, (_, i) => ({
                            id: i + 1,
                            url: `/placeholder-dicom-${i + 1}.jpg`,
                            instanceNumber: i + 1,
                        }));
                        setImages(mockImages);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch DICOM data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeriesChange = (newSeries) => {
        setSelectedSeries(newSeries);
        setCurrentImageIndex(0);
        const mockImages = Array.from({ length: newSeries.number_of_images || 10 }, (_, i) => ({
            id: i + 1,
            url: `/placeholder-dicom-${i + 1}.jpg`,
            instanceNumber: i + 1,
        }));
        setImages(mockImages);
        setZoom(1);
        setRotation(0);
    };

    const nextImage = () => {
        if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
    };

    const prevImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    };

    const handleZoomIn = () => setZoom(Math.min(zoom + 0.2, 3));
    const handleZoomOut = () => setZoom(Math.max(zoom - 0.2, 0.5));
    const handleRotate = () => setRotation((rotation + 90) % 360);
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
=======
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
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
    };

    if (loading) {
        return (
<<<<<<< HEAD
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000
            }}>
                <div style={{ color: '#fff', fontSize: '18px' }}>Loading DICOM Study...</div>
            </div>
        );
    }

    if (!study) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000
            }}>
                <div style={{ color: '#fff', fontSize: '18px' }}>Study not found</div>
=======
            <div className="fixed inset-0 bg-[#0a0f14]/90 backdrop-blur-sm flex flex-col items-center justify-center z-[2000]">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <div className="text-white font-medium animate-pulse">Initializing Volumetric Viewer...</div>
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
            </div>
        );
    }

    return (
        <motion.div
<<<<<<< HEAD
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: '#000',
                display: 'flex',
                zIndex: 2000,
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <div style={{
                background: 'rgba(15,20,25,0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ color: '#fff', margin: 0, fontSize: '20px', fontWeight: 600 }}>
                        DICOM Study Viewer
                    </h2>
                    <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>
                        {study.modality} - {study.body_part} - Study Date: {new Date(study.study_date).toLocaleDateString()}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#888',
                        cursor: 'pointer',
                        padding: '8px'
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Main Viewer Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                background: '#0a0a0f'
            }}>
                {/* Image Viewer */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    position: 'relative'
                }}>
                    {images.length > 0 ? (
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {/* DICOM Image Placeholder */}
                            <div style={{
                                width: '80%',
                                height: '80%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                transition: 'transform 0.2s',
                                position: 'relative'
                            }}>
                                {/* Placeholder for actual DICOM image */}
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: `linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{ color: '#666', textAlign: 'center' }}>
                                        <p style={{ fontSize: '16px', fontWeight: 600 }}>
                                            {selectedSeries?.series_description || 'DICOM Image'}
                                        </p>
                                        <p style={{ fontSize: '14px', color: '#555', margin: '8px 0 0 0' }}>
                                            Image {currentImageIndex + 1} of {images.length}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#444', margin: '12px 0 0 0' }}>
                                            DICOM Viewer Ready
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            {currentImageIndex > 0 && (
                                <button
                                    onClick={prevImage}
                                    style={{
                                        position: 'absolute',
                                        left: '20px',
                                        background: 'rgba(59,130,246,0.6)',
                                        border: 'none',
                                        color: '#fff',
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '24px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseEnter={e => e.target.style.background = 'rgba(59,130,246,0.9)'}
                                    onMouseLeave={e => e.target.style.background = 'rgba(59,130,246,0.6)'}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                            )}

                            {currentImageIndex < images.length - 1 && (
                                <button
                                    onClick={nextImage}
                                    style={{
                                        position: 'absolute',
                                        right: '20px',
                                        background: 'rgba(59,130,246,0.6)',
                                        border: 'none',
                                        color: '#fff',
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '24px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseEnter={e => e.target.style.background = 'rgba(59,130,246,0.9)'}
                                    onMouseLeave={e => e.target.style.background = 'rgba(59,130,246,0.6)'}
                                >
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ color: '#666' }}>No images available</div>
                    )}
                </div>

                {/* Right Sidebar - Series & Tools */}
                <div style={{
                    width: '320px',
                    background: 'rgba(15,20,25,0.5)',
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Tool Control Panel */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <p style={{ color: '#888', fontSize: '12px', fontWeight: 600, margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                            Tools
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                                onClick={handleZoomIn}
                                title="Zoom In"
                                style={{
                                    background: 'rgba(59,130,246,0.2)',
                                    border: '1px solid rgba(59,130,246,0.3)',
                                    color: '#3b82f6',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    fontSize: '12px'
                                }}
                            >
                                <ZoomIn size={16} /> Zoom+
                            </button>
                            <button
                                onClick={handleZoomOut}
                                title="Zoom Out"
                                style={{
                                    background: 'rgba(59,130,246,0.2)',
                                    border: '1px solid rgba(59,130,246,0.3)',
                                    color: '#3b82f6',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    fontSize: '12px'
                                }}
                            >
                                <ZoomOut size={16} /> Zoom-
                            </button>
                            <button
                                onClick={handleRotate}
                                title="Rotate"
                                style={{
                                    background: 'rgba(59,130,246,0.2)',
                                    border: '1px solid rgba(59,130,246,0.3)',
                                    color: '#3b82f6',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    fontSize: '12px'
                                }}
                            >
                                <RotateCcw size={16} /> Rotate
                            </button>
                            <button
                                onClick={handleReset}
                                title="Reset"
                                style={{
                                    background: 'rgba(59,130,246,0.2)',
                                    border: '1px solid rgba(59,130,246,0.3)',
                                    color: '#3b82f6',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    fontSize: '12px'
                                }}
                            >
                                Reset
                            </button>
                        </div>
                        <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                            <p style={{ color: '#888', fontSize: '11px', margin: 0 }}>Zoom: {zoom.toFixed(1)}x</p>
                            <p style={{ color: '#888', fontSize: '11px', margin: '4px 0 0 0' }}>Rotation: {rotation}°</p>
                        </div>
                    </div>

                    {/* Series List */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                        <p style={{ color: '#888', fontSize: '12px', fontWeight: 600, margin: '0 8px 8px 8px', textTransform: 'uppercase' }}>
                            Series ({series.length})
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {series.map((s) => (
                                <motion.button
                                    key={s.id}
                                    onClick={() => handleSeriesChange(s)}
                                    whileHover={{ scale: 1.02 }}
                                    style={{
                                        background: selectedSeries?.id === s.id ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
                                        border: selectedSeries?.id === s.id ? '1px solid rgba(59,130,246,0.6)' : '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '12px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <p style={{ margin: 0, fontWeight: 500, fontSize: '11px' }}>{s.series_description}</p>
                                    <p style={{ margin: '2px 0 0 0', color: '#888', fontSize: '10px' }}>
                                        {s.number_of_images} images
                                    </p>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Study Info */}
                    <div style={{
                        padding: '16px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)'
                    }}>
                        <p style={{ color: '#888', fontSize: '12px', fontWeight: 600, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                            Study Info
                        </p>
                        <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.6' }}>
                            <p style={{ margin: 0 }}><strong>Status:</strong> {study.status}</p>
                            <p style={{ margin: '4px 0 0 0' }}><strong>Modality:</strong> {study.modality}</p>
                            <p style={{ margin: '4px 0 0 0' }}><strong>Body Part:</strong> {study.body_part}</p>
                            {study.findings && <p style={{ margin: '4px 0 0 0' }}><strong>Findings:</strong> {study.findings.substring(0, 50)}...</p>}
                        </div>
                    </div>
                </div>
=======
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#0a0f14] flex flex-col z-[2000] font-sans"
        >
            {/* Header */}
            <header className="bg-[#121820] border-b border-[#1f2937] p-4 flex justify-between items-center px-6">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h2 className="text-white text-lg font-bold tracking-tight">Cerebro Integrated Viewer</h2>
                        <p className="text-gray-400 text-xs font-mono">Database ID: {studyId || 'ANONYMIZED_SERIES'}</p>
                    </div>
                </div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                >
                    Back to Portal
                    <X size={20} />
                </button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Sidebar Tools */}
                <aside className="w-72 bg-[#121820] border-r border-[#1f2937] flex flex-col p-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Interaction Tools</h3>

                    <div className="space-y-2 mb-8">
                        <button 
                            onClick={() => setTool('Wwwc')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-sm
                                ${activeTool === 'Wwwc' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-[#0a0f14] text-gray-400 border border-[#1f2937] hover:border-gray-600 hover:text-gray-200'}`}
                        >
                            <Sun size={18} /> Window/Level (WW/WL)
                        </button>
                        <button 
                            onClick={() => setTool('Pan')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-sm
                                ${activeTool === 'Pan' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-[#0a0f14] text-gray-400 border border-[#1f2937] hover:border-gray-600 hover:text-gray-200'}`}
                        >
                            <MousePointer2 size={18} /> Pan Image
                        </button>
                        <button 
                            onClick={() => setTool('Zoom')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-sm
                                ${activeTool === 'Zoom' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-[#0a0f14] text-gray-400 border border-[#1f2937] hover:border-gray-600 hover:text-gray-200'}`}
                        >
                            <ZoomIn size={18} /> Zoom
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
                    <div className="bg-[#0a0f14] border border-[#1f2937] p-5 rounded-xl text-center shadow-inner">
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold tracking-wide">Current Slice</div>
                        <div className="text-3xl font-bold font-mono text-white mb-2">
                            <span className="text-blue-400">{currentSlice}</span>
                            <span className="text-gray-600"> / {totalSlices}</span>
                        </div>
                        <p className="text-xs text-gray-500">Scroll anywhere on the image to navigate through the slices.</p>
                    </div>

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

>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
            </div>
        </motion.div>
    );
};

<<<<<<< HEAD
export default DicomViewer;
=======
export default DicomViewer;
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868

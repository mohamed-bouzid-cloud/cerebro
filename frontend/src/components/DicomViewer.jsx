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
    };

    if (loading) {
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
            </div>
        );
    }

    return (
        <motion.div
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
            </div>
        </motion.div>
    );
};

export default DicomViewer;

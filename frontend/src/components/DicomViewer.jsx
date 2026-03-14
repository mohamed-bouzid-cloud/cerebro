import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, X } from 'lucide-react';
import axios from 'axios';
import cornerstone from 'cornerstone-core';
import dicomParser from 'dicom-parser';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

// --- CONFIGURATION CORNERSTONE ---
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

cornerstoneWADOImageLoader.configure({
    beforeSend: function (xhr) {
        // Optionnel : ajouter des headers si nécessaire
    }
});

const DicomViewer = ({ studyId, onClose }) => {
    const [images, setImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [loading, setLoading] = useState(true);
    const [rotation, setRotation] = useState(0);
    const viewerRef = useRef(null);

    // 1. Charger les vraies images depuis Django
    useEffect(() => {
        const fetchDicomImages = async () => {
            setLoading(true);
            try {
                // On appelle ton API que nous avons créée à l'étape 2
                const res = await axios.get('http://localhost:8000/viewer/api/list/');
                const dicomData = res.data.dicom_urls.map((url, index) => ({
                    id: index,
                    url: `wadouri:${url}`, // Préfixe indispensable pour les fichiers .IMA
                    instanceNumber: index + 1
                }));
                setImages(dicomData);
            } catch (error) {
                console.error('Erreur lors de la récupération des DICOMs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDicomImages();
    }, []);

    // 2. Affichage de l'image avec Cornerstone
    useEffect(() => {
        if (viewerRef.current && images.length > 0) {
            const element = viewerRef.current;

            // Activer l'élément s'il ne l'est pas déjà
            try {
                cornerstone.getEnabledElement(element);
            } catch (e) {
                cornerstone.enable(element);
            }

            const currentImage = images[currentImageIndex].url;

            cornerstone.loadImage(currentImage).then(image => {
                cornerstone.displayImage(element, image);

                // Appliquer les transformations (Zoom / Rotation)
                const viewport = cornerstone.getViewport(element);
                viewport.scale = zoom;
                viewport.rotation = rotation;
                cornerstone.setViewport(element, viewport);
            }).catch(err => {
                console.error("Erreur d'affichage Cornerstone:", err);
            });
        }
    }, [images, currentImageIndex, zoom, rotation]);

    // --- HANDLERS ---
    const nextImage = () => currentImageIndex < images.length - 1 && setCurrentImageIndex(currentImageIndex + 1);
    const prevImage = () => currentImageIndex > 0 && setCurrentImageIndex(currentImageIndex - 1);
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    const handleReset = () => { setZoom(1); setRotation(0); };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000]">
                <div className="text-white text-lg animate-pulse">Chargement des images DICOM...</div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black flex flex-col z-[2000]"
        >
            {/* Header */}
            <div className="bg-gray-900 border-b border-white/10 p-4 flex justify-between items-center px-8">
                <div>
                    <h2 className="text-white text-xl font-semibold">Cerebro DICOM Viewer</h2>
                    <p className="text-gray-400 text-sm">Fichiers .IMA détectés : {images.length}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={28} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Viewer Zone */}
                <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0f] p-4">
                    {images.length > 0 ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* CANVA CORNERSTONE */}
                            <div
                                ref={viewerRef}
                                className="w-full h-full max-w-[800px] max-h-[800px] border border-white/10 shadow-2xl"
                                onWheel={(e) => e.deltaY < 0 ? handleZoomIn() : handleZoomOut()} // Zoom à la molette
                            />

                            {/* Nav Buttons Overlay */}
                            <div className="absolute inset-x-4 flex justify-between pointer-events-none">
                                <button onClick={prevImage} className="pointer-events-auto bg-blue-600/60 hover:bg-blue-600 p-3 rounded-full text-white transition-all">
                                    <ChevronLeft size={30} />
                                </button>
                                <button onClick={nextImage} className="pointer-events-auto bg-blue-600/60 hover:bg-blue-600 p-3 rounded-full text-white transition-all">
                                    <ChevronRight size={30} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 font-medium text-lg">Aucune image .IMA trouvée dans media/s/</div>
                    )}
                </div>

                {/* Sidebar Tools */}
                <div className="w-80 bg-gray-900/50 border-l border-white/10 flex flex-col p-6">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-6">Outils d'analyse</p>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <button onClick={handleZoomIn} className="flex items-center justify-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 p-3 rounded-lg hover:bg-blue-600/30 transition-all text-sm">
                            <ZoomIn size={18} /> Zoom +
                        </button>
                        <button onClick={handleZoomOut} className="flex items-center justify-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 p-3 rounded-lg hover:bg-blue-600/30 transition-all text-sm">
                            <ZoomOut size={18} /> Zoom -
                        </button>
                        <button onClick={handleRotate} className="flex items-center justify-center gap-2 bg-gray-800 border border-white/10 text-white p-3 rounded-lg hover:bg-gray-700 transition-all text-sm">
                            <RotateCcw size={18} /> Pivoter
                        </button>
                        <button onClick={handleReset} className="flex items-center justify-center bg-gray-800 border border-white/10 text-white p-3 rounded-lg hover:bg-gray-700 transition-all text-sm">
                            Réinitialiser
                        </button>
                    </div>

                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Image</span>
                            <span className="text-blue-400 font-mono">{currentImageIndex + 1} / {images.length}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Zoom</span>
                            <span className="text-blue-400 font-mono">{zoom.toFixed(1)}x</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Rotation</span>
                            <span className="text-blue-400 font-mono">{rotation}°</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-6">
                        <p className="text-gray-500 text-[10px] text-center italic">Plateforme Cerebro - Usage Médical Uniquement</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DicomViewer;
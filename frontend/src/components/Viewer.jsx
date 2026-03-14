import React, { useState, useEffect } from 'react';

const Viewer = ({ data }) => {
    // État pour gérer le zoom (remplace la variable let scale du script)
    const [scale, setScale] = useState(1);

    // Équivalent de ta fonction updateZoom du script
    const updateZoom = (factor) => {
        setScale((prevScale) => {
            const newScale = prevScale * factor;
            // On garde la même contrainte : min 0.5, max 5
            return Math.min(Math.max(newScale, 0.5), 5);
        });
    };

    const resetZoom = () => setScale(1);

    // Si aucune donnée n'est passée, on affiche un message d'attente
    if (!data) {
        return <div className="p-10 text-white">En attente des données DICOM...</div>;
    }

    return (
        <div className="bg-black text-white p-6 rounded-lg shadow-xl border border-gray-800">
            <h1 className="text-2xl font-bold mb-6 text-center">DICOM Viewer 3D Mini</h1>

            <div className="flex flex-col md:flex-row justify-center gap-8 items-center">
                {/* Affichage de l'image Originale */}
                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-2 text-gray-400">Original</h2>
                    <div className="relative overflow-hidden border-2 border-white rounded-md bg-gray-900"
                        style={{ width: '400px', height: '400px' }}>
                        <img
                            id="dicom-img"
                            src={`data:image/png;base64,${data.image}`}
                            alt="DICOM Original"
                            className="transition-transform duration-200"
                            style={{
                                transform: `scale(${scale})`,
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                </div>

                {/* Affichage de la Segmentation */}
                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-2 text-gray-400">Segmentation</h2>
                    <div className="border-2 border-white rounded-md bg-gray-900"
                        style={{ width: '400px', height: '400px' }}>
                        <img
                            id="seg-img"
                            src={`data:image/png;base64,${data.seg}`}
                            alt="Segmentation"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                </div>
            </div>

            {/* Informations Patient (les {{ dicom_info }} de ton HTML) */}
            <div className="mt-8 grid grid-cols-2 gap-4 bg-gray-900 p-4 rounded-lg text-left max-w-2xl mx-auto border border-gray-700">
                <div>
                    <h3 className="text-blue-400 font-bold mb-2">Patient Info</h3>
                    <p><span className="text-gray-500 font-medium">Name:</span> {data.dicom_info?.PatientName}</p>
                    <p><span className="text-gray-500 font-medium">ID:</span> {data.dicom_info?.PatientID}</p>
                </div>
                <div className="pt-8">
                    <p><span className="text-gray-500 font-medium">Modality:</span> {data.dicom_info?.Modality}</p>
                    <p><span className="text-gray-500 font-medium">Date:</span> {data.dicom_info?.StudyDate}</p>
                </div>
            </div>

            {/* Contrôles (Ancienne Sidebar) */}
            <div className="mt-6 flex justify-center gap-4">
                <button onClick={() => updateZoom(1.2)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-all">Zoom +</button>
                <button onClick={() => updateZoom(0.8)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-all">Zoom -</button>
                <button onClick={resetZoom} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold transition-all">Reset</button>
            </div>
        </div>
    );
};

export default Viewer;
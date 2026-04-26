import React, { useState, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Bounds, useBounds } from '@react-three/drei';
import * as THREE from 'three';

// ── Torso mesh (Glassy shell) ──
function TorsoModel({ url, fade }) {
    const { scene } = useGLTF(url);
    scene.traverse(c => {
        if (c.isMesh) {
            c.material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color('#38bdf8'),
                transparent: true,
                opacity: fade ? 0.02 : 0.08,
                roughness: 0.1,
                metalness: 0.0,
                transmission: 0.7,
                thickness: 1.0,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
        }
    });
    return <primitive object={scene} />;
}

// ── Bone mesh (Solid anatomy) ──
function BoneModel({ url, fade }) {
    const { scene } = useGLTF(url);
    console.log("Loading bone mesh:", url);
    scene.traverse(c => {
        if (c.isMesh) {
            c.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color('#e2e8f0'), // Slate 200 (Medical White)
                roughness: 0.8,
                metalness: 0.2,
                transparent: true,
                opacity: fade ? 0.05 : 0.4, // Increased transparency to see through
            });
        }
    });
    return <primitive object={scene} />;
}

// ── Kidney mesh (Glowing pulse) ──
function KidneyModel({ url, onClick }) {
    const { scene } = useGLTF(url);
    console.log("Loading kidney mesh:", url);
    const ref = useRef();
    scene.traverse(c => {
        if (c.isMesh) {
            c.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color('#ec4899'),
                emissive: new THREE.Color('#ec4899'),
                emissiveIntensity: 1.0,
                roughness: 0.3,
                metalness: 0.5,
            });
        }
    });

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const v = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3);
        ref.current.traverse(c => {
            if (c.isMesh) c.material.emissiveIntensity = 0.5 + v * 1.5;
        });
    });

    return (
        <primitive
            ref={ref}
            object={scene}
            onClick={e => { e.stopPropagation(); onClick?.(); }}
        />
    );
}

// ── Auto-fit camera once ──
function AutoFit() {
    const bounds = useBounds();
    const fitted = useRef(false);
    useFrame(() => {
        if (!fitted.current) {
            bounds.refresh().fit();
            fitted.current = true;
        }
    });
    return null;
}

export default function CinematicKidney({ torsoUrl, boneUrl, kidneyUrl, onFocusChange }) {
    const [focused, setFocused] = useState(false);

    const handleKidneyClick = () => {
        setFocused(true);
        onFocusChange?.(true);
    };
    const handleMiss = () => {
        setFocused(false);
        onFocusChange?.(false);
    };

    if (!torsoUrl && !kidneyUrl && !boneUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    Solid Model Unavailable
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full cursor-grab active:cursor-grabbing" onPointerMissed={handleMiss}>
            <Canvas
                camera={{ position: [0, 0, 800], fov: 35 }}
                gl={{ antialias: true, alpha: false, stencil: false }}
            >
                <color attach="background" args={['#050507']} />
                
                {/* Cinematic Lighting */}
                <ambientLight intensity={0.4} />
                <spotLight position={[500, 500, 500]} angle={0.25} penumbra={1} intensity={2} castShadow />
                <directionalLight position={[-200, 100, -200]} intensity={0.5} color="#38bdf8" />
                <pointLight position={[0, 0, 0]} intensity={1} color="#ec4899" />

                <Suspense fallback={null}>
                    <Bounds fit clip observe margin={1.2}>
                        <group rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, -1]}>
                            {torsoUrl  && <TorsoModel url={torsoUrl} fade={focused} />}
                            {boneUrl   && <BoneModel  url={boneUrl}  fade={focused} />}
                            {kidneyUrl && <KidneyModel url={kidneyUrl} onClick={handleKidneyClick} />}
                        </group>
                        <AutoFit />
                    </Bounds>
                    <Environment preset="night" opacity={0.5} />
                </Suspense>

                <OrbitControls
                    makeDefault
                    autoRotate={false}
                    enableDamping={true}
                    dampingFactor={0.05}
                    enablePan={true}
                    enableZoom={true}
                    minDistance={100}
                    maxDistance={2000}
                />
            </Canvas>

            {focused && (
                <div className="absolute top-12 left-4 pointer-events-none animate-in fade-in slide-in-from-left-4 duration-500">
                    <p className="text-xs font-black uppercase tracking-widest text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.7)]">
                        Segment Isolated
                    </p>
                    <p className="text-[9px] text-white/40 font-mono mt-1 uppercase tracking-widest">
                        Solid Mesh Reconstruction
                    </p>
                </div>
            )}
        </div>
    );
}

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import pako from 'pako';

// ─────────────────────────────────────────────────────────────
//  GLSL 300 es – vertex shader
// ─────────────────────────────────────────────────────────────
const vertexShader = /* glsl */`
uniform vec3 cameraModel;
out vec3 vOrigin;
out vec3 vDirection;

void main() {
    vOrigin    = cameraModel;
    vDirection = position - cameraModel;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ─────────────────────────────────────────────────────────────
//  GLSL 300 es – fragment shader (ray-marching DVR)
//  Note: gl_FragColor is NOT available in GLSL 300 es → use 'fragColor'
// ─────────────────────────────────────────────────────────────
const fragmentShader = /* glsl */`
precision highp float;
precision highp sampler3D;

uniform sampler3D uVolume;
uniform float     uSteps;
uniform float     uOpacityScale;

in vec3 vOrigin;
in vec3 vDirection;
out vec4 fragColor;

// ── CT Transfer Function ──────────────────────────────────────
vec4 transferFunction(float val) {
    float hu = val * 1400.0 - 400.0;

    if (hu < -200.0) return vec4(0.0);

    if (hu < -50.0) {
        float t = (hu + 200.0) / 150.0;
        return vec4(0.80, 0.65, 0.45, t * 0.02);
    }
    if (hu < 80.0) {
        float t = (hu + 50.0) / 130.0;
        return vec4(0.80 - t*0.15, 0.28 + t*0.08, 0.18,
                    uOpacityScale * (0.08 + t * 0.10));
    }
    if (hu < 300.0) {
        float t = (hu - 80.0) / 220.0;
        return vec4(0.90, 0.62 + t*0.25, 0.38 + t*0.38,
                    uOpacityScale * (0.18 + t * 0.30));
    }
    float t = clamp((hu - 300.0) / 700.0, 0.0, 1.0);
    return vec4(0.93 + t*0.07, 0.90 + t*0.10, 0.85 + t*0.15,
                uOpacityScale * (0.55 + t * 0.45));
}

// ── Ray–Box Intersection (box = [-0.5, 0.5]^3) ───────────────
bool intersectBox(vec3 orig, vec3 dir, out float tMin, out float tMax) {
    vec3 inv = 1.0 / dir;
    vec3 t0  = (-0.5 - orig) * inv;
    vec3 t1  = ( 0.5 - orig) * inv;
    vec3 tNr = min(t0, t1);
    vec3 tFr = max(t0, t1);
    tMin = max(max(tNr.x, tNr.y), tNr.z);
    tMax = min(min(tFr.x, tFr.y), tFr.z);
    return tMax > max(tMin, 0.0);
}

void main() {
    vec3  dir = normalize(vDirection);
    float tMin, tMax;
    if (!intersectBox(vOrigin, dir, tMin, tMax)) discard;

    float t        = max(tMin, 0.0);
    float stepSize = (tMax - tMin) / uSteps;
    vec4  accum    = vec4(0.0);

    for (int i = 0; i < 400; i++) {
        vec3 pos = vOrigin + t * dir + 0.5;
        if (any(lessThan(pos, vec3(0.0))) || any(greaterThan(pos, vec3(1.0)))) break;

        float val   = texture(uVolume, pos).r;
        vec4  samp  = transferFunction(val);
        float alpha = 1.0 - exp(-samp.a * stepSize * 40.0);
        accum.rgb  += (1.0 - accum.a) * alpha * samp.rgb;
        accum.a    += (1.0 - accum.a) * alpha;

        if (accum.a > 0.98) break;
        t += stepSize;
        if (t > tMax) break;
    }

    if (accum.a < 0.01) discard;
    fragColor = accum;
}
`;

// ─────────────────────────────────────────────────────────────
//  Inner component – inside <Canvas>
// ─────────────────────────────────────────────────────────────
function VolumeModel({ data, shape, spacing }) {
    const meshRef    = useRef();
    const { camera } = useThree();
    const invMat     = useMemo(() => new THREE.Matrix4(), []);

    const [D, H, W]       = shape;
    const [sz, sy, sx]    = spacing;

    const texture = useMemo(() => {
        const tex = new THREE.Data3DTexture(data, W, H, D);
        tex.format          = THREE.RedFormat;
        tex.type            = THREE.UnsignedByteType;
        tex.minFilter       = THREE.LinearFilter;
        tex.magFilter       = THREE.LinearFilter;
        tex.wrapS = tex.wrapT = tex.wrapR = THREE.ClampToEdgeWrapping;
        tex.unpackAlignment = 1;
        tex.needsUpdate     = true;
        return tex;
    }, [data, D, H, W]);

    const physScale = useMemo(() => {
        const pW = W * sx, pH = H * sy, pD = D * sz;
        const mx = Math.max(pW, pH, pD);
        return new THREE.Vector3(pW / mx, pH / mx, pD / mx);
    }, [D, H, W, sx, sy, sz]);

    const material = useMemo(() => new THREE.ShaderMaterial({
        glslVersion:  THREE.GLSL3,
        vertexShader,
        fragmentShader,
        uniforms: {
            uVolume:       { value: texture },
            uSteps:        { value: 256.0 },
            uOpacityScale: { value: 1.0 },
            cameraModel:   { value: new THREE.Vector3() },
        },
        side:        THREE.BackSide,
        transparent: true,
        depthWrite:  false,
    }), [texture]);

    useFrame(() => {
        if (!meshRef.current) return;
        invMat.copy(meshRef.current.matrixWorld).invert();
        material.uniforms.cameraModel.value
            .copy(camera.position).applyMatrix4(invMat);
    });

    // Rotate so DICOM Z (inferior→superior) maps to Three.js Y-up
    return (
        <mesh ref={meshRef} scale={physScale} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}

// ─────────────────────────────────────────────────────────────
//  Main export
// ─────────────────────────────────────────────────────────────
export default function VolumeRenderer({ studyId, seriesId }) {
    const [volData,  setVolData]   = useState(null);
    const [msg,      setMsg]       = useState('Initializing DVR…');
    const [error,    setError]     = useState(null);

    useEffect(() => {
        if (!studyId || !seriesId) return;
        let cancelled = false;

        (async () => {
            try {
                setMsg('Loading volume from server…');
                const res = await fetch(
                    `http://localhost:8000/api/dicom/volume-data/?study_id=${studyId}&series_id=${seriesId}`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                setMsg('Decompressing…');
                const json   = await res.json();
                const binary = atob(json.data);
                const bytes  = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                const raw = pako.inflate(bytes);

                if (!cancelled) {
                    setVolData({ data: raw, shape: json.shape, spacing: json.spacing });
                    setMsg(null);
                }
            } catch (e) {
                if (!cancelled) setError(e.message);
            }
        })();

        return () => { cancelled = true; };
    }, [studyId, seriesId]);

    if (error) return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <p className="text-[9px] font-mono text-red-400/60 uppercase tracking-widest text-center">
                DVR Error:<br />{error}
            </p>
        </div>
    );

    return (
        <div className="w-full h-full relative">
            <Canvas
                camera={{ position: [0, 0, 2.5], fov: 35 }}
                gl={{ antialias: true, alpha: false }}
                style={{ width: '100%', height: '100%' }}
            >
                <color attach="background" args={['#050507']} />
                {volData && (
                    <VolumeModel
                        data={volData.data}
                        shape={volData.shape}
                        spacing={volData.spacing}
                    />
                )}
                <OrbitControls
                    autoRotate
                    autoRotateSpeed={0.5}
                    enablePan={false}
                    enableZoom
                    minDistance={1.2}
                    maxDistance={5}
                />
            </Canvas>

            {/* Loading overlay rendered on top of the (empty) canvas */}
            {msg && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                    <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                    <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{msg}</p>
                </div>
            )}
        </div>
    );
}

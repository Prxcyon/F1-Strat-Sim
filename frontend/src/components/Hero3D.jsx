import { Canvas } from '@react-three/fiber'
import { Environment, Float, OrbitControls, useGLTF, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'

function CarFallback() {
  // A stylized geometric F1 car placeholder used while the heavy 54MB .glb loads.
  return (
    <group position={[0, -0.6, 0]} scale={1.2}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.5, 0.3, 2.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.3, 1.2]}>
        <boxGeometry args={[1.4, 0.05, 0.4]} />
        <meshStandardMaterial color="#ef5350" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.7, -1.1]}>
        <boxGeometry args={[1.2, 0.1, 0.4]} />
        <meshStandardMaterial color="#42a5f5" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0.4, 0.3, 0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>
      <mesh position={[-0.4, 0.3, 0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>
      <mesh position={[0.5, 0.35, -0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.3, 32]} />
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>
      <mesh position={[-0.5, 0.35, -0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.3, 32]} />
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>
    </group>
  )
}

function F1Car() {
  // Loading from Supabase public storage (compressed 24.5MB version)
  const SUPABASE_MODEL_URL = 'https://xrmiqmlkxyqhqinktypz.supabase.co/storage/v1/object/public/f1-assets/f1-car-compressed.glb'
  
  const { scene } = useGLTF(SUPABASE_MODEL_URL, true) // Second param 'true' uses Draco decoder
  return <primitive object={scene} position={[0, -0.4, 0]} scale={1.4} />
}

import TrueFocus from './TrueFocus'
import Shuffle from './Shuffle'

export default function Hero3D() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
      {/* Absolute overlay top text */}
      <div style={{ position: 'absolute', width: '100%', top: '1%', textAlign: 'center', color: '#fff', zIndex: 10, pointerEvents: 'auto' }}>
        <TrueFocus 
          sentence="F1 Engine" 
          manualMode={false} 
          blurAmount={4} 
          borderColor="#ef5350" 
          glowColor="rgba(239, 83, 80, 0.6)" 
        />
        <div style={{ marginTop: '2px' }}>
          <Shuffle 
            text="Next-Gen Racing Intelligence & Telemetry" 
            shuffleDirection="down"
            shuffleTimes={5}
            duration={0.5}
            className="subtitle-shuffle"
            style={{ 
              fontSize: '16px', 
              fontWeight: '300', 
              fontStyle: 'italic', 
              letterSpacing: '4px', 
              textTransform: 'uppercase',
              color: '#c99cf7'
            }}
          />
        </div>
      </div>

      {/* Bottom Scroll Indicator - 'Outfit' font and moved down */}
      <div style={{ 
        position: 'absolute', 
        bottom: '0.5vh', 
        width: '100%', 
        textAlign: 'center', 
        zIndex: 10, 
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px'
      }}>
        <p style={{ 
          fontFamily: 'Outfit, sans-serif',
          fontSize: '14px', 
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.8)', 
          animation: 'pulse 2s infinite', 
          letterSpacing: '4px',
          textTransform: 'uppercase'
        }}>
          Scroll to Ignite
        </p>
        <div style={{ 
          width: '3px', 
          height: '50px', 
          background: 'linear-gradient(to bottom, rgba(239, 83, 80, 1.0), transparent)',
          animation: 'scrollLine 2s infinite',
          borderRadius: '2px'
        }} />
      </div>

      <Canvas camera={{ position: [0, 1.5, 6], fov: 45 }} shadows alpha={true}>
        <ambientLight intensity={0.5} />
        
        {/* Dynamic Studio Lighting */}
        <spotLight position={[10, 10, 10]} intensity={1.5} color="#ef5350" angle={0.5} penumbra={1} castShadow />
        <spotLight position={[-10, 10, -10]} intensity={1.5} color="#42a5f5" angle={0.5} penumbra={1} castShadow />
        
        <Environment preset="night" />
        
        {/* Free OrbitControls — no snap, no spring, stays wherever you leave it */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.6}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
        />

        <Suspense fallback={<CarFallback />}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <F1Car />
          </Float>
          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={10} blur={2} far={4} color="#000000" />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Preload the actual model from Supabase
useGLTF.preload('https://xrmiqmlkxyqhqinktypz.supabase.co/storage/v1/object/public/f1-assets/f1-car-compressed.glb', true)

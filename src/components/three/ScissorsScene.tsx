import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ChromeScissors() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={groupRef} scale={0.8}>
        {/* Left blade */}
        <mesh position={[-0.3, 0.8, 0]} rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.08, 1.5, 8, 16]} />
          <MeshTransmissionMaterial
            color="#ffffff"
            thickness={0.5}
            roughness={0.05}
            transmission={0.9}
            ior={1.5}
            chromaticAberration={0.1}
            backside
          />
        </mesh>
        
        {/* Right blade */}
        <mesh position={[0.3, 0.8, 0]} rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.08, 1.5, 8, 16]} />
          <MeshTransmissionMaterial
            color="#ffffff"
            thickness={0.5}
            roughness={0.05}
            transmission={0.9}
            ior={1.5}
            chromaticAberration={0.1}
            backside
          />
        </mesh>
        
        {/* Left handle ring */}
        <mesh position={[-0.5, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.08, 16, 32]} />
          <MeshTransmissionMaterial
            color="#ffffff"
            thickness={0.3}
            roughness={0.1}
            transmission={0.85}
            ior={1.5}
            chromaticAberration={0.05}
            backside
          />
        </mesh>
        
        {/* Right handle ring */}
        <mesh position={[0.5, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.08, 16, 32]} />
          <MeshTransmissionMaterial
            color="#ffffff"
            thickness={0.3}
            roughness={0.1}
            transmission={0.85}
            ior={1.5}
            chromaticAberration={0.05}
            backside
          />
        </mesh>
        
        {/* Center pivot */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>
    </Float>
  );
}

export function ScissorsScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ffffff" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          color="#ffffff"
        />
        <ChromeScissors />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Animated particle sphere for hero background
function ParticleSphere() {
  const sphereRef = useRef();
  const particlesRef = useRef();

  useEffect(() => {
    if (!sphereRef.current) return;

    const geometry = new THREE.IcosahedronGeometry(2, 12);
    const material = new THREE.PointsMaterial({
      color: '#00eefc',
      size: 0.08,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
    });
    const points = new THREE.Points(geometry, material);
    particlesRef.current = points;
    sphereRef.current.add(points);

    return () => {
      sphereRef.current?.remove(points);
    };
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.x += 0.0002;
      particlesRef.current.rotation.y += 0.0003;
    }
    if (sphereRef.current) {
      sphereRef.current.rotation.x += 0.0001;
      sphereRef.current.rotation.y += 0.00015;
    }
  });

  return (
    <group ref={sphereRef}>
      <Sphere args={[2, 32, 32]}>
        <meshPhongMaterial
          color="#00eefc"
          emissive="#00eefc"
          emissiveIntensity={0.1}
          transparent
          opacity={0.15}
        />
      </Sphere>
    </group>
  );
}

// Glowing orbit ring
function OrbitRing() {
  const ringRef = useRef();

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.001;
    }
  });

  return (
    <group ref={ringRef}>
      <mesh>
        <torusGeometry args={[3, 0.1, 64, 32]} />
        <meshPhongMaterial
          color="#00e639"
          emissive="#00e639"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.4} color="#ffffff" />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00eefc" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff0080" />

      <ParticleSphere />
      <OrbitRing />
    </Canvas>
  );
}

export default HeroScene;

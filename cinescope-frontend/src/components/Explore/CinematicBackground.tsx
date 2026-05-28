import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Sparkles, Float } from "@react-three/drei";
import * as THREE from "three";

interface BackgroundProps {
  color?: string;
  intensity?: number;
}

const NebulaCloud = ({ color }: { color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  const targetColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
      meshRef.current.rotation.z += delta * 0.02;
    }
    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor, 0.05);
    }
  });

  return (
    <Float speed={1} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={[0, 0, -5]}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial
          ref={materialRef}
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </Float>
  );
};

const MouseParallaxCamera = () => {
  useFrame((state) => {
    // Subtle parallax effect based on mouse movement
    const t = state.clock.getElapsedTime();
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      (state.mouse.x * state.viewport.width) / 50,
      0.05
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      (state.mouse.y * state.viewport.height) / 50,
      0.05
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

export const CinematicBackground: React.FC<BackgroundProps> = ({
  color = "#ffffff",
  intensity = 1,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <color attach="background" args={["#020204"]} />
        
        {/* Deep background stars */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        {/* Floating cinematic particles */}
        <Sparkles count={400} scale={20} size={2} speed={0.4} opacity={0.3} color={color} />
        
        {/* Ambient atmospheric nebula */}
        <NebulaCloud color={color} />
        
        <ambientLight intensity={intensity} />
        <MouseParallaxCamera />
      </Canvas>
    </div>
  );
};

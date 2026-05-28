import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface PortalProps {
  universe: any;
  index: number;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

const ATMOSPHERES: Record<string, any> = {
  marvel: { color: "#e62429", glow: "rgba(230, 36, 41, 0.5)", bg: "/assets/marvel-bg.jpg" },
  dc: { color: "#0078f0", glow: "rgba(0, 120, 240, 0.5)", bg: "/assets/dc-bg.jpg" },
  starwars: { color: "#ffe81f", glow: "rgba(255, 232, 31, 0.5)", bg: "/assets/starwars-bg.jpg" },
  naruto: { color: "#ff7b00", glow: "rgba(255, 123, 0, 0.5)", bg: "/assets/naruto-bg.jpg" },
};

export const UniversePortal: React.FC<PortalProps> = ({ universe, index, onSelect, onHover }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  
  // Spring config for smooth parallax
  const springCfg = { stiffness: 150, damping: 20, mass: 0.5 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [15, -15]), springCfg);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-15, 15]), springCfg);
  const scale = useSpring(useTransform(my, [-0.5, 0.5], [1, 1.05]), springCfg);

  const atm = ATMOSPHERES[universe.id] || ATMOSPHERES.marvel;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mx.set(x / rect.width - 0.5);
    my.set(y / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
    onHover(null);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 1.2, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => onHover(universe.id)}
      onClick={() => onSelect(universe.id)}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
        perspective: 1200,
      }}
      className="relative flex-1 min-h-[30vh] md:min-h-[50vh] rounded-[2rem] overflow-hidden cursor-pointer group will-change-transform"
    >
      {/* Background Image Layer (Deepest) */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center origin-center transition-transform duration-[1.5s] ease-out group-hover:scale-125"
        style={{
          backgroundImage: `url(${universe.bgUrl || atm.bg})`,
          transform: "translateZ(-100px)",
          filter: "brightness(0.4) contrast(1.2)",
        }}
      />

      {/* Atmospheric Glow Overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 mix-blend-screen pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${atm.glow} 0%, transparent 70%)`,
          transform: "translateZ(-50px)",
        }}
      />

      {/* Depth Particles/Grid Layer */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${atm.color} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          transform: "translateZ(20px)",
        }}
      />

      {/* Content Layer (Closest) */}
      <div 
        className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 z-10"
        style={{ transform: "translateZ(80px)" }}
      >
        <div className="translate-y-8 group-hover:translate-y-0 transition-all duration-700 ease-[0.16,1,0.3,1]">
          {/* Accent Line */}
          <motion.div 
            className="h-1 rounded-full mb-6"
            initial={{ width: 0 }}
            animate={{ width: "2rem" }}
            whileHover={{ width: "5rem" }}
            style={{ background: atm.color }}
          />
          
          <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-2xl">
            {universe.name}
          </h3>
          
          <p 
            className="text-sm md:text-base font-bold uppercase tracking-[0.3em] mt-4 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 translate-y-4 group-hover:translate-y-0 drop-shadow-lg"
            style={{ color: atm.color }}
          >
            Enter Dimension
          </p>
        </div>
      </div>

      {/* Edge Highlight */}
      <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 rounded-[2rem] transition-colors duration-500 pointer-events-none" />
    </motion.div>
  );
};

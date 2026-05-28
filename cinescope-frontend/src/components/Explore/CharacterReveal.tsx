import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  char: any;
  index: number;
  themeClass: string;
}

export const CharacterReveal: React.FC<Props> = ({ char, index, themeClass }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const isEven = index % 2 === 0;

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pin the section and scrub the animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center",
          end: "+=100%",
          scrub: 1,
          pin: true,
        }
      });

      // Animate Image (slides in from left or right)
      tl.fromTo(imgRef.current, 
        { x: isEven ? -150 : 150, opacity: 0, scale: 0.8, filter: "blur(10px)" }, 
        { x: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 2, ease: "power2.out" }
      )
      // Animate Text Container (slides in from opposite side)
      .fromTo(textContainerRef.current, 
        { x: isEven ? 100 : -100, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 1.5, ease: "power4.out" },
        "-=1.5"
      );

      // Continuous floating animation for the character image
      gsap.to(imgRef.current, {
        y: 20,
        repeat: -1,
        yoyo: true,
        duration: 3 + Math.random(),
        ease: "sine.inOut"
      });

    }, containerRef);

    return () => ctx.revert();
  }, [isEven]);

  return (
    <div ref={containerRef} className="h-screen w-full flex items-center justify-center relative my-16 overflow-hidden">
      
      <div className={`max-w-[1600px] w-full mx-auto px-6 md:px-12 flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24 relative z-20`}>
        
        {/* Character Image (Left or Right) */}
        <div className="flex-1 w-full flex justify-center items-center relative">
          <div className="relative w-full max-w-[500px] aspect-[3/4]">
            {/* Ambient Backlight behind character */}
            <div className="absolute inset-0 bg-white/10 blur-[80px] rounded-full mix-blend-overlay" />
            
            <img 
              ref={imgRef}
              src={char.avatarUrl || char.imageUrl || '/default-bg.jpg'} 
              alt={char.name}
              className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] will-change-transform"
              style={{
                // Soft edge mask to blend JPGs if they aren't true PNGs, 
                // but keeps transparent PNGs perfectly intact.
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)',
                maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)'
              }}
            />
          </div>
        </div>

        {/* Text Content */}
        <div ref={textContainerRef} className={`flex-1 flex flex-col justify-center ${isEven ? 'text-left' : 'text-right'}`}>
          <p className="text-sm md:text-lg font-bold tracking-[0.4em] uppercase text-zinc-400 mb-6 drop-shadow-lg">
            "{char.quote || 'A legendary figure emerges.'}"
          </p>
          
          <h3 className={`text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8 ${themeClass} drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}>
            {char.name}
          </h3>
          
          <div className={`flex items-center gap-3 mb-6 ${isEven ? 'justify-start' : 'justify-end'}`}>
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/20 text-zinc-300">
              {char.alignment}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">
              {char.role}
            </span>
          </div>

          <p className="text-base md:text-xl font-light text-zinc-300 leading-relaxed max-w-xl">
            {char.description}
          </p>
        </div>
      </div>

    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';

interface Meteor {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
  length: number;
  opacity: number;
}

interface MeteorShowerProps {
  enabled?: boolean;
}

export const MeteorShower: React.FC<MeteorShowerProps> = ({ enabled = true }) => {
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpawnTimeRef = useRef<number>(0);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const createMeteor = (): Meteor => {
    const startX = Math.random() * 100;
    const startY = Math.random() * 50; // Top half of screen
    
    // Meteor moves diagonally down and to the side
    const angle = (Math.random() * 45 + 15) * (Math.PI / 180); // 15-60 degrees
    const distance = Math.random() * 40 + 30; // Distance traveled
    
    const endX = startX + Math.cos(angle) * distance;
    const endY = startY + Math.sin(angle) * distance;
    
    return {
      id: `meteor-${Date.now()}-${Math.random()}`,
      startX,
      startY,
      endX,
      endY,
      duration: Math.random() * 1000 + 800, // 800-1800ms
      delay: 0,
      length: Math.random() * 60 + 40, // 40-100px trail
      opacity: Math.random() * 0.4 + 0.3, // 0.3-0.7
    };
  };

  const spawnMeteor = (currentTime: number) => {
    // Random spawn interval: 2-5 seconds
    const spawnInterval = Math.random() * 3000 + 2000;
    
    if (currentTime - lastSpawnTimeRef.current > spawnInterval) {
      lastSpawnTimeRef.current = currentTime;
      
      const newMeteor = createMeteor();
      setMeteors(prev => [...prev, newMeteor]);
      
      // Remove meteor after animation completes
      setTimeout(() => {
        setMeteors(prev => prev.filter(m => m.id !== newMeteor.id));
      }, newMeteor.duration + 500);
    }
  };

  useEffect(() => {
    if (!enabled || prefersReducedMotion) {
      setMeteors([]);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let isActive = true;
    
    const animate = (timestamp: number) => {
      if (!isActive) return;
      
      spawnMeteor(timestamp);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, prefersReducedMotion]);

  useEffect(() => {
    // Pause animations when tab is not visible, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden: cancel animation frame
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else if (enabled && !prefersReducedMotion) {
        // Tab visible: resume animation if enabled and not already running
        if (animationFrameRef.current === null) {
          const animate = (timestamp: number) => {
            if (!document.hidden && enabled && !prefersReducedMotion) {
              spawnMeteor(timestamp);
              animationFrameRef.current = requestAnimationFrame(animate);
            }
          };
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, prefersReducedMotion]);

  if (!enabled || prefersReducedMotion) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-[5]"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    >
      {meteors.map((meteor) => {
        const angle = Math.atan2(meteor.endY - meteor.startY, meteor.endX - meteor.startX);
        const distanceX = (meteor.endX - meteor.startX) * window.innerWidth / 100;
        const distanceY = (meteor.endY - meteor.startY) * window.innerHeight / 100;
        
        return (
          <div
            key={meteor.id}
            className="absolute"
            style={{
              left: `${meteor.startX}%`,
              top: `${meteor.startY}%`,
              width: `${meteor.length}px`,
              height: '2px',
              background: `linear-gradient(90deg, 
                rgba(255, 255, 255, ${meteor.opacity}) 0%, 
                rgba(200, 220, 255, ${meteor.opacity * 0.6}) 50%, 
                transparent 100%)`,
              transform: `rotate(${angle}rad)`,
              boxShadow: `0 0 6px rgba(255, 255, 255, ${meteor.opacity * 0.8})`,
              animation: `meteorFall-${meteor.id} ${meteor.duration}ms linear forwards`,
              willChange: 'transform, opacity',
            }}
          >
            <style>{`
              @keyframes meteorFall-${meteor.id} {
                0% {
                  transform: translateX(0) translateY(0) rotate(${angle}rad);
                  opacity: 0;
                }
                10% {
                  opacity: 1;
                }
                90% {
                  opacity: 1;
                }
                100% {
                  transform: translateX(${distanceX}px) translateY(${distanceY}px) rotate(${angle}rad);
                  opacity: 0;
                }
              }
            `}</style>
          </div>
        );
      })}
    </div>
  );
};

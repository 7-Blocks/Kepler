import React from 'react';

interface Props {
  animating: boolean;
}

export const AuroraBackground: React.FC<Props> = ({ animating }) => {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #020408 0%, #060a12 50%, #0a0f1a 100%)',
        }}
      />

      {/* Green band */}
      <div
        className="absolute top-[3%] left-[-10%] w-[120%] h-[32%]"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(50, 220, 50, 0.55) 20%, rgba(80, 255, 80, 0.75) 40%, rgba(50, 220, 50, 0.55) 60%, transparent 100%)',
          filter: 'blur(18px)',
          animation: animating ? 'aurora-wave 10s ease-in-out infinite' : 'none',
          transformOrigin: 'center center',
        }}
      />

      {/* Purple band */}
      <div
        className="absolute top-[8%] left-[-5%] w-[110%] h-[22%]"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(148, 100, 255, 0.65) 30%, rgba(180, 120, 255, 0.8) 50%, rgba(148, 100, 255, 0.65) 70%, transparent 100%)',
          filter: 'blur(22px)',
          animation: animating
            ? 'aurora-wave 14s ease-in-out 2s infinite reverse'
            : 'none',
          transformOrigin: 'center center',
        }}
      />

      {/* Cyan accent */}
      <div
        className="absolute top-[14%] left-[-8%] w-[116%] h-[18%]"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(0, 230, 255, 0.45) 30%, rgba(0, 210, 240, 0.6) 50%, rgba(0, 230, 255, 0.45) 70%, transparent 100%)',
          filter: 'blur(16px)',
          animation: animating
            ? 'aurora-wave 12s ease-in-out 4s infinite'
            : 'none',
          transformOrigin: 'center center',
        }}
      />

      {/* Horizon glow */}
      <div
        className="absolute bottom-[25%] left-0 right-0 h-[22%]"
        style={{
          background:
            'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(50, 220, 50, 0.15) 0%, rgba(80, 100, 220, 0.08) 50%, transparent 100%)',
        }}
      />

      {/* Stars */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1.5px 1.5px at 10% 70%, rgba(255,255,255,0.8) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 30% 80%, rgba(255,255,255,0.7) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 50% 65%, rgba(255,255,255,0.6) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 70% 75%, rgba(255,255,255,0.8) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 90% 85%, rgba(255,255,255,0.7) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 15% 90%, rgba(200,255,200,0.7) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 60% 92%, rgba(200,220,255,0.6) 0%, transparent 100%)',
        }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, rgba(50, 220, 50, 0.1) 0%, transparent 30%, rgba(148, 100, 255, 0.08) 60%, transparent 100%)',
          animation: animating ? 'haze-shift 20s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  );
};

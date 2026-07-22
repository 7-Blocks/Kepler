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
            'linear-gradient(180deg, #010204 0%, #050810 50%, #0a0f1a 100%)',
        }}
      />

      <div
        className="absolute top-[3%] left-[-10%] w-[120%] h-[32%]"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(55, 230, 55, 0.6) 20%, rgba(90, 255, 90, 0.8) 40%, rgba(55, 230, 55, 0.6) 60%, transparent 100%)',
          filter: 'blur(18px)',
          animation: animating ? 'aurora-wave 10s ease-in-out infinite' : 'none',
          transformOrigin: 'center center',
        }}
      />

      <div
        className="absolute top-[8%] left-[-5%] w-[110%] h-[22%]"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(155, 108, 255, 0.7) 30%, rgba(190, 130, 255, 0.85) 50%, rgba(155, 108, 255, 0.7) 70%, transparent 100%)',
          filter: 'blur(22px)',
          animation: animating
            ? 'aurora-wave 14s ease-in-out 2s infinite reverse'
            : 'none',
          transformOrigin: 'center center',
        }}
      />

      <div
        className="absolute top-[14%] left-[-8%] w-[116%] h-[18%]"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(0, 235, 255, 0.5) 30%, rgba(0, 215, 245, 0.65) 50%, rgba(0, 235, 255, 0.5) 70%, transparent 100%)',
          filter: 'blur(16px)',
          animation: animating
            ? 'aurora-wave 12s ease-in-out 4s infinite'
            : 'none',
          transformOrigin: 'center center',
        }}
      />

      <div
        className="absolute bottom-[25%] left-0 right-0 h-[22%]"
        style={{
          background:
            'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(55, 230, 55, 0.18) 0%, rgba(85, 105, 225, 0.1) 50%, transparent 100%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1.5px 1.5px at 10% 70%, rgba(255,255,255,0.85) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 30% 80%, rgba(255,255,255,0.75) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 50% 65%, rgba(255,255,255,0.65) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 70% 75%, rgba(255,255,255,0.85) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 90% 85%, rgba(255,255,255,0.75) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 15% 90%, rgba(210,255,210,0.75) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 60% 92%, rgba(210,225,255,0.65) 0%, transparent 100%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, rgba(55, 230, 55, 0.12) 0%, transparent 30%, rgba(155, 108, 255, 0.1) 60%, transparent 100%)',
          animation: animating ? 'haze-shift 20s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  );
};

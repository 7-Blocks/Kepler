import React from 'react';

interface Props {
  animating: boolean;
}

export const SolarStormBackground: React.FC<Props> = ({ animating }) => {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0C1220 0%, #1a0e05 40%, #221208 100%)',
        }}
      />

      {/* Main flare */}
      <div
        className="absolute -top-[10%] left-[10%] w-[80%] h-[45%]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 140, 0, 0.8) 0%, rgba(255, 80, 0, 0.4) 40%, transparent 70%)',
          animation: animating ? 'solar-pulse 8s ease-in-out infinite' : 'none',
        }}
      />

      {/* Secondary flare */}
      <div
        className="absolute -top-[3%] right-[5%] w-[35%] h-[30%]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 180, 0, 0.7) 0%, rgba(255, 100, 0, 0.3) 50%, transparent 80%)',
          animation: animating
            ? 'solar-pulse 6s ease-in-out 2s infinite'
            : 'none',
        }}
      />

      {/* Plasma waves */}
      {animating && (
        <>
          <div
            className="absolute top-[22%] -left-[10%] w-[120%] h-[5px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 120, 0, 1) 20%, rgba(255, 80, 0, 1) 50%, rgba(255, 120, 0, 1) 80%, transparent 100%)',
              animation: 'plasma-wave 12s linear infinite',
              filter: 'blur(3px)',
            }}
          />
          <div
            className="absolute top-[38%] -left-[10%] w-[120%] h-[4px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 160, 50, 0.9) 30%, rgba(255, 100, 20, 1) 50%, rgba(255, 160, 50, 0.9) 70%, transparent 100%)',
              animation: 'plasma-wave 15s linear 3s infinite',
              filter: 'blur(2px)',
            }}
          />
          <div
            className="absolute top-[55%] -left-[10%] w-[120%] h-[3px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 140, 30, 0.8) 25%, rgba(255, 90, 10, 1) 50%, rgba(255, 140, 30, 0.8) 75%, transparent 100%)',
              animation: 'plasma-wave 18s linear 6s infinite',
              filter: 'blur(2px)',
            }}
          />
        </>
      )}

      {/* Particles */}
      {animating && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(4px 4px at 15% 25%, rgba(255, 160, 50, 1) 0%, transparent 100%), ' +
              'radial-gradient(3px 3px at 35% 45%, rgba(255, 120, 0, 0.9) 0%, transparent 100%), ' +
              'radial-gradient(4px 4px at 55% 15%, rgba(255, 200, 80, 1) 0%, transparent 100%), ' +
              'radial-gradient(3px 3px at 75% 55%, rgba(255, 140, 30, 0.8) 0%, transparent 100%), ' +
              'radial-gradient(3px 3px at 25% 70%, rgba(255, 100, 0, 0.7) 0%, transparent 100%), ' +
              'radial-gradient(3px 3px at 65% 35%, rgba(255, 180, 60, 0.9) 0%, transparent 100%)',
            animation: 'particle-drift 20s linear infinite',
          }}
        />
      )}

      {/* Haze */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(255, 120, 0, 0.2) 0%, transparent 40%, rgba(255, 80, 0, 0.15) 70%, transparent 100%)',
          animation: animating ? 'haze-shift 15s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  );
};

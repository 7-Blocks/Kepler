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
            'linear-gradient(180deg, #1a0f05 0%, #2a1508 40%, #1c1008 100%)',
        }}
      />

      <div
        className="absolute -top-[10%] left-[10%] w-[80%] h-[45%]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 145, 0, 0.85) 0%, rgba(255, 85, 0, 0.45) 40%, transparent 70%)',
          animation: animating ? 'solar-pulse 8s ease-in-out infinite' : 'none',
        }}
      />

      <div
        className="absolute -top-[3%] right-[5%] w-[35%] h-[30%]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 185, 0, 0.75) 0%, rgba(255, 105, 0, 0.35) 50%, transparent 80%)',
          animation: animating
            ? 'solar-pulse 6s ease-in-out 2s infinite'
            : 'none',
        }}
      />

      {animating && (
        <>
          <div
            className="absolute top-[22%] -left-[10%] w-[120%] h-[5px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 125, 0, 1) 20%, rgba(255, 85, 0, 1) 50%, rgba(255, 125, 0, 1) 80%, transparent 100%)',
              animation: 'plasma-wave 12s linear infinite',
              filter: 'blur(3px)',
            }}
          />
          <div
            className="absolute top-[38%] -left-[10%] w-[120%] h-[4px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 165, 55, 0.9) 30%, rgba(255, 105, 25, 1) 50%, rgba(255, 165, 55, 0.9) 70%, transparent 100%)',
              animation: 'plasma-wave 15s linear 3s infinite',
              filter: 'blur(2px)',
            }}
          />
          <div
            className="absolute top-[55%] -left-[10%] w-[120%] h-[3px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 145, 35, 0.85) 25%, rgba(255, 95, 15, 1) 50%, rgba(255, 145, 35, 0.85) 75%, transparent 100%)',
              animation: 'plasma-wave 18s linear 6s infinite',
              filter: 'blur(2px)',
            }}
          />
        </>
      )}

      {animating && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(5px 5px at 15% 25%, rgba(255, 165, 55, 1) 0%, transparent 100%), ' +
              'radial-gradient(4px 4px at 35% 45%, rgba(255, 125, 0, 0.95) 0%, transparent 100%), ' +
              'radial-gradient(5px 5px at 55% 15%, rgba(255, 205, 85, 1) 0%, transparent 100%), ' +
              'radial-gradient(4px 4px at 75% 55%, rgba(255, 145, 35, 0.9) 0%, transparent 100%), ' +
              'radial-gradient(4px 4px at 25% 70%, rgba(255, 105, 0, 0.8) 0%, transparent 100%), ' +
              'radial-gradient(4px 4px at 65% 35%, rgba(255, 185, 65, 0.95) 0%, transparent 100%)',
            animation: 'particle-drift 20s linear infinite',
          }}
        />
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(255, 125, 0, 0.25) 0%, transparent 40%, rgba(255, 85, 0, 0.18) 70%, transparent 100%)',
          animation: animating ? 'haze-shift 15s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  );
};

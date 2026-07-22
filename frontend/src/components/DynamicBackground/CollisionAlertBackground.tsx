import React from 'react';

interface Props {
  animating: boolean;
}

export const CollisionAlertBackground: React.FC<Props> = ({ animating }) => {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0C1220 0%, #200a10 50%, #0C1220 100%)',
        }}
      />

      {animating && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255, 59, 48, 0.4) 0%, transparent 70%)',
            animation: 'collision-pulse 3s ease-in-out infinite',
          }}
        />
      )}

      {animating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-[200%] h-[200%]"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(255, 59, 48, 0.65) 0%, transparent 20%)',
              animation: 'radar-sweep 4s linear infinite',
            }}
          />
        </div>
      )}

      {animating && (
        <>
          <div
            className="absolute top-[20%] left-[15%] w-[70%] h-[60%]"
            style={{
              border: '1.5px solid rgba(255, 59, 48, 0.45)',
              borderRadius: '50%',
              transform: 'rotateX(70deg)',
              animation: 'orbit-rotate 20s linear infinite',
            }}
          />
          <div
            className="absolute top-[25%] left-[20%] w-[60%] h-[50%]"
            style={{
              border: '1.5px solid rgba(255, 149, 0, 0.35)',
              borderRadius: '50%',
              transform: 'rotateX(65deg) rotateZ(30deg)',
              animation: 'orbit-rotate 25s linear infinite reverse',
            }}
          />
          <div
            className="absolute top-[15%] left-[10%] w-[80%] h-[70%]"
            style={{
              border: '1px solid rgba(255, 59, 48, 0.3)',
              borderRadius: '50%',
              transform: 'rotateX(75deg) rotateZ(-20deg)',
              animation: 'orbit-rotate 30s linear infinite',
            }}
          />
        </>
      )}

      {animating && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(6px 6px at 45% 45%, rgba(255, 59, 48, 1) 0%, transparent 100%), ' +
              'radial-gradient(6px 6px at 55% 52%, rgba(255, 59, 48, 0.9) 0%, transparent 100%), ' +
              'radial-gradient(5px 5px at 48% 48%, rgba(255, 149, 0, 0.85) 0%, transparent 100%)',
            animation: 'collision-pulse 2s ease-in-out infinite',
          }}
        />
      )}

      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(1.5px 1.5px at 10% 15%, rgba(255,255,255,0.85) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.75) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 80% 20%, rgba(255,255,255,0.85) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 90% 70%, rgba(255,255,255,0.65) 0%, transparent 100%)',
        }}
      />
    </div>
  );
};

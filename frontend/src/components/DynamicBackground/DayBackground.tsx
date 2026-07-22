import React from 'react';

interface Props {
  animating: boolean;
}

export const DayBackground: React.FC<Props> = ({ animating }) => {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0c1e3a 0%, #122d52 35%, #1a4270 65%, #1e5288 100%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1.5px 1.5px at 8% 12%, rgba(255,255,255,0.6) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 22% 38%, rgba(255,255,255,0.5) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 48% 8%, rgba(255,255,255,0.55) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 72% 22%, rgba(255,255,255,0.4) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 88% 52%, rgba(255,255,255,0.5) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 38% 68%, rgba(255,255,255,0.35) 0%, transparent 100%)',
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-[50%]"
        style={{
          background:
            'radial-gradient(ellipse 140% 70% at 50% 100%, rgba(80, 200, 255, 0.5) 0%, rgba(50, 140, 230, 0.25) 40%, transparent 75%)',
        }}
      />

      <div
        className="absolute bottom-[22%] left-0 right-0 h-[10%]"
        style={{
          background:
            'linear-gradient(0deg, rgba(120, 210, 255, 0.25) 0%, rgba(180, 230, 255, 0.4) 50%, rgba(120, 210, 255, 0.12) 100%)',
        }}
      />

      {animating && (
        <>
          <div
            className="absolute bottom-[18%] -left-[20%] w-[140%] h-[6%]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 70%, transparent 100%)',
              animation: 'bg-drift-slow 120s linear infinite',
            }}
          />
          <div
            className="absolute bottom-[28%] -left-[30%] w-[160%] h-[4%]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 75%, transparent 100%)',
              animation: 'bg-drift-slow 180s linear infinite reverse',
            }}
          />
        </>
      )}

      <div
        className="absolute -top-[12%] -right-[5%] w-[40%] h-[40%]"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255, 225, 140, 0.7) 0%, rgba(255, 200, 80, 0.3) 40%, transparent 70%)',
        }}
      />
    </div>
  );
};

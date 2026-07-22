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
            'linear-gradient(180deg, #0a1628 0%, #0f2444 40%, #1a3a5c 70%, #1e4a6e 100%)',
        }}
      />

      {/* Stars - faint for daytime */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1.5px 1.5px at 8% 12%, rgba(255,255,255,0.5) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 22% 38%, rgba(255,255,255,0.4) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 48% 8%, rgba(255,255,255,0.45) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 72% 22%, rgba(255,255,255,0.35) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 88% 52%, rgba(255,255,255,0.4) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 38% 68%, rgba(255,255,255,0.3) 0%, transparent 100%)',
        }}
      />

      {/* Earth glow from bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[55%]"
        style={{
          background:
            'radial-gradient(ellipse 130% 70% at 50% 100%, rgba(64, 180, 255, 0.45) 0%, rgba(40, 120, 220, 0.2) 40%, transparent 75%)',
        }}
      />

      {/* Atmosphere band */}
      <div
        className="absolute bottom-[22%] left-0 right-0 h-[12%]"
        style={{
          background:
            'linear-gradient(0deg, rgba(100, 200, 255, 0.2) 0%, rgba(160, 220, 255, 0.35) 50%, rgba(100, 200, 255, 0.1) 100%)',
        }}
      />

      {/* Cloud layers */}
      {animating && (
        <>
          <div
            className="absolute bottom-[18%] -left-[20%] w-[140%] h-[7%]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.15) 70%, transparent 100%)',
              animation: 'bg-drift-slow 120s linear infinite',
            }}
          />
          <div
            className="absolute bottom-[28%] -left-[30%] w-[160%] h-[5%]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.1) 75%, transparent 100%)',
              animation: 'bg-drift-slow 180s linear infinite reverse',
            }}
          />
        </>
      )}

      {/* Sun glow */}
      <div
        className="absolute -top-[15%] -right-[5%] w-[45%] h-[45%]"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255, 220, 130, 0.6) 0%, rgba(255, 200, 80, 0.25) 40%, transparent 70%)',
        }}
      />
    </div>
  );
};

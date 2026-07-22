import React from 'react';

interface Props {
  animating: boolean;
}

export const NightBackground: React.FC<Props> = ({ animating }) => {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #010204 0%, #050810 40%, #0a0f1a 100%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1.5px 1.5px at 5% 8%, #fff 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 12% 35%, rgba(255,255,255,0.85) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 20% 15%, rgba(200,225,255,0.95) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.75) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 35% 5%, #fff 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 45% 45%, rgba(200,210,255,0.85) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 55% 20%, #fff 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 60% 75%, rgba(255,255,255,0.65) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 70% 30%, rgba(255,255,255,0.85) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 78% 55%, rgba(200,225,255,0.9) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 85% 10%, rgba(255,255,255,0.75) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 92% 40%, rgba(255,255,255,0.85) 0%, transparent 100%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(2px 2px at 8% 22%, #fff 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 22% 68%, rgba(200,225,255,1) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 48% 12%, rgba(255,255,255,0.95) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 65% 48%, #fff 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 82% 72%, rgba(200,225,255,0.95) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 95% 18%, rgba(255,255,255,0.85) 0%, transparent 100%)',
        }}
      />

      {animating && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(3px 3px at 15% 30%, rgba(200,225,255,1) 0%, transparent 100%), ' +
              'radial-gradient(3px 3px at 42% 55%, #fff 0%, transparent 100%), ' +
              'radial-gradient(3px 3px at 73% 18%, rgba(200,225,255,1) 0%, transparent 100%), ' +
              'radial-gradient(3px 3px at 88% 62%, rgba(255,255,255,0.9) 0%, transparent 100%)',
            animation: 'star-twinkle 4s ease-in-out infinite alternate',
          }}
        />
      )}

      <div
        className="absolute top-[5%] right-[8%] w-56 h-56"
        style={{
          background:
            'radial-gradient(circle at center, rgba(210, 220, 240, 0.45) 0%, rgba(160, 180, 210, 0.18) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[8%] right-[11%] w-14 h-14 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(230, 235, 250, 0.95) 0%, rgba(190, 200, 225, 0.55) 60%, transparent 100%)',
          boxShadow:
            '0 0 60px rgba(190, 210, 240, 0.35), 0 0 120px rgba(190, 210, 240, 0.18)',
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-[30%]"
        style={{
          background:
            'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(50, 100, 170, 0.3) 0%, rgba(25, 65, 130, 0.15) 50%, transparent 80%)',
        }}
      />

      <div
        className="absolute bottom-[2%] left-[15%] right-[15%] h-[10%]"
        style={{
          background:
            'radial-gradient(2px 2px at 10% 50%, rgba(255, 215, 130, 1) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 25% 30%, rgba(255, 225, 150, 0.95) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 40% 60%, rgba(255, 205, 110, 0.85) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 55% 40%, rgba(255, 215, 130, 0.95) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 70% 55%, rgba(255, 205, 110, 0.75) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 85% 35%, rgba(255, 225, 150, 0.85) 0%, transparent 100%)',
        }}
      />
    </div>
  );
};

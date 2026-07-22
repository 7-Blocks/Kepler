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
            'linear-gradient(180deg, #020408 0%, #060a12 40%, #0a0f1a 100%)',
        }}
      />

      {/* Stars layer 1 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1.5px 1.5px at 5% 8%, rgba(255,255,255,1) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 12% 35%, rgba(255,255,255,0.8) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 20% 15%, rgba(200,220,255,0.9) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.7) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 35% 5%, rgba(255,255,255,0.9) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 45% 45%, rgba(200,200,255,0.8) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 55% 20%, rgba(255,255,255,1) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 60% 75%, rgba(255,255,255,0.6) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 70% 30%, rgba(255,255,255,0.8) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 78% 55%, rgba(200,220,255,0.9) 0%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 85% 10%, rgba(255,255,255,0.7) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 92% 40%, rgba(255,255,255,0.8) 0%, transparent 100%)',
        }}
      />

      {/* Stars layer 2 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(2px 2px at 8% 22%, rgba(255,255,255,1) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 22% 68%, rgba(200,220,255,1) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 48% 12%, rgba(255,255,255,0.9) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 65% 48%, rgba(255,255,255,1) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 82% 72%, rgba(200,220,255,0.9) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 95% 18%, rgba(255,255,255,0.8) 0%, transparent 100%)',
        }}
      />

      {/* Twinkling */}
      {animating && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(3px 3px at 15% 30%, rgba(200,220,255,1) 0%, transparent 100%), ' +
              'radial-gradient(3px 3px at 42% 55%, rgba(255,255,255,0.9) 0%, transparent 100%), ' +
              'radial-gradient(3px 3px at 73% 18%, rgba(200,220,255,1) 0%, transparent 100%), ' +
              'radial-gradient(3px 3px at 88% 62%, rgba(255,255,255,0.8) 0%, transparent 100%)',
            animation: 'star-twinkle 4s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* Moon */}
      <div
        className="absolute top-[6%] right-[10%] w-48 h-48"
        style={{
          background:
            'radial-gradient(circle at center, rgba(200, 215, 240, 0.4) 0%, rgba(150, 170, 200, 0.15) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[9%] right-[13%] w-12 h-12 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(220, 230, 245, 0.9) 0%, rgba(180, 195, 220, 0.5) 60%, transparent 100%)',
          boxShadow:
            '0 0 50px rgba(180, 200, 230, 0.3), 0 0 100px rgba(180, 200, 230, 0.15)',
        }}
      />

      {/* City lights glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[35%]"
        style={{
          background:
            'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(40, 90, 160, 0.25) 0%, rgba(20, 60, 120, 0.12) 50%, transparent 80%)',
        }}
      />

      {/* City light dots */}
      <div
        className="absolute bottom-[3%] left-[15%] right-[15%] h-[12%]"
        style={{
          background:
            'radial-gradient(2px 2px at 10% 50%, rgba(255, 210, 120, 1) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 25% 30%, rgba(255, 220, 140, 0.9) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 40% 60%, rgba(255, 200, 100, 0.8) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 55% 40%, rgba(255, 210, 120, 0.9) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 70% 55%, rgba(255, 200, 100, 0.7) 0%, transparent 100%), ' +
            'radial-gradient(2px 2px at 85% 35%, rgba(255, 220, 140, 0.8) 0%, transparent 100%)',
        }}
      />
    </div>
  );
};

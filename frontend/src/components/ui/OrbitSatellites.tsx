import { Satellite, Radio, Antenna, type LucideIcon } from "lucide-react";

interface OrbitRing {
  radius: number;
  duration: number;
  reverse?: boolean;
  Icon: LucideIcon;
  color: string;
}

const RINGS: OrbitRing[] = [
  { radius: 210, duration: 26, Icon: Satellite, color: "#4CD6F0" },
  { radius: 290, duration: 38, reverse: true, Icon: Radio, color: "#9D7BFF" },
  { radius: 360, duration: 48, Icon: Antenna, color: "#FFB454" },
];

export function OrbitSatellites({ className = "" }: { className?: string }) {
  return (
    <div className={`orbit-satellites ${className}`} aria-hidden="true">
      <style>{`
        .orbit-satellites {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .orbit-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px dashed rgba(255, 255, 255, 0.08);
        }
        .orbit-spin {
          position: absolute;
          inset: 0;
          animation: orbit-rotate linear infinite;
        }
        .orbit-spin.reverse {
          animation-direction: reverse;
        }
        .orbit-marker {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          backdrop-filter: blur(4px);
        }
        @keyframes orbit-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .orbit-spin { animation: none; }
        }
      `}</style>

      {RINGS.map(({ radius, duration, reverse, Icon, color }) => (
        <div
          key={radius}
          className="orbit-ring"
          style={{ width: radius * 2, height: radius * 2 }}
        >
          <div
            className={`orbit-spin${reverse ? " reverse" : ""}`}
            style={{ animationDuration: `${duration}s` }}
          >
            <div
              className="orbit-marker"
              style={{
                background: `${color}1a`,
                border: `1px solid ${color}55`,
                boxShadow: `0 0 16px ${color}40`,
                color,
              }}
            >
              <Icon size={13} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
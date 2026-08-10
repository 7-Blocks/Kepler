import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { SpaceObject } from '@/services/api';

interface SatelliteComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  satellites: SpaceObject[];
}

function orbitTypeFromSMA(sma: number | null): string {
  if (!sma) return 'LEO';
  const alt = sma - 6371; 
  if (alt < 2000)  return 'LEO';
  if (alt < 35000) return 'MEO';
  if (alt < 36000) return 'GEO';
  return 'HEO';
}

function altFromSMA(sma: number | null): number {
  if (!sma) return 0;
  return Math.round(sma - 6371);
}

// Simple Radar Chart
const RadarChart = ({ data }: { data: SpaceObject[] }) => {
  const size = 200;
  const center = size / 2;
  const radius = (size / 2) - 20;
  const axes = [
    { name: 'Altitude', max: 36000, getValue: (o: SpaceObject) => altFromSMA(o.semimajor_axis) },
    { name: 'Inclination', max: 180, getValue: (o: SpaceObject) => o.inclination ?? 0 },
    { name: 'Period', max: 1500, getValue: (o: SpaceObject) => o.period ?? 0 },
    { name: 'Eccentricity', max: 1, getValue: (o: SpaceObject) => o.eccentricity ?? 0 },
    { name: 'Mean Motion', max: 20, getValue: (o: SpaceObject) => o.mean_motion ?? 0 },
  ];
  
  const colors = ['#00E5FF', '#FACC15', '#F43F5E', '#10B981']; // Tailwind cyan, yellow, rose, emerald

  const renderPolygon = (sat: SpaceObject, color: string) => {
    const points = axes.map((axis, i) => {
      const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const val = Math.min(Math.max(axis.getValue(sat), 0), axis.max);
      const r = (val / axis.max) * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');

    return (
      <polygon
        points={points}
        fill={color}
        fillOpacity="0.2"
        stroke={color}
        strokeWidth="2"
      />
    );
  };

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {/* Background grid */}
      {[0.2, 0.4, 0.6, 0.8, 1].map(r => (
        <polygon
          key={r}
          points={axes.map((_, i) => {
            const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
            return `${center + radius * r * Math.cos(angle)},${center + radius * r * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="currentColor"
          className="text-border-panel/50"
          strokeWidth="1"
        />
      ))}
      {/* Axes lines */}
      {axes.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        return (
          <g key={i}>
            <line
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="currentColor"
              className="text-border-panel/50"
              strokeWidth="1"
            />
            <text
              x={center + (radius + 15) * Math.cos(angle)}
              y={center + (radius + 15) * Math.sin(angle)}
              textAnchor="middle"
              alignmentBaseline="middle"
              className="text-[8px] fill-on-surface-variant font-technical-data"
            >
              {axis.name}
            </text>
          </g>
        );
      })}
      {/* Data polygons */}
      {data.map((sat, i) => (
        <g key={sat.id}>{renderPolygon(sat, colors[i % colors.length])}</g>
      ))}
    </svg>
  );
};

export const SatelliteComparisonModal: React.FC<SatelliteComparisonModalProps> = ({
  isOpen,
  onClose,
  satellites,
}) => {
  if (!isOpen) return null;

  const compareFields = [
    { label: 'Altitude', getValue: (o: SpaceObject) => { const a = altFromSMA(o.semimajor_axis); return a > 0 ? `${a.toLocaleString()} km` : 'N/A'; } },
    { label: 'Velocity', getValue: () => 'N/A' }, // Only in telemetry
    { label: 'Inclination', getValue: (o: SpaceObject) => o.inclination != null ? `${o.inclination.toFixed(2)}°` : 'N/A' },
    { label: 'Fuel', getValue: () => 'N/A' }, // Only in satellite object
    { label: 'Orbit', getValue: (o: SpaceObject) => orbitTypeFromSMA(o.semimajor_axis) },
    { label: 'Health', getValue: () => 'N/A' },
    { label: 'Risk Score', getValue: () => 'N/A' },
    { label: 'Country', getValue: () => 'N/A' },
    { label: 'Mission', getValue: () => 'N/A' },
  ];

  const colors = ['bg-primary', 'bg-status-warning', 'bg-status-emergency', 'bg-status-success'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 20, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 20, scale: 0.95 }}
          className="w-full max-w-5xl max-h-[90vh] bg-surface-container-lowest border border-border-panel shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-border-panel">
            <h2 className="text-xl font-headline-lg font-bold text-primary-container">Satellite Comparison</h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-primary transition-ui cursor-pointer"
            >
              <MaterialIcon name="close" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col md:flex-row gap-6">
            
            {/* Chart Section */}
            <div className="w-full md:w-1/3 flex flex-col items-center border border-border-panel bg-surface-container-low p-4 relative">
              <h3 className="font-label-caps text-on-surface-variant text-xs mb-8 w-full text-left">RADAR ANALYSIS</h3>
              <div className="w-full aspect-square max-w-[250px] mb-8">
                <RadarChart data={satellites} />
              </div>
              <div className="w-full flex flex-col gap-2 mt-auto">
                {satellites.map((sat, i) => (
                  <div key={sat.id} className="flex items-center gap-2 font-technical-data text-[10px]">
                    <div className={`w-3 h-3 ${colors[i % colors.length]}`} />
                    <span className="truncate text-on-surface">{sat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table Section */}
            <div className="w-full md:w-2/3 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-panel bg-surface-container">
                    <th className="p-3 font-label-caps text-on-surface-variant text-[10px]">METRIC</th>
                    {satellites.map((sat, i) => (
                      <th key={sat.id} className="p-3 font-technical-data font-bold text-primary text-xs w-[120px] max-w-[150px]">
                        <div className="flex flex-col">
                          <span className="truncate" title={sat.name}>{sat.name}</span>
                          <span className="text-[9px] text-on-surface-variant font-normal">NORAD: {sat.catalog_number}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-panel">
                  {compareFields.map((field) => (
                    <tr key={field.label} className="hover:bg-surface-variant/30 transition-ui">
                      <td className="p-3 font-label-caps text-[10px] text-on-surface-variant">{field.label}</td>
                      {satellites.map((sat) => (
                        <td key={sat.id} className="p-3 font-technical-data text-xs text-on-surface">
                          {field.getValue(sat)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

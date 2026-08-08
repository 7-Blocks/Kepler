import { MaterialIcon } from '../MaterialIcon';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { useLayerStore } from '@/store/layerStore';
import { ORBIT_REGIMES, type OrbitRegime } from '@/types/orbitLayers';
import {
  OBJECT_CATEGORIES,
  OBJECT_CATEGORY_INFO,
  type ObjectCategory,
} from '@/types/objectCategories';

interface LayerManagerPanelProps {
  onClose: () => void;
  regimeCounts: Record<OrbitRegime, number>;
  categoryCounts: Record<ObjectCategory, number>;
}

export function LayerManagerPanel({ onClose, regimeCounts, categoryCounts }: LayerManagerPanelProps) {
  const categoryVisibility = useLayerStore((s) => s.categoryVisibility);
  const regimeVisibility = useLayerStore((s) => s.regimeVisibility);
  const toggleCategory = useLayerStore((s) => s.toggleCategory);
  const toggleRegime = useLayerStore((s) => s.toggleRegime);

  return (
    <section
      role="region"
      aria-label="Orbit layer visibility controls"
      className="pointer-events-auto flex max-h-full min-h-0 flex-col bg-bg-deep-space/90 backdrop-blur-xl border border-border-panel p-4 min-w-[220px] shadow-[0_0_30px_rgba(0,0,0,0.6)]"
    >
      <div className="flex justify-between items-center mb-3 shrink-0">
        <span className="font-label-caps text-[10px] text-primary-container font-bold tracking-widest">
          ORBIT LAYERS
        </span>
        <button
          onClick={onClose}
          aria-label="Close layer manager"
          className="text-on-surface-variant/60 hover:text-on-surface cursor-pointer"
        >
          <MaterialIcon name="close" className="text-xs" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div role="group" aria-labelledby="orbit-region-heading" className="mb-4">
          <div id="orbit-region-heading" className="font-label-caps text-[9px] text-on-surface-variant/60 tracking-widest mb-2">
            ORBIT REGION
          </div>
          <div className="space-y-2">
            {ORBIT_REGIMES.map((regime) => (
              <div key={regime} className="flex items-center justify-between gap-3">
                <span className="font-technical-data text-[11px] text-on-surface-variant">{regime}</span>
                <div className="flex items-center gap-2">
                  <span className="font-technical-data text-[11px] font-bold text-on-surface">
                    {regimeCounts[regime].toLocaleString()}
                  </span>
                  <ToggleSwitch
                    checked={regimeVisibility[regime]}
                    onChange={() => toggleRegime(regime)}
                    label={`Toggle ${regime} visibility`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div role="group" aria-labelledby="object-category-heading">
          <div id="object-category-heading" className="font-label-caps text-[9px] text-on-surface-variant/60 tracking-widest mb-2">
            OBJECT CATEGORY
          </div>
          <div className="space-y-2">
            {OBJECT_CATEGORIES.map((category) => {
              const info = OBJECT_CATEGORY_INFO[category];
              return (
                <div key={category} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: info.css, boxShadow: `0 0 8px ${info.css}60` }}
                    />
                    <span className="font-technical-data text-[11px] text-on-surface-variant">{info.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-technical-data text-[11px] font-bold text-on-surface">
                      {categoryCounts[category].toLocaleString()}
                    </span>
                    <ToggleSwitch
                      checked={categoryVisibility[category]}
                      onChange={() => toggleCategory(category)}
                      label={`Toggle ${info.label} visibility`}
                      accentColor={info.css}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 shrink-0 border-t border-border-panel/40 text-[9px] text-on-surface-variant/50 font-technical-data">
        Filters apply instantly · Saved for this session
      </div>
    </section>
  );
}

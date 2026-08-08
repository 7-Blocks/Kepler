import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OrbitRegime } from '@/types/orbitLayers';
import type { ObjectCategory } from '@/types/objectCategories';
import { OBJECT_CATEGORIES } from '@/types/objectCategories';

export type { ObjectCategory };

interface LayerState {
  categoryVisibility: Record<ObjectCategory, boolean>;
  regimeVisibility: Record<OrbitRegime, boolean>;
  toggleCategory: (key: ObjectCategory) => void;
  toggleRegime: (key: OrbitRegime) => void;
  resetLayers: () => void;
}

const defaultCategoryVisibility: Record<ObjectCategory, boolean> = {
  NAVIGATION: true,
  WEATHER: true,
  MILITARY: true,
  SPACE_DEBRIS: true,
  ROCKET_BODY: true,
  OTHER: true,
};

const defaultRegimeVisibility: Record<OrbitRegime, boolean> = {
  LEO: true,
  MEO: true,
  GEO: true,
  HEO: true,
};

export const useLayerStore = create<LayerState>()(
  persist(
    (set) => ({
      categoryVisibility: defaultCategoryVisibility,
      regimeVisibility: defaultRegimeVisibility,
      toggleCategory: (key) =>
        set((state) => ({
          categoryVisibility: { ...state.categoryVisibility, [key]: !state.categoryVisibility[key] },
        })),
      toggleRegime: (key) =>
        set((state) => ({
          regimeVisibility: { ...state.regimeVisibility, [key]: !state.regimeVisibility[key] },
        })),
      resetLayers: () =>
        set({ categoryVisibility: defaultCategoryVisibility, regimeVisibility: defaultRegimeVisibility }),
    }),
    {
      // v2: ObjectCategory keys changed from catalog classifications to mission layers
      name: 'kepler-orbit-layers-v2',
      storage: createJSONStorage(() => sessionStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<LayerState> | undefined;
        const categoryVisibility = { ...defaultCategoryVisibility };
        for (const key of OBJECT_CATEGORIES) {
          if (p?.categoryVisibility && typeof p.categoryVisibility[key] === 'boolean') {
            categoryVisibility[key] = p.categoryVisibility[key];
          }
        }
        return {
          ...current,
          ...p,
          categoryVisibility,
          regimeVisibility: {
            ...defaultRegimeVisibility,
            ...(p?.regimeVisibility ?? {}),
          },
        };
      },
    }
  )
);

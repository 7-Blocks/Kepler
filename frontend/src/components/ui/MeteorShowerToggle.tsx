import React from 'react';
import { useUIStore } from '@/store';
import { MaterialIcon } from '../MaterialIcon';

export const MeteorShowerToggle: React.FC = () => {
  const meteorShowerEnabled = useUIStore((s) => s.meteorShowerEnabled);
  const setMeteorShowerEnabled = useUIStore((s) => s.setMeteorShowerEnabled);

  return (
    <button
      type="button"
      onClick={() => setMeteorShowerEnabled(!meteorShowerEnabled)}
      aria-pressed={meteorShowerEnabled}
      aria-label={`Meteor effects ${meteorShowerEnabled ? 'enabled' : 'disabled'}`}
      className={`px-2.5 md:px-3.5 py-2 font-bold text-[10px] md:text-xs transition-ui border cursor-pointer flex items-center gap-1.5 ${
        meteorShowerEnabled
          ? 'bg-primary-container text-bg-deep-space border-primary-container'
          : 'border-primary-container text-primary-container hover:bg-primary-container/10'
      }`}
      title="Toggle meteor shower effects"
    >
      <MaterialIcon 
        name={meteorShowerEnabled ? 'stars' : 'stars'} 
        className="text-sm"
      />
      <span className="hidden sm:inline">METEORS</span>
    </button>
  );
};

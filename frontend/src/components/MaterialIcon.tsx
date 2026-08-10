import React from 'react';

interface MaterialIconProps {
  name: string;
  className?: string;
  filled?: boolean;
  style?: React.CSSProperties;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({ name, className = '', filled = false, style }) => {
  return (
    <span
      className={`material-symbols-outlined select-none align-middle ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1", ...style } : style}
    >
      {name}
    </span>
  );
};

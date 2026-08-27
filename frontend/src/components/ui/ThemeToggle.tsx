import React from 'react';
import { useThemeStore } from '@/store/themeStore';
import { MaterialIcon } from '@/components/MaterialIcon';

export const ThemeToggle: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      className="relative p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-primary hover:text-primary-fixed transition-ui cursor-pointer"
    >
      <MaterialIcon name={isLight ? 'dark_mode' : 'light_mode'} className="text-xl" />
    </button>
  );
};

export default ThemeToggle;

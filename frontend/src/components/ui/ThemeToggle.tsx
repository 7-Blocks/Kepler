import { useThemeStore } from '@/store/themeStore';
import { ToggleSwitch } from './ToggleSwitch';

export function ThemeToggle() {
    const theme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);

    const isDark = theme === 'dark';

    return (
        <ToggleSwitch
            checked={isDark}
            onChange={(checked) => {
                setTheme(checked ? 'dark' : 'light');
            }}
            label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            accentColor="var(--color-primary-container)"
        />
    );
}
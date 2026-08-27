import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeStore {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') {
        return 'dark';
    }

    const savedTheme = localStorage.getItem('kepler-theme');

    if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
    }

    return 'dark';
};

export const useThemeStore = create<ThemeStore>((set) => ({
    theme: getInitialTheme(),

    setTheme: (theme) => {
        document.documentElement.classList.toggle(
            'light',
            theme === 'light'
        );

        localStorage.setItem('kepler-theme', theme);

        set({ theme });
    },

    toggleTheme: () =>
        set((state) => {
            const newTheme =
                state.theme === 'dark' ? 'light' : 'dark';

            document.documentElement.classList.toggle(
                'light',
                newTheme === 'light'
            );

            localStorage.setItem('kepler-theme', newTheme);

            return { theme: newTheme };
        }),
}));
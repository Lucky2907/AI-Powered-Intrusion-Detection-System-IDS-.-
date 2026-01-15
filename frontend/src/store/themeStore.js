import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      darkMode: false,
      
      toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.darkMode;
        
        // Update document class
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        return { darkMode: newDarkMode };
      }),
      
      setDarkMode: (value) => set(() => {
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { darkMode: value };
      })
    }),
    {
      name: 'theme-storage'
    }
  )
);

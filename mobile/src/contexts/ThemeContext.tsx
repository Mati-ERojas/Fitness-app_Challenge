import { createContext, useMemo, useState, type PropsWithChildren } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, elevation, motion, radii, spacing, typography, type ColorScheme } from '@/theme/tokens';

export type ThemePreference = 'system' | ColorScheme;

type Theme = {
  colorScheme: ColorScheme;
  colors: (typeof colors)[ColorScheme];
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  motion: typeof motion;
  elevation: typeof elevation;
};

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  theme: Theme;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const colorScheme = preference === 'system' ? systemColorScheme : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      theme: {
        colorScheme,
        colors: colors[colorScheme],
        spacing,
        radii,
        typography,
        motion,
        elevation,
      },
    }),
    [colorScheme, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

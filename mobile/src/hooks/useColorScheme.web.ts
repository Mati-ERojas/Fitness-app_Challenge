import { useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme() {
  const nativeColorScheme = useNativeColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setColorScheme(nativeColorScheme === 'dark' ? 'dark' : 'light');
  }, [nativeColorScheme]);

  return colorScheme;
}

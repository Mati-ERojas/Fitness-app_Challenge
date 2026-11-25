import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as ExpoThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { theme } = useTheme();
  const { status } = useAuth();
  const baseNavigationTheme = theme.colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  return (
    <ExpoThemeProvider value={navigationTheme}>
      <StatusBar
        barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Protected
            guard={status === 'authenticated'}
            redirectTo={status === 'unauthenticated' ? '/(auth)/login' : '/'}
          >
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected
            guard={status === 'unauthenticated'}
            redirectTo={status === 'authenticated' ? '/(app)/home' : '/'}
          >
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </View>
    </ExpoThemeProvider>
  );
}

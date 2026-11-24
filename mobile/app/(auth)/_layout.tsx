import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

export default function AuthLayout() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== '/login' && pathname !== '/register') {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        router.dismissTo('/');
        return true;
      },
    );

    return () => subscription.remove();
  }, [pathname, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}

import { Redirect } from 'expo-router';

import { AuthInitializationErrorScreen } from '@/features/auth/components/AuthInitializationErrorScreen';
import { AuthLoadingScreen } from '@/features/auth/components/AuthLoadingScreen';
import { useAuth } from '@/hooks/useAuth';

export default function IndexScreen() {
  const auth = useAuth();

  if (auth.status === 'initializing') {
    return <AuthLoadingScreen />;
  }

  if (auth.status === 'initialization-error') {
    return (
      <AuthInitializationErrorScreen
        error={auth.error}
        onRetry={() => void auth.retryInitialization()}
      />
    );
  }

  if (auth.status === 'authenticated') {
    return <Redirect href="/(app)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

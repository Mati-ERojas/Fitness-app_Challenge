import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { DumbbellMark } from '@/components/DumbbellMark';
import type { AuthInitializationError } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';

type AuthInitializationErrorScreenProps = {
  error: AuthInitializationError;
  onRetry: () => void;
};

const errorMessages: Record<AuthInitializationError, string> = {
  storage: 'No pudimos acceder al almacenamiento seguro del dispositivo.',
  forbidden: 'El servidor no pudo autorizar la validación de tu sesión.',
  network: 'No pudimos conectar con el servidor. Revisá tu conexión.',
  server: 'El servidor no pudo validar tu sesión en este momento.',
  request: 'Ocurrió un problema al validar tu sesión.',
};

export function AuthInitializationErrorScreen({
  error,
  onRetry,
}: AuthInitializationErrorScreenProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.orb,
            styles.upperOrb,
            { backgroundColor: theme.colors.accent },
          ]}
        />
        <View
          style={[
            styles.orb,
            styles.lowerOrb,
            { backgroundColor: theme.colors.primary },
          ]}
        />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.glass,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
            ...theme.elevation.card,
          },
        ]}
      >
        <View style={styles.brandMark}>
          <DumbbellMark
            primary={theme.colors.primary}
            accent={theme.colors.accent}
          />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          No pudimos comprobar tu sesión
        </Text>
        <Text
          accessibilityRole="alert"
          style={[styles.description, { color: theme.colors.textSecondary }]}
        >
          {errorMessages[error]} No modificamos los datos de sesión. Podés
          volver a intentarlo.
        </Text>
        <Button label="Reintentar" onPress={onRetry} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 24,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
  },
  upperOrb: {
    width: 330,
    height: 330,
    top: -180,
    right: -170,
  },
  lowerOrb: {
    width: 280,
    height: 280,
    bottom: 40,
    left: -180,
    opacity: 0.07,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
    gap: 18,
    padding: 26,
    borderWidth: 1,
  },
  brandMark: {
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  description: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
  },
});

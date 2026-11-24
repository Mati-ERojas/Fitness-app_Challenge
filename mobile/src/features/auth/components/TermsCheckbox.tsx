import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type TermsCheckboxProps = {
  checked: boolean;
  error?: string;
  onToggle: () => void;
};

export function TermsCheckbox({ checked, error, onToggle }: TermsCheckboxProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityLabel="Acepto los términos y condiciones"
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={styles.row}>
        <View
          style={[
            styles.checkCircle,
            {
              borderColor: error ? theme.colors.error : checked ? theme.colors.primary : theme.colors.border,
              backgroundColor: checked ? theme.colors.primary : 'transparent',
            },
          ]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Acepto los <Text style={{ color: theme.colors.primary }}>Términos y Condiciones</Text>
        </Text>
      </Pressable>
      {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 13,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  label: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  error: {
    paddingLeft: 37,
    fontSize: 12,
    lineHeight: 17,
  },
});

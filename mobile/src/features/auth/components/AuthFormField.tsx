import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type AuthFieldKind = 'name' | 'email' | 'password';

type AuthFormFieldProps = {
  label: string;
  kind: AuthFieldKind;
  value: string;
  error?: string;
  touched?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onChangeText: (value: string) => void;
  onBlur: () => void;
};

export function AuthFormField({
  label,
  kind,
  value,
  error,
  touched = false,
  autoCapitalize,
  onChangeText,
  onBlur,
}: AuthFormFieldProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = kind === 'password';
  const showError = touched && Boolean(error);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.glass,
            borderColor: showError
              ? theme.colors.error
              : focused
                ? theme.colors.primary
                : theme.colors.border,
          },
        ]}>
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <FieldIcon kind={kind} color={theme.colors.textSecondary} />
        </View>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={showError ? error : undefined}
          autoCapitalize={autoCapitalize ?? (kind === 'name' ? 'words' : 'none')}
          autoCorrect={false}
          keyboardType={kind === 'email' ? ('email-address' satisfies KeyboardTypeOptions) : 'default'}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={label}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isPassword && !passwordVisible}
          selectionColor={theme.colors.primary}
          style={[styles.input, theme.typography.body, { color: theme.colors.text }]}
          textContentType={
            kind === 'email' ? 'emailAddress' : isPassword ? 'password' : 'name'
          }
          value={value}
        />
        {isPassword && (
          <Pressable
            accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityRole="button"
            accessibilityState={{ selected: passwordVisible }}
            hitSlop={8}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.visibilityButton}>
            <EyeIcon color={theme.colors.textSecondary} visible={passwordVisible} />
          </Pressable>
        )}
      </View>
      {showError && (
        <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

function FieldIcon({ kind, color }: { kind: AuthFieldKind; color: string }) {
  if (kind === 'name') {
    return (
      <View style={styles.userIcon}>
        <View style={[styles.userHead, { backgroundColor: color }]} />
        <View style={[styles.userBody, { backgroundColor: color }]} />
      </View>
    );
  }

  if (kind === 'email') {
    return (
      <View style={[styles.mailIcon, { borderColor: color }]}>
        <View style={[styles.mailLine, styles.mailLineLeft, { backgroundColor: color }]} />
        <View style={[styles.mailLine, styles.mailLineRight, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.lockIcon}>
      <View style={[styles.lockShackle, { borderColor: color }]} />
      <View style={[styles.lockBody, { backgroundColor: color }]}>
        <View style={styles.lockKeyhole} />
      </View>
    </View>
  );
}

function EyeIcon({ color, visible }: { color: string; visible: boolean }) {
  return (
    <View style={styles.eyeIcon}>
      <View style={[styles.eyeShape, { borderColor: color }]}>
        <View style={[styles.eyePupil, { backgroundColor: color }]} />
      </View>
      {!visible && <View style={[styles.eyeSlash, { backgroundColor: color }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  field: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 999,
  },
  iconTile: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
  },
  visibilityButton: {
    width: 38,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    paddingHorizontal: 14,
    fontSize: 12,
    lineHeight: 17,
  },
  userIcon: {
    width: 22,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  userHead: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  userBody: {
    width: 18,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },
  mailIcon: {
    width: 22,
    height: 16,
    overflow: 'hidden',
    borderWidth: 1.7,
    borderRadius: 3,
  },
  mailLine: {
    position: 'absolute',
    top: 4,
    width: 14,
    height: 1.5,
  },
  mailLineLeft: {
    left: -1,
    transform: [{ rotate: '35deg' }],
  },
  mailLineRight: {
    right: -1,
    transform: [{ rotate: '-35deg' }],
  },
  lockIcon: {
    width: 20,
    height: 23,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  lockBody: {
    width: 19,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  lockKeyhole: {
    width: 3,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#101827',
  },
  eyeIcon: {
    width: 22,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeShape: {
    width: 19,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  eyePupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eyeSlash: {
    position: 'absolute',
    width: 25,
    height: 1.5,
    transform: [{ rotate: '-42deg' }],
  },
});

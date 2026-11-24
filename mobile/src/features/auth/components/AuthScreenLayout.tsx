import { Link, type Href } from 'expo-router';
import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DumbbellMark } from '@/components/DumbbellMark';
import { useTheme } from '@/hooks/useTheme';

type AuthScreenLayoutProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  footerPrompt: string;
  footerLinkLabel: string;
  footerHref: Href;
}>;

export function AuthScreenLayout({
  eyebrow,
  title,
  description,
  footerPrompt,
  footerLinkLabel,
  footerHref,
  children,
}: AuthScreenLayoutProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.orb, styles.orbUpper, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.orb, styles.orbLower, { backgroundColor: theme.colors.accent }]} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.content,
              {
                maxWidth: 540,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
              },
            ]}>
            <View style={styles.header}>
              <Link href="/" dismissTo asChild>
                <Pressable
                  accessibilityLabel="Volver al inicio"
                  accessibilityRole="button"
                  hitSlop={8}
                  style={StyleSheet.flatten([
                    styles.backButton,
                    { backgroundColor: theme.colors.glass, borderColor: theme.colors.border },
                  ])}>
                  <Text style={[styles.backGlyph, { color: theme.colors.text }]}>‹</Text>
                </Pressable>
              </Link>
              <View style={styles.brand}>
                <DumbbellMark primary={theme.colors.primary} accent={theme.colors.accent} />
                <Text style={[styles.brandName, { color: theme.colors.text }]}>TrainPro</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.intro}>
              <Text style={[styles.eyebrow, theme.typography.caption, { color: theme.colors.primary }]}>
                {eyebrow}
              </Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
              <Text style={[styles.description, theme.typography.body, { color: theme.colors.textSecondary }]}>
                {description}
              </Text>
            </View>

            <View
              style={[
                styles.formPanel,
                {
                  backgroundColor: theme.colors.glass,
                  borderColor: theme.colors.border,
                  ...theme.elevation.card,
                },
              ]}>
              {children}
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerPrompt, { color: theme.colors.textSecondary }]}>
                {footerPrompt}
              </Text>
              <Link href={footerHref} asChild>
                <Pressable accessibilityRole="link" hitSlop={8}>
                  <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                    {footerLinkLabel}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: 24,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbUpper: {
    width: 340,
    height: 340,
    top: 24,
    right: -195,
    opacity: 0.16,
  },
  orbLower: {
    width: 280,
    height: 280,
    bottom: 12,
    left: -205,
    opacity: 0.08,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 22,
  },
  backGlyph: {
    marginTop: -4,
    fontSize: 36,
    lineHeight: 42,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 44,
  },
  intro: {
    gap: 12,
    marginTop: 12,
  },
  eyebrow: {
    fontWeight: '700',
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  description: {
    maxWidth: 480,
  },
  formPanel: {
    width: '100%',
    alignSelf: 'stretch',
    gap: 16,
    padding: 18,
    borderWidth: 1,
    borderRadius: 28,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
    rowGap: 4,
    paddingBottom: 8,
  },
  footerPrompt: {
    fontSize: 15,
    lineHeight: 22,
  },
  footerLink: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
});

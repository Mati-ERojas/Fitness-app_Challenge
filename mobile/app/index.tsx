import { useEffect } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
    Easing,
    ReduceMotion,
    cancelAnimation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

import { Button } from "@/components/Button";
import { DumbbellMark } from "@/components/DumbbellMark";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/hooks/useTheme";

const focusAreas = ["Alumnos", "Rutinas", "Progreso"];

export default function IndexScreen() {
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const compact = width < 380;
    const reduceMotion = useReducedMotion();
    const drift = useSharedValue(0);
    const upperOrbStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(drift.value, [0, 1], [0, -10]) },
            { translateX: interpolate(drift.value, [0, 1], [0, 7]) },
        ],
    }));
    const lowerOrbStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(drift.value, [0, 1], [0, 9]) },
            { translateX: interpolate(drift.value, [0, 1], [0, -6]) },
        ],
    }));

    useEffect(() => {
        if (reduceMotion) {
            drift.value = 0;
            return;
        }

        drift.value = withRepeat(
            withTiming(1, {
                duration: 7000,
                easing: Easing.inOut(Easing.quad),
                reduceMotion: ReduceMotion.System,
            }),
            -1,
            true,
            undefined,
            ReduceMotion.System,
        );

        return () => cancelAnimation(drift);
    }, [drift, reduceMotion]);

    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Animated.View
                    style={[
                        styles.backdropOrb,
                        styles.backdropOrbUpper,
                        { backgroundColor: theme.colors.accent },
                        upperOrbStyle,
                    ]}
                />
                <Animated.View
                    style={[
                        styles.backdropOrb,
                        styles.backdropOrbLower,
                        { backgroundColor: theme.colors.primary },
                        lowerOrbStyle,
                    ]}
                />
            </View>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={[
                        styles.content,
                        {
                            maxWidth: 520,
                            paddingHorizontal: compact
                                ? theme.spacing.lg
                                : theme.spacing.xl,
                            paddingVertical: theme.spacing.lg,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.brandRow,
                            { marginBottom: theme.spacing.xxl },
                        ]}
                    >
                        <DumbbellMark
                            primary={theme.colors.primary}
                            accent={theme.colors.accent}
                        />
                        <Text
                            style={[
                                styles.brandName,
                                { color: theme.colors.text },
                            ]}
                        >
                            TrainPro
                        </Text>
                    </View>

                    <View style={styles.copy}>
                        <Text
                            style={[
                                styles.eyebrow,
                                theme.typography.caption,
                                { color: theme.colors.primary },
                            ]}
                        >
                            PARA ENTRENADORES PROFESIONALES
                        </Text>
                        <Text
                            style={[
                                styles.heading,
                                theme.typography.display,
                                {
                                    color: theme.colors.text,
                                    fontSize: compact ? 38 : 44,
                                    lineHeight: compact ? 44 : 50,
                                },
                            ]}
                        >
                            Entrená con intención. Guiá cada progreso.
                        </Text>
                        <Text
                            style={[
                                styles.description,
                                theme.typography.body,
                                { color: theme.colors.textSecondary },
                            ]}
                        >
                            El espacio profesional para organizar tu trabajo y
                            potenciar el progreso de cada alumno.
                        </Text>
                    </View>

                    <View
                        accessibilityLabel="Alumnos, rutinas y progreso"
                        style={[
                            styles.focusAreas,
                            {
                                marginTop: theme.spacing.xl,
                                gap: theme.spacing.xs,
                            },
                        ]}
                        accessible
                    >
                        {focusAreas.map((area) => (
                            <View
                                key={area}
                                style={[
                                    styles.focusPill,
                                    {
                                        backgroundColor: theme.colors.glass,
                                        borderColor: theme.colors.border,
                                        paddingHorizontal: theme.spacing.md,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.focusDot,
                                        {
                                            backgroundColor:
                                                theme.colors.accent,
                                        },
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.focusLabel,
                                        { color: theme.colors.textSecondary },
                                    ]}
                                >
                                    {area}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View
                        style={[
                            styles.actions,
                            { marginTop: theme.spacing.xl },
                        ]}
                    >
                        <Button label="Crear cuenta" href="/(auth)/register" />
                        <Button
                            label="Iniciar sesión"
                            href="/(auth)/login"
                            variant="secondary"
                        />
                    </View>

                    <Text
                        style={[
                            styles.footer,
                            theme.typography.caption,
                            { color: theme.colors.textMuted },
                        ]}
                    >
                        Tu experiencia como entrenador, en movimiento.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        overflow: "hidden",
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        width: "100%",
        alignSelf: "center",
        overflow: "hidden",
    },
    backdropOrb: {
        position: "absolute",
        borderRadius: 999,
    },
    backdropOrbUpper: {
        width: 280,
        height: 280,
        top: "10%",
        right: "-25%",
        opacity: 0.12,
    },
    backdropOrbLower: {
        width: 220,
        height: 220,
        bottom: "14%",
        left: "-22%",
        opacity: 0.09,
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    brandName: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "700",
        letterSpacing: -0.5,
    },
    copy: {
        gap: 16,
    },
    eyebrow: {
        fontWeight: "700",
    },
    heading: {
        maxWidth: 500,
        fontWeight: "700",
        letterSpacing: -1.6,
    },
    description: {
        maxWidth: 450,
    },
    focusAreas: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    focusPill: {
        minHeight: 38,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderRadius: 999,
        paddingVertical: 8,
    },
    focusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    focusLabel: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600",
    },
    actions: {
        gap: 14,
    },
    footer: {
        marginTop: 30,
        textAlign: "center",
    },
});

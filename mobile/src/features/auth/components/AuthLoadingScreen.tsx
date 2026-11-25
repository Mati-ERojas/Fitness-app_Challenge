import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DumbbellMark } from "@/components/DumbbellMark";
import { useTheme } from "@/hooks/useTheme";

export function AuthLoadingScreen() {
    const { theme } = useTheme();

    return (
        <SafeAreaView
            style={[
                StyleSheet.absoluteFill,
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
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

            <View style={styles.content}>
                <View
                    style={[
                        styles.brand,
                        {
                            backgroundColor: theme.colors.glass,
                            borderColor: theme.colors.border,
                            borderRadius: theme.radii.lg,
                        },
                    ]}
                >
                    <DumbbellMark
                        primary={theme.colors.primary}
                        accent={theme.colors.accent}
                    />
                    <Text
                        style={[styles.brandName, { color: theme.colors.text }]}
                    >
                        TrainPro
                    </Text>
                </View>

                <View style={styles.loading}>
                    <ActivityIndicator
                        accessibilityLabel="Comprobando la sesión"
                        color={theme.colors.primary}
                        size="large"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    orb: {
        position: "absolute",
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
    content: {
        alignItems: "center",
        gap: 100,
    },
    brand: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 22,
        paddingVertical: 16,
        borderWidth: 1,
    },
    brandName: {
        fontSize: 30,
        lineHeight: 38,
        fontWeight: "800",
        letterSpacing: -0.8,
    },
    loading: {
        alignItems: "center",
        gap: 14,
    },
    loadingText: {
        fontSize: 14,
        lineHeight: 20,
    },
});

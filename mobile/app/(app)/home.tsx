import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { Button } from "@/components/Button";
import { DumbbellMark } from "@/components/DumbbellMark";
import { useAuth } from "@/hooks/useAuth";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/hooks/useTheme";

const upcomingAreas = [
    {
        number: "01",
        title: "Alumnos",
        description:
            "Organizá la información de las personas que entrenan con vos.",
    },
    {
        number: "02",
        title: "Rutinas",
        description:
            "Planificá propuestas de entrenamiento desde un mismo lugar.",
    },
    {
        number: "03",
        title: "Herramientas inteligentes",
        description:
            "Optimizá tu trabajo con nuevas herramientas para entrenadores.",
    },
];

export default function HomeScreen() {
    const { theme } = useTheme();
    const { status, user, logout } = useAuth();
    const router = useRouter();
    const logoutInProgress = useRef(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { width } = useWindowDimensions();
    const reduceMotion = useReducedMotion();
    const entranceProgress = useSharedValue(0);
    const isWide = width >= 760;
    const authenticatedUser = status === "authenticated" ? user : null;

    useEffect(() => {
        if (reduceMotion) {
            entranceProgress.value = 1;
            return;
        }

        entranceProgress.value = withTiming(1, {
            duration: theme.motion.transitionDuration,
            reduceMotion: ReduceMotion.System,
        });
    }, [entranceProgress, reduceMotion, theme.motion.transitionDuration]);

    const entranceStyle = useAnimatedStyle(() => ({
        opacity: entranceProgress.value,
        transform: [{ translateY: (1 - entranceProgress.value) * 10 }],
    }));

    const greeting = authenticatedUser
        ? `Hola, ${authenticatedUser.first_name}.`
        : status === "initializing"
          ? "Preparando tu espacio"
          : "Tu espacio profesional";

    const description = authenticatedUser
        ? "Todo lo que necesitás para acompañar cada entrenamiento, en un solo lugar."
        : status === "initializing"
          ? "Estamos validando tu sesión para preparar tu espacio."
          : status === "initialization-error"
            ? "No pudimos validar tu sesión en este momento."
            : "Iniciá sesión para acceder a tu espacio de trabajo.";

    const contentWidth = Math.min(width - theme.spacing.lg * 2, 980);

    const handleLogout = async () => {
        if (logoutInProgress.current) {
            return;
        }

        logoutInProgress.current = true;
        setIsLoggingOut(true);

        try {
            const result = await logout();
            if (result.remoteRevocationConfirmed && result.localTokenRemoved) {
                router.replace("/");
                return;
            }

            const message = !result.localTokenRemoved
                ? result.remoteRevocationConfirmed
                    ? "El servidor revocó la sesión, pero no se pudo confirmar la eliminación del token de este dispositivo."
                    : "No se pudo confirmar la revocación en el servidor ni la eliminación del token de este dispositivo."
                : "Se eliminó la sesión de este dispositivo, pero no se pudo confirmar su revocación en el servidor. Verificá tu conexión.\n\nLa API puede mantener activa la sesión hasta que expire o sea revocada.";

            Alert.alert(
                result.localTokenRemoved
                    ? "Cierre de sesión local"
                    : "No se pudo limpiar el almacenamiento",
                message,
                [
                    {
                        text: "Entendido",
                        onPress: () => router.replace("/"),
                    },
                ],
                { cancelable: false },
            );
        } finally {
            logoutInProgress.current = false;
            setIsLoggingOut(false);
        }
    };

    return (
        <SafeAreaView
            edges={["top", "bottom"]}
            style={[
                styles.safeArea,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <View
                    style={[
                        styles.backgroundOrb,
                        styles.upperOrb,
                        { backgroundColor: theme.colors.primary },
                    ]}
                />
                <View
                    style={[
                        styles.backgroundOrb,
                        styles.lowerOrb,
                        { backgroundColor: theme.colors.accent },
                    ]}
                />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.content,
                        { width: contentWidth, gap: theme.spacing.xl },
                        entranceStyle,
                    ]}
                >
                    <View style={styles.header}>
                        <View style={styles.brand}>
                            <View
                                style={[
                                    styles.brandMark,
                                    {
                                        backgroundColor: theme.colors.glass,
                                        borderColor: theme.colors.border,
                                    },
                                ]}
                            >
                                <DumbbellMark
                                    primary={theme.colors.primary}
                                    accent={theme.colors.accent}
                                />
                            </View>
                            <View>
                                <Text
                                    style={[
                                        styles.brandName,
                                        { color: theme.colors.text },
                                    ]}
                                >
                                    TrainPro
                                </Text>
                                <Text
                                    style={[
                                        styles.brandCaption,
                                        { color: theme.colors.textMuted },
                                    ]}
                                >
                                    ESPACIO DE ENTRENAMIENTO
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.welcome}>
                        <Text
                            style={[
                                styles.eyebrow,
                                { color: theme.colors.primary },
                            ]}
                        >
                            PANEL PRINCIPAL
                        </Text>
                        <Text
                            style={[styles.title, { color: theme.colors.text }]}
                        >
                            {greeting}
                        </Text>
                        <Text
                            style={[
                                styles.description,
                                { color: theme.colors.textSecondary },
                            ]}
                        >
                            {description}
                        </Text>
                    </View>

                    {status === "initialization-error" ? (
                        <View
                            accessibilityRole="alert"
                            style={[
                                styles.notice,
                                {
                                    backgroundColor: theme.colors.glass,
                                    borderColor: theme.colors.border,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.noticeTitle,
                                    { color: theme.colors.text },
                                ]}
                            >
                                No se pudo validar la sesión
                            </Text>
                            <Text
                                style={[
                                    styles.noticeText,
                                    { color: theme.colors.textSecondary },
                                ]}
                            >
                                No se pudo completar la validación de tu cuenta.
                                Volvé a intentarlo más tarde.
                            </Text>
                        </View>
                    ) : null}

                    <LinearGradient
                        colors={
                            theme.colorScheme === "dark"
                                ? ["#1E40AF", "#1D4ED8", "#0F172A"]
                                : ["#1D4ED8", "#2563EB", "#0369A1"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.hero,
                            {
                                borderColor:
                                    theme.colorScheme === "dark"
                                        ? "rgba(147, 197, 253, 0.34)"
                                        : "rgba(255, 255, 255, 0.28)",
                                borderRadius: theme.radii.lg,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.heroGlow,
                                { backgroundColor: theme.colors.accent },
                            ]}
                        />
                        <View
                            style={[
                                styles.heroMain,
                                isWide && styles.heroMainWide,
                            ]}
                        >
                            <View style={styles.heroCopy}>
                                <Text style={styles.heroEyebrow}>
                                    TRAINPRO · PARA ENTRENADORES
                                </Text>
                                <Text
                                    style={[
                                        styles.heroTitle,
                                        !isWide && styles.heroTitleCompact,
                                    ]}
                                >
                                    Más foco en cada persona. Más claridad en tu
                                    trabajo.
                                </Text>
                                <Text style={styles.heroDescription}>
                                    Un espacio para organizar y potenciar tu
                                    trabajo como profesional del entrenamiento.
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.heroVisual,
                                    !isWide && styles.heroVisualCompact,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.heroIconHalo,
                                        !isWide && styles.heroIconHaloCompact,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.heroMarkScale,
                                            !isWide &&
                                                styles.heroMarkScaleCompact,
                                        ]}
                                    >
                                        <DumbbellMark
                                            primary="#FFFFFF"
                                            accent="#7DD3FC"
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={styles.heroFooter}>
                            <View style={styles.heroFooterLine} />
                            <Text style={styles.heroFooterText}>
                                TU ESPACIO PARA CRECER
                            </Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.sectionHeading}>
                        <View>
                            <Text
                                style={[
                                    styles.sectionTitle,
                                    { color: theme.colors.text },
                                ]}
                            >
                                Tu espacio de trabajo
                            </Text>
                            <Text
                                style={[
                                    styles.sectionSubtitle,
                                    { color: theme.colors.textSecondary },
                                ]}
                            >
                                Estamos preparando nuevas herramientas para vos.
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.sectionIndex,
                                { color: theme.colors.primary },
                            ]}
                        >
                            01 / 03
                        </Text>
                    </View>

                    <View style={[styles.areas, isWide && styles.areasWide]}>
                        {upcomingAreas.map((area) => (
                            <View
                                key={area.number}
                                style={[
                                    styles.areaCard,
                                    isWide && styles.areaCardWide,
                                    {
                                        backgroundColor: theme.colors.glass,
                                        borderColor: theme.colors.border,
                                        borderRadius: theme.radii.md,
                                        ...theme.elevation.card,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.areaTop,
                                        { backgroundColor: "none" },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.areaNumber,
                                            { color: theme.colors.primary },
                                        ]}
                                    >
                                        {area.number}
                                    </Text>
                                    <View
                                        style={[
                                            styles.statusPill,
                                            {
                                                backgroundColor:
                                                    theme.colors
                                                        .disabledSurface,
                                                borderColor:
                                                    theme.colors.border,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                {
                                                    color: theme.colors
                                                        .textMuted,
                                                },
                                            ]}
                                        >
                                            PRÓXIMAMENTE
                                        </Text>
                                    </View>
                                </View>
                                <Text
                                    style={[
                                        styles.areaTitle,
                                        { color: theme.colors.text },
                                    ]}
                                >
                                    {area.title}
                                </Text>
                                <Text
                                    style={[
                                        styles.areaDescription,
                                        { color: theme.colors.textSecondary },
                                    ]}
                                >
                                    {area.description}
                                </Text>
                                <View
                                    style={[
                                        styles.areaRule,
                                        {
                                            backgroundColor:
                                                theme.colors.border,
                                        },
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.areaFootnote,
                                        { color: theme.colors.textMuted },
                                    ]}
                                >
                                    EN DESARROLLO
                                </Text>
                            </View>
                        ))}
                    </View>

                    {authenticatedUser ? (
                        <View
                            style={[
                                styles.accountCard,
                                {
                                    backgroundColor: theme.colors.glass,
                                    borderColor: theme.colors.border,
                                    borderRadius: theme.radii.md,
                                },
                            ]}
                        >
                            <View style={styles.accountHeader}>
                                <View style={styles.accountAccent}>
                                    <Text
                                        style={[
                                            styles.accountInitial,
                                            { color: theme.colors.primary },
                                        ]}
                                    >
                                        {authenticatedUser.first_name
                                            .charAt(0)
                                            .toLocaleUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.accountDetails}>
                                    <Text
                                        style={[
                                            styles.accountEyebrow,
                                            { color: theme.colors.textMuted },
                                        ]}
                                    >
                                        TU CUENTA
                                    </Text>
                                    <Text
                                        style={[
                                            styles.accountName,
                                            { color: theme.colors.text },
                                        ]}
                                    >
                                        {authenticatedUser.first_name}{" "}
                                        {authenticatedUser.last_name}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.accountEmail,
                                            {
                                                color: theme.colors
                                                    .textSecondary,
                                            },
                                        ]}
                                    >
                                        {authenticatedUser.email}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.logoutButtonFrame}>
                                <View style={styles.logoutButtonScale}>
                                    <Button
                                        label="Cerrar sesión"
                                        variant="auth"
                                        onPress={handleLogout}
                                        loading={isLoggingOut}
                                        enabledStyle={{
                                            textColor: "#FFFFFF",
                                            backgroundColor: "#991B1B",
                                            backgroundGradient:
                                                theme.colorScheme === "dark"
                                                    ? [
                                                          "#B91C1C",
                                                          "#991B1B",
                                                          "#7F1D1D",
                                                      ]
                                                    : [
                                                          "#e82525",
                                                          "rgb(211, 22, 22)",
                                                          "#c21111",
                                                      ],
                                            borderColor:
                                                "rgba(255, 255, 255, 0.38)",
                                            borderWidth: 1,
                                            borderRadius: theme.radii.pill,
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    ) : null}

                    {status === "unauthenticated" ? (
                        <Button
                            label="Iniciar sesión"
                            href="/(auth)/login"
                            variant="secondary"
                        />
                    ) : null}

                    <Text
                        style={[
                            styles.footer,
                            { color: theme.colors.textMuted },
                        ]}
                    >
                        TrainPro · Diseñado para acompañar tu trabajo.
                    </Text>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 36,
    },
    content: {
        alignSelf: "center",
        maxWidth: 980,
    },
    backgroundOrb: {
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
    header: {
        minHeight: 58,
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    brand: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    brandMark: {
        width: 54,
        height: 54,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderRadius: 18,
    },
    brandName: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    brandCaption: {
        marginTop: 2,
        fontSize: 9,
        lineHeight: 13,
        letterSpacing: 1.1,
        fontWeight: "700",
    },
    accountCard: {
        flexDirection: "column",
        alignItems: "stretch",
        gap: 14,
        padding: 16,
        borderWidth: 1,
    },
    accountHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        width: "100%",
    },
    logoutButtonFrame: {
        width: "100%",
        height: 54,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    logoutButtonScale: {
        width: "100%",
        transform: [{ scale: 0.84 }],
    },
    comingSoon: {
        fontSize: 10,
        lineHeight: 14,
    },
    welcome: {
        gap: 9,
        marginTop: 4,
    },
    eyebrow: {
        fontSize: 11,
        lineHeight: 16,
        letterSpacing: 1.6,
        fontWeight: "800",
    },
    title: {
        fontSize: 36,
        lineHeight: 43,
        letterSpacing: -1.2,
        fontWeight: "800",
    },
    description: {
        maxWidth: 620,
        fontSize: 16,
        lineHeight: 24,
    },
    notice: {
        padding: 16,
        gap: 4,
        borderWidth: 1,
        borderRadius: 16,
    },
    noticeTitle: {
        fontSize: 14,
        fontWeight: "700",
    },
    noticeText: {
        fontSize: 13,
        lineHeight: 19,
    },
    hero: {
        minHeight: 250,
        overflow: "hidden",
        padding: 24,
        borderWidth: 1,
        ...StyleSheet.flatten({
            shadowColor: "#1D4ED8",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.24,
            shadowRadius: 24,
            elevation: 8,
        }),
    },
    heroGlow: {
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: 140,
        right: -105,
        top: -110,
        opacity: 0.16,
    },
    heroMain: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    heroMainWide: {
        gap: 24,
    },
    heroCopy: {
        flex: 1,
        gap: 11,
    },
    heroEyebrow: {
        color: "rgba(255, 255, 255, 0.76)",
        fontSize: 10,
        lineHeight: 15,
        letterSpacing: 1.2,
        fontWeight: "800",
    },
    heroTitle: {
        maxWidth: 520,
        color: "#FFFFFF",
        fontSize: 25,
        lineHeight: 31,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    heroTitleCompact: {
        fontSize: 21,
        lineHeight: 27,
    },
    heroDescription: {
        maxWidth: 480,
        color: "rgba(255, 255, 255, 0.82)",
        fontSize: 14,
        lineHeight: 21,
    },
    heroVisual: {
        width: 92,
        height: 112,
        alignItems: "center",
        justifyContent: "center",
    },
    heroVisualCompact: {
        width: 62,
        height: 74,
    },
    heroIconHalo: {
        width: 84,
        height: 84,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.28)",
        borderRadius: 42,
        backgroundColor: "rgba(255, 255, 255, 0.14)",
    },
    heroIconHaloCompact: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    heroMarkScale: {
        transform: [{ scale: 1.25 }],
    },
    heroMarkScaleCompact: {
        transform: [{ scale: 0.9 }],
    },
    heroFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 20,
    },
    heroFooterLine: {
        width: 28,
        height: 2,
        borderRadius: 1,
        backgroundColor: "#7DD3FC",
    },
    heroFooterText: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 9,
        lineHeight: 14,
        letterSpacing: 1.2,
        fontWeight: "700",
    },
    sectionHeading: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 21,
        lineHeight: 27,
        fontWeight: "800",
        letterSpacing: -0.4,
    },
    sectionSubtitle: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 19,
    },
    sectionIndex: {
        fontSize: 11,
        lineHeight: 16,
        letterSpacing: 1,
        fontWeight: "800",
    },
    areas: {
        gap: 14,
    },
    areasWide: {
        flexDirection: "row",
        alignItems: "stretch",
    },
    areaCard: {
        minHeight: 178,
        padding: 18,
        borderWidth: 1,
        gap: 10,
    },
    areaCardWide: {
        flex: 1,
    },
    areaTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 4,
    },
    areaNumber: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "800",
        letterSpacing: 1,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderRadius: 999,
    },
    statusText: {
        fontSize: 8,
        lineHeight: 11,
        letterSpacing: 0.7,
        fontWeight: "800",
    },
    areaTitle: {
        fontSize: 17,
        lineHeight: 23,
        fontWeight: "700",
    },
    areaDescription: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
    },
    areaRule: {
        height: StyleSheet.hairlineWidth,
        marginTop: 2,
    },
    areaFootnote: {
        fontSize: 9,
        lineHeight: 13,
        letterSpacing: 1,
        fontWeight: "700",
    },
    accountAccent: {
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(56, 189, 248, 0.34)",
        borderRadius: 24,
        backgroundColor: "rgba(37, 99, 235, 0.1)",
    },
    accountInitial: {
        fontSize: 20,
        fontWeight: "800",
    },
    accountDetails: {
        flex: 1,
        gap: 2,
    },
    accountEyebrow: {
        fontSize: 9,
        lineHeight: 13,
        letterSpacing: 1.2,
        fontWeight: "800",
    },
    accountName: {
        fontSize: 15,
        lineHeight: 21,
        fontWeight: "700",
    },
    accountEmail: {
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        alignSelf: "center",
        textAlign: "center",
        fontSize: 11,
        lineHeight: 16,
    },
});

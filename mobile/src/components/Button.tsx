import { Link, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    type ColorValue,
    type PressableStateCallbackType,
} from "react-native";
import Animated, {
    ReduceMotion,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/hooks/useTheme";

export type ButtonVisualStyle = {
    textColor: ColorValue;
    backgroundColor: ColorValue;
    backgroundGradient?: readonly [ColorValue, ColorValue, ...ColorValue[]];
    borderColor: ColorValue;
    borderWidth: number;
    borderRadius: number;
};

export type ButtonProps = {
    label: string;
    href?: Href;
    onPress?: () => void;
    variant?: "primary" | "secondary" | "auth";
    disabled?: boolean;
    loading?: boolean;
    enabledStyle?: Partial<ButtonVisualStyle>;
    disabledStyle?: Partial<ButtonVisualStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

export function Button({
    label,
    href,
    onPress,
    variant = "primary",
    disabled = false,
    loading = false,
    enabledStyle,
    disabledStyle,
}: ButtonProps) {
    const { theme } = useTheme();
    const reduceMotion = useReducedMotion();
    const scale = useSharedValue(1);
    const isDisabled = disabled || loading;
    const isAuth = variant === "auth";
    const isSecondary = variant === "secondary";
    const defaultEnabledStyle: ButtonVisualStyle = {
        textColor: isSecondary
            ? theme.colors.primary
            : theme.colors.primaryText,
        backgroundColor: isSecondary
            ? theme.colors.surface
            : isAuth
              ? "#4F46E5"
              : theme.colors.primary,
        backgroundGradient: isAuth
            ? ["#7C3AED", "#2563EB", "#0284C7"]
            : undefined,
        borderColor: isSecondary
            ? theme.colors.accent
            : isAuth
              ? "#38BDF8"
              : theme.colors.primary,
        borderWidth: isSecondary ? 1.5 : 1,
        borderRadius: theme.radii.pill,
    };
    const defaultDisabledStyle: ButtonVisualStyle = {
        textColor: theme.colors.disabledText,
        backgroundColor: theme.colors.disabledSurface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.radii.pill,
    };
    const enabledAppearance = { ...defaultEnabledStyle, ...enabledStyle };
    const disabledAppearance = {
        ...defaultDisabledStyle,
        ...disabledStyle,
        ...(isAuth ? { backgroundGradient: undefined } : {}),
    };
    const appearance = isDisabled ? disabledAppearance : enabledAppearance;
    const contentColor = appearance.textColor;
    const hasCustomDisabledStyle = disabledStyle !== undefined;
    const shouldDim = isDisabled && !hasCustomDisabledStyle;
    const disabledProgress = useSharedValue(isDisabled ? 1 : 0);
    useEffect(() => {
        const nextValue = isDisabled ? 1 : 0;
        if (reduceMotion) {
            disabledProgress.value = nextValue;
            return;
        }

        disabledProgress.value = withTiming(nextValue, {
            duration: theme.motion.transitionDuration,
            reduceMotion: ReduceMotion.System,
        });
    }, [
        disabledProgress,
        isDisabled,
        reduceMotion,
        theme.motion.transitionDuration,
    ]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    const authSurfaceStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            disabledProgress.value,
            [0, 1],
            [
                enabledAppearance.backgroundColor as string,
                disabledAppearance.backgroundColor as string,
            ],
        ),
    }));
    const authBorderStyle = useAnimatedStyle(() => ({
        borderColor: interpolateColor(
            disabledProgress.value,
            [0, 1],
            [
                enabledAppearance.borderColor as string,
                disabledAppearance.borderColor as string,
            ],
        ),
    }));
    const authTextStyle = useAnimatedStyle(() => ({
        color: interpolateColor(
            disabledProgress.value,
            [0, 1],
            [
                enabledAppearance.textColor as string,
                disabledAppearance.textColor as string,
            ],
        ),
    }));
    const enabledGradientStyle = useAnimatedStyle(() => ({
        opacity: 1 - disabledProgress.value,
    }));
    const disabledGradientStyle = useAnimatedStyle(() => ({
        opacity: disabledProgress.value,
    }));

    const control = (
        <AnimatedPressable
            accessibilityLabel={label}
            accessibilityRole={href ? "link" : "button"}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            disabled={isDisabled}
            onPress={onPress}
            onPressIn={() => {
                if (!isDisabled && !reduceMotion) {
                    scale.value = withTiming(theme.motion.pressScale, {
                        duration: theme.motion.pressDuration,
                        reduceMotion: ReduceMotion.System,
                    });
                }
            }}
            onPressOut={() => {
                scale.value = withTiming(1, {
                    duration: theme.motion.pressDuration,
                    reduceMotion: ReduceMotion.System,
                });
            }}
            style={(state: PressableStateCallbackType) => [
                styles.button,
                animatedStyle,
                {
                    minHeight: 64,
                    borderWidth: isAuth ? 0 : appearance.borderWidth,
                    borderRadius: appearance.borderRadius,
                    paddingLeft: isAuth ? theme.spacing.md : theme.spacing.lg,
                    paddingRight: isAuth ? theme.spacing.md : theme.spacing.xs,
                    backgroundColor: isAuth
                        ? enabledAppearance.backgroundColor
                        : appearance.backgroundColor,
                    borderColor: isAuth
                        ? enabledAppearance.borderColor
                        : appearance.borderColor,
                    shadowColor:
                        isAuth && !isDisabled ? "#4F46E5" : "transparent",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isAuth && !isDisabled ? 0.32 : 0,
                    shadowRadius: 14,
                    elevation: isAuth && !isDisabled ? 6 : 0,
                    opacity: shouldDim
                        ? 0.55
                        : state.pressed && !isDisabled && !reduceMotion
                          ? 0.94
                          : 1,
                },
                isAuth && authSurfaceStyle,
            ]}
        >
            {isAuth && (
                <>
                    {enabledAppearance.backgroundGradient && (
                        <Animated.View
                            pointerEvents="none"
                            style={[styles.gradientLayer, enabledGradientStyle]}
                        >
                            <LinearGradient
                                colors={enabledAppearance.backgroundGradient}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={[
                                    styles.gradient,
                                    {
                                        top: enabledAppearance.borderWidth,
                                        right: enabledAppearance.borderWidth,
                                        bottom: enabledAppearance.borderWidth,
                                        left: enabledAppearance.borderWidth,
                                        borderRadius: Math.max(
                                            0,
                                            enabledAppearance.borderRadius -
                                                enabledAppearance.borderWidth,
                                        ),
                                    },
                                ]}
                            />
                        </Animated.View>
                    )}
                    {disabledAppearance.backgroundGradient && (
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.gradientLayer,
                                disabledGradientStyle,
                            ]}
                        >
                            <LinearGradient
                                colors={disabledAppearance.backgroundGradient}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={[
                                    styles.gradient,
                                    {
                                        top: disabledAppearance.borderWidth,
                                        right: disabledAppearance.borderWidth,
                                        bottom: disabledAppearance.borderWidth,
                                        left: disabledAppearance.borderWidth,
                                        borderRadius: Math.max(
                                            0,
                                            disabledAppearance.borderRadius -
                                                disabledAppearance.borderWidth,
                                        ),
                                    },
                                ]}
                            />
                        </Animated.View>
                    )}
                </>
            )}
            {loading ? (
                <ActivityIndicator
                    color={contentColor}
                    style={styles.loadingIndicator}
                />
            ) : (
                <View style={[styles.content, isAuth && styles.authContent]}>
                    <AnimatedText
                        style={[
                            styles.label,
                            theme.typography.body,
                            isAuth ? styles.authLabel : styles.emphasizedLabel,
                            { color: contentColor },
                            isAuth && authTextStyle,
                        ]}
                    >
                        {label}
                    </AnimatedText>
                    <View
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={[
                            isAuth ? styles.authArrowBox : styles.arrowBox,
                            !isAuth && {
                                backgroundColor: isSecondary
                                    ? theme.colors.glass
                                    : "rgba(255, 255, 255, 0.16)",
                                borderColor: isSecondary
                                    ? theme.colors.border
                                    : "rgba(255, 255, 255, 0.24)",
                            },
                        ]}
                    >
                        <AnimatedText
                            style={[
                                styles.arrow,
                                isAuth && styles.authArrow,
                                { color: contentColor },
                                isAuth && authTextStyle,
                            ]}
                        >
                            {isAuth ? "" : "›"}
                        </AnimatedText>
                    </View>
                </View>
            )}
            {isAuth && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.authBorder,
                        {
                            borderWidth: Math.max(appearance.borderWidth, 2),
                            borderRadius: appearance.borderRadius,
                        },
                        authBorderStyle,
                    ]}
                />
            )}
        </AnimatedPressable>
    );

    return href ? (
        <Link href={href} asChild>
            {control}
        </Link>
    ) : (
        control
    );
}

const styles = StyleSheet.create({
    button: {
        width: "100%",
        alignSelf: "stretch",
        alignItems: "stretch",
        position: "relative",
        justifyContent: "center",
        overflow: "hidden",
    },
    content: {
        width: "100%",
        alignSelf: "stretch",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    authContent: {
        flex: 1,
        minHeight: 62,
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontWeight: "600",
    },
    emphasizedLabel: {
        fontSize: 17,
        fontWeight: "700",
    },
    authLabel: {
        width: "100%",
        fontSize: 19,
        fontWeight: "700",
        textAlign: "center",
    },
    arrowBox: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderRadius: 22,
    },
    authArrowBox: {
        position: "absolute",
        right: 4,
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    authArrow: {
        fontSize: 28,
        lineHeight: 34,
    },
    arrow: {
        fontSize: 22,
        lineHeight: 30,
        includeFontPadding: false,
        textAlign: "center",
        fontWeight: "700",
    },
    gradient: {
        position: "absolute",
    },
    gradientLayer: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    authBorder: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    loadingIndicator: {
        alignSelf: "center",
    },
});

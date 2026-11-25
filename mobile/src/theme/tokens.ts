export type ColorScheme = "light" | "dark";

export type ThemeColors = {
    background: string;
    surface: string;
    glass: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    accent: string;
    border: string;
    disabledSurface: string;
    disabledText: string;
    success: string;
    warning: string;
    error: string;
    offline: string;
};

export const colors: Record<ColorScheme, ThemeColors> = {
    light: {
        background: "#F1F5F9",
        surface: "#FFFFFF",
        glass: "rgba(255, 255, 255, 0.90)",
        text: "#0F172A",
        textSecondary: "#334155",
        textMuted: "#64748B",
        primary: "#2563EB",
        primaryText: "#2d2d2d",
        accent: "#38BDF8",
        border: "#CBD5E1",
        disabledSurface: "#E2E8F0",
        disabledText: "#64748B",
        success: "#15803D",
        warning: "#A16207",
        error: "#B91C1C",
        offline: "#64748B",
    },
    dark: {
        background: "#101827",
        surface: "#1E293B",
        glass: "rgba(30, 41, 59, 0.82)",
        text: "#F8FAFC",
        textSecondary: "#CBD5E1",
        textMuted: "#94A3B8",
        primary: "#2563EB",
        primaryText: "#FFFFFF",
        accent: "#38BDF8",
        border: "rgba(203, 213, 225, 0.20)",
        disabledSurface: "#334155",
        disabledText: "#94A3B8",
        success: "#4ADE80",
        warning: "#FACC15",
        error: "#F87171",
        offline: "#94A3B8",
    },
};

export const spacing = {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
} as const;

export const radii = {
    sm: 10,
    md: 16,
    lg: 24,
    pill: 999,
} as const;

export const typography = {
    caption: { fontSize: 12, lineHeight: 18, letterSpacing: 1.2 },
    body: { fontSize: 16, lineHeight: 24 },
    bodySmall: { fontSize: 14, lineHeight: 21 },
    title: { fontSize: 32, lineHeight: 38 },
    display: { fontSize: 42, lineHeight: 48 },
} as const;

export const motion = {
    pressDuration: 150,
    transitionDuration: 220,
    pressScale: 0.985,
} as const;

export const elevation = {
    card: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
    },
} as const;

import { Formik } from "formik";
import axios from "axios";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { loginSchema } from "@/features/auth/schemas/authSchemas";
import { login } from "@/features/auth/services/authService";
import type { LoginFormValues } from "@/features/auth/types/forms";
import { normalizeEmail } from "@/features/auth/utils/normalizeEmail";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
    tokenStorage,
    TokenStorageError,
} from "@/services/storage/tokenStorage";

const initialValues: LoginFormValues = {
    email: "",
    password: "",
};

type LoginStatus = {
    kind: "error";
    message: string;
};

function getLoginErrorMessage(error: unknown): string {
    if (error instanceof TokenStorageError) {
        return "Iniciaste sesión, pero no pudimos guardar tu sesión de forma segura. Intentá nuevamente.";
    }

    if (!axios.isAxiosError(error)) {
        return "No pudimos iniciar sesión. Intentá nuevamente.";
    }

    switch (error.response?.status) {
        case 401:
            return "El correo o la contraseña son incorrectos.";
        case 422:
            return "Revisa el correo y la contraseña ingresados.";
        case 429:
            return "Demasiados intentos. Esperá un momento antes de volver a intentar.";
        default:
            return error.response
                ? "No pudimos iniciar sesión. Intentá nuevamente."
                : "No pudimos conectar con el servidor. Revisa tu conexión e intentá nuevamente.";
    }
}

export default function LoginScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { setAuthenticatedUser } = useAuth();
    const submissionInProgress = useRef(false);

    return (
        <AuthScreenLayout
            eyebrow="INICIAR SESIÓN"
            title="Qué bueno verte de nuevo"
            description="Iniciá sesión para seguir acompañando el progreso de tus alumnos."
            footerPrompt="¿Todavía no tenés una cuenta?"
            footerLinkLabel="Crear cuenta"
            footerHref="/(auth)/register"
        >
            <Formik<LoginFormValues>
                initialValues={initialValues}
                validationSchema={loginSchema}
                validateOnMount
                onSubmit={async (values, { setStatus }) => {
                    if (submissionInProgress.current) return;

                    submissionInProgress.current = true;
                    setStatus(undefined);

                    try {
                        const response = await login({
                            email: normalizeEmail(values.email),
                            password: values.password,
                        });

                        await tokenStorage.save(response.access_token);
                        setAuthenticatedUser(response.user);
                        router.replace("/(app)/home");
                    } catch (error) {
                        setStatus({
                            kind: "error",
                            message: getLoginErrorMessage(error),
                        });
                    } finally {
                        submissionInProgress.current = false;
                    }
                }}
            >
                {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    setFieldTouched,
                    setFieldValue,
                    handleSubmit,
                    isValid,
                    isSubmitting,
                    dirty,
                    status,
                }) => (
                    <View
                        style={{
                            width: "100%",
                            alignSelf: "stretch",
                            gap: theme.spacing.md,
                        }}
                    >
                        <AuthFormField
                            label="Correo electrónico"
                            kind="email"
                            value={values.email}
                            error={errors.email}
                            touched={touched.email}
                            onChangeText={handleChange("email")}
                            onBlur={() => {
                                void setFieldValue(
                                    "email",
                                    normalizeEmail(values.email),
                                );
                                void setFieldTouched("email", true);
                            }}
                        />
                        <AuthFormField
                            label="Contraseña"
                            kind="password"
                            value={values.password}
                            error={errors.password}
                            touched={touched.password}
                            onChangeText={handleChange("password")}
                            onBlur={() =>
                                void setFieldTouched("password", true)
                            }
                        />
                        {status ? (
                            <Text
                                accessibilityRole="alert"
                                style={{
                                    color: theme.colors.error,
                                    ...theme.typography.bodySmall,
                                }}
                            >
                                {status.message}
                            </Text>
                        ) : null}
                        <Button
                            label="Iniciar sesión"
                            variant="auth"
                            enabledStyle={{
                                textColor: "#FFFFFF",
                                backgroundColor: "#4F46E5",
                                backgroundGradient: [
                                    "#7C3AED",
                                    theme.colors.primary,
                                    "#0284C7",
                                ],
                                borderWidth: 1,
                                borderRadius: 999,
                            }}
                            disabledStyle={{
                                textColor: theme.colors.textMuted,
                                backgroundColor: "rgba(148, 163, 184, 0.22)",
                                borderColor:
                                    theme.colorScheme === "dark"
                                        ? "rgba(226, 232, 240, 0.25)"
                                        : "rgba(100, 116, 139, 0.25)",
                                borderWidth: 1.5,
                                borderRadius: 999,
                            }}
                            disabled={!dirty || !isValid || isSubmitting}
                            loading={isSubmitting}
                            onPress={() => handleSubmit()}
                        />
                    </View>
                )}
            </Formik>
        </AuthScreenLayout>
    );
}

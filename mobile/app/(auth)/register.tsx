import { Formik } from "formik";
import axios from "axios";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { TermsCheckbox } from "@/features/auth/components/TermsCheckbox";
import { registerSchema } from "@/features/auth/schemas/authSchemas";
import { register } from "@/features/auth/services/authService";
import type { RegisterFormValues } from "@/features/auth/types/forms";
import { normalizeEmail } from "@/features/auth/utils/normalizeEmail";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
    tokenStorage,
    TokenStorageError,
} from "@/services/storage/tokenStorage";

const initialValues: RegisterFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
};

type RegisterStatus = {
    kind: "error";
    message: string;
};

function getRegisterErrorMessage(error: unknown): string {
    if (error instanceof TokenStorageError) {
        return error.operation === "save"
            ? "La cuenta se creó, pero no pudimos guardar la sesión de forma segura. Iniciá sesión para continuar."
            : "No pudimos acceder al almacenamiento seguro. Intentá nuevamente.";
    }

    if (!axios.isAxiosError(error)) {
        return "No pudimos completar el registro. Intentá nuevamente.";
    }

    switch (error.response?.status) {
        case 409:
            return "Ya existe una cuenta con ese correo electrónico. Probá iniciar sesión.";
        case 422:
            return "Revisá los datos ingresados y aceptá los términos y condiciones.";
        default:
            return error.response
                ? "No pudimos completar el registro. Intentá nuevamente."
                : "No pudimos conectar con el servidor. Revisá tu conexión e intentá nuevamente. Si el registro llegó a completarse, probá iniciar sesión.";
    }
}

export default function RegisterScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { setAuthenticatedUser } = useAuth();
    const submissionInProgress = useRef(false);

    return (
        <AuthScreenLayout
            eyebrow="CREAR CUENTA"
            title="Comienza tu entrenamiento"
            description="Unite a TrainPro y alcanzá tus objetivos."
            footerPrompt="¿Ya tenés una cuenta?"
            footerLinkLabel="Iniciar sesión"
            footerHref="/(auth)/login"
        >
            <Formik<RegisterFormValues>
                initialValues={initialValues}
                validationSchema={registerSchema}
                validateOnMount
                onSubmit={async (values, { setStatus }) => {
                    if (submissionInProgress.current) return;

                    submissionInProgress.current = true;
                    setStatus(undefined);

                    try {
                        const response = await register({
                            first_name: values.firstName,
                            last_name: values.lastName,
                            email: normalizeEmail(values.email),
                            password: values.password,
                            terms_accepted: values.termsAccepted,
                        });

                        await tokenStorage.save(response.access_token);
                        setAuthenticatedUser(response.user);
                        router.replace("/(app)/home");
                    } catch (error) {
                        setStatus({
                            kind: "error",
                            message: getRegisterErrorMessage(error),
                        } satisfies RegisterStatus);
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
                            label="Nombre"
                            kind="name"
                            value={values.firstName}
                            error={errors.firstName}
                            touched={touched.firstName}
                            onChangeText={handleChange("firstName")}
                            onBlur={() =>
                                void setFieldTouched("firstName", true)
                            }
                        />
                        <AuthFormField
                            label="Apellido"
                            kind="name"
                            value={values.lastName}
                            error={errors.lastName}
                            touched={touched.lastName}
                            onChangeText={handleChange("lastName")}
                            onBlur={() =>
                                void setFieldTouched("lastName", true)
                            }
                        />
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
                        <AuthFormField
                            label="Confirmar contraseña"
                            kind="password"
                            value={values.confirmPassword}
                            error={errors.confirmPassword}
                            touched={touched.confirmPassword}
                            onChangeText={handleChange("confirmPassword")}
                            onBlur={() =>
                                void setFieldTouched("confirmPassword", true)
                            }
                        />
                        <TermsCheckbox
                            checked={values.termsAccepted}
                            error={
                                touched.termsAccepted
                                    ? errors.termsAccepted
                                    : undefined
                            }
                            onToggle={() => {
                                void setFieldTouched("termsAccepted", true);
                                void setFieldValue(
                                    "termsAccepted",
                                    !values.termsAccepted,
                                );
                            }}
                        />
                        {status?.kind === "error" ? (
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
                            label="Registrarme"
                            variant="auth"
                            enabledStyle={{
                                textColor: "#FFFFFF",
                                backgroundColor: "#4F46E5",
                                backgroundGradient: [
                                    "#7C3AED",
                                    theme.colors.primary,
                                    "#0284C7",
                                ],
                                borderColor: "rgba(255, 255, 255, 0.45)",
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

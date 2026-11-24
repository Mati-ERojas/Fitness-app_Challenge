import { Formik } from "formik";
import { View } from "react-native";

import { Button } from "@/components/Button";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { loginSchema } from "@/features/auth/schemas/authSchemas";
import type { LoginFormValues } from "@/features/auth/types/forms";
import { normalizeEmail } from "@/features/auth/utils/normalizeEmail";
import { useTheme } from "@/hooks/useTheme";

const initialValues: LoginFormValues = {
    email: "",
    password: "",
};

export default function LoginScreen() {
    const { theme } = useTheme();

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
                onSubmit={async () => {}}
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

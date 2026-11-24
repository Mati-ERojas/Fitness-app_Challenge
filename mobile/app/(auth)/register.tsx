import { Formik } from "formik";
import { View } from "react-native";

import { Button } from "@/components/Button";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { TermsCheckbox } from "@/features/auth/components/TermsCheckbox";
import { registerSchema } from "@/features/auth/schemas/authSchemas";
import type { RegisterFormValues } from "@/features/auth/types/forms";
import { normalizeEmail } from "@/features/auth/utils/normalizeEmail";
import { useTheme } from "@/hooks/useTheme";

const initialValues: RegisterFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
};

export default function RegisterScreen() {
    const { theme } = useTheme();

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

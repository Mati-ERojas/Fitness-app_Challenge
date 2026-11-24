import * as Yup from 'yup';

import { normalizeEmail } from '@/features/auth/utils/normalizeEmail';

const emailSchema = Yup.string()
  .transform((value, originalValue) =>
    typeof originalValue === 'string' ? normalizeEmail(originalValue) : value,
  )
  .email('Ingresá un correo electrónico válido.')
  .required('El correo electrónico es obligatorio.');

const passwordSchema = Yup.string()
  .min(12, 'La contraseña debe tener al menos 12 caracteres.')
  .required('La contraseña es obligatoria.');

export const loginSchema = Yup.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = Yup.object({
  firstName: Yup.string().trim().required('El nombre es obligatorio.'),
  lastName: Yup.string().trim().required('El apellido es obligatorio.'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden.')
    .required('Confirmá tu contraseña.'),
  termsAccepted: Yup.boolean()
    .oneOf([true], 'Debés aceptar los términos y condiciones.')
    .required('Debés aceptar los términos y condiciones.'),
});

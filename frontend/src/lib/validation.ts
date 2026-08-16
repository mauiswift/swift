import { z } from 'zod';

// ───────────────────────────────────────────────────────────────
// PHONE NUMBER VALIDATION
// ───────────────────────────────────────────────────────────────
const phoneRegex = /^(?:\+?63|0)9\d{2}\d{7}$/; // Philippine numbers
const validatePhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return phoneRegex.test(cleaned);
};

// ───────────────────────────────────────────────────────────────
// REGISTER FORM SCHEMA
// ───────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .transform((val) => val.trim()),

  email: z
    .string()
    .email('Please enter a valid email address')
    .max(150, 'Email must be less than 150 characters')
    .transform((val) => val.trim().toLowerCase()),

  phone: z
    .string()
    .refine(
      validatePhoneNumber,
      {
        message:
          'Please enter a valid Philippine mobile number (e.g., 09171234567 or +639171234567)',
      }
    ),

  business_name: z
    .string()
    .min(1, 'Company name is required')
    .max(150, 'Business name must be less than 150 characters')
    .transform((val) => val.trim()),

  address: z
    .string()
    .max(255, 'Address must be less than 255 characters')
    .optional()
    .transform((val) => val?.trim() || null)
    .nullable(),

  nda_accepted: z
    .boolean()
    .refine((value) => value === true, {
      message: 'You must accept the NDA before submitting your registration.',
    }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ───────────────────────────────────────────────────────────────
// LOGIN SCHEMA (EMAIL/PASSWORD)
// ───────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform((val) => val.trim().toLowerCase()),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ───────────────────────────────────────────────────────────────
// HELPER: Get user-friendly field-level error
// ───────────────────────────────────────────────────────────────
export const getFieldError = (
  errors: z.ZodIssue[] | undefined,
  fieldName: string
): string | undefined => {
  return errors?.find((e) => e.path[0] === fieldName)?.message;
};

// ───────────────────────────────────────────────────────────────
// HELPER: Format phone for display
// ───────────────────────────────────────────────────────────────
export const formatPhoneForDisplay = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('63')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+63${cleaned.slice(1)}`;
  }
  return `+${cleaned}`;
};

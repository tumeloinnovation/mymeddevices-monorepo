import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address').max(255);

export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(128);

export const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});

export const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be exactly 6 characters'),
});

export const changePasswordSchema = z.object({
  current_password: passwordSchema,
  new_password: passwordSchema,
}).refine(data => data.current_password !== data.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password'],
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OTPInput = z.infer<typeof otpSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

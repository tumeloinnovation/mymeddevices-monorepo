import { toast } from "sonner-native";

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  description?: string;
}

export const checkEmail = (email: string): ValidationResult => {
  if (!email || !email.trim()) {
    return {
      isValid: false,
      message: "Please enter your email address",
      description: "We need your email to send a verification code.",
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      message: "Please enter a valid email address",
      description: "Double-check for typos before submitting.",
    };
  }

  return { isValid: true };
};

export const validateEmail = (email: string, showToast = true): boolean => {
  const result = checkEmail(email);
  if (!result.isValid && showToast) {
    toast.error(result.message!, { description: result.description });
  }
  return result.isValid;
};

export const validatePassword = (
  password: string
): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }
  return { isValid: true, message: "" };
};

export const checkPhone = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      message: "Please enter your phone number",
      description: "A valid phone number is required for order delivery and M-Pesa.",
    };
  }

  const cleaned = phone.replace(/[\s\-()]/g, "");
  // Matches +254..., 254..., 07..., 01... or standard 9-12 digit numbers
  const phoneRegex = /^(?:\+?254|0)?[17]\d{8}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      message: "Please enter a valid phone number",
      description: "Enter a valid 10-digit number e.g. 0712 345 678 or +254...",
    };
  }

  return { isValid: true };
};

export const validatePhone = (phone: string, showToast = true): boolean => {
  const result = checkPhone(phone);
  if (!result.isValid && showToast) {
    toast.error(result.message!, { description: result.description });
  }
  return result.isValid;
};

export const checkRegistrationForm = (formData: {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): ValidationResult => {
  if (
    !formData.firstName.trim() ||
    !formData.lastName.trim() ||
    !formData.phone.trim() ||
    !formData.password.trim()
  ) {
    return {
      isValid: false,
      message: "Please fill in all required fields",
      description: "First name, last name, phone number, and password are mandatory.",
    };
  }

  const phoneValidation = checkPhone(formData.phone);
  if (!phoneValidation.isValid) {
    return phoneValidation;
  }

  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    return {
      isValid: false,
      message: passwordValidation.message,
    };
  }

  if (formData.password !== formData.confirmPassword) {
    return {
      isValid: false,
      message: "Passwords do not match",
      description: "Both fields must match exactly.",
    };
  }

  return { isValid: true };
};

export const validateRegistrationForm = (
  formData: {
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    confirmPassword: string;
  },
  showToast = true
): boolean => {
  const result = checkRegistrationForm(formData);
  if (!result.isValid && showToast) {
    toast.error(result.message!, { description: result.description });
  }
  return result.isValid;
};
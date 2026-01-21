/**
 * Password validation utilities
 * Standard password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }
  
  // Check for uppercase letter
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }
  
  // Check for lowercase letter
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }
  
  // Check for number
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('At least one number');
  }
  
  // Check for special character
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('At least one special character (!@#$%^&*...)');
  }
  
  // Calculate password strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    if (password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

export function getPasswordRequirementsText(): string[] {
  return [
    `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    'At least one special character (!@#$%^&*...)',
  ];
}

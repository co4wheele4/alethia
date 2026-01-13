/**
 * Tests for password validation utilities
 */

import { validatePassword, getPasswordRequirementsText, PASSWORD_REQUIREMENTS } from '../../../lib/utils/password-validation';

describe('password-validation', () => {
  describe('validatePassword', () => {
    it('should return valid for a strong password', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe('strong');
    });

    it('should return valid for a medium password', () => {
      const result = validatePassword('MediumP1!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe('medium');
    });

    it('should return invalid for password too short', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least 8 characters');
      expect(result.strength).toBe('weak');
    });

    it('should return invalid for missing uppercase', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one uppercase letter');
    });

    it('should return invalid for missing lowercase', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one lowercase letter');
    });

    it('should return invalid for missing number', () => {
      const result = validatePassword('NoNumber!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one number');
    });

    it('should return invalid for missing special character', () => {
      const result = validatePassword('NoSpecial123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one special character (!@#$%^&*...)');
    });

    it('should return multiple errors for invalid password', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should calculate strong strength for 12+ char password with all requirements', () => {
      const result = validatePassword('VeryStrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });
  });

  describe('getPasswordRequirementsText', () => {
    it('should return array of requirement strings', () => {
      const requirements = getPasswordRequirementsText();
      expect(requirements).toHaveLength(5);
      expect(requirements[0]).toContain('8 characters');
      expect(requirements[1]).toContain('uppercase');
      expect(requirements[2]).toContain('lowercase');
      expect(requirements[3]).toContain('number');
      expect(requirements[4]).toContain('special character');
    });
  });

  describe('PASSWORD_REQUIREMENTS', () => {
    it('should have correct default values', () => {
      expect(PASSWORD_REQUIREMENTS.minLength).toBe(8);
      expect(PASSWORD_REQUIREMENTS.requireUppercase).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireLowercase).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireNumber).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireSpecialChar).toBe(true);
    });
  });
});

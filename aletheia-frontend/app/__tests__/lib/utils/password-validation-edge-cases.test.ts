/**
 * Edge case tests for password validation
 * Tests empty strings, very long passwords, special characters, boundary conditions
 */

import { validatePassword, getPasswordRequirementsText } from '../../../lib/utils/password-validation';

describe('password-validation Edge Cases', () => {
  describe('validatePassword - Edge Cases', () => {
    it('should handle empty string', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength).toBe('weak');
    });

    it('should handle very short password (1 character)', () => {
      const result = validatePassword('A');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least 8 characters');
    });

    it('should handle password exactly at minimum length (8 chars)', () => {
      const result = validatePassword('ValidP1!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    it('should handle password just below minimum length (7 chars)', () => {
      const result = validatePassword('ValidP1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least 8 characters');
    });

    it('should handle very long password (100+ characters)', () => {
      const longPassword = 'A'.repeat(50) + 'a'.repeat(50) + '1!';
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should handle password with only uppercase letters', () => {
      const result = validatePassword('UPPERCASE');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one lowercase letter');
      expect(result.errors).toContain('At least one number');
      expect(result.errors.some(err => err.includes('special character'))).toBe(true);
    });

    it('should handle password with only lowercase letters', () => {
      const result = validatePassword('lowercase');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one uppercase letter');
      expect(result.errors).toContain('At least one number');
      expect(result.errors.some(err => err.includes('special character'))).toBe(true);
    });

    it('should handle password with only numbers', () => {
      const result = validatePassword('12345678');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one uppercase letter');
      expect(result.errors).toContain('At least one lowercase letter');
      expect(result.errors.some(err => err.includes('special character'))).toBe(true);
    });

    it('should handle password with only special characters', () => {
      const result = validatePassword('!@#$%^&*');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one uppercase letter');
      expect(result.errors).toContain('At least one lowercase letter');
      expect(result.errors).toContain('At least one number');
    });

    it('should handle password with all special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = validatePassword(`A${specialChars}a1`);
      expect(result.isValid).toBe(true);
    });

    it('should handle password with unicode characters', () => {
      const result = validatePassword('ValidP1!ñ');
      // Should still validate correctly (unicode chars don't affect validation)
      expect(result.isValid).toBe(true);
    });

    it('should handle password with spaces', () => {
      const result = validatePassword('Valid P1!');
      // Spaces are allowed, validation should pass
      expect(result.isValid).toBe(true);
    });

    it('should handle password with tabs and newlines', () => {
      const result = validatePassword('ValidP1!\t\n');
      expect(result.isValid).toBe(true);
    });

    it('should calculate strength correctly for 11 character password', () => {
      const result = validatePassword('ValidPass1!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium'); // Less than 12 chars
    });

    it('should calculate strength correctly for 12 character password', () => {
      const result = validatePassword('ValidPass12!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong'); // 12+ chars with all requirements
    });

    it('should handle password with mixed case but missing number', () => {
      const result = validatePassword('MixedCase!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one number');
    });

    it('should handle password with mixed case and number but missing special char', () => {
      const result = validatePassword('MixedCase1');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('special character'))).toBe(true);
    });

    it('should handle password with all requirements but wrong length', () => {
      const result = validatePassword('Mix1!'); // Only 5 chars
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least 8 characters');
    });

    it('should handle password with special characters at boundaries', () => {
      const result = validatePassword('!ValidP1');
      expect(result.isValid).toBe(true);
    });

    it('should handle password ending with special character', () => {
      const result = validatePassword('ValidP1!');
      expect(result.isValid).toBe(true);
    });

    it('should handle password with multiple special characters', () => {
      const result = validatePassword('ValidP1!@#');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    it('should handle password with repeated characters', () => {
      const result = validatePassword('AAAAaaa1!');
      expect(result.isValid).toBe(true);
    });

    it('should handle password with sequential characters', () => {
      const result = validatePassword('Abc123!@');
      expect(result.isValid).toBe(true);
    });

    it('should handle password strength for weak password', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
    });

    it('should handle password strength for medium password', () => {
      const result = validatePassword('MediumP1!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    it('should handle password strength for strong password', () => {
      const result = validatePassword('VeryStrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });
  });

  describe('getPasswordRequirementsText - Edge Cases', () => {
    it('should return consistent requirement text', () => {
      const requirements1 = getPasswordRequirementsText();
      const requirements2 = getPasswordRequirementsText();
      
      expect(requirements1).toEqual(requirements2);
      expect(requirements1.length).toBe(5);
    });

    it('should return requirements in correct order', () => {
      const requirements = getPasswordRequirementsText();
      
      expect(requirements[0]).toContain('8 characters');
      expect(requirements[1]).toContain('uppercase');
      expect(requirements[2]).toContain('lowercase');
      expect(requirements[3]).toContain('number');
      expect(requirements[4]).toContain('special character');
    });
  });
});

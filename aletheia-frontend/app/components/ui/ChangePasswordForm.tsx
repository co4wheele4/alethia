/**
 * Change Password Form Component
 * Allows authenticated users to change their password
 */

'use client';

import { useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import { validatePassword } from '../../lib/utils/password-validation';
import {
  Box,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

// Submit button component using React 19 useFormStatus
function SubmitButton({ isPending }: { isPending: boolean }) {
  const formStatus = useFormStatus();
  const pending = isPending || formStatus.pending;

  return (
    <Button
      type="submit"
      variant="contained"
      disabled={pending}
      fullWidth
      startIcon={<LockIcon />}
    >
      {pending ? 'Changing Password...' : 'Change Password'}
    </Button>
  );
}

export interface ChangePasswordFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordForm({ open, onClose, onSuccess }: ChangePasswordFormProps) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate required fields
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!newPassword) {
      setError('New password is required');
      return;
    }

    if (!confirmPassword) {
      setError('Please confirm your new password');
      return;
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password requirements
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(`Password does not meet requirements: ${validation.errors.join(', ')}`);
      return;
    }

    // Validate new password is different from current
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    // Use React 19 useTransition for better UX
    startTransition(async () => {
      try {
        await changePassword(currentPassword, newPassword);
        
        // If we get here, password was changed successfully
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } catch (err: unknown) {
        let errorMessage = 'Failed to change password. Please try again.';
        
        if (err instanceof Error) {
          const message = err.message;
          const lowerMessage = message.toLowerCase();
          
          // Check for current password errors
          if (lowerMessage.includes('incorrect') || 
              lowerMessage.includes('invalid') || 
              lowerMessage.includes('wrong') || 
              lowerMessage.includes('current password')) {
            errorMessage = 'Current password is incorrect. Please try again.';
          } 
          // Check for network errors
          else if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          }
          // Check for validation errors
          else if (lowerMessage.includes('validation') || lowerMessage.includes('requirement')) {
            errorMessage = message;
          }
          // Use the error message as-is if it's meaningful
          else {
            errorMessage = message || errorMessage;
          }
        }
        
        setError(errorMessage);
        // Clear password fields on error for security
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {success ? (
              <Alert severity="success">
                Password changed successfully! This dialog will close shortly.
              </Alert>
            ) : (
              <>
                <TextField
                  id="currentPassword"
                  name="currentPassword"
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    // Clear error when user starts typing
                    if (error && error.includes('incorrect')) {
                      setError(null);
                    }
                  }}
                  required
                  fullWidth
                  variant="outlined"
                  autoComplete="current-password"
                  error={error !== null && (error.includes('incorrect') || error.includes('Current password'))}
                  helperText={
                    error !== null && (error.includes('incorrect') || error.includes('Current password'))
                      ? 'Current password is incorrect'
                      : undefined
                  }
                />

                <TextField
                  id="newPassword"
                  name="newPassword"
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                  autoComplete="new-password"
                  helperText="Must meet password requirements (8+ chars, uppercase, lowercase, number, special char)"
                />

                <TextField
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                  autoComplete="new-password"
                  error={confirmPassword.length > 0 && newPassword !== confirmPassword}
                  helperText={
                    confirmPassword.length > 0 && newPassword !== confirmPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                />

                {error && (
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isPending}>
            {success ? 'Close' : 'Cancel'}
          </Button>
          {!success && <SubmitButton isPending={isPending} />}
        </DialogActions>
      </form>
    </Dialog>
  );
}

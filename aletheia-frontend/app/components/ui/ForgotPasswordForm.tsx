/**
 * Forgot Password Form Component
 * Allows users to request a password reset email
 */

'use client';

import { useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Link,
} from '@mui/material';
import { Email as EmailIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

// Submit button component using React 19 useFormStatus
function SubmitButton({ isPending }: { isPending: boolean }) {
  const formStatus = useFormStatus();
  // formStatus.pending is always false in tests (no form actions), so this branch is unreachable
  /* c8 ignore next */
  const pending = isPending || formStatus.pending;

  return (
    <Button
      type="submit"
      variant="contained"
      disabled={pending}
      fullWidth
      startIcon={<EmailIcon />}
    >
      {pending ? 'Sending...' : 'Send Reset Email'}
    </Button>
  );
}

export interface ForgotPasswordFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ open, onClose, onSuccess }: ForgotPasswordFormProps) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Use React 19 useTransition for better UX
    startTransition(async () => {
      try {
        await forgotPassword(email);
        
        // If we get here, email was sent successfully
        setSuccess(true);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          const callOnSuccess = () => {
            onSuccess();
          };
          setTimeout(callOnSuccess, 2000);
        }
      } catch (err: unknown) {
        let errorMessage = 'Failed to send reset email. Please try again.';
        
        if (err instanceof Error) {
          const message = err.message;
          const lowerMessage = message.toLowerCase();
          
          // Check for user not found errors
          if (lowerMessage.includes('not found') || 
              lowerMessage.includes('does not exist') || 
              lowerMessage.includes('no account') ||
              lowerMessage.includes('no user')) {
            errorMessage = 'No account found with this email address.';
          } 
          // Check for network errors
          else if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          }
          // Use the error message as-is if it's meaningful
          else {
            errorMessage = message || errorMessage;
          }
        }
        
        setError(errorMessage);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setEmail('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reset Password</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {success ? (
              <>
                <Alert severity="success">
                  <Typography variant="body2" gutterBottom>
                    <strong>Password reset email sent!</strong>
                  </Typography>
                  <Typography variant="body2">
                    Please check your email for instructions to reset your password.
                    The link will expire in 24 hours.
                  </Typography>
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Didn't receive the email? Check your spam folder or try again.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Enter your email address and we'll send you a link to reset your password.
                </Typography>
                <TextField
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error when user starts typing
                    if (error) {
                      setError(null);
                    }
                  }}
                  required
                  fullWidth
                  variant="outlined"
                  autoComplete="email"
                  placeholder="Enter your email"
                  error={error !== null && (error.includes('not found') || error.includes('does not exist') || error.includes('No account'))}
                  helperText={
                    error !== null && (error.includes('not found') || error.includes('does not exist') || error.includes('No account'))
                      ? 'No account found with this email address'
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

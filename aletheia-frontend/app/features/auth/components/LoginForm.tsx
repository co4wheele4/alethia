/**
 * Login and Register Form Component
 * Uses React 19 useTransition and useFormStatus for better form handling
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { validatePassword, getPasswordRequirementsText } from '../utils/password-validation';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import {
  Box,
  Button,
  TextField,
  Alert,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Link,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

// Submit button component using React 19 useFormStatus
// This hook provides form status from the nearest form ancestor
// Note: useFormStatus works with form actions, but we use isPending as fallback
// for our GraphQL mutation-based forms
function SubmitButton({ 
  isRegisterMode, 
  isPending 
}: { 
  isRegisterMode: boolean;
  isPending: boolean;
}) {
  // useFormStatus works best with form actions (server actions)
  // For our GraphQL-based forms, we use isPending from useTransition
  const formStatus = useFormStatus();
  
  // Prefer isPending from useTransition (more reliable for our use case)
  // useFormStatus.pending will be false since we're not using form actions
  const pending = isPending || formStatus.pending;
  
  return (
    <Button
      type="submit"
      variant="contained"
      disabled={pending}
      fullWidth
      sx={{ mt: 2 }}
    >
      {pending
        ? (isRegisterMode ? 'Registering...' : 'Logging in...')
        : (isRegisterMode ? 'Register' : 'Login')}
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const { login, register } = useAuth();
  
  // React 19: useTransition for non-blocking UI updates during async operations
  // This keeps the UI responsive during async operations
  const [isPending, startTransition] = useTransition();
  
  // Validate password when in register mode
  const passwordValidation = isRegisterMode && password ? validatePassword(password) : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    // Validate password requirements in register mode
    if (isRegisterMode) {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        setError(`Password does not meet requirements: ${validation.errors.join(', ')}`);
        return;
      }
    }

    // Use React 19 useTransition for better UX during async operations
    startTransition(async () => {
      try {
        if (isRegisterMode) {
          const token = await register(email, password, name || undefined);
          if (token) {
            router.push('/dashboard');
          } else {
            setError('Registration failed. Please try again.');
          }
        } else {
          const token = await login(email, password);
          if (token) {
            router.push('/dashboard');
          } else {
            setError('Login failed. Invalid email or password.');
          }
        }
      } catch (err: unknown) {
        // Extract error message from GraphQL error or generic error
        let errorMessage = isRegisterMode 
          ? 'Registration failed. Please try again.' 
          : 'Login failed. Please check your credentials and try again.';
        
        if (err instanceof Error) {
          const message = err.message;
          
          // Handle GraphQL errors
          if (message.includes('GraphQL')) {
            // Try to extract the actual error message from GraphQL error
            const graphqlMatch = message.match(/Error: (.+)/);
            if (graphqlMatch) {
              errorMessage = graphqlMatch[1];
            } else if (message.includes('Network')) {
              errorMessage = 'Network error. Please check your connection and try again.';
            } else {
              errorMessage = message;
            }
          } 
          // Handle specific error messages
          else if (message.includes('Invalid email or password') || message.includes('Invalid credentials')) {
            errorMessage = 'Invalid email or password. Please try again.';
          } 
          else if (message.includes('User not found')) {
            errorMessage = 'No account found with this email address.';
          }
          else if (message.includes('Email already exists') || message.includes('already registered')) {
            errorMessage = 'An account with this email already exists. Please login instead.';
          }
          else if (message.includes('Network') || message.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          }
          else {
            // Use the error message as-is if it's meaningful
            errorMessage = message || errorMessage;
          }
        }
        
        setError(errorMessage);
      }
    });
  };


  return (
    <Box sx={{ width: '100%' }}>
      {/* Toggle between Login and Register */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={isRegisterMode ? 1 : 0}
          onChange={(_, newValue) => {
            setIsRegisterMode(newValue === 1);
            setError(null); // Clear error when switching modes
            setPassword(''); // Clear password when switching modes
            setShowPasswordRequirements(false); // Hide requirements when switching modes
          }}
          sx={{ mb: 2 }}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isRegisterMode && (
          <TextField
            id="name"
            name="name"
            label="Name (Optional)"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            fullWidth
            variant="outlined"
          />
        )}

        <TextField
          id="email"
          name="email"
          label="Email"
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
          placeholder="Enter your email"
          fullWidth
          variant="outlined"
          error={error !== null && (error.includes('Invalid email') || error.includes('not found'))}
        />

        <Box>
          <TextField
            id="password"
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              // Clear error when user starts typing
              if (error && (error.includes('password') || error.includes('Invalid'))) {
                setError(null);
              }
              if (isRegisterMode) {
                setShowPasswordRequirements(true);
              }
            }}
            onFocus={() => {
              if (isRegisterMode) {
                setShowPasswordRequirements(true);
              }
            }}
          required
          placeholder="Enter your password"
          fullWidth
          variant="outlined"
          error={
            (isRegisterMode && password.length > 0 && passwordValidation !== null && !passwordValidation.isValid) ||
            (error !== null && (error.includes('password') || error.includes('Invalid')))
          }
            helperText={
              isRegisterMode && password.length > 0 && passwordValidation !== null
                ? passwordValidation.isValid
                  ? 'Password meets all requirements'
                  : `${passwordValidation.errors.length} requirement(s) not met`
                : undefined
            }
          />
          
          {/* Forgot Password Link (shown only in login mode) */}
          {!isRegisterMode && (
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  setForgotPasswordOpen(true);
                }}
                sx={{ cursor: 'pointer' }}
              >
                Forgot password?
              </Link>
            </Box>
          )}
          
          {/* Password Requirements List (shown in register mode) */}
          {isRegisterMode && showPasswordRequirements && password.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Password Requirements:
              </Typography>
              <List dense sx={{ py: 0 }}>
                {getPasswordRequirementsText().map((requirement, index) => {
                  const isMet = passwordValidation?.errors.findIndex(err => 
                    requirement.toLowerCase().includes(err.toLowerCase().split(' ')[0])
                  ) === -1;
                  
                  return (
                    <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {isMet ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Cancel color="error" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={requirement}
                        primaryTypographyProps={{
                          variant: 'caption',
                          color: isMet ? 'text.secondary' : 'text.primary',
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
              
              {/* Password Strength Indicator */}
              {passwordValidation && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    Password Strength: <strong>{passwordValidation.strength.toUpperCase()}</strong>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      passwordValidation.strength === 'weak' ? 33 :
                      passwordValidation.strength === 'medium' ? 66 : 100
                    }
                    color={
                      passwordValidation.strength === 'weak' ? 'error' :
                      passwordValidation.strength === 'medium' ? 'warning' : 'success'
                    }
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>

        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ mt: 1 }}
          >
            {error}
          </Alert>
        )}

        <SubmitButton isRegisterMode={isRegisterMode} isPending={isPending} />
      </Box>

      {/* Forgot Password Dialog */}
      <ForgotPasswordForm
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </Box>
  );
}

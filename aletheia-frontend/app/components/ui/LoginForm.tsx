/**
 * Login and Register Form Component
 * Allows users to login or register for a new account
 */

'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Button,
  TextField,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';

export function LoginForm() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, register, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegisterMode) {
        await register(email, name || undefined);
        console.log('Registration successful!');
      } else {
        await login(email, password);
        console.log('Login successful!');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : (isRegisterMode ? 'Registration failed. Please try again.' : 'Login failed. Please try again.');
      setError(errorMessage);
    }
  };


  return (
    <Box sx={{ width: '100%' }}>
      {/* Toggle between Login and Register */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={isRegisterMode ? 1 : 0}
          onChange={(_, newValue) => setIsRegisterMode(newValue === 1)}
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
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
          fullWidth
          variant="outlined"
        />

        {!isRegisterMode && (
          <TextField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            fullWidth
            variant="outlined"
          />
        )}

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          fullWidth
          sx={{ mt: 2 }}
        >
          {loading
            ? (isRegisterMode ? 'Registering...' : 'Logging in...')
            : (isRegisterMode ? 'Register' : 'Login')}
        </Button>
      </Box>
    </Box>
  );
}

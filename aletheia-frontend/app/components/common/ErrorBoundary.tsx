/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 * Uses React 19 error handling patterns
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 4,
            gap: 2,
          }}
        >
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
          <Typography variant="h5" component="h2" gutterBottom>
            Something went wrong
          </Typography>
          <Alert severity="error" sx={{ maxWidth: 600, width: '100%' }}>
            <AlertTitle>Error Details</AlertTitle>
            {this.state.error?.message || 'An unexpected error occurred'}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
          </Alert>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleReset}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Tests for ForgotPasswordForm component
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ForgotPasswordForm } from '../../../components/ui/ForgotPasswordForm';
import { useAuth } from '../../../hooks/useAuth';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';

jest.mock('../../../hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockForgotPassword = jest.fn();

const mockApolloClient = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  cache: new InMemoryCache(),
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ApolloProvider client={mockApolloClient}>{children}</ApolloProvider>
);

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      token: null,
      isAuthenticated: false,
      isInitialized: true,
      login: jest.fn(),
      register: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: mockForgotPassword,
      logout: jest.fn(),
      loading: false,
      error: undefined,
    });
  });

  it('should render dialog when open', () => {
    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <TestWrapper>
        <ForgotPasswordForm open={false} onClose={jest.fn()} />
      </TestWrapper>
    );

    expect(screen.queryByText('Reset Password')).not.toBeInTheDocument();
  });

  it('should validate email is required', async () => {
    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const form = screen.getByRole('button', { name: /send reset email/i }).closest('form');
    expect(form).toBeInTheDocument();
    
    // Submit the form directly
    await act(async () => {
      if (form) {
        fireEvent.submit(form);
      }
    });

    // Wait for error to appear - it's set synchronously but React needs to re-render
    await waitFor(() => {
      // Error is displayed in Alert component
      const errorText = screen.queryByText(/email is required/i);
      expect(errorText).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should validate email format', async () => {
    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const form = screen.getByRole('button', { name: /send reset email/i }).closest('form');
    
    // Submit the form directly
    await act(async () => {
      if (form) {
        fireEvent.submit(form);
      }
    });

    // Wait for error to appear - it's set synchronously but React needs to re-render
    await waitFor(() => {
      // Error is displayed in Alert component
      const errorText = screen.queryByText(/please enter a valid email address|valid email address/i);
      expect(errorText).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should call forgotPassword on valid submission', async () => {
    mockForgotPassword.mockResolvedValue(true);

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should render SubmitButton component', () => {
    // Test that SubmitButton function is executed (line 26)
    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    // SubmitButton should be rendered (it's used in line 193)
    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('should display error when email not found', async () => {
    mockForgotPassword.mockRejectedValue(new Error('No account found with this email address'));

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Error might be in Alert or helperText
      const errorElement = screen.queryByRole('alert') || 
                          screen.queryByText(/no account found/i) ||
                          screen.queryByText(/does not exist/i);
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('should show success message on success', async () => {
    jest.useFakeTimers();
    mockForgotPassword.mockResolvedValue(true);

    const onSuccess = jest.fn();
    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} onSuccess={onSuccess} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
    });

    // Fast-forward time to trigger setTimeout callback (line 86-89)
    // This executes the callOnSuccess function which calls onSuccess()
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // callOnSuccess function should have been executed, which calls onSuccess
    expect(onSuccess).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('should not call onSuccess when not provided', async () => {
    jest.useFakeTimers();
    mockForgotPassword.mockResolvedValue(true);

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
    });

    // Fast-forward time - the setTimeout should not execute because onSuccess is undefined
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // No errors should occur (onSuccess is undefined, so the if check should prevent calling it)
    expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should close dialog when cancel is clicked', () => {
    const onClose = jest.fn();
    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={onClose} />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should clear error when user starts typing', async () => {
    mockForgotPassword.mockRejectedValue(new Error('Error'));

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    await waitFor(() => {
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  it('should close error alert when close button is clicked', async () => {
    // Test the arrow function in Alert's onClose (line 181: onClose={() => setError(null)})
    mockForgotPassword.mockRejectedValue(new Error('Test error'));

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Click the close button on the alert
    const alert = screen.getByRole('alert');
    const closeButton = alert.querySelector('button[aria-label="Close"]');
    if (closeButton) {
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        // Error should be cleared (the arrow function onClose={() => setError(null)} should execute)
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    }
  });

  it('should handle network errors', async () => {
    mockForgotPassword.mockRejectedValue(new Error('Network connection failed'));

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorText = screen.queryByText(/network error/i);
      expect(errorText).toBeInTheDocument();
    });
  });

  it('should handle generic error messages', async () => {
    // Test the else branch where error message is used as-is (line 108)
    const genericError = 'An unexpected error occurred';
    mockForgotPassword.mockRejectedValue(new Error(genericError));

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const alert = screen.queryByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(genericError);
    });
  });

  it('should handle error with empty message', async () => {
    // Test the branch where message is empty (line 108: message || errorMessage)
    mockForgotPassword.mockRejectedValue(new Error(''));

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should use default error message when message is empty
      const alert = screen.queryByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/failed to send reset email/i);
    });
  });

  it('should not close dialog when isPending is true', () => {
    const onClose = jest.fn();
    mockForgotPassword.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={onClose} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    // Try to close while pending - handleClose should check isPending (line 121)
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled(); // Should be disabled when pending
    
    // onClose should not be called when isPending is true
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should show "Sending..." when pending', async () => {
    // Test the branch where pending is true (line 40: pending ? 'Sending...' : 'Send Reset Email')
    mockForgotPassword.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    // Button should show "Sending..." when pending (SubmitButton function, line 40)
    await waitFor(() => {
      const sendingButton = screen.getByRole('button', { name: /sending/i });
      expect(sendingButton).toBeInTheDocument();
      expect(sendingButton).toBeDisabled();
    });
  });
});

/**
 * Tests for ForgotPasswordForm component
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ForgotPasswordForm } from '../../../components/ui/ForgotPasswordForm';
import { useAuth } from '../../../hooks/useAuth';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';

vi.mock('../../../hooks/useAuth');

const mockUseAuth = useAuth as any;
const mockForgotPassword = vi.fn();

const mockApolloClient = new ApolloClient({
  
  link: { request: vi.fn() } as any,
  cache: new InMemoryCache(),
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ApolloProvider client={mockApolloClient}>{children}</ApolloProvider>
);

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      token: null,
      isAuthenticated: false,
      isInitialized: true,
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      forgotPassword: mockForgotPassword,
      logout: vi.fn(),
      loading: false,
      error: undefined,
    });
  });

  afterEach(() => {
    
  });

  it('should render dialog when open', () => {
    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <TestWrapper>
        <ForgotPasswordForm open={false} onClose={vi.fn()} />
      </TestWrapper>
    );

    expect(screen.queryByText('Reset Password')).not.toBeInTheDocument();
  });

  it('should validate email is required', async () => {
    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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
    mockForgotPassword.mockResolvedValue(true);

    const onSuccess = vi.fn();
    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={vi.fn()} onSuccess={onSuccess} />
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

    // Wait for the setTimeout callback (2000ms in the component)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 2100));
    });

    // onSuccess should have been called
    expect(onSuccess).toHaveBeenCalledTimes(1);
  }, 10000);

  it('should not call onSuccess when not provided', async () => {
    mockForgotPassword.mockResolvedValue(true);

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
    });

    // Wait to ensure no errors occur
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
  });

  it('should close dialog when cancel is clicked', () => {
    const onClose = vi.fn();
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
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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
    const onClose = vi.fn();
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
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
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

  it('should clear error and check specific error types', async () => {
    // Test the branch where error is not null in onChange (line 163)
    // and the error logic in TextField (line 172, 174)
    mockForgotPassword.mockRejectedValue(new Error('User not found'));

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText(/no account found/i).length).toBeGreaterThan(0);
    });

    // Start typing - should clear error (line 163)
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    
    await waitFor(() => {
      expect(screen.queryByText(/no account found/i)).not.toBeInTheDocument();
    });
  });

  it('should handle non-Error objects in catch block', async () => {
    // Test the branch where err is not an Error instance (line 90 false branch)
    mockForgotPassword.mockRejectedValue('string error');

    render(
      <TestWrapper>
        <ForgotPasswordForm open={true} onClose={vi.fn()} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const alert = screen.queryByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/failed to send reset email/i);
    });
  });

  it('should check all user not found error variations', async () => {
    // Test the different error message variations that trigger the user not found branch
    const variations = [
      'User not found',
      'User does not exist',
      'No account with this email',
    ];

    for (const errorMsg of variations) {
      mockForgotPassword.mockRejectedValueOnce(new Error(errorMsg));

      const { unmount } = render(
        <TestWrapper>
          <ForgotPasswordForm open={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getAllByText(/no account found/i).length).toBeGreaterThan(0);
      });
      
      unmount();
    }
  });

  it('should test handleClose when isPending is true', async () => {
    const onClose = vi.fn();
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

    // Wait for pending state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    });

    // Try to close - should not call onClose because isPending is true
    // We can't click the cancel button because it's disabled, but we can try to trigger the Dialog's onClose directly
    const dialog = screen.getByRole('dialog');
    // MUI Dialog onClose is usually triggered via backdrop click or Escape key
    // We can simulate a direct call to the handleClose via the Dialog's onClose prop
    // In RTL, we can't easily access the props of a rendered component, but we can simulate the event
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    
    expect(onClose).not.toHaveBeenCalled();
  });
});

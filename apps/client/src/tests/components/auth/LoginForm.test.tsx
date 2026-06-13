import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { LoginForm } from '../../../components/auth/LoginForm';
import api from '../../../lib/axios';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../lib/axios');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style }: any) => (
      <div data-testid="motion-div" className={className} style={style}>
        {children}
      </div>
    ),
  },
}));

describe('LoginForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders email and password fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SIGN IN/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    render(<LoginForm />);

    const submitBtn = screen.getByRole('button', { name: /SIGN IN/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.type(emailInput, 'test@example.com');

    const submitBtn = screen.getByRole('button', { name: /SIGN IN/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('calls login API on valid submit', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        accessToken: 'fake-token',
      },
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passInput = screen.getByLabelText(/Password/i);

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passInput, 'TestPass123');

    const submitBtn = screen.getByRole('button', { name: /SIGN IN/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'TestPass123',
      });
      expect(mockPush).toHaveBeenCalledWith('/editor');
    });
  });

  it('shows error message on failed login', async () => {
    mockedApi.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passInput = screen.getByLabelText(/Password/i);

    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passInput, 'wrongpass');

    const submitBtn = screen.getByRole('button', { name: /SIGN IN/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    // Create a promise we can control to keep the form in submitting state
    let resolvePost: any;
    const postPromise = new Promise((resolve) => {
      resolvePost = resolve;
    });
    mockedApi.post.mockReturnValueOnce(postPromise as any);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passInput = screen.getByLabelText(/Password/i);

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passInput, 'TestPass123');

    const submitBtn = screen.getByRole('button', { name: /SIGN IN/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /SIGNING IN.../i })).toBeDisabled();
    });

    // Cleanup
    resolvePost({ data: { user: {}, accessToken: '' } });
  });
});

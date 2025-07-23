import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';
import { vi } from 'vitest';
import type { User } from '@clerk/nextjs/server';

// Create a custom render method that includes all providers
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const TestProviders = ({ children, queryClient = createTestQueryClient() }: TestProvidersProps) => {
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ClerkProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) => {
  const { queryClient, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders queryClient={queryClient}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
};

// Mock user for authenticated tests
export const mockUser: Partial<User> = {
  id: 'user_test123',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  username: 'testuser',
  primaryEmailAddress: {
    emailAddress: 'test@example.com',
  } as any,
  imageUrl: 'https://example.com/avatar.jpg',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// Mock Clerk hooks
export const mockClerk = {
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: mockUser,
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: mockUser.id,
    sessionId: 'session_test123',
    signOut: vi.fn(),
  }),
  useSession: () => ({
    isLoaded: true,
    isSignedIn: true,
    session: {
      id: 'session_test123',
      user: mockUser,
    },
  }),
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, createTestQueryClient };

// Utility functions for common test scenarios
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

export const expectErrorMessage = async (message: string | RegExp) => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(screen.getByText(message)).toBeInTheDocument();
  });
};

// Mock fetch for API calls
export const mockFetch = (response: any, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
};

// Mock Next.js router
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};

// Mock Next.js navigation
export const mockNavigation = {
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
};
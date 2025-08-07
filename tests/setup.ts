import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'
import { mockClerk } from './test-utils'

// Make React available globally for JSX
global.React = React

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
process.env.CLERK_SECRET_KEY = 'sk_test_123'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: any) => children,
  SignIn: () => null,
  SignUp: () => null,
  SignInButton: vi.fn(({ children }: any) => children),
  SignUpButton: vi.fn(({ children }: any) => children),
  SignedIn: vi.fn(({ children }: any) => children),
  SignedOut: vi.fn(({ children }: any) => children),
  UserButton: () => null,
  useUser: () => mockClerk.useUser(),
  useAuth: () => mockClerk.useAuth(),
  useSession: () => mockClerk.useSession(),
  auth: () => Promise.resolve({ userId: 'user_test123' }),
  currentUser: () => Promise.resolve(mockClerk.useUser().user),
}))

// Mock Prisma client
vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./mocks/prisma')
  return {
    prisma: prismaMock,
  }
})

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock fetch globally
global.fetch = vi.fn()
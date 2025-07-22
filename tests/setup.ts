import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Make React available globally for JSX
global.React = React

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
}))

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  SignInButton: vi.fn(({ children }: any) => children),
  SignUpButton: vi.fn(({ children }: any) => children),
  SignedIn: vi.fn(({ children }: any) => children),
  SignedOut: vi.fn(({ children }: any) => children),
  UserButton: vi.fn(() => null),
  useAuth: () => ({ userId: 'test-user-id' }),
  auth: () => ({ userId: 'test-user-id' }),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-key'
process.env.CLERK_SECRET_KEY = 'test-secret'
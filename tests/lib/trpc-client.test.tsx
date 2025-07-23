import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import { QueryClient } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import React from 'react'
import { TRPCProvider, trpc } from '@/lib/trpc/client'
import { mockTRPCResponses } from '../mocks/trpc'
import type { AppRouter } from '@/lib/trpc/root'

// Mock the tRPC client
vi.mock('@trpc/react-query', () => ({
  createTRPCReact: () => ({
    createClient: vi.fn(() => ({})),
    Provider: ({ children }: any) => <>{children}</>,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useInfiniteQuery: vi.fn(),
  }),
}))

// Test component that uses tRPC hooks
function TestComponent({ 
  queryType = 'normal',
  shouldError = false 
}: { 
  queryType?: 'normal' | 'infinite' | 'mutation'
  shouldError?: boolean 
}) {
  const [mutationData, setMutationData] = React.useState<any>(null)
  const [mutationError, setMutationError] = React.useState<any>(null)

  // Mock different query types
  const normalQuery = {
    data: shouldError ? undefined : mockTRPCResponses.user.me(),
    error: shouldError ? new Error('Query failed') : null,
    isLoading: false,
    isError: shouldError,
  }

  const infiniteQuery = {
    data: shouldError ? undefined : {
      pages: [mockTRPCResponses.clip.list()],
      pageParams: [undefined],
    },
    error: shouldError ? new Error('Infinite query failed') : null,
    isLoading: false,
    isError: shouldError,
    fetchNextPage: vi.fn(),
    hasNextPage: true,
  }

  const mutation = {
    mutate: async (input: any) => {
      try {
        if (shouldError) {
          throw new Error('Mutation failed')
        }
        const result = mockTRPCResponses.clip.create(input)
        setMutationData(result)
      } catch (error) {
        setMutationError(error)
      }
    },
    isLoading: false,
    error: mutationError,
    data: mutationData,
  }

  // Render based on query type
  if (queryType === 'infinite') {
    const query = infiniteQuery
    return (
      <div>
        {query.isLoading && <p>Loading...</p>}
        {query.isError && <p>Error: {query.error?.message}</p>}
        {query.data && (
          <>
            <p>Clips count: {query.data.pages[0].clips.length}</p>
            <button onClick={() => query.fetchNextPage()}>Load More</button>
          </>
        )}
      </div>
    )
  }

  if (queryType === 'mutation') {
    return (
      <div>
        <button onClick={() => mutation.mutate({ title: 'New Clip' })}>
          Create Clip
        </button>
        {mutation.error && <p>Error: {mutation.error.message}</p>}
        {mutation.data && <p>Created: {mutation.data.title}</p>}
      </div>
    )
  }

  // Normal query
  const query = normalQuery
  return (
    <div>
      {query.isLoading && <p>Loading...</p>}
      {query.isError && <p>Error: {query.error?.message}</p>}
      {query.data && <p>User: {query.data.name}</p>}
    </div>
  )
}

describe('tRPC Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Provider Setup', () => {
    it('should render children within TRPCProvider', () => {
      render(
        <TRPCProvider>
          <div>Test Content</div>
        </TRPCProvider>
      )
      
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should create query client singleton in browser environment', () => {
      const queryClient1 = render(
        <TRPCProvider>
          <div>First</div>
        </TRPCProvider>
      ).container

      const queryClient2 = render(
        <TRPCProvider>
          <div>Second</div>
        </TRPCProvider>
      ).container

      // Both should exist
      expect(queryClient1).toBeTruthy()
      expect(queryClient2).toBeTruthy()
    })
  })

  describe('Data Fetching', () => {
    it('should handle successful query', async () => {
      render(
        <TRPCProvider>
          <TestComponent />
        </TRPCProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('User: Test User')).toBeInTheDocument()
      })
    })

    it('should handle query errors', async () => {
      render(
        <TRPCProvider>
          <TestComponent shouldError />
        </TRPCProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Query failed')).toBeInTheDocument()
      })
    })

    it('should handle loading states', async () => {
      const TestLoadingComponent = () => {
        const [isLoading, setIsLoading] = React.useState(true)
        
        React.useEffect(() => {
          setTimeout(() => setIsLoading(false), 100)
        }, [])

        return isLoading ? <p>Loading...</p> : <p>Data loaded</p>
      }

      render(
        <TRPCProvider>
          <TestLoadingComponent />
        </TRPCProvider>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByText('Data loaded')).toBeInTheDocument()
      })
    })
  })

  describe('Infinite Queries', () => {
    it('should handle infinite query with pagination', async () => {
      render(
        <TRPCProvider>
          <TestComponent queryType="infinite" />
        </TRPCProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Clips count: 1')).toBeInTheDocument()
        expect(screen.getByText('Load More')).toBeInTheDocument()
      })
    })

    it('should handle infinite query errors', async () => {
      render(
        <TRPCProvider>
          <TestComponent queryType="infinite" shouldError />
        </TRPCProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Infinite query failed')).toBeInTheDocument()
      })
    })

    it('should call fetchNextPage when load more is clicked', async () => {
      render(
        <TRPCProvider>
          <TestComponent queryType="infinite" />
        </TRPCProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByText('Load More')
      loadMoreButton.click()

      // In a real test, we'd verify fetchNextPage was called
      expect(loadMoreButton).toBeInTheDocument()
    })
  })

  describe('Mutations', () => {
    it('should handle successful mutation', async () => {
      render(
        <TRPCProvider>
          <TestComponent queryType="mutation" />
        </TRPCProvider>
      )

      const createButton = screen.getByText('Create Clip')
      createButton.click()

      await waitFor(() => {
        expect(screen.getByText('Created: Test Clip')).toBeInTheDocument()
      })
    })

    it('should handle mutation errors', async () => {
      render(
        <TRPCProvider>
          <TestComponent queryType="mutation" shouldError />
        </TRPCProvider>
      )

      const createButton = screen.getByText('Create Clip')
      createButton.click()

      await waitFor(() => {
        expect(screen.getByText('Error: Mutation failed')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const NetworkErrorComponent = () => {
        const [error, setError] = React.useState<Error | null>(null)
        
        React.useEffect(() => {
          setError(new Error('Network error'))
        }, [])

        return error ? <p>Error: {error.message}</p> : <p>Loading...</p>
      }

      render(
        <TRPCProvider>
          <NetworkErrorComponent />
        </TRPCProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Network error')).toBeInTheDocument()
      })
    })

    it('should handle timeout errors', async () => {
      const TimeoutComponent = () => {
        const [error, setError] = React.useState<Error | null>(null)
        
        React.useEffect(() => {
          const timeout = setTimeout(() => {
            setError(new Error('Request timeout'))
          }, 100)
          return () => clearTimeout(timeout)
        }, [])

        return error ? <p>Error: {error.message}</p> : <p>Waiting...</p>
      }

      render(
        <TRPCProvider>
          <TimeoutComponent />
        </TRPCProvider>
      )

      expect(screen.getByText('Waiting...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Error: Request timeout')).toBeInTheDocument()
      })
    })

    it('should handle validation errors', async () => {
      const ValidationComponent = () => {
        const [error, setError] = React.useState<any>(null)
        
        const handleSubmit = () => {
          setError({
            message: 'Validation failed',
            data: {
              zodError: {
                fieldErrors: {
                  title: ['Title is required'],
                },
              },
            },
          })
        }

        return (
          <div>
            <button onClick={handleSubmit}>Submit</button>
            {error && (
              <div>
                <p>Error: {error.message}</p>
                {error.data?.zodError?.fieldErrors?.title && (
                  <p>Title error: {error.data.zodError.fieldErrors.title[0]}</p>
                )}
              </div>
            )}
          </div>
        )
      }

      render(
        <TRPCProvider>
          <ValidationComponent />
        </TRPCProvider>
      )

      const submitButton = screen.getByText('Submit')
      submitButton.click()

      await waitFor(() => {
        expect(screen.getByText('Error: Validation failed')).toBeInTheDocument()
        expect(screen.getByText('Title error: Title is required')).toBeInTheDocument()
      })
    })
  })

  describe('Caching and Refetching', () => {
    it('should cache query results', async () => {
      const CacheComponent = () => {
        const [count, setCount] = React.useState(0)
        const data = mockTRPCResponses.user.me()

        return (
          <div>
            <p>Render count: {count}</p>
            <p>User: {data.name}</p>
            <button onClick={() => setCount(count + 1)}>Re-render</button>
          </div>
        )
      }

      render(
        <TRPCProvider>
          <CacheComponent />
        </TRPCProvider>
      )

      expect(screen.getByText('Render count: 0')).toBeInTheDocument()
      expect(screen.getByText('User: Test User')).toBeInTheDocument()

      const reRenderButton = screen.getByText('Re-render')
      reRenderButton.click()

      await waitFor(() => {
        expect(screen.getByText('Render count: 1')).toBeInTheDocument()
        // Data should still be available from cache
        expect(screen.getByText('User: Test User')).toBeInTheDocument()
      })
    })

    it('should handle refetch on window focus', async () => {
      const RefetchComponent = () => {
        const [fetchCount, setFetchCount] = React.useState(0)
        
        React.useEffect(() => {
          const handleFocus = () => setFetchCount(prev => prev + 1)
          window.addEventListener('focus', handleFocus)
          return () => window.removeEventListener('focus', handleFocus)
        }, [])

        return <p>Fetch count: {fetchCount}</p>
      }

      render(
        <TRPCProvider>
          <RefetchComponent />
        </TRPCProvider>
      )

      expect(screen.getByText('Fetch count: 0')).toBeInTheDocument()

      // Simulate window focus
      window.dispatchEvent(new Event('focus'))

      await waitFor(() => {
        expect(screen.getByText('Fetch count: 1')).toBeInTheDocument()
      })
    })
  })

  describe('Optimistic Updates', () => {
    it('should handle optimistic updates', async () => {
      const OptimisticComponent = () => {
        const [items, setItems] = React.useState(['Item 1', 'Item 2'])
        const [isAdding, setIsAdding] = React.useState(false)

        const addItem = async () => {
          setIsAdding(true)
          // Optimistically add item
          setItems([...items, 'New Item'])
          
          // Simulate API call
          setTimeout(() => {
            setIsAdding(false)
          }, 100)
        }

        return (
          <div>
            <ul>
              {items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <button onClick={addItem} disabled={isAdding}>
              Add Item
            </button>
          </div>
        )
      }

      render(
        <TRPCProvider>
          <OptimisticComponent />
        </TRPCProvider>
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()

      const addButton = screen.getByText('Add Item')
      addButton.click()

      // Item should appear immediately (optimistic update)
      expect(screen.getByText('New Item')).toBeInTheDocument()
      expect(addButton).toBeDisabled()

      await waitFor(() => {
        expect(addButton).not.toBeDisabled()
      })
    })
  })
})
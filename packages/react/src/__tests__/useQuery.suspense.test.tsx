import React, { Suspense } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { QueryClient } from '@mfestack/core'
import { QueryClientProvider } from '../context/QueryClientProvider'
import { useQuery } from '../hooks/useQuery'

function Wrapper({ children, client }: { children: React.ReactNode; client: QueryClient }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useQuery - suspense and keepPreviousData', () => {
  test('suspense throws promise until resolved', async () => {
    const client = new QueryClient()
    const deferred: { resolve?: (v: any) => void } = {}
    const queryFn = vi.fn(() => new Promise((res) => { deferred.resolve = res }))

    function Component() {
      const { data } = useQuery({ queryKey: ['suspense'], queryFn, suspense: true })
      return <div data-testid="data">{data as any}</div>
    }

    render(
      <Wrapper client={client}>
        <Suspense fallback={<div>Loading...</div>}>
          <Component />
        </Suspense>
      </Wrapper>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await act(async () => {
      deferred.resolve?.('ok')
      await Promise.resolve()
    })

    expect(screen.getByTestId('data')).toHaveTextContent('ok')
    expect(queryFn).toHaveBeenCalled()
  })

  test('keepPreviousData retains data on key change while refetching', async () => {
    const client = new QueryClient()
    let resolveA!: (v: any) => void
    let resolveB!: (v: any) => void
    const promiseA = new Promise((res) => { resolveA = res })
    const promiseB = new Promise((res) => { resolveB = res })
    const fnA = vi.fn(() => promiseA)
    const fnB = vi.fn(() => promiseB)

    function Comp({ id }: { id: string }) {
      const { data, isLoading, refetch } = useQuery({
        queryKey: ['item', id],
        queryFn: id === 'a' ? fnA : fnB,
        keepPreviousData: true,
        enabled: false,
      })
      useEffect(() => {
        refetch().catch(() => {})
      }, [refetch])
      return (
        <div>
          <div data-testid="data">{(data as any) ?? ''}</div>
          <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
        </div>
      )
    }

    const { rerender } = render(
      <Wrapper client={client}>
        <Comp id="a" />
      </Wrapper>
    )

    await act(async () => {
      await Promise.resolve()
      resolveA('A')
    })
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('A')
    })

    rerender(
      <Wrapper client={client}>
        <Comp id="b" />
      </Wrapper>
    )
    // While fetching B, loading should be true
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')

    await act(async () => {
      await Promise.resolve()
      resolveB && resolveB('B')
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('B')
    })
  })
})



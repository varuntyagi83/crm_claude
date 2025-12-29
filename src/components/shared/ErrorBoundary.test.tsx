import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Content rendered successfully</div>
}

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })
  afterEach(() => {
    console.error = originalError
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Content rendered successfully')).toBeInTheDocument()
  })

  it('renders error UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('shows Try Again button that resets the error state', async () => {
    const user = userEvent.setup()
    let shouldThrow = true

    function DynamicThrowError() {
      if (shouldThrow) {
        throw new Error('Test error message')
      }
      return <div>Content rendered successfully</div>
    }

    render(
      <ErrorBoundary>
        <DynamicThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Fix the error condition before clicking Try Again
    shouldThrow = false

    // Click Try Again
    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.getByText('Content rendered successfully')).toBeInTheDocument()
  })

  it('shows Reload Page button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
  })

  it('displays error message in development mode', () => {
    // Vitest runs in DEV mode by default
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })
})

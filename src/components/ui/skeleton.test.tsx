import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('should render correctly', () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('should apply default animation class', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')

    expect(skeleton).toHaveClass('animate-pulse')
  })

  it('should apply default background class', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')

    expect(skeleton).toHaveClass('bg-muted')
  })

  it('should apply rounded style', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')

    expect(skeleton).toHaveClass('rounded-md')
  })

  it('should merge custom className', () => {
    render(<Skeleton className="h-4 w-20" data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')

    expect(skeleton).toHaveClass('h-4')
    expect(skeleton).toHaveClass('w-20')
  })

  it('should pass through additional HTML attributes', () => {
    render(<Skeleton data-testid="skeleton" aria-label="Loading" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('aria-label', 'Loading')
  })

  it('should render as a div element', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton.tagName).toBe('DIV')
  })

  it('should work with different size classes', () => {
    render(
      <>
        <Skeleton className="h-8 w-8" data-testid="small" />
        <Skeleton className="h-16 w-full" data-testid="large" />
        <Skeleton className="h-4 w-24" data-testid="text" />
      </>
    )

    expect(screen.getByTestId('small')).toHaveClass('h-8', 'w-8')
    expect(screen.getByTestId('large')).toHaveClass('h-16', 'w-full')
    expect(screen.getByTestId('text')).toHaveClass('h-4', 'w-24')
  })

  it('should work with rounded-full for circles', () => {
    render(<Skeleton className="h-12 w-12 rounded-full" data-testid="avatar" />)
    const skeleton = screen.getByTestId('avatar')

    expect(skeleton).toHaveClass('rounded-full')
  })
})

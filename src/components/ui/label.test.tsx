import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from './label'

describe('Label', () => {
  it('should render with children', () => {
    render(<Label>Email</Label>)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('should apply default styles', () => {
    render(<Label data-testid="label">Email</Label>)
    const label = screen.getByTestId('label')

    expect(label).toHaveClass('text-sm')
    expect(label).toHaveClass('font-medium')
  })

  it('should merge custom className', () => {
    render(<Label className="custom-class" data-testid="label">Email</Label>)
    expect(screen.getByTestId('label')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<Label ref={ref}>Email</Label>)
    expect(ref).toHaveBeenCalled()
  })

  it('should associate with input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>
    )

    const label = screen.getByText('Email')
    expect(label).toHaveAttribute('for', 'email')
  })

  it('should render as a label element', () => {
    render(<Label>Email</Label>)
    const label = screen.getByText('Email')
    expect(label.tagName).toBe('LABEL')
  })

  it('should pass through additional HTML attributes', () => {
    render(<Label data-testid="test-label" id="my-label">Email</Label>)
    const label = screen.getByTestId('test-label')
    expect(label).toHaveAttribute('id', 'my-label')
  })
})

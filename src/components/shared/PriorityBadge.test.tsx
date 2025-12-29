import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityBadge } from './PriorityBadge'

describe('PriorityBadge', () => {
  it('should render low priority with correct styling', () => {
    render(<PriorityBadge priority="low" />)

    const badge = screen.getByText('Low')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100')
    expect(badge).toHaveClass('text-gray-700')
  })

  it('should render medium priority with correct styling', () => {
    render(<PriorityBadge priority="medium" />)

    const badge = screen.getByText('Medium')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-yellow-100')
    expect(badge).toHaveClass('text-yellow-800')
  })

  it('should render high priority with correct styling', () => {
    render(<PriorityBadge priority="high" />)

    const badge = screen.getByText('High')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-orange-100')
    expect(badge).toHaveClass('text-orange-800')
  })

  it('should render urgent priority with correct styling', () => {
    render(<PriorityBadge priority="urgent" />)

    const badge = screen.getByText('Urgent')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100')
    expect(badge).toHaveClass('text-red-800')
  })

  it('should merge custom className', () => {
    render(<PriorityBadge priority="high" className="custom-class" />)

    const badge = screen.getByText('High')
    expect(badge).toHaveClass('custom-class')
  })

  it('should use outline variant from Badge', () => {
    render(<PriorityBadge priority="low" />)

    const badge = screen.getByText('Low')
    expect(badge).toHaveClass('border')
  })
})

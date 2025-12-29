import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  describe('merchant statuses', () => {
    it('should render active status with correct styling', () => {
      render(<StatusBadge status="active" />)

      const badge = screen.getByText('Active')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-800')
    })

    it('should render inactive status with correct styling', () => {
      render(<StatusBadge status="inactive" />)

      const badge = screen.getByText('Inactive')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-800')
    })

    it('should render suspended status with correct styling', () => {
      render(<StatusBadge status="suspended" />)

      const badge = screen.getByText('Suspended')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-100')
      expect(badge).toHaveClass('text-red-800')
    })

    it('should render onboarding status with correct styling', () => {
      render(<StatusBadge status="onboarding" />)

      const badge = screen.getByText('Onboarding')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-100')
      expect(badge).toHaveClass('text-blue-800')
    })
  })

  describe('ticket statuses', () => {
    it('should render open status with correct styling', () => {
      render(<StatusBadge status="open" />)

      const badge = screen.getByText('Open')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-100')
      expect(badge).toHaveClass('text-blue-800')
    })

    it('should render in_progress status with correct styling', () => {
      render(<StatusBadge status="in_progress" />)

      const badge = screen.getByText('In Progress')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-yellow-100')
      expect(badge).toHaveClass('text-yellow-800')
    })

    it('should render waiting_on_merchant status with correct styling', () => {
      render(<StatusBadge status="waiting_on_merchant" />)

      const badge = screen.getByText('Waiting')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-orange-100')
      expect(badge).toHaveClass('text-orange-800')
    })

    it('should render resolved status with correct styling', () => {
      render(<StatusBadge status="resolved" />)

      const badge = screen.getByText('Resolved')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-800')
    })

    it('should render closed status with correct styling', () => {
      render(<StatusBadge status="closed" />)

      const badge = screen.getByText('Closed')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-800')
    })
  })

  describe('unknown status', () => {
    it('should render unknown status as-is with outline variant', () => {
      // @ts-expect-error - testing unknown status
      render(<StatusBadge status="unknown_status" />)

      const badge = screen.getByText('unknown_status')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('custom className', () => {
    it('should merge custom className', () => {
      render(<StatusBadge status="active" className="custom-class" />)

      const badge = screen.getByText('Active')
      expect(badge).toHaveClass('custom-class')
    })
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from './MetricCard'
import { DollarSign, Users, TrendingUp } from 'lucide-react'

describe('MetricCard', () => {
  it('should render title', () => {
    render(<MetricCard title="Total Revenue" value="$10,000" />)
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
  })

  it('should render value', () => {
    render(<MetricCard title="Total Revenue" value="$10,000" />)
    expect(screen.getByText('$10,000')).toBeInTheDocument()
  })

  it('should render numeric value', () => {
    render(<MetricCard title="Active Users" value={1234} />)
    expect(screen.getByText('1234')).toBeInTheDocument()
  })

  it('should render subtitle when provided', () => {
    render(
      <MetricCard
        title="Total Revenue"
        value="$10,000"
        subtitle="Last 30 days"
      />
    )

    expect(screen.getByText('Last 30 days')).toBeInTheDocument()
  })

  it('should not render subtitle when not provided', () => {
    render(<MetricCard title="Total Revenue" value="$10,000" />)
    expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument()
  })

  it('should render icon when provided', () => {
    const { container } = render(
      <MetricCard title="Revenue" value="$10,000" icon={DollarSign} />
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should not render icon when not provided', () => {
    const { container } = render(
      <MetricCard title="Revenue" value="$10,000" />
    )

    // Only the card content, no icon container
    const iconContainer = container.querySelector('.rounded-full.bg-primary\\/10')
    expect(iconContainer).not.toBeInTheDocument()
  })

  describe('trend', () => {
    it('should render positive trend with correct styling', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$10,000"
          trend={{ value: 12, label: 'from last month' }}
        />
      )

      const trendText = screen.getByText('+12% from last month')
      expect(trendText).toBeInTheDocument()
      expect(trendText).toHaveClass('text-green-600')
    })

    it('should render negative trend with correct styling', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$10,000"
          trend={{ value: -5, label: 'from last month' }}
        />
      )

      const trendText = screen.getByText('-5% from last month')
      expect(trendText).toBeInTheDocument()
      expect(trendText).toHaveClass('text-red-600')
    })

    it('should render zero trend as positive', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$10,000"
          trend={{ value: 0, label: 'from last month' }}
        />
      )

      const trendText = screen.getByText('+0% from last month')
      expect(trendText).toBeInTheDocument()
      expect(trendText).toHaveClass('text-green-600')
    })

    it('should not render trend when not provided', () => {
      render(<MetricCard title="Revenue" value="$10,000" />)
      expect(screen.queryByText(/from last month/)).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      render(<MetricCard title="Revenue" value="$10,000" loading />)

      // Should show skeletons instead of actual content
      expect(screen.queryByText('Revenue')).not.toBeInTheDocument()
      expect(screen.queryByText('$10,000')).not.toBeInTheDocument()

      // Check for skeleton elements
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not show actual content when loading', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$10,000"
          subtitle="Last 30 days"
          loading
        />
      )

      expect(screen.queryByText('$10,000')).not.toBeInTheDocument()
      expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument()
    })
  })

  it('should merge custom className', () => {
    const { container } = render(
      <MetricCard
        title="Revenue"
        value="$10,000"
        className="custom-class"
      />
    )

    const card = container.firstChild
    expect(card).toHaveClass('custom-class')
  })

  it('should render complete metric card correctly', () => {
    render(
      <MetricCard
        title="Total Merchants"
        value={1234}
        subtitle="Active accounts"
        icon={Users}
        trend={{ value: 8.5, label: 'from last week' }}
      />
    )

    expect(screen.getByText('Total Merchants')).toBeInTheDocument()
    expect(screen.getByText('1234')).toBeInTheDocument()
    expect(screen.getByText('Active accounts')).toBeInTheDocument()
    expect(screen.getByText('+8.5% from last week')).toBeInTheDocument()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'
import { Search, Plus } from 'lucide-react'

describe('EmptyState', () => {
  it('should render title', () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('should render title as h3 element', () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('No items found')
  })

  it('should render description when provided', () => {
    render(
      <EmptyState
        title="No items found"
        description="Try adjusting your search or filters"
      />
    )

    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
  })

  it('should not render description when not provided', () => {
    const { container } = render(<EmptyState title="No items found" />)
    const description = container.querySelector('p')
    expect(description).toBeNull()
  })

  it('should render action button when provided', () => {
    render(
      <EmptyState
        title="No items found"
        action={{
          label: 'Add Item',
          onClick: vi.fn(),
        }}
      />
    )

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument()
  })

  it('should call action onClick when button is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <EmptyState
        title="No items found"
        action={{
          label: 'Add Item',
          onClick: handleClick,
        }}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Add Item' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should not render action button when not provided', () => {
    render(<EmptyState title="No items found" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should render default FolderOpen icon when no icon provided', () => {
    const { container } = render(<EmptyState title="No items found" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should render custom icon when provided', () => {
    const { container } = render(
      <EmptyState title="No results" icon={Search} />
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should merge custom className', () => {
    const { container } = render(
      <EmptyState title="No items found" className="custom-class" />
    )

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('custom-class')
  })

  it('should have centered layout', () => {
    const { container } = render(<EmptyState title="No items found" />)

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('flex')
    expect(wrapper).toHaveClass('flex-col')
    expect(wrapper).toHaveClass('items-center')
    expect(wrapper).toHaveClass('justify-center')
    expect(wrapper).toHaveClass('text-center')
  })

  it('should render full composition correctly', () => {
    const handleClick = vi.fn()

    render(
      <EmptyState
        title="No merchants found"
        description="Get started by adding your first merchant"
        icon={Plus}
        action={{
          label: 'Add Merchant',
          onClick: handleClick,
        }}
      />
    )

    expect(screen.getByText('No merchants found')).toBeInTheDocument()
    expect(screen.getByText('Get started by adding your first merchant')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Merchant' })).toBeInTheDocument()
  })
})

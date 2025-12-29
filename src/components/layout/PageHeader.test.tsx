import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { PageHeader } from './PageHeader'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('PageHeader', () => {
  it('should render title', () => {
    renderWithRouter(<PageHeader title="Dashboard" />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard')
  })

  it('should render description', () => {
    renderWithRouter(
      <PageHeader title="Dashboard" description="Overview of your CRM" />
    )

    expect(screen.getByText('Overview of your CRM')).toBeInTheDocument()
  })

  it('should render subtitle as description fallback', () => {
    renderWithRouter(
      <PageHeader title="Dashboard" subtitle="Subtitle text" />
    )

    expect(screen.getByText('Subtitle text')).toBeInTheDocument()
  })

  it('should prefer description over subtitle', () => {
    renderWithRouter(
      <PageHeader
        title="Dashboard"
        description="Description text"
        subtitle="Subtitle text"
      />
    )

    expect(screen.getByText('Description text')).toBeInTheDocument()
    expect(screen.queryByText('Subtitle text')).not.toBeInTheDocument()
  })

  it('should render actions', () => {
    renderWithRouter(
      <PageHeader
        title="Dashboard"
        actions={<button>Add New</button>}
      />
    )

    expect(screen.getByText('Add New')).toBeInTheDocument()
  })

  it('should render breadcrumbs', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Merchants', href: '/merchants' },
      { label: 'Details' },
    ]

    renderWithRouter(
      <PageHeader title="Merchant Details" breadcrumbs={breadcrumbs} />
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Merchants')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('should render breadcrumb links', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Current' },
    ]

    renderWithRouter(
      <PageHeader title="Current Page" breadcrumbs={breadcrumbs} />
    )

    const homeLink = screen.getByText('Home')
    expect(homeLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('should not render breadcrumb navigation for empty array', () => {
    renderWithRouter(<PageHeader title="Dashboard" breadcrumbs={[]} />)

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = renderWithRouter(
      <PageHeader title="Dashboard" className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should not render description when not provided', () => {
    renderWithRouter(<PageHeader title="Dashboard" />)

    const paragraph = document.querySelector('p')
    expect(paragraph).not.toBeInTheDocument()
  })

  it('should not render actions container when actions not provided', () => {
    renderWithRouter(<PageHeader title="Dashboard" />)

    // Only the title container should exist, not the actions container
    const divs = document.querySelectorAll('.flex.items-center.gap-2')
    expect(divs.length).toBe(0)
  })
})

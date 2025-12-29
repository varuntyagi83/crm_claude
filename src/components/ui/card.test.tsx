import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card'

describe('Card', () => {
  it('should render with children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('should apply default styles', () => {
    render(<Card data-testid="card">Content</Card>)
    const card = screen.getByTestId('card')

    expect(card).toHaveClass('rounded-lg')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('shadow-sm')
  })

  it('should merge custom className', () => {
    render(<Card className="custom-class" data-testid="card">Content</Card>)
    expect(screen.getByTestId('card')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<Card ref={ref}>Content</Card>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardHeader', () => {
  it('should render with children', () => {
    render(<CardHeader>Header content</CardHeader>)
    expect(screen.getByText('Header content')).toBeInTheDocument()
  })

  it('should apply default styles', () => {
    render(<CardHeader data-testid="header">Content</CardHeader>)
    const header = screen.getByTestId('header')

    expect(header).toHaveClass('flex')
    expect(header).toHaveClass('flex-col')
    expect(header).toHaveClass('p-6')
  })

  it('should merge custom className', () => {
    render(<CardHeader className="custom-class" data-testid="header">Content</CardHeader>)
    expect(screen.getByTestId('header')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<CardHeader ref={ref}>Content</CardHeader>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardTitle', () => {
  it('should render with children', () => {
    render(<CardTitle>Title</CardTitle>)
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('should apply default styles', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>)
    const title = screen.getByTestId('title')

    expect(title).toHaveClass('text-2xl')
    expect(title).toHaveClass('font-semibold')
  })

  it('should merge custom className', () => {
    render(<CardTitle className="custom-class" data-testid="title">Title</CardTitle>)
    expect(screen.getByTestId('title')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<CardTitle ref={ref}>Title</CardTitle>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardDescription', () => {
  it('should render with children', () => {
    render(<CardDescription>Description text</CardDescription>)
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })

  it('should apply default styles', () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>)
    const desc = screen.getByTestId('desc')

    expect(desc).toHaveClass('text-sm')
    expect(desc).toHaveClass('text-muted-foreground')
  })

  it('should merge custom className', () => {
    render(<CardDescription className="custom-class" data-testid="desc">Description</CardDescription>)
    expect(screen.getByTestId('desc')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<CardDescription ref={ref}>Description</CardDescription>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardContent', () => {
  it('should render with children', () => {
    render(<CardContent>Content area</CardContent>)
    expect(screen.getByText('Content area')).toBeInTheDocument()
  })

  it('should apply default styles', () => {
    render(<CardContent data-testid="content">Content</CardContent>)
    const content = screen.getByTestId('content')

    expect(content).toHaveClass('p-6')
    expect(content).toHaveClass('pt-0')
  })

  it('should merge custom className', () => {
    render(<CardContent className="custom-class" data-testid="content">Content</CardContent>)
    expect(screen.getByTestId('content')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<CardContent ref={ref}>Content</CardContent>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardFooter', () => {
  it('should render with children', () => {
    render(<CardFooter>Footer content</CardFooter>)
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('should apply default styles', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>)
    const footer = screen.getByTestId('footer')

    expect(footer).toHaveClass('flex')
    expect(footer).toHaveClass('items-center')
    expect(footer).toHaveClass('p-6')
    expect(footer).toHaveClass('pt-0')
  })

  it('should merge custom className', () => {
    render(<CardFooter className="custom-class" data-testid="footer">Footer</CardFooter>)
    expect(screen.getByTestId('footer')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<CardFooter ref={ref}>Footer</CardFooter>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('Card composition', () => {
  it('should render a complete card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description here</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    )

    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card description here')).toBeInTheDocument()
    expect(screen.getByText('Main content')).toBeInTheDocument()
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })
})

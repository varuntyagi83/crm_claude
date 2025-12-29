import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog'

describe('Dialog', () => {
  it('should not show content when closed', () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    expect(screen.queryByText('Title')).not.toBeInTheDocument()
  })

  it('should show content when open', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('should call onOpenChange when close button is clicked', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()

    render(
      <Dialog open={true} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it('should close on Escape key press', () => {
    const handleOpenChange = vi.fn()

    render(
      <Dialog open={true} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it('should close when clicking overlay', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()

    const { container } = render(
      <Dialog open={true} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    // Find the overlay by class
    const overlay = container.querySelector('.bg-black\\/80')
    if (overlay) {
      await user.click(overlay)
      expect(handleOpenChange).toHaveBeenCalledWith(false)
    }
  })
})

describe('DialogTrigger', () => {
  it('should open dialog when clicked', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()

    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))
    expect(handleOpenChange).toHaveBeenCalledWith(true)
  })

  it('should work with asChild prop', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()

    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button>Custom Button</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Custom Button'))
    expect(handleOpenChange).toHaveBeenCalledWith(true)
  })
})

describe('DialogHeader', () => {
  it('should render with children', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>Header Content</DialogHeader>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Header Content')).toBeInTheDocument()
  })

  it('should apply default styles', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader data-testid="header">Header</DialogHeader>
        </DialogContent>
      </Dialog>
    )

    const header = screen.getByTestId('header')
    expect(header).toHaveClass('flex')
    expect(header).toHaveClass('flex-col')
  })

  it('should merge custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader className="custom-class" data-testid="header">Header</DialogHeader>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByTestId('header')).toHaveClass('custom-class')
  })
})

describe('DialogFooter', () => {
  it('should render with children', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter>Footer Content</DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Footer Content')).toBeInTheDocument()
  })

  it('should apply default styles', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter data-testid="footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )

    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('flex')
  })

  it('should merge custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter className="custom-class" data-testid="footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByTestId('footer')).toHaveClass('custom-class')
  })
})

describe('DialogTitle', () => {
  it('should render with children', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>My Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('My Dialog Title')).toBeInTheDocument()
  })

  it('should render as h2 element', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('should apply default styles', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle data-testid="title">Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    const title = screen.getByTestId('title')
    expect(title).toHaveClass('text-lg')
    expect(title).toHaveClass('font-semibold')
  })

  it('should merge custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle className="custom-class" data-testid="title">Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByTestId('title')).toHaveClass('custom-class')
  })
})

describe('DialogDescription', () => {
  it('should render with children', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>This is a description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('This is a description')).toBeInTheDocument()
  })

  it('should render as p element', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription data-testid="desc">Description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const desc = screen.getByTestId('desc')
    expect(desc.tagName).toBe('P')
  })

  it('should apply default styles', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription data-testid="desc">Description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const desc = screen.getByTestId('desc')
    expect(desc).toHaveClass('text-sm')
    expect(desc).toHaveClass('text-muted-foreground')
  })

  it('should merge custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription className="custom-class" data-testid="desc">Description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByTestId('desc')).toHaveClass('custom-class')
  })
})

describe('Dialog composition', () => {
  it('should render a complete dialog with all subcomponents', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>Are you sure you want to proceed?</DialogDescription>
          </DialogHeader>
          <div>Main content here</div>
          <DialogFooter>
            <button>Cancel</button>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    expect(screen.getByText('Main content here')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })
})

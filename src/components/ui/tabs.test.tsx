import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

describe('Tabs', () => {
  const TestTabs = ({ onValueChange }: { onValueChange?: (value: string) => void }) => (
    <Tabs defaultValue="tab1" onValueChange={onValueChange}>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  )

  it('should render all tabs', () => {
    render(<TestTabs />)

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.getByText('Tab 3')).toBeInTheDocument()
  })

  it('should display default tab content', () => {
    render(<TestTabs />)

    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument()
  })

  it('should switch tab content when clicking on tab', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)

    await user.click(screen.getByText('Tab 2'))

    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument()
  })

  it('should call onValueChange when tab is switched', async () => {
    const user = userEvent.setup()
    const handleValueChange = vi.fn()
    render(<TestTabs onValueChange={handleValueChange} />)

    await user.click(screen.getByText('Tab 2'))
    expect(handleValueChange).toHaveBeenCalledWith('tab2')
  })

  it('should highlight the active tab', () => {
    render(<TestTabs />)

    const tab1 = screen.getByText('Tab 1')
    expect(tab1).toHaveClass('bg-background')
  })

  it('should work as controlled component', async () => {
    const user = userEvent.setup()
    const ControlledTabs = () => {
      const [value, setValue] = React.useState('tab1')
      return (
        <Tabs value={value} onValueChange={setValue}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
    }

    // Need to import React for this test
    const React = await import('react')
    render(<ControlledTabs />)

    expect(screen.getByText('Content 1')).toBeInTheDocument()

    await user.click(screen.getByText('Tab 2'))
    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })
})

describe('TabsList', () => {
  it('should render with default styles', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )

    // TabsList is the element containing the button
    const tabsList = container.querySelector('.inline-flex.rounded-md')
    expect(tabsList).toBeInTheDocument()
    expect(tabsList).toHaveClass('inline-flex')
    expect(tabsList).toHaveClass('rounded-md')
    expect(tabsList).toHaveClass('bg-muted')
  })

  it('should merge custom className', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-class">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )

    const tabsList = container.querySelector('.custom-class')
    expect(tabsList).toBeInTheDocument()
    expect(tabsList).toHaveClass('custom-class')
  })
})

describe('TabsTrigger', () => {
  it('should render as a button', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )

    expect(screen.getByRole('button', { name: 'Tab 1' })).toBeInTheDocument()
  })

  it('should have correct type attribute', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('should merge custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" className="custom-class">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )

    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })
})

describe('TabsContent', () => {
  it('should only render when selected', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
  })

  it('should merge custom className', async () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-class">
          <div data-testid="content">Content</div>
        </TabsContent>
      </Tabs>
    )

    const content = screen.getByTestId('content').parentElement
    expect(content).toHaveClass('custom-class')
  })
})

describe('Tabs error handling', () => {
  it('should throw error when TabsTrigger is used outside Tabs', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TabsTrigger value="tab1">Tab 1</TabsTrigger>)
    }).toThrow('Tabs components must be used within a Tabs provider')

    consoleSpy.mockRestore()
  })

  it('should throw error when TabsContent is used outside Tabs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TabsContent value="tab1">Content</TabsContent>)
    }).toThrow('Tabs components must be used within a Tabs provider')

    consoleSpy.mockRestore()
  })
})

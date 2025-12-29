import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from './select'

describe('Select', () => {
  const defaultOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  it('should render correctly', () => {
    render(<Select options={defaultOptions} data-testid="select" />)
    expect(screen.getByTestId('select')).toBeInTheDocument()
  })

  it('should render all options', () => {
    render(<Select options={defaultOptions} />)

    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })

  it('should render placeholder when provided', () => {
    render(<Select options={defaultOptions} placeholder="Select an option" />)
    expect(screen.getByText('Select an option')).toBeInTheDocument()
  })

  it('should handle change events', async () => {
    const handleChange = vi.fn()
    render(
      <Select
        options={defaultOptions}
        onChange={handleChange}
        data-testid="select"
      />
    )

    fireEvent.change(screen.getByTestId('select'), { target: { value: 'option2' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('should reflect selected value', () => {
    render(
      <Select
        options={defaultOptions}
        value="option2"
        onChange={() => {}}
        data-testid="select"
      />
    )

    expect(screen.getByTestId('select')).toHaveValue('option2')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Select options={defaultOptions} disabled data-testid="select" />)
    expect(screen.getByTestId('select')).toBeDisabled()
  })

  it('should merge custom className', () => {
    render(<Select options={defaultOptions} className="custom-class" data-testid="select" />)
    expect(screen.getByTestId('select')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<Select options={defaultOptions} ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('should have correct base styles', () => {
    render(<Select options={defaultOptions} data-testid="select" />)
    const select = screen.getByTestId('select')

    expect(select).toHaveClass('rounded-md')
    expect(select).toHaveClass('border')
    expect(select).toHaveClass('h-10')
  })

  it('should render with empty options', () => {
    render(<Select options={[]} data-testid="select" />)
    const select = screen.getByTestId('select')

    expect(select).toBeInTheDocument()
    expect(select.querySelectorAll('option')).toHaveLength(0)
  })

  it('should accept name attribute', () => {
    render(<Select options={defaultOptions} name="category" data-testid="select" />)
    expect(screen.getByTestId('select')).toHaveAttribute('name', 'category')
  })

  it('should accept required attribute', () => {
    render(<Select options={defaultOptions} required data-testid="select" />)
    expect(screen.getByTestId('select')).toBeRequired()
  })

  it('should render chevron icon', () => {
    const { container } = render(<Select options={defaultOptions} />)
    // ChevronDown icon should be present in the container
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should handle focus events', () => {
    const handleFocus = vi.fn()
    render(<Select options={defaultOptions} onFocus={handleFocus} data-testid="select" />)

    fireEvent.focus(screen.getByTestId('select'))
    expect(handleFocus).toHaveBeenCalled()
  })

  it('should handle blur events', () => {
    const handleBlur = vi.fn()
    render(<Select options={defaultOptions} onBlur={handleBlur} data-testid="select" />)

    fireEvent.blur(screen.getByTestId('select'))
    expect(handleBlur).toHaveBeenCalled()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

describe('Input', () => {
  it('should render correctly', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('should handle text input', async () => {
    const user = userEvent.setup()
    render(<Input data-testid="input" />)

    const input = screen.getByTestId('input')
    await user.type(input, 'Hello World')

    expect(input).toHaveValue('Hello World')
  })

  it('should handle change events', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled" />)
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled()
  })

  it('should accept different input types', () => {
    render(<Input type="password" data-testid="password" />)
    expect(screen.getByTestId('password')).toHaveAttribute('type', 'password')
  })

  it('should handle email type', () => {
    render(<Input type="email" data-testid="email" />)
    expect(screen.getByTestId('email')).toHaveAttribute('type', 'email')
  })

  it('should handle number type', () => {
    render(<Input type="number" data-testid="number" />)
    expect(screen.getByTestId('number')).toHaveAttribute('type', 'number')
  })

  it('should merge custom className', () => {
    render(<Input className="custom-class" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<Input ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('should have correct base styles', () => {
    render(<Input data-testid="input" />)
    const input = screen.getByTestId('input')

    expect(input).toHaveClass('rounded-md')
    expect(input).toHaveClass('border')
    expect(input).toHaveClass('h-10')
  })

  it('should accept value prop for controlled input', () => {
    render(<Input value="Controlled Value" onChange={() => {}} />)
    expect(screen.getByDisplayValue('Controlled Value')).toBeInTheDocument()
  })

  it('should accept defaultValue for uncontrolled input', () => {
    render(<Input defaultValue="Default Value" />)
    expect(screen.getByDisplayValue('Default Value')).toBeInTheDocument()
  })

  it('should accept name attribute', () => {
    render(<Input name="username" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('name', 'username')
  })

  it('should accept required attribute', () => {
    render(<Input required data-testid="input" />)
    expect(screen.getByTestId('input')).toBeRequired()
  })

  it('should handle focus events', () => {
    const handleFocus = vi.fn()
    render(<Input onFocus={handleFocus} data-testid="input" />)

    fireEvent.focus(screen.getByTestId('input'))
    expect(handleFocus).toHaveBeenCalled()
  })

  it('should handle blur events', () => {
    const handleBlur = vi.fn()
    render(<Input onBlur={handleBlur} data-testid="input" />)

    fireEvent.blur(screen.getByTestId('input'))
    expect(handleBlur).toHaveBeenCalled()
  })
})

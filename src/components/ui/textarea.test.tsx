import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from './textarea'

describe('Textarea', () => {
  it('should render correctly', () => {
    render(<Textarea placeholder="Enter description" />)
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
  })

  it('should handle text input', async () => {
    const user = userEvent.setup()
    render(<Textarea data-testid="textarea" />)

    const textarea = screen.getByTestId('textarea')
    await user.type(textarea, 'Hello World')

    expect(textarea).toHaveValue('Hello World')
  })

  it('should handle change events', () => {
    const handleChange = vi.fn()
    render(<Textarea onChange={handleChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Textarea disabled placeholder="Disabled" />)
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled()
  })

  it('should merge custom className', () => {
    render(<Textarea className="custom-class" data-testid="textarea" />)
    expect(screen.getByTestId('textarea')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<Textarea ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('should have correct base styles', () => {
    render(<Textarea data-testid="textarea" />)
    const textarea = screen.getByTestId('textarea')

    expect(textarea).toHaveClass('rounded-md')
    expect(textarea).toHaveClass('border')
    expect(textarea).toHaveClass('min-h-[80px]')
  })

  it('should accept value prop for controlled textarea', () => {
    render(<Textarea value="Controlled Value" onChange={() => {}} />)
    expect(screen.getByDisplayValue('Controlled Value')).toBeInTheDocument()
  })

  it('should accept defaultValue for uncontrolled textarea', () => {
    render(<Textarea defaultValue="Default Value" />)
    expect(screen.getByDisplayValue('Default Value')).toBeInTheDocument()
  })

  it('should accept name attribute', () => {
    render(<Textarea name="description" data-testid="textarea" />)
    expect(screen.getByTestId('textarea')).toHaveAttribute('name', 'description')
  })

  it('should accept required attribute', () => {
    render(<Textarea required data-testid="textarea" />)
    expect(screen.getByTestId('textarea')).toBeRequired()
  })

  it('should accept rows attribute', () => {
    render(<Textarea rows={5} data-testid="textarea" />)
    expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '5')
  })

  it('should handle focus events', () => {
    const handleFocus = vi.fn()
    render(<Textarea onFocus={handleFocus} data-testid="textarea" />)

    fireEvent.focus(screen.getByTestId('textarea'))
    expect(handleFocus).toHaveBeenCalled()
  })

  it('should handle blur events', () => {
    const handleBlur = vi.fn()
    render(<Textarea onBlur={handleBlur} data-testid="textarea" />)

    fireEvent.blur(screen.getByTestId('textarea'))
    expect(handleBlur).toHaveBeenCalled()
  })

  it('should handle multiline input', async () => {
    const user = userEvent.setup()
    render(<Textarea data-testid="textarea" />)

    const textarea = screen.getByTestId('textarea')
    await user.type(textarea, 'Line 1{enter}Line 2{enter}Line 3')

    expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3')
  })
})

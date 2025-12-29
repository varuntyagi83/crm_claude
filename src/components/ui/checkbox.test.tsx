import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './checkbox'

describe('Checkbox', () => {
  it('should render correctly', () => {
    render(<Checkbox data-testid="checkbox" />)
    expect(screen.getByTestId('checkbox')).toBeInTheDocument()
  })

  it('should be unchecked by default', () => {
    render(<Checkbox data-testid="checkbox" />)
    expect(screen.getByTestId('checkbox')).not.toBeChecked()
  })

  it('should be checked when checked prop is true', () => {
    render(<Checkbox checked onChange={() => {}} data-testid="checkbox" />)
    expect(screen.getByTestId('checkbox')).toBeChecked()
  })

  it('should call onChange when clicked', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Checkbox onChange={handleChange} data-testid="checkbox" />)

    await user.click(screen.getByTestId('checkbox'))
    expect(handleChange).toHaveBeenCalled()
  })

  it('should call onCheckedChange with correct value', async () => {
    const user = userEvent.setup()
    const handleCheckedChange = vi.fn()
    render(<Checkbox onCheckedChange={handleCheckedChange} data-testid="checkbox" />)

    await user.click(screen.getByTestId('checkbox'))
    expect(handleCheckedChange).toHaveBeenCalledWith(true)
  })

  it('should call onCheckedChange with false when unchecking', async () => {
    const user = userEvent.setup()
    const handleCheckedChange = vi.fn()
    render(
      <Checkbox
        checked
        onCheckedChange={handleCheckedChange}
        onChange={() => {}}
        data-testid="checkbox"
      />
    )

    await user.click(screen.getByTestId('checkbox'))
    expect(handleCheckedChange).toHaveBeenCalledWith(false)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox disabled data-testid="checkbox" />)
    expect(screen.getByTestId('checkbox')).toBeDisabled()
  })

  it('should not call onChange when disabled and clicked', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Checkbox disabled onChange={handleChange} data-testid="checkbox" />)

    await user.click(screen.getByTestId('checkbox'))
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<Checkbox ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('should accept id attribute', () => {
    render(<Checkbox id="terms" data-testid="checkbox" />)
    expect(screen.getByTestId('checkbox')).toHaveAttribute('id', 'terms')
  })

  it('should accept name attribute', () => {
    render(<Checkbox name="agree" data-testid="checkbox" />)
    expect(screen.getByTestId('checkbox')).toHaveAttribute('name', 'agree')
  })

  it('should show check icon when checked', () => {
    const { container } = render(<Checkbox checked onChange={() => {}} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should not show check icon when unchecked', () => {
    const { container } = render(<Checkbox />)
    const checkboxContainer = container.querySelector('.h-4.w-4')
    // The check icon should not be present when unchecked
    expect(checkboxContainer?.querySelector('svg')).not.toBeInTheDocument()
  })

  it('should work with label association', () => {
    render(
      <>
        <Checkbox id="accept" data-testid="checkbox" />
        <label htmlFor="accept">Accept terms</label>
      </>
    )

    expect(screen.getByLabelText('Accept terms')).toBeInTheDocument()
  })
})

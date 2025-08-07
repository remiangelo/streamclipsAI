import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('should render basic input', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('data-slot', 'input')
  })

  it('should render with placeholder', () => {
    render(<Input placeholder="Enter text here" />)
    const input = screen.getByPlaceholderText('Enter text here')
    expect(input).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    render(<Input className="custom-input" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  it('should render with different input types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />)
    let input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'text')

    rerender(<Input type="email" data-testid="input" />)
    input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'email')

    rerender(<Input type="password" data-testid="input" />)
    input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'password')

    rerender(<Input type="number" data-testid="input" />)
    input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'number')
  })

  it('should handle user input', async () => {
    const user = userEvent.setup()
    render(<Input />)
    const input = screen.getByRole('textbox')

    await user.type(input, 'Hello World')
    expect(input).toHaveValue('Hello World')
  })

  it('should handle onChange event', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)
    const input = screen.getByRole('textbox')

    await user.type(input, 'Test')
    expect(handleChange).toHaveBeenCalledTimes(4) // Once for each character
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should handle onFocus and onBlur events', async () => {
    const user = userEvent.setup()
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
    const input = screen.getByRole('textbox')

    await user.click(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)

    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('should handle value prop', () => {
    const { rerender } = render(<Input value="initial value" readOnly />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('initial value')

    rerender(<Input value="updated value" readOnly />)
    expect(input).toHaveValue('updated value')
  })

  it('should handle defaultValue prop', () => {
    render(<Input defaultValue="default text" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('default text')
  })

  it('should pass through additional props', () => {
    render(
      <Input 
        data-testid="test-input" 
        id="my-input"
        name="username"
        required
        maxLength={50}
      />
    )
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('id', 'my-input')
    expect(input).toHaveAttribute('name', 'username')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAttribute('maxLength', '50')
  })

  it('should handle aria attributes', () => {
    render(
      <Input 
        aria-label="Username input"
        aria-describedby="username-help"
        aria-invalid="true"
      />
    )
    const input = screen.getByLabelText('Username input')
    expect(input).toHaveAttribute('aria-describedby', 'username-help')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('should handle file input type', () => {
    render(<Input type="file" data-testid="file-input" />)
    const input = screen.getByTestId('file-input')
    expect(input).toHaveAttribute('type', 'file')
  })

  it('should handle controlled input', async () => {
    const user = userEvent.setup()
    const ControlledInput = () => {
      const [value, setValue] = React.useState('')
      return (
        <Input 
          value={value} 
          onChange={(e) => setValue(e.target.value.toUpperCase())} 
        />
      )
    }

    render(<ControlledInput />)
    const input = screen.getByRole('textbox')

    await user.type(input, 'hello')
    expect(input).toHaveValue('HELLO')
  })

  it('should handle keyboard events', async () => {
    const user = userEvent.setup()
    const handleKeyDown = vi.fn()
    const handleKeyUp = vi.fn()
    
    render(<Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />)
    const input = screen.getByRole('textbox')

    await user.click(input)
    await user.keyboard('{Enter}')
    
    expect(handleKeyDown).toHaveBeenCalled()
    expect(handleKeyUp).toHaveBeenCalled()
  })
})
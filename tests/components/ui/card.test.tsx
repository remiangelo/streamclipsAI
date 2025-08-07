import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardAction
} from '@/components/ui/card'

describe('Card', () => {
  it('should render basic card', () => {
    render(<Card>Card content</Card>)
    const card = screen.getByText('Card content')
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('data-slot', 'card')
  })

  it('should render with custom className', () => {
    render(<Card className="custom-class">Card content</Card>)
    const card = screen.getByText('Card content')
    expect(card).toHaveClass('custom-class')
  })

  it('should pass through additional props', () => {
    render(<Card data-testid="test-card" id="my-card">Card content</Card>)
    const card = screen.getByTestId('test-card')
    expect(card).toHaveAttribute('id', 'my-card')
  })
})

describe('CardHeader', () => {
  it('should render header', () => {
    render(<CardHeader>Header content</CardHeader>)
    const header = screen.getByText('Header content')
    expect(header).toBeInTheDocument()
    expect(header).toHaveAttribute('data-slot', 'card-header')
  })

  it('should render with custom className', () => {
    render(<CardHeader className="custom-header">Header</CardHeader>)
    const header = screen.getByText('Header')
    expect(header).toHaveClass('custom-header')
  })
})

describe('CardTitle', () => {
  it('should render title', () => {
    render(<CardTitle>Title text</CardTitle>)
    const title = screen.getByText('Title text')
    expect(title).toBeInTheDocument()
    expect(title).toHaveAttribute('data-slot', 'card-title')
  })

  it('should apply font styling', () => {
    render(<CardTitle>Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title).toHaveClass('font-semibold')
  })
})

describe('CardDescription', () => {
  it('should render description', () => {
    render(<CardDescription>Description text</CardDescription>)
    const description = screen.getByText('Description text')
    expect(description).toBeInTheDocument()
    expect(description).toHaveAttribute('data-slot', 'card-description')
  })

  it('should apply text styling', () => {
    render(<CardDescription>Description</CardDescription>)
    const description = screen.getByText('Description')
    expect(description).toHaveClass('text-sm')
  })
})

describe('CardAction', () => {
  it('should render action', () => {
    render(<CardAction>Action content</CardAction>)
    const action = screen.getByText('Action content')
    expect(action).toBeInTheDocument()
    expect(action).toHaveAttribute('data-slot', 'card-action')
  })

  it('should apply grid positioning', () => {
    render(<CardAction>Action</CardAction>)
    const action = screen.getByText('Action')
    expect(action).toHaveClass('col-start-2')
    expect(action).toHaveClass('row-span-2')
  })
})

describe('CardContent', () => {
  it('should render content', () => {
    render(<CardContent>Content text</CardContent>)
    const content = screen.getByText('Content text')
    expect(content).toBeInTheDocument()
    expect(content).toHaveAttribute('data-slot', 'card-content')
  })

  it('should apply padding', () => {
    render(<CardContent>Content</CardContent>)
    const content = screen.getByText('Content')
    expect(content).toHaveClass('px-6')
  })
})

describe('CardFooter', () => {
  it('should render footer', () => {
    render(<CardFooter>Footer content</CardFooter>)
    const footer = screen.getByText('Footer content')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveAttribute('data-slot', 'card-footer')
  })

  it('should apply flex styling', () => {
    render(<CardFooter>Footer</CardFooter>)
    const footer = screen.getByText('Footer')
    expect(footer).toHaveClass('flex')
    expect(footer).toHaveClass('items-center')
  })
})

describe('Card composition', () => {
  it('should render complete card with all components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>This is a test card</CardDescription>
          <CardAction>
            <button>Action</button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Card body content</p>
        </CardContent>
        <CardFooter>
          <span>Footer text</span>
        </CardFooter>
      </Card>
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('This is a test card')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.getByText('Card body content')).toBeInTheDocument()
    expect(screen.getByText('Footer text')).toBeInTheDocument()
  })

  it('should handle nested content properly', () => {
    render(
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Complex Title</CardTitle>
            <CardDescription>With nested elements</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <p>Nested content 1</p>
            <p>Nested content 2</p>
          </div>
        </CardContent>
      </Card>
    )

    expect(screen.getByText('Complex Title')).toBeInTheDocument()
    expect(screen.getByText('With nested elements')).toBeInTheDocument()
    expect(screen.getByText('Nested content 1')).toBeInTheDocument()
    expect(screen.getByText('Nested content 2')).toBeInTheDocument()
  })
})
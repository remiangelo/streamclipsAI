import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import HomePage from '@/app/page'

describe('HomePage', () => {
  it('should render the hero section', () => {
    render(<HomePage />)

    expect(screen.getByText(/Transform your streams/i)).toBeInTheDocument()
    // Use getAllByText since there are multiple elements with this text
    const viralTexts = screen.getAllByText(/into viral content/i)
    expect(viralTexts.length).toBeGreaterThan(0)
  })

  it('should render the main CTA button', () => {
    render(<HomePage />)

    const ctaButton = screen.getByText(/Start free trial/i)
    expect(ctaButton).toBeInTheDocument()
  })

  it('should render feature cards', () => {
    render(<HomePage />)

    expect(screen.getByText(/AI Chat Analysis/i)).toBeInTheDocument()
    expect(screen.getByText(/Instant Processing/i)).toBeInTheDocument()
    expect(screen.getByText(/Platform Optimized/i)).toBeInTheDocument()
  })

  it('should render statistics', () => {
    render(<HomePage />)

    expect(screen.getByText(/10K\+/)).toBeInTheDocument()
    expect(screen.getByText(/Clips Generated/i)).toBeInTheDocument()
    expect(screen.getByText(/2M\+/)).toBeInTheDocument()
    expect(screen.getByText(/Hours Analyzed/i)).toBeInTheDocument()
  })

  it('should render the footer', () => {
    render(<HomePage />)

    expect(screen.getByText(/© 2024 StreamClips AI/i)).toBeInTheDocument()
  })

  it('should have proper navigation links', () => {
    render(<HomePage />)

    // Use getAllByText since links appear in both header and footer
    const featuresLinks = screen.getAllByText('Features')
    expect(featuresLinks.length).toBeGreaterThan(0)
    
    const pricingLinks = screen.getAllByText('Pricing')
    expect(pricingLinks.length).toBeGreaterThan(0)
    
    const docsLinks = screen.getAllByText('Docs')
    expect(docsLinks.length).toBeGreaterThan(0)
  })
})
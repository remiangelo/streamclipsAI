import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import HomePage from '@/app/page'

describe('HomePage', () => {
  it('should render the hero section', () => {
    render(<HomePage />)

    expect(screen.getByText('Transform your')).toBeInTheDocument()
    expect(screen.getByText('Twitch streams')).toBeInTheDocument()
    expect(screen.getByText('into viral clips')).toBeInTheDocument()
  })

  it('should render the main CTA button', () => {
    render(<HomePage />)

    const ctaButtons = screen.getAllByText(/Start free trial/i)
    expect(ctaButtons.length).toBeGreaterThan(0)
  })

  it('should render feature cards', () => {
    render(<HomePage />)

    expect(screen.getByText('Smart Chat Analysis')).toBeInTheDocument()
    expect(screen.getByText('Lightning Fast')).toBeInTheDocument()
    expect(screen.getByText('Platform Ready')).toBeInTheDocument()
  })

  it('should render statistics', () => {
    render(<HomePage />)

    expect(screen.getByText('50K+')).toBeInTheDocument()
    expect(screen.getByText('Clips Generated')).toBeInTheDocument()
    expect(screen.getByText('10M+')).toBeInTheDocument()
    expect(screen.getByText('Hours Analyzed')).toBeInTheDocument()
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
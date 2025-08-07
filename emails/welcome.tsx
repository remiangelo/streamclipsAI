import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  userName: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://streamclips.ai';

export const WelcomeEmail = ({ userName }: WelcomeEmailProps) => {
  const dashboardUrl = `${baseUrl}/dashboard`;
  const docsUrl = `${baseUrl}/docs/getting-started`;

  return (
    <Html>
      <Head />
      <Preview>Welcome to StreamClips AI - Let's create viral content!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="48"
            height="48"
            alt="StreamClips AI"
            style={logo}
          />
          
          <Heading style={heading}>Welcome to StreamClips AI! 🎉</Heading>
          
          <Text style={paragraph}>Hi {userName},</Text>
          
          <Text style={paragraph}>
            Welcome aboard! We're thrilled to have you join StreamClips AI. You're now
            ready to transform your Twitch VODs into viral-worthy clips with the power
            of AI.
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href={dashboardUrl}>
              Get Started
            </Button>
          </Section>

          <Hr style={hr} />

          <Heading as="h3" style={subheading}>
            Here's what you can do with StreamClips AI:
          </Heading>

          <Section style={featureSection}>
            <div style={featureItem}>
              <Text style={featureIcon}>🤖</Text>
              <Text style={featureText}>
                <strong>AI-Powered Analysis</strong>
                <br />
                Our AI analyzes chat activity to find the most engaging moments
              </Text>
            </div>

            <div style={featureItem}>
              <Text style={featureIcon}>✂️</Text>
              <Text style={featureText}>
                <strong>Automatic Clipping</strong>
                <br />
                Extract and download clips in formats optimized for any platform
              </Text>
            </div>

            <div style={featureItem}>
              <Text style={featureIcon}>📱</Text>
              <Text style={featureText}>
                <strong>Platform Ready</strong>
                <br />
                Export to TikTok, YouTube Shorts, Instagram Reels, and more
              </Text>
            </div>

            <div style={featureItem}>
              <Text style={featureIcon}>⚡</Text>
              <Text style={featureText}>
                <strong>Fast Processing</strong>
                <br />
                Get your clips in minutes, not hours
              </Text>
            </div>
          </Section>

          <Hr style={hr} />

          <Heading as="h3" style={subheading}>
            Quick Start Guide:
          </Heading>

          <ol style={list}>
            <li style={listItem}>Import a VOD from your Twitch channel</li>
            <li style={listItem}>Let our AI analyze the chat and find highlights</li>
            <li style={listItem}>Review and download your clips</li>
            <li style={listItem}>Share them on your favorite platforms!</li>
          </ol>

          <Section style={ctaSection}>
            <Text style={ctaText}>
              Ready to create your first viral clip?
            </Text>
            <Button style={secondaryButton} href={docsUrl}>
              View Documentation
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            <strong>Your Free Tier Benefits:</strong>
            <br />
            • 5 clips per month
            <br />
            • Basic export options
            <br />
            • Standard processing speed
          </Text>

          <Text style={upgradeText}>
            Need more clips?{' '}
            <Link href={`${baseUrl}/pricing`} style={link}>
              Upgrade your plan
            </Link>{' '}
            anytime.
          </Text>

          <Text style={footerLight}>
            StreamClips AI - AI-powered highlight reels for Twitch streamers
            <br />
            <Link href={`${baseUrl}/support`} style={footerLink}>
              Support
            </Link>{' '}
            •{' '}
            <Link href={`${baseUrl}/docs`} style={footerLink}>
              Documentation
            </Link>{' '}
            •{' '}
            <Link href={`${baseUrl}/community`} style={footerLink}>
              Community
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  userName: 'Alex',
} as WelcomeEmailProps;

export default WelcomeEmail;

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#1a1a1a',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '12px',
  maxWidth: '600px',
};

const logo = {
  margin: '0 auto 32px',
  display: 'block',
};

const heading = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const subheading = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '600',
  margin: '24px 0 16px',
};

const paragraph = {
  color: '#e5e5e5',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 40px',
};

const secondaryButton = {
  backgroundColor: 'transparent',
  border: '1px solid #8b5cf6',
  borderRadius: '8px',
  color: '#8b5cf6',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const hr = {
  borderColor: '#333333',
  margin: '40px 0',
};

const featureSection = {
  margin: '24px 0',
};

const featureItem = {
  display: 'flex',
  alignItems: 'flex-start',
  margin: '20px 0',
};

const featureIcon = {
  fontSize: '32px',
  marginRight: '16px',
  flexShrink: 0,
};

const featureText = {
  color: '#e5e5e5',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const list = {
  color: '#e5e5e5',
  fontSize: '16px',
  lineHeight: '28px',
  paddingLeft: '24px',
  margin: '16px 0',
};

const listItem = {
  margin: '12px 0',
};

const ctaSection = {
  backgroundColor: '#262626',
  padding: '24px',
  borderRadius: '8px',
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const link = {
  color: '#8b5cf6',
  textDecoration: 'underline',
};

const footer = {
  color: '#a3a3a3',
  fontSize: '14px',
  lineHeight: '22px',
  textAlign: 'center' as const,
  margin: '32px 0 16px',
};

const upgradeText = {
  color: '#e5e5e5',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const footerLight = {
  color: '#737373',
  fontSize: '12px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
};

const footerLink = {
  color: '#737373',
  textDecoration: 'underline',
};
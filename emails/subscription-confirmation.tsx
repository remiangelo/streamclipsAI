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

interface SubscriptionConfirmationEmailProps {
  userName: string;
  planName: string;
  features: string[];
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://streamclips.ai';

export const SubscriptionConfirmationEmail = ({
  userName,
  planName,
  features,
}: SubscriptionConfirmationEmailProps) => {
  const dashboardUrl = `${baseUrl}/dashboard`;
  const billingUrl = `${baseUrl}/dashboard/settings/billing`;

  return (
    <Html>
      <Head />
      <Preview>Welcome to StreamClips AI {planName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="48"
            height="48"
            alt="StreamClips AI"
            style={logo}
          />
          
          <Heading style={heading}>
            Welcome to {planName}! ✨
          </Heading>
          
          <Text style={paragraph}>Hi {userName},</Text>
          
          <Text style={paragraph}>
            Thank you for upgrading to StreamClips AI {planName}! Your subscription is
            now active and you have access to all the premium features.
          </Text>

          <Section style={planContainer}>
            <Heading as="h3" style={planTitle}>
              Your {planName} Benefits
            </Heading>
            <ul style={featureList}>
              {features.map((feature, index) => (
                <li key={index} style={featureItem}>
                  <span style={checkmark}>✓</span> {feature}
                </li>
              ))}
            </ul>
          </Section>

          <Section style={btnContainer}>
            <Button style={button} href={dashboardUrl}>
              Start Creating Clips
            </Button>
          </Section>

          <Hr style={hr} />

          <Heading as="h3" style={subheading}>
            What's New in {planName}?
          </Heading>

          {planName === 'Pro' && (
            <Section style={newFeaturesSection}>
              <Text style={newFeature}>
                <strong>🚀 Unlimited Clips</strong> - No more monthly limits
              </Text>
              <Text style={newFeature}>
                <strong>⚡ Priority Processing</strong> - Your VODs are processed first
              </Text>
              <Text style={newFeature}>
                <strong>🎨 Custom Branding</strong> - Add your logo and watermarks
              </Text>
              <Text style={newFeature}>
                <strong>📊 Advanced Analytics</strong> - Track clip performance
              </Text>
            </Section>
          )}

          {planName === 'Studio' && (
            <Section style={newFeaturesSection}>
              <Text style={newFeature}>
                <strong>👥 Team Collaboration</strong> - Invite up to 5 team members
              </Text>
              <Text style={newFeature}>
                <strong>🔌 API Access</strong> - Integrate with your workflow
              </Text>
              <Text style={newFeature}>
                <strong>🎯 Custom AI Training</strong> - Train AI on your content style
              </Text>
              <Text style={newFeature}>
                <strong>📞 Priority Support</strong> - Direct access to our team
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          <Section style={billingSection}>
            <Heading as="h3" style={billingTitle}>
              Billing Information
            </Heading>
            <Text style={billingText}>
              Your subscription will automatically renew each month. You can manage your
              subscription, update payment methods, or cancel anytime from your{' '}
              <Link href={billingUrl} style={link}>
                billing settings
              </Link>
              .
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Thank you for choosing StreamClips AI! If you have any questions or need
            assistance, our{' '}
            <Link href={`${baseUrl}/support`} style={link}>
              support team
            </Link>{' '}
            is here to help.
          </Text>

          <Text style={footerLight}>
            StreamClips AI - AI-powered highlight reels for Twitch streamers
            <br />
            <Link href={billingUrl} style={footerLink}>
              Manage Subscription
            </Link>{' '}
            •{' '}
            <Link href={`${baseUrl}/support`} style={footerLink}>
              Support
            </Link>{' '}
            •{' '}
            <Link href={`${baseUrl}/docs`} style={footerLink}>
              Documentation
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

SubscriptionConfirmationEmail.PreviewProps = {
  userName: 'Alex',
  planName: 'Pro',
  features: [
    'Unlimited clips per month',
    'Priority processing',
    'Custom branding & watermarks',
    '4K export quality',
    'Advanced analytics',
    'All platform exports',
  ],
} as SubscriptionConfirmationEmailProps;

export default SubscriptionConfirmationEmail;

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

const planContainer = {
  backgroundColor: '#8b5cf6',
  padding: '24px',
  borderRadius: '12px',
  margin: '24px 0',
};

const planTitle = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const featureList = {
  listStyle: 'none',
  padding: '0',
  margin: '0',
};

const featureItem = {
  color: '#ffffff',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
  display: 'flex',
  alignItems: 'center',
};

const checkmark = {
  color: '#10b981',
  fontWeight: 'bold',
  fontSize: '18px',
  marginRight: '12px',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 40px',
};

const hr = {
  borderColor: '#333333',
  margin: '40px 0',
};

const newFeaturesSection = {
  margin: '24px 0',
};

const newFeature = {
  color: '#e5e5e5',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '12px 0',
  padding: '12px',
  backgroundColor: '#262626',
  borderRadius: '8px',
};

const billingSection = {
  backgroundColor: '#262626',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
};

const billingTitle = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const billingText = {
  color: '#e5e5e5',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
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
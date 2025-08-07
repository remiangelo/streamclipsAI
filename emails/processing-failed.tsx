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

interface ProcessingFailedEmailProps {
  userName: string;
  vodTitle: string;
  errorMessage: string;
  vodId: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://streamclips.ai';

export const ProcessingFailedEmail = ({
  userName,
  vodTitle,
  errorMessage,
  vodId,
}: ProcessingFailedEmailProps) => {
  const vodUrl = `${baseUrl}/dashboard/vods`;
  const supportUrl = `${baseUrl}/support`;

  return (
    <Html>
      <Head />
      <Preview>Processing failed for your VOD</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="48"
            height="48"
            alt="StreamClips AI"
            style={logo}
          />
          
          <Heading style={heading}>Processing Failed ❌</Heading>
          
          <Text style={paragraph}>Hi {userName},</Text>
          
          <Text style={paragraph}>
            Unfortunately, we encountered an issue while processing your VOD "{vodTitle}".
            Don't worry - your VOD is safe and you can try again.
          </Text>

          <Section style={errorContainer}>
            <Text style={errorTitle}>Error Details:</Text>
            <Text style={errorMessage}>{errorMessage}</Text>
          </Section>

          <Section style={btnContainer}>
            <Button style={button} href={vodUrl}>
              Try Again
            </Button>
          </Section>

          <Text style={paragraph}>
            Common reasons for processing failures:
          </Text>
          
          <ul style={list}>
            <li style={listItem}>VOD might be temporarily unavailable on Twitch</li>
            <li style={listItem}>The VOD might be subscriber-only or deleted</li>
            <li style={listItem}>Temporary network issues during processing</li>
            <li style={listItem}>The VOD might be too long (over 12 hours)</li>
          </ul>

          <Hr style={hr} />

          <Text style={helpText}>
            <strong>Need help?</strong> Our support team is here to assist you.
          </Text>
          
          <Section style={supportSection}>
            <Button style={supportButton} href={supportUrl}>
              Contact Support
            </Button>
          </Section>

          <Text style={footer}>
            We apologize for the inconvenience. Most issues are resolved by simply
            retrying the analysis.
          </Text>

          <Text style={footerLight}>
            StreamClips AI - AI-powered highlight reels for Twitch streamers
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

ProcessingFailedEmail.PreviewProps = {
  userName: 'Alex',
  vodTitle: 'Epic Gaming Session - Road to Diamond',
  errorMessage: 'Failed to fetch VOD data from Twitch. The VOD might be unavailable or deleted.',
  vodId: 'vod_abc123',
} as ProcessingFailedEmailProps;

export default ProcessingFailedEmail;

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
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const paragraph = {
  color: '#e5e5e5',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const errorContainer = {
  backgroundColor: '#7f1d1d',
  border: '1px solid #991b1b',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
};

const errorTitle = {
  color: '#fecaca',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const errorMessage = {
  color: '#fca5a5',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
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
  padding: '12px 32px',
};

const list = {
  color: '#e5e5e5',
  fontSize: '14px',
  lineHeight: '24px',
  paddingLeft: '20px',
  margin: '16px 0',
};

const listItem = {
  margin: '8px 0',
};

const hr = {
  borderColor: '#333333',
  margin: '32px 0',
};

const helpText = {
  color: '#e5e5e5',
  fontSize: '16px',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const supportSection = {
  textAlign: 'center' as const,
  margin: '16px 0',
};

const supportButton = {
  backgroundColor: 'transparent',
  border: '1px solid #8b5cf6',
  borderRadius: '8px',
  color: '#8b5cf6',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 24px',
};

const footer = {
  color: '#a3a3a3',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '32px 0 16px',
};

const footerLight = {
  color: '#737373',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '16px 0',
};
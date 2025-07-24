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

interface ProcessingCompleteEmailProps {
  userName: string;
  vodTitle: string;
  clipCount: number;
  vodId: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://streamclips.ai';

export const ProcessingCompleteEmail = ({
  userName,
  vodTitle,
  clipCount,
  vodId,
}: ProcessingCompleteEmailProps) => {
  const clipsUrl = `${baseUrl}/dashboard/vods/${vodId}/clips`;

  return (
    <Html>
      <Head />
      <Preview>Your {clipCount} clips are ready to view!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="48"
            height="48"
            alt="StreamClips AI"
            style={logo}
          />
          
          <Heading style={heading}>Your clips are ready! 🎬</Heading>
          
          <Text style={paragraph}>Hi {userName},</Text>
          
          <Text style={paragraph}>
            Great news! We've finished analyzing your VOD "{vodTitle}" and extracted{' '}
            <strong>{clipCount} highlight clips</strong> for you.
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href={clipsUrl}>
              View Your Clips
            </Button>
          </Section>

          <Text style={paragraph}>
            Your clips are ready to download, share, or export to your favorite platforms
            like TikTok, YouTube Shorts, and Instagram Reels.
          </Text>

          <Hr style={hr} />

          <Section style={statsContainer}>
            <Heading as="h3" style={subheading}>
              Processing Summary
            </Heading>
            <Text style={statsText}>
              <strong>VOD Title:</strong> {vodTitle}
            </Text>
            <Text style={statsText}>
              <strong>Clips Generated:</strong> {clipCount}
            </Text>
            <Text style={statsText}>
              <strong>Status:</strong>{' '}
              <span style={successBadge}>Completed</span>
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Happy clipping! If you have any questions, feel free to{' '}
            <Link href={`${baseUrl}/support`} style={link}>
              contact our support team
            </Link>
            .
          </Text>

          <Text style={footerLight}>
            StreamClips AI - AI-powered highlight reels for Twitch streamers
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

ProcessingCompleteEmail.PreviewProps = {
  userName: 'Alex',
  vodTitle: 'Epic Gaming Session - Road to Diamond',
  clipCount: 12,
  vodId: 'clp_abc123',
} as ProcessingCompleteEmailProps;

export default ProcessingCompleteEmail;

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

const subheading = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px',
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
  padding: '12px 32px',
  transition: 'background-color 0.2s',
};

const hr = {
  borderColor: '#333333',
  margin: '32px 0',
};

const statsContainer = {
  backgroundColor: '#262626',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
};

const statsText = {
  color: '#e5e5e5',
  fontSize: '14px',
  margin: '8px 0',
};

const successBadge = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  padding: '4px 12px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600',
};

const link = {
  color: '#8b5cf6',
  textDecoration: 'underline',
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
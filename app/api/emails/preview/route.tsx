import { NextRequest, NextResponse } from 'next/server';
import { ProcessingCompleteEmail } from '@/emails/processing-complete';
import { ProcessingFailedEmail } from '@/emails/processing-failed';
import { WelcomeEmail } from '@/emails/welcome';
import { SubscriptionConfirmationEmail } from '@/emails/subscription-confirmation';
import { render } from '@react-email/render';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const template = searchParams.get('template');

  let emailComponent;
  switch (template) {
    case 'processing-complete':
      emailComponent = ProcessingCompleteEmail({
        userName: 'Alex',
        vodTitle: 'Epic Gaming Session - Road to Diamond',
        clipCount: 12,
        vodId: 'clp_abc123',
      });
      break;
    
    case 'processing-failed':
      emailComponent = ProcessingFailedEmail({
        userName: 'Alex',
        vodTitle: 'Epic Gaming Session - Road to Diamond',
        errorMessage: 'Failed to fetch VOD data from Twitch. The VOD might be unavailable or deleted.',
        vodId: 'vod_abc123',
      });
      break;
    
    case 'welcome':
      emailComponent = WelcomeEmail({
        userName: 'Alex',
      });
      break;
    
    case 'subscription-confirmation':
      emailComponent = SubscriptionConfirmationEmail({
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
      });
      break;
    
    default:
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
  }

  const html = render(emailComponent);
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
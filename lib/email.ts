import { Resend } from 'resend';
import { ProcessingCompleteEmail } from '@/emails/processing-complete';
import { ProcessingFailedEmail } from '@/emails/processing-failed';
import { WelcomeEmail } from '@/emails/welcome';
import { SubscriptionConfirmationEmail } from '@/emails/subscription-confirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export class EmailService {
  private readonly from = 'StreamClips AI <noreply@streamclips.ai>';

  async sendProcessingCompleteEmail({
    to,
    userName,
    vodTitle,
    clipCount,
    vodId,
  }: {
    to: string;
    userName: string;
    vodTitle: string;
    clipCount: number;
    vodId: string;
  }) {
    try {
      const { data, error } = await resend.emails.send({
        from: this.from,
        to,
        subject: `🎬 Your ${clipCount} clips are ready!`,
        react: ProcessingCompleteEmail({
          userName,
          vodTitle,
          clipCount,
          vodId,
        }),
      });

      if (error) {
        console.error('Email send error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  async sendProcessingFailedEmail({
    to,
    userName,
    vodTitle,
    errorMessage,
    vodId,
  }: {
    to: string;
    userName: string;
    vodTitle: string;
    errorMessage: string;
    vodId: string;
  }) {
    try {
      const { data, error } = await resend.emails.send({
        from: this.from,
        to,
        subject: '❌ Processing failed for your VOD',
        react: ProcessingFailedEmail({
          userName,
          vodTitle,
          errorMessage,
          vodId,
        }),
      });

      if (error) {
        console.error('Email send error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  async sendWelcomeEmail({
    to,
    userName,
  }: {
    to: string;
    userName: string;
  }) {
    try {
      const { data, error } = await resend.emails.send({
        from: this.from,
        to,
        subject: '🎉 Welcome to StreamClips AI!',
        react: WelcomeEmail({ userName }),
      });

      if (error) {
        console.error('Email send error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  async sendSubscriptionConfirmationEmail({
    to,
    userName,
    planName,
    features,
  }: {
    to: string;
    userName: string;
    planName: string;
    features: string[];
  }) {
    try {
      const { data, error } = await resend.emails.send({
        from: this.from,
        to,
        subject: `✨ Welcome to StreamClips AI ${planName}!`,
        react: SubscriptionConfirmationEmail({
          userName,
          planName,
          features,
        }),
      });

      if (error) {
        console.error('Email send error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  // Batch email sending for admin notifications
  async sendBatchEmails(emails: EmailData[]) {
    try {
      const results = await Promise.allSettled(
        emails.map(email => 
          resend.emails.send({
            from: this.from,
            ...email,
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: failed === 0,
        successful,
        failed,
        results,
      };
    } catch (error) {
      console.error('Batch email error:', error);
      return {
        success: false,
        successful: 0,
        failed: emails.length,
        error: error instanceof Error ? error.message : 'Batch email failed',
      };
    }
  }
}

export const emailService = new EmailService();
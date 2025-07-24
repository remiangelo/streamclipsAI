import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { emailService } from '@/lib/email';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, username, image_url } = evt.data;
    const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id);

    if (!primaryEmail) {
      return new Response('No primary email found', { status: 400 });
    }

    try {
      // Create user in database
      const user = await db.user.create({
        data: {
          clerkId: id,
          email: primaryEmail.email_address,
          twitchUsername: username || undefined,
        },
      });

      // Create default preferences
      await db.userPreferences.create({
        data: {
          userId: user.id,
          emailNotifications: true,
          emailProcessingComplete: true,
          emailProcessingFailed: true,
          emailSubscriptionUpdates: true,
          emailProductUpdates: false,
          emailWeeklyDigest: false,
        },
      });

      // Send welcome email
      await emailService.sendWelcomeEmail({
        to: primaryEmail.email_address,
        userName: username || primaryEmail.email_address.split('@')[0],
      });

      console.log('User created:', user.id);
    } catch (error) {
      console.error('Error creating user:', error);
      return new Response('Error creating user', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, username } = evt.data;
    const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id);

    if (!primaryEmail) {
      return new Response('No primary email found', { status: 400 });
    }

    try {
      // Update user in database
      await db.user.update({
        where: { clerkId: id },
        data: {
          email: primaryEmail.email_address,
          twitchUsername: username || undefined,
        },
      });

      console.log('User updated:', id);
    } catch (error) {
      console.error('Error updating user:', error);
      return new Response('Error updating user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      // Delete user from database (cascading deletes will handle related data)
      await db.user.delete({
        where: { clerkId: id },
      });

      console.log('User deleted:', id);
    } catch (error) {
      console.error('Error deleting user:', error);
      return new Response('Error deleting user', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
}
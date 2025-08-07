# Environment Setup Guide

## Step 1: Create the .env.local file

```bash
cd /Users/remibeltram/Pittura/streamclipsAI/streamclips-ai/streamclips-ai
touch .env.local
```

## Step 2: Set up each service and get credentials

### 1. Neon Database (PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click "Create Database"
3. Name your database (e.g., "streamclips-ai")
4. Copy the connection strings:
   - Use the "Pooled connection" string for `DATABASE_URL`
   - Use the "Direct connection" string for `DATABASE_URL_UNPOOLED`
5. Both strings will look like: `postgresql://username:password@host.neon.tech/database?sslmode=require`

### 2. Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Name it "StreamClips AI"
4. In the dashboard:
   - Go to "API Keys" in the left sidebar
   - Copy the "Publishable key" → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Copy the "Secret key" → `CLERK_SECRET_KEY`
5. Set up Twitch OAuth:
   - Go to "User & Authentication" → "Social Connections"
   - Enable "Twitch"
   - You'll need Twitch Client ID and Secret (see Twitch section below)

### 3. Twitch API

1. Go to [dev.twitch.tv](https://dev.twitch.tv) and sign in
2. Click "Your Console" → "Register Your Application"
3. Fill in:
   - Name: "StreamClips AI"
   - OAuth Redirect URLs: `https://YOUR-CLERK-DOMAIN.clerk.accounts.dev/v1/oauth_callback`
   - Category: "Application Integration"
4. After creating:
   - Copy "Client ID" → `TWITCH_CLIENT_ID`
   - Click "New Secret" and copy it → `TWITCH_CLIENT_SECRET`
5. Go back to Clerk and add these credentials to the Twitch social connection

### 4. Stripe (for payments)

1. Go to [stripe.com](https://stripe.com) and sign up
2. Make sure you're in "Test mode" (toggle in dashboard)
3. Go to "Developers" → "API keys"
4. Copy:
   - "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - "Secret key" → `STRIPE_SECRET_KEY`
5. For webhook secret (set this up later when deploying):
   - Go to "Webhooks" → "Add endpoint"
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

### 5. Upstash Redis

1. Go to [upstash.com](https://upstash.com) and sign up
2. Create a new Redis database
3. Choose a region close to your users
4. In the database details, copy:
   - "REST URL" → `UPSTASH_REDIS_REST_URL`
   - "REST Token" → `UPSTASH_REDIS_REST_TOKEN`

### 6. Pusher (for real-time updates)

1. Go to [pusher.com](https://pusher.com) and sign up
2. Create a new Channels app
3. Name it "streamclips-ai"
4. Choose a cluster closest to your users
5. From the "App Keys" section, copy:
   - "app_id" → `PUSHER_APP_ID`
   - "key" → `PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_KEY`
   - "secret" → `PUSHER_SECRET`
   - "cluster" → `PUSHER_CLUSTER` and `NEXT_PUBLIC_PUSHER_CLUSTER`

### 7. Vercel Blob (optional for now)

1. This is only needed when deploying to Vercel
2. In your Vercel project dashboard, go to "Storage"
3. Create a Blob store
4. Copy the token → `BLOB_READ_WRITE_TOKEN`

### 8. AWS S3 (optional for now)

1. Only needed for production video storage
2. Create an S3 bucket in AWS Console
3. Create an IAM user with S3 access
4. Copy the credentials when you need them

## Step 3: Complete .env.local file

After gathering all credentials, your `.env.local` should look like this:

```env
# Database (from Neon)
DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/streamclips-ai?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/streamclips-ai?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Twitch API
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret

# Stripe (can leave empty for now if not testing payments)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxx

# Pusher
PUSHER_APP_ID=1234567
PUSHER_KEY=xxxxxxxxxxxxx
PUSHER_SECRET=xxxxxxxxxxxxx
PUSHER_CLUSTER=us2
NEXT_PUBLIC_PUSHER_KEY=xxxxxxxxxxxxx
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# These can be left empty for local development
BLOB_READ_WRITE_TOKEN=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Initialize the database

Once your `.env.local` is set up with at least the database credentials:

```bash
# Generate Prisma client
npx prisma generate

# Push the schema to your database
npx prisma db push

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

## Minimum Required for Local Development

To get started, you minimally need:

1. **Neon Database** credentials (DATABASE_URL)
2. **Clerk** credentials (for authentication)
3. **Twitch API** credentials (to fetch VODs)

The rest can be added as you build out those features!

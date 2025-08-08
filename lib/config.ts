/**
 * Centralized configuration with environment validation for all runtimes.
 * Import from server code only unless accessing NEXT_PUBLIC_* keys.
 *
 * Usage:
 *  import { config } from '@/lib/config'
 *  const bucket = config.storage.s3.bucketName
 */

type RequiredWhen = 'always' | 'production' | 'serverOnly'

type EnvSpec<T = string> = {
  key: string
  required?: RequiredWhen
  defaultValue?: T
  parser?: (v: string) => T
  description?: string
}

function isServer() {
  return typeof window === 'undefined'
}

function isProduction() {
  return process.env.NODE_ENV === 'production'
}

function isTest() {
  return process.env.NODE_ENV === 'test'
}

function parseNumber(v: string) {
  const n = Number(v)
  if (Number.isNaN(n)) throw new Error(`Expected number but got "${v}"`)
  return n
}

function readEnv<T = string>(spec: EnvSpec<T>): { value: T | undefined; missing: boolean } {
  const raw = process.env[spec.key]
  const required = spec.required ?? 'serverOnly'
  const onServer = isServer()
  const inProd = isProduction()

  let mustHave = false
  if (required === 'always') mustHave = true
  else if (required === 'production') mustHave = inProd
  else if (required === 'serverOnly') mustHave = onServer

  if ((raw === undefined || raw === '') && mustHave) {
    if (spec.defaultValue !== undefined) {
      return { value: spec.defaultValue, missing: false }
    }
    return { value: undefined, missing: true }
  }

  if (raw === undefined || raw === '') {
    if (spec.defaultValue !== undefined) {
      return { value: spec.defaultValue, missing: false }
    }
    return { value: undefined, missing: false }
  }

  return {
    value: spec.parser ? spec.parser(raw) : (raw as unknown as T),
    missing: false,
  }
}

function collectEnv(specs: ReadonlyArray<EnvSpec<unknown>>): { result: Record<string, unknown>; missing: string[] } {
  const result: Record<string, unknown> = {}
  const missing: string[] = []

  for (const spec of specs) {
    const { value, missing: isMissing } = readEnv(spec)
    result[spec.key] = value
    if (isMissing) missing.push(spec.key)
  }

  return { result, missing }
}

function assertOrWarn(missing: string[], context: string) {
  if (missing.length === 0) return
  const msg = `[config] Missing required environment variables (${context}): ${missing.join(', ')}`
  if (isProduction() && !isTest()) {
    throw new Error(msg)
  } else {
    // eslint-disable-next-line no-console
    console.warn(msg)
  }
}

const commonSpecs: EnvSpec[] = [
  { key: 'NEXT_PUBLIC_APP_URL', required: 'always', description: 'Public base URL of the app' },
  { key: 'NODE_ENV', required: 'always', description: 'Node environment' },
  // Clerk
  { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', required: 'always' },
  { key: 'CLERK_SECRET_KEY', required: 'serverOnly' },
  { key: 'CLERK_WEBHOOK_SECRET', required: 'serverOnly' },
  // Database
  { key: 'DATABASE_URL', required: 'serverOnly' },
  { key: 'DIRECT_URL', required: 'serverOnly' },
  // LemonSqueezy
  { key: 'LEMONSQUEEZY_API_KEY', required: 'serverOnly' },
  { key: 'LEMONSQUEEZY_STORE_ID', required: 'serverOnly' },
  { key: 'LEMONSQUEEZY_STARTER_VARIANT_ID', required: 'serverOnly' },
  { key: 'LEMONSQUEEZY_PRO_VARIANT_ID', required: 'serverOnly' },
  { key: 'LEMONSQUEEZY_STUDIO_VARIANT_ID', required: 'serverOnly' },
  { key: 'LEMONSQUEEZY_WEBHOOK_SECRET', required: 'serverOnly' },
  // Resend
  { key: 'RESEND_API_KEY', required: 'serverOnly' },
  // Twitch
  { key: 'TWITCH_CLIENT_ID', required: 'serverOnly' },
  { key: 'TWITCH_CLIENT_SECRET', required: 'serverOnly' },
  // Storage selection
  { key: 'STORAGE_PROVIDER', required: 'always', defaultValue: 'vercel' },
  // S3/R2
  { key: 'S3_REGION', required: 'serverOnly' },
  { key: 'S3_ACCESS_KEY_ID', required: 'serverOnly' },
  { key: 'S3_SECRET_ACCESS_KEY', required: 'serverOnly' },
  { key: 'S3_BUCKET_NAME', required: 'serverOnly' },
  { key: 'S3_ENDPOINT', required: 'serverOnly' },
  { key: 'APP_PUBLIC_ASSETS_BASE_URL', required: 'always', defaultValue: '' },
  { key: 'CLOUDFRONT_DOMAIN', required: 'always', defaultValue: '' },
  // Observability
  { key: 'SENTRY_DSN', required: 'always', defaultValue: '' },
  { key: 'SENTRY_ENVIRONMENT', required: 'always', defaultValue: '' },
  // Security/Operational
  { key: 'INTERNAL_SIGNING_SECRET', required: 'serverOnly', defaultValue: '' },
  { key: 'RATE_LIMIT_REDIS_URL', required: 'always', defaultValue: '' },
  { key: 'ENFORCE_HTTPS', required: 'always', defaultValue: 'true' },
]

const numberSpecs: EnvSpec<number>[] = [
  { key: 'JOB_POLL_INTERVAL_MS', required: 'always', defaultValue: 5000, parser: parseNumber },
  { key: 'MAX_JOB_ATTEMPTS', required: 'always', defaultValue: 3, parser: parseNumber },
]

const baseSpecs = [...commonSpecs, ...numberSpecs] as ReadonlyArray<EnvSpec<unknown>>

const { result: raw, missing: missingBase } = collectEnv(baseSpecs)

// Conditional requirements based on provider
const storageProvider = (raw['STORAGE_PROVIDER'] as string | undefined)?.toLowerCase() || 'vercel'
if (storageProvider === 's3') {
  const s3Required = ['S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME', 'S3_ENDPOINT']
  const missingS3 = s3Required.filter((k) => !raw[k])
  assertOrWarn([...missingBase, ...missingS3], 'storage=s3')
} else {
  assertOrWarn(missingBase, 'storage=vercel')
}

export const config = {
  app: {
    url: raw['NEXT_PUBLIC_APP_URL'] as string,
    env: raw['NODE_ENV'] as string,
    enforceHttps: (raw['ENFORCE_HTTPS'] as string)?.toLowerCase() === 'true',
  },
  clerk: {
    publishableKey: raw['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] as string,
    secretKey: raw['CLERK_SECRET_KEY'] as string | undefined,
    webhookSecret: raw['CLERK_WEBHOOK_SECRET'] as string | undefined,
  },
  db: {
    url: raw['DATABASE_URL'] as string,
    directUrl: raw['DIRECT_URL'] as string | undefined,
  },
  lemonsqueezy: {
    apiKey: raw['LEMONSQUEEZY_API_KEY'] as string,
    storeId: raw['LEMONSQUEEZY_STORE_ID'] as string,
    variants: {
      starter: raw['LEMONSQUEEZY_STARTER_VARIANT_ID'] as string,
      pro: raw['LEMONSQUEEZY_PRO_VARIANT_ID'] as string,
      studio: raw['LEMONSQUEEZY_STUDIO_VARIANT_ID'] as string,
    },
    webhookSecret: raw['LEMONSQUEEZY_WEBHOOK_SECRET'] as string,
  },
  email: {
    resendApiKey: raw['RESEND_API_KEY'] as string,
    from: 'StreamClips AI <noreply@streamclips.ai>', // change if needed
  },
  twitch: {
    clientId: raw['TWITCH_CLIENT_ID'] as string,
    clientSecret: raw['TWITCH_CLIENT_SECRET'] as string,
  },
  storage: {
    provider: storageProvider as 'vercel' | 's3',
    s3: {
      region: raw['S3_REGION'] as string | undefined,
      accessKeyId: raw['S3_ACCESS_KEY_ID'] as string | undefined,
      secretAccessKey: raw['S3_SECRET_ACCESS_KEY'] as string | undefined,
      bucketName: raw['S3_BUCKET_NAME'] as string | undefined,
      endpoint: raw['S3_ENDPOINT'] as string | undefined,
      publicBaseUrl: (raw['APP_PUBLIC_ASSETS_BASE_URL'] as string) || '',
      cloudfrontDomain: (raw['CLOUDFRONT_DOMAIN'] as string) || '',
    },
  },
  observability: {
    sentryDsn: (raw['SENTRY_DSN'] as string) || '',
    environment: (raw['SENTRY_ENVIRONMENT'] as string) || '',
  },
  jobs: {
    pollIntervalMs: (raw['JOB_POLL_INTERVAL_MS'] as number) || 5000,
    maxAttempts: (raw['MAX_JOB_ATTEMPTS'] as number) || 3,
  },
  security: {
    internalSigningSecret: (raw['INTERNAL_SIGNING_SECRET'] as string) || '',
    rateLimitRedisUrl: (raw['RATE_LIMIT_REDIS_URL'] as string) || '',
  },
} as const

export type AppConfig = typeof config

// Convenience guard for server-only env access
export function requireServerEnv(key: keyof typeof process.env) {
  if (!isServer()) {
    throw new Error(`Accessed server env "${String(key)}" from the client`)
  }
  const v = process.env[key]
  if (!v) throw new Error(`Missing required env: ${String(key)}`)
  return v
}
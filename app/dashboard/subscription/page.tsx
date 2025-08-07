'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubscriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const { data: status, isLoading: statusLoading } = api.subscription.getStatus.useQuery();
  const { data: plans, isLoading: plansLoading } = api.subscription.getPlans.useQuery();
  const { data: portalUrl } = api.subscription.getPortalUrl.useQuery();

  const createCheckout = api.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(null);
    },
  });

  const cancelSubscription = api.subscription.cancel.useMutation({
    onSuccess: () => {
      toast.success('Subscription cancelled successfully');
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resumeSubscription = api.subscription.resume.useMutation({
    onSuccess: () => {
      toast.success('Subscription resumed successfully');
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubscribe = (tier: 'STARTER' | 'PRO' | 'STUDIO') => {
    setIsLoading(tier);
    createCheckout.mutate({ tier });
  };

  if (statusLoading || plansLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  const currentTier = status?.tier || 'FREE';
  const subscriptionStatus = status?.status || 'INACTIVE';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Status */}
      {status && subscriptionStatus !== 'INACTIVE' && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              Your current plan and usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Plan</p>
                <p className="text-2xl font-bold capitalize">{currentTier}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-lg capitalize">{subscriptionStatus.toLowerCase()}</p>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Clips Used</span>
                  <span>
                    {status.usage.clipsUsed} / {status.usage.clipsLimit === -1 ? 'Unlimited' : status.usage.clipsLimit}
                  </span>
                </div>
                {status.usage.clipsLimit !== -1 && (
                  <Progress 
                    value={(status.usage.clipsUsed / status.usage.clipsLimit) * 100} 
                    className="mt-1"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Storage Used</span>
                  <span>
                    {(status.usage.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB / 
                    {(status.usage.storageLimit / (1024 * 1024 * 1024)).toFixed(0)} GB
                  </span>
                </div>
                <Progress 
                  value={(status.usage.storageUsed / status.usage.storageLimit) * 100} 
                  className="mt-1"
                />
              </div>
            </div>

            {status.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {subscriptionStatus === 'CANCELLED' ? 'Cancels' : 'Renews'} on{' '}
                {new Date(status.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            {portalUrl?.url && (
              <Button variant="outline" asChild>
                <a href={portalUrl.url} target="_blank" rel="noopener noreferrer">
                  Manage Billing
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            {subscriptionStatus === 'ACTIVE' && (
              <Button 
                variant="destructive" 
                onClick={() => cancelSubscription.mutate()}
                disabled={cancelSubscription.isLoading}
              >
                {cancelSubscription.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Subscription
              </Button>
            )}
            {subscriptionStatus === 'CANCELLED' && (
              <Button 
                onClick={() => resumeSubscription.mutate()}
                disabled={resumeSubscription.isLoading}
              >
                {resumeSubscription.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resume Subscription
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans?.filter(plan => plan.id !== 'FREE').map((plan) => (
          <Card 
            key={plan.id} 
            className={plan.current ? 'border-primary' : ''}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="mr-2 h-4 w-4 text-primary mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.current ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id as any)}
                  disabled={isLoading !== null}
                >
                  {isLoading === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentTier !== 'FREE' && currentTier < plan.id ? 'Upgrade' : 'Subscribe'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Free Tier Info */}
      {currentTier === 'FREE' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Free Tier</AlertTitle>
          <AlertDescription>
            You're currently on the free tier with 5 clips per month and 5GB storage. 
            Upgrade to unlock more features and higher limits.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
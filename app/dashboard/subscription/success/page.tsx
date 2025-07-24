'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import confetti from 'canvas-confetti';

export default function SubscriptionSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Subscription Successful!</CardTitle>
          <CardDescription>
            Welcome to StreamClips AI Pro! Your subscription is now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            You now have access to all premium features including:
          </p>
          <ul className="text-sm space-y-1">
            <li>✓ Unlimited clip generation</li>
            <li>✓ Platform-specific exports</li>
            <li>✓ Priority processing</li>
            <li>✓ Advanced analytics</li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full" 
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push('/dashboard/vods')}
          >
            Start Creating Clips
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
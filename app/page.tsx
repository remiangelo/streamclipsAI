import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Sparkles, Clock, TrendingUp, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            StreamClips AI
          </span>
        </div>
        <nav className="flex items-center space-x-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Get Started</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </SignedIn>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Turn Your Best Moments Into Viral Clips
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            AI-powered highlight detection analyzes your Twitch chat to find the most engaging moments. 
            Create viral-ready clips in seconds, not hours.
          </p>
          <div className="flex justify-center space-x-4">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="text-lg px-8">
                  Start Free Trial
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  Go to Dashboard
                </Button>
              </Link>
            </SignedIn>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="p-6 hover:shadow-lg transition-shadow border-primary/20">
            <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Chat Analysis</h3>
            <p className="text-muted-foreground">
              Our AI analyzes chat spikes, emotes, and sentiment to identify your best moments automatically.
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-accent/20">
            <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Save Hours Weekly</h3>
            <p className="text-muted-foreground">
              Stop manually scrubbing through VODs. Get your highlights in minutes, not hours.
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-primary/20">
            <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Optimized for Viral</h3>
            <p className="text-muted-foreground">
              Auto-format for TikTok, YouTube Shorts, and Instagram Reels with one click.
            </p>
          </Card>
        </section>

        <section className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Join 1,000+ Streamers Already Saving Time</h2>
          <p className="text-muted-foreground mb-8">
            From affiliate streamers to partners, creators trust StreamClips AI to find their best content.
          </p>
          <div className="flex justify-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Try 5 Free Clips
                </Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </section>
      </main>
    </div>
  );
}

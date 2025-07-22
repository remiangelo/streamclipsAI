import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, Sparkles, Zap, BarChart3, Clock, CheckCircle, Play } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
      
      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 group-hover:shadow-lg transition-all">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">StreamClips AI</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            
            <div className="h-6 w-px bg-border" />
            
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            </SignedIn>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-sm mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Now with GPT-4 powered analysis
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-up">
              <span className="text-gradient">Transform your streams</span>
              <br />
              <span className="text-gradient">into viral content</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{animationDelay: '0.1s'}}>
              AI-powered highlight detection that analyzes your Twitch chat to automatically identify 
              and clip your most engaging moments. Ship content faster than ever.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-fade-up" style={{animationDelay: '0.2s'}}>
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 group">
                    Start free trial
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" className="group">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </SignedIn>
              <Button size="lg" variant="outline" className="group">
                <Play className="mr-2 h-4 w-4" />
                Watch demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-up" style={{animationDelay: '0.3s'}}>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">10K+</div>
                <div className="text-sm text-muted-foreground">Clips Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">2M+</div>
                <div className="text-sm text-muted-foreground">Hours Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">95%</div>
                <div className="text-sm text-muted-foreground">Time Saved</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything you need to go viral</h2>
            <p className="text-lg text-muted-foreground">Powerful features designed for content creators</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Chat Analysis</h3>
              <p className="text-muted-foreground text-sm">
                Advanced ML models analyze chat velocity, emotes, and sentiment to identify highlight moments
              </p>
            </div>
            
            <div className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Processing</h3>
              <p className="text-muted-foreground text-sm">
                Process hours of content in minutes with our distributed GPU infrastructure
              </p>
            </div>
            
            <div className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Platform Optimized</h3>
              <p className="text-muted-foreground text-sm">
                Auto-format clips for TikTok, YouTube Shorts, and Instagram Reels
              </p>
            </div>
            
            <div className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground text-sm">
                Track performance, engagement metrics, and optimize your content strategy
              </p>
            </div>
            
            <div className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Highlights</h3>
              <p className="text-muted-foreground text-sm">
                AI learns from your content to improve highlight detection accuracy over time
              </p>
            </div>
            
            <div className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Play className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
              <p className="text-muted-foreground text-sm">
                Queue multiple VODs and let our system work while you sleep
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 p-12 lg:p-16 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/[0.2]" />
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Ready to 10x your content output?
                </h2>
                <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
                  Join thousands of creators using AI to transform their streams into viral content. 
                  Start with 5 free clips today.
                </p>
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                      Get started for free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold">StreamClips AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered highlight generation for content creators
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-foreground transition-colors">API</Link></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 StreamClips AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
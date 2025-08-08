import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, Sparkles, Zap, BarChart3, Clock, CheckCircle, Play, Star, Shield, Cpu } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Subtle animated background (hero-only flair) */}
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-20 container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center glass-subtle rounded-2xl px-6 py-4 backdrop-blur-xl">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all group-hover:scale-110">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">StreamClips AI</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="relative text-sm text-gray-400 hover:text-white transition-colors group">
              Features
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
            </Link>
            <Link href="/pricing" className="relative text-sm text-gray-400 hover:text-white transition-colors group">
              Pricing
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
            </Link>
            <Link href="/docs" className="relative text-sm text-gray-400 hover:text-white transition-colors group">
              Docs
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
            </Link>
            
            <div className="h-6 w-px bg-gray-800" />
            
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="btn-primary">
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="sm" className="btn-primary">
                  Dashboard
                </Button>
              </Link>
            </SignedIn>

            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-purple text-sm mb-8 animate-fade-down">
              <Star className="h-4 w-4 text-purple-400" />
              <span className="text-gray-300">Powered by GPT-4 & Claude</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-up">
              <span className="block">Transform your</span>
              <span className="block text-gradient-purple mt-2">Twitch streams</span>
              <span className="block">into viral clips</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 animate-fade-up" style={{animationDelay: '0.1s'}}>
              Let AI analyze your chat and automatically detect the most hype moments. 
              Create TikToks, Reels, and Shorts in seconds, not hours.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-fade-up" style={{animationDelay: '0.2s'}}>
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg" variant="accent" className="group px-8">
                    Start free trial
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" variant="accent" className="group px-8">
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

            {/* Hero Video/Image Preview */}
            <div className="relative mx-auto max-w-4xl animate-fade-up" style={{animationDelay: '0.3s'}}>
              <div className="glass-subtle rounded-2xl p-2 hover-card">
                <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/[0.02] opacity-20" />
                  <Play className="h-16 w-16 text-white/50 relative z-10" />
                </div>
              </div>
              
              {/* Floating UI elements */}
              <div className="absolute -top-4 -left-4 glass-purple px-4 py-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm">AI Processing</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 glass-purple px-4 py-2 rounded-xl" style={{animationDelay: '1s'}}>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">2.5K viewers spike</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "50K+", label: "Clips Generated", delay: "0ms" },
                { value: "10M+", label: "Hours Analyzed", delay: "50ms" },
                { value: "95%", label: "Accuracy Rate", delay: "100ms" },
                { value: "< 2min", label: "Processing Time", delay: "150ms" }
              ].map((stat, i) => (
                <div key={i} className="glass-subtle rounded-2xl p-6 text-center hover-card animate-fade-up" style={{animationDelay: stat.delay}}>
                  <div className="text-3xl font-bold text-gradient mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Built for <span className="text-gradient">content creators</span>
            </h2>
            <p className="text-lg text-gray-400">Everything you need to turn streams into shareable content</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto animate-stagger">
            {/* Feature 1 - Large */}
            <div className="md:col-span-2 lg:col-span-2 group">
              <div className="h-full glass-subtle rounded-3xl p-8 hover-card">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl">
                    <Cpu className="h-8 w-8 text-purple-400" />
                  </div>
                  <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">AI-Powered</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Smart Chat Analysis</h3>
                <p className="text-gray-400 mb-6">
                  Our AI models analyze chat velocity, emote usage, and viewer sentiment in real-time 
                  to identify the exact moments your audience goes wild.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {["PogChamp Detection", "Hype Moments", "Viewer Peaks"].map((feature) => (
                    <div key={feature} className="glass-purple rounded-xl px-3 py-2 text-center text-sm hover:bg-purple-600/20 transition-all cursor-pointer">
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="group">
              <div className="h-full glass-subtle rounded-3xl p-8 hover-card">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl mb-6">
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                <p className="text-gray-400">
                  Process hours of content in minutes. Our distributed GPU infrastructure ensures 
                  you get your clips while the hype is still fresh.
                </p>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="group">
              <div className="h-full glass-subtle rounded-3xl p-8 hover-card">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl mb-6">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Platform Ready</h3>
                <p className="text-gray-400">
                  Auto-format for TikTok, Reels, and Shorts. Includes captions, perfect crops, 
                  and trending music suggestions.
                </p>
              </div>
            </div>
            
            {/* Feature 4 */}
            <div className="group">
              <div className="h-full glass-subtle rounded-3xl p-8 hover-card">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl mb-6">
                  <BarChart3 className="h-8 w-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Analytics Suite</h3>
                <p className="text-gray-400">
                  Track clip performance across platforms. See what works and optimize your 
                  content strategy with data.
                </p>
              </div>
            </div>
            
            {/* Feature 5 */}
            <div className="group">
              <div className="h-full glass-subtle rounded-3xl p-8 hover-card">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl mb-6">
                  <Shield className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Privacy First</h3>
                <p className="text-gray-400">
                  Your content stays yours. Enterprise-grade security with SOC 2 compliance 
                  and encrypted storage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fade-up">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                Three steps to <span className="text-gradient">viral content</span>
              </h2>
            </div>
            
            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Connect your Twitch",
                  description: "Link your account and select any VOD from your channel history"
                },
                {
                  step: "02", 
                  title: "AI analyzes chat",
                  description: "Our models scan every message to find peak excitement moments"
                },
                {
                  step: "03",
                  title: "Export perfect clips", 
                  description: "Download formatted clips ready for TikTok, Reels, and Shorts"
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-center animate-fade-up group" style={{animationDelay: `${i * 100}ms`}}>
                  <div className="flex-shrink-0 w-20 h-20 rounded-2xl glass-purple flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="text-2xl font-bold text-gradient">{item.step}</span>
                  </div>
                  <div className="flex-grow glass-subtle rounded-2xl p-6 group-hover:shadow-lg transition-all">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-90" />
              <div className="absolute inset-0 bg-grid-white/[0.1]" />
              <div className="relative glass-dark backdrop-blur-xl p-12 lg:p-20 text-center">
                <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                  Ready to go viral?
                </h2>
                <p className="text-xl mb-8 text-gray-200 max-w-2xl mx-auto">
                  Join thousands of streamers already using AI to create engaging content. 
                  Start with 5 free clips today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8">
                        Start free trial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard">
                      <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </SignedIn>
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    View pricing
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">StreamClips AI</span>
              </div>
              <p className="text-sm text-gray-400">
                AI-powered highlight generation for content creators
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Product</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Company</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-900 pt-8 text-center text-sm text-gray-500">
            © 2024 StreamClips AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
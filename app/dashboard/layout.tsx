"use client";

import { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Video, 
  Film, 
  Settings, 
  CreditCard, 
  BarChart3, 
  Sparkles,
  Home,
  HelpCircle,
  ChevronRight,
  FlaskConical
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "My VODs", href: "/dashboard/vods", icon: Video },
  { name: "My Clips", href: "/dashboard/clips", icon: Film },
  { name: "Chat Analyzer", href: "/dashboard/analyzer", icon: FlaskConical },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card/50 backdrop-blur-sm">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b px-6 py-5">
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 group-hover:shadow-lg transition-all">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">StreamClips AI</span>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                             (item.href !== "/dashboard" && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className={cn(
                      "mr-3 h-4 w-4 transition-colors",
                      isActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {item.name}
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Help section */}
          <div className="border-t p-4">
            <Link 
              href="/docs" 
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
            >
              <HelpCircle className="h-4 w-4" />
              Help & Documentation
            </Link>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              {/* Breadcrumb or page title could go here */}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick actions */}
              <button className="relative p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              
              <div className="h-8 w-px bg-border" />
              
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9"
                  }
                }}
              />
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
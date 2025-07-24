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
  FlaskConical,
  Bell,
  Moon,
  Sun
} from "lucide-react";
import { useState } from "react";

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
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="min-h-screen bg-black">
      {/* Background gradient */}
      <div className="fixed inset-0 gradient-bg" />
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 glass-dark border-r border-gray-800">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-gray-800 px-6 py-5">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">StreamClips AI</span>
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
                    "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30"
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  )}
                >
                  <div className="flex items-center">
                    <div className={cn(
                      "mr-3 p-2 rounded-lg transition-all",
                      isActive 
                        ? "bg-gradient-to-br from-purple-600/30 to-pink-600/30" 
                        : "bg-gray-800/50 group-hover:bg-gray-700/50"
                    )}>
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-purple-400" : "text-gray-400 group-hover:text-white"
                      )} />
                    </div>
                    {item.name}
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Help section */}
          <div className="border-t border-gray-800 p-4">
            <Link 
              href="/docs" 
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            >
              <div className="p-2 rounded-lg bg-gray-800/50">
                <HelpCircle className="h-4 w-4" />
              </div>
              Help & Documentation
            </Link>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="pl-64 relative z-10">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 glass-dark border-b border-gray-800">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              {/* Page context */}
              <div className="text-sm text-gray-400">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2.5 rounded-xl glass hover:bg-white/5 transition-all">
                <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                <Bell className="h-5 w-5 text-gray-400" />
              </button>
              
              {/* Theme toggle */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-xl glass hover:bg-white/5 transition-all"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-gray-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              <div className="h-8 w-px bg-gray-800" />
              
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10 rounded-xl",
                    userButtonTrigger: "rounded-xl"
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
import { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  Film, 
  Settings, 
  CreditCard, 
  BarChart3, 
  Sparkles,
  Home
} from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-card border-r border-border">
        <div className="p-4">
          <Link href="/dashboard" className="flex items-center space-x-2 mb-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">StreamClips AI</span>
          </Link>
          
          <nav className="space-y-1">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                <Home className="mr-2 h-4 w-4" />
                Overview
              </Button>
            </Link>
            <Link href="/dashboard/vods">
              <Button variant="ghost" className="w-full justify-start">
                <Video className="mr-2 h-4 w-4" />
                My VODs
              </Button>
            </Link>
            <Link href="/dashboard/clips">
              <Button variant="ghost" className="w-full justify-start">
                <Film className="mr-2 h-4 w-4" />
                My Clips
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="ghost" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </nav>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </header>
        
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
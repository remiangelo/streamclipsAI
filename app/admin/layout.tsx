import { requireAdmin } from '@/lib/admin-auth';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Activity,
  BarChart3,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'System Health', href: '/admin/health', icon: Activity },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Settings className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          </div>
          
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-gray-800 hover:text-white",
                  "text-gray-400"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
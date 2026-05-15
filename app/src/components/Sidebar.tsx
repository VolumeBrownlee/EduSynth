import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  BarChart3,
  HelpCircle,
  Settings,
  Users,
  GraduationCap
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: ('admin' | 'teacher' | 'student')[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Tutor', icon: MessageSquare },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/quiz', label: 'Quizzes', icon: HelpCircle },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter(
    item => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside className="sidebar-glass fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar z-40">
      <div className="p-4">
        {/* User Info Card */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.registrationId}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <p className="text-lg font-bold text-cyan-400">5 days</p>
            </div>
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground">Readiness Score</p>
              <p className="text-lg font-bold text-indigo-400">78%</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

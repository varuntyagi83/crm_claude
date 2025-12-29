import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Store,
  Ticket,
  CheckSquare,
  Users,
  Settings,
  CreditCard,
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['sales', 'support', 'ops', 'admin'] as const,
  },
  {
    label: 'Merchants',
    href: '/merchants',
    icon: Store,
    roles: ['sales', 'support', 'ops', 'admin'] as const,
  },
  {
    label: 'Tickets',
    href: '/tickets',
    icon: Ticket,
    roles: ['support', 'ops', 'admin'] as const,
  },
  {
    label: 'My Tasks',
    href: '/tasks',
    icon: CheckSquare,
    roles: ['sales', 'support', 'ops', 'admin'] as const,
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    roles: ['admin'] as const,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'] as const,
  },
]

export function Sidebar() {
  const { profile } = useAuth()
  const userRole = profile?.role

  const filteredItems = navItems.filter(
    (item) => userRole && (item.roles as readonly string[]).includes(userRole)
  )

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <CreditCard className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Merchant CRM</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            Logged in as <span className="font-medium">{profile?.role}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

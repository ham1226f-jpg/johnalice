'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { HeaderTourButton } from '@/components/tour/HeaderTourButton'
import { TourPageId } from '@/types'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Receipt, 
  ShoppingBag,
  RotateCcw,
  Users,
  Menu,
  X,
  LogOut,
  User,
  CreditCard,
  Wallet,
  BarChart3,
  Store,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { InstallPrompt } from '@/components/ui/install-prompt'
import { StoreSelector } from '@/components/layout/StoreSelector'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
  tourPageId: TourPageId
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, tourPageId: 'dashboard' },
  { name: 'POS', href: '/pos', icon: ShoppingCart, tourPageId: 'pos' },
  { name: 'Transactions', href: '/transactions', icon: Receipt, tourPageId: 'transactions' },
  { name: 'Inventory', href: '/inventory', icon: Package, tourPageId: 'inventory' },
  { name: 'Reports', href: '/reports', icon: FileText, adminOnly: true, tourPageId: 'transactions' },
  { name: 'Inventory Analytics', href: '/inventory-analytics', icon: BarChart3, adminOnly: true, tourPageId: 'inventory' },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingBag, adminOnly: true, tourPageId: 'purchase-orders' },
  { name: 'Returns', href: '/returns', icon: RotateCcw, tourPageId: 'returns' },
  { name: 'Customers', href: '/customers', icon: Users, tourPageId: 'transactions' },
  { name: 'Debts', href: '/debts', icon: CreditCard, tourPageId: 'transactions' },
  { name: 'Expenses', href: '/expenses', icon: Wallet, tourPageId: 'transactions' },
  { name: 'Stores', href: '/stores', icon: Store, adminOnly: true, tourPageId: 'users' },
  { name: 'Users', href: '/users', icon: User, adminOnly: true, tourPageId: 'users' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, tenant, signOut } = useAuth()
  const pathname = usePathname()

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  )

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight">Smart POS</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Point of Sale</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{tenant?.name}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          {/* Theme toggle, store selector, tour button, and user badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <StoreSelector />
            <ThemeToggle />
            {navigation.find((item) => item.href === pathname)?.tourPageId && (
              <HeaderTourButton 
                pageId={navigation.find((item) => item.href === pathname)!.tourPageId} 
              />
            )}
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize">{user?.role.replace('_', ' ')}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  )
}

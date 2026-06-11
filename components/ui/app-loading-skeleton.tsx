import { ShoppingCart } from 'lucide-react'

export function AppLoadingSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Skeleton */}
      <aside className="hidden lg:block w-64 bg-card border-r border-border">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight">Smart POS</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Point of Sale</span>
              </div>
            </div>
          </div>

          {/* Navigation Skeleton */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </nav>

          {/* User info skeleton */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
          <div className="h-6 bg-muted animate-pulse rounded w-32" />
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          </div>
        </header>

        {/* Page content skeleton */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="h-8 bg-muted animate-pulse rounded w-48" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </main>
      </div>
    </div>
  )
}

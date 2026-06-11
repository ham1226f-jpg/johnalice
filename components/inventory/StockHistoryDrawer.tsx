'use client'

import { X } from 'lucide-react'
import { useStockHistory } from '@/hooks/useStock'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

interface StockHistoryDrawerProps {
  productId: string | null
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockHistoryDrawer({ productId, productName, open, onOpenChange }: StockHistoryDrawerProps) {
  const { data, isLoading } = useStockHistory(productId || '', { pageSize: 50 })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-lg overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Stock History</h2>
            <p className="text-sm text-muted-foreground">{productName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : data && data.history.length > 0 ? (
            <div className="space-y-4">
              {data.history.map((item) => (
                <div key={item.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        item.type === 'restock' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        item.type === 'sale' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        item.type === 'return' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                    </div>
                    <span className={`text-lg font-semibold ${
                      item.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.quantity_change > 0 ? '+' : ''}{item.quantity_change}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      New quantity: <span className="font-medium text-foreground">{item.quantity_after}</span>
                    </p>
                    {item.reason && (
                      <p className="text-muted-foreground">
                        Reason: <span className="text-foreground">{item.reason}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                      {item.user && ` • ${item.user.full_name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No stock history available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

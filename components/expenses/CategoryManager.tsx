'use client'

import { useState } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/hooks/useExpenses'

export function CategoryManager() {
  const { data: categories, isLoading } = useExpenseCategories()
  const createCategory = useCreateExpenseCategory()
  const deleteCategory = useDeleteExpenseCategory()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return

    try {
      await createCategory.mutateAsync(newCategoryName.trim())
      toast.success('Category created')
      setNewCategoryName('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create category')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteCategory.mutateAsync(deleteId)
      toast.success('Category deleted')
      setDeleteId(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Expense Categories</h3>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            onClick={handleCreate}
            disabled={!newCategoryName.trim() || createCategory.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>{category.name}</span>
                  {category.is_default && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                {!category.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No categories found
          </p>
        )}
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Categories with existing expenses cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

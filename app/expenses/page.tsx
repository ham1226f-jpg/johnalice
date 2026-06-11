'use client'

import { useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { ExpenseSummary, ExpenseKPICards } from '@/components/expenses/ExpenseSummary'
import { CategoryManager } from '@/components/expenses/CategoryManager'
import { Expense } from '@/types'

export default function ExpensesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingExpense(null)
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Expenses</h1>
              <p className="text-muted-foreground mt-1">
                Track and manage business expenditures
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" className="sm:size-default" onClick={() => setCategoryManagerOpen(true)}>
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Categories</span>
              </Button>
              <Button size="sm" className="sm:size-default" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Expense</span>
              </Button>
            </div>
          </div>

          <ExpenseKPICards />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 min-w-0">
              <ExpenseList onEdit={handleEdit} />
            </div>
            <div className="min-w-0">
              <ExpenseSummary />
            </div>
          </div>
        </div>

        <ExpenseForm
          expense={editingExpense}
          open={formOpen}
          onOpenChange={handleFormClose}
        />

        <Dialog open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Categories</DialogTitle>
            </DialogHeader>
            <CategoryManager />
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  )
}

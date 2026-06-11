'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { CustomerList } from '@/components/customers/CustomerList'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { CustomerDetail } from '@/components/customers/CustomerDetail'
import { Customer } from '@/types'

export default function CustomersPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)

  const handleAdd = () => {
    setEditingCustomer(null)
    setFormOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  const handleView = (customer: Customer) => {
    setViewingCustomer(customer)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingCustomer(null)
  }

  const handleDetailClose = () => {
    setViewingCustomer(null)
  }

  const handleEditFromDetail = (customer: Customer) => {
    setViewingCustomer(null)
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer information and credit settings
            </p>
          </div>

          <CustomerList
            onAdd={handleAdd}
            onEdit={handleEdit}
            onView={handleView}
          />
        </div>

        <CustomerForm
          customer={editingCustomer}
          open={formOpen}
          onOpenChange={handleFormClose}
        />

        {viewingCustomer && (
          <CustomerDetail
            customer={viewingCustomer}
            onClose={handleDetailClose}
            onEdit={handleEditFromDetail}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  )
}
